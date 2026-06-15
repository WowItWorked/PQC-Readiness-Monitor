/* PQC Readiness Monitor — latest live TLS scan results.
   Overwritten each day by the GitHub Action (scanner/scan.go via the daily
   workflow). `results` maps a primary domain to the observed key-exchange posture:
     "live"    — server negotiated hybrid post-quantum key exchange (X25519MLKEM768)
     "none"    — server completed TLS but only with classical key exchange
     "unknown" — host unreachable / scan inconclusive (score left unchanged)
   Seeded empty; the overlay is a no-op until the first real scan populates it. */
window.PQC_TLS = { "scannedAt": null, "results": {} };
