// PQC Readiness Monitor — daily TLS post-quantum scanner.
//
// Reads a JSON list of domains and, for each, reports whether the server
// negotiates hybrid post-quantum key exchange. Method: dial offering ONLY the
// X25519MLKEM768 group — a successful TLS 1.3 handshake then proves the server
// negotiated it ("live"). If that fails, dial again with classical groups; if
// THAT succeeds the host serves TLS but without PQC ("none"); otherwise the host
// is unreachable/inconclusive ("unknown"). One handshake (two at most) per host.
//
// Requires Go 1.24+ (exports crypto/tls.X25519MLKEM768, enabled by default).
//
// Usage: go run scan.go <domains.json> <results.json>
//   domains.json: {"domains":["jpmorganchase.com", ...]}
//   results.json: {"jpmorganchase.com":"live", ...}

package main

import (
	"crypto/tls"
	"encoding/json"
	"net"
	"os"
	"sync"
	"time"
)

func dial(host string, groups []tls.CurveID, requireTLS13 bool) bool {
	d := &net.Dialer{Timeout: 8 * time.Second}
	cfg := &tls.Config{
		ServerName:       host,
		CurvePreferences: groups,
		MinVersion:       tls.VersionTLS12,
	}
	if requireTLS13 {
		cfg.MinVersion = tls.VersionTLS13
	}
	c, err := tls.DialWithDialer(d, "tcp", host+":443", cfg)
	if err != nil {
		return false
	}
	c.Close()
	return true
}

func classifyHost(host string) string {
	// Offer only the hybrid PQC group: success ⟺ server negotiated it.
	if dial(host, []tls.CurveID{tls.X25519MLKEM768}, true) {
		return "live"
	}
	// Reachable over TLS at all (classical)?
	if dial(host, []tls.CurveID{tls.X25519, tls.CurveP256, tls.CurveP384}, false) {
		return "none"
	}
	return "unknown"
}

func classify(domain string) string {
	r := classifyHost(domain)
	if r == "unknown" { // many sites serve only on www.
		if w := classifyHost("www." + domain); w != "unknown" {
			return w
		}
	}
	return r
}

func main() {
	if len(os.Args) < 3 {
		os.Stderr.WriteString("usage: scan <domains.json> <results.json>\n")
		os.Exit(2)
	}
	raw, err := os.ReadFile(os.Args[1])
	if err != nil {
		os.Stderr.WriteString("read domains: " + err.Error() + "\n")
		os.Exit(1)
	}
	var in struct {
		Domains []string `json:"domains"`
	}
	if err := json.Unmarshal(raw, &in); err != nil {
		os.Stderr.WriteString("parse domains: " + err.Error() + "\n")
		os.Exit(1)
	}

	res := make(map[string]string, len(in.Domains))
	var mu sync.Mutex
	var wg sync.WaitGroup
	sem := make(chan struct{}, 12) // gentle concurrency
	for _, dm := range in.Domains {
		wg.Add(1)
		sem <- struct{}{}
		go func(host string) {
			defer wg.Done()
			defer func() { <-sem }()
			r := classify(host)
			mu.Lock()
			res[host] = r
			mu.Unlock()
		}(dm)
	}
	wg.Wait()

	out, _ := json.Marshal(res)
	if err := os.WriteFile(os.Args[2], out, 0644); err != nil {
		os.Stderr.WriteString("write results: " + err.Error() + "\n")
		os.Exit(1)
	}
}
