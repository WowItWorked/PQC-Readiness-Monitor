/* PQC Readiness Monitor — live intelligence feeds.
   Each intelligence section refreshes from trusted sources that allow browser
   (CORS) access on every page load:
     · Federal Register API — official U.S. policy and regulator documents
     · IETF Datatracker API — post-quantum standards and guidance documents
     · Crossref API — peer-reviewed PQC research metadata (DOIs)
     · Hacker News (Algolia) API — discovery layer, kept trustworthy by a strict
       domain allowlist so items only surface vendor newsrooms, standards
       bodies, regulators, and reputable technology press; links go to the
       original source.
   Results are normalized to the news-item shape, merged into a per-section
   running list persisted in localStorage (deduped by id, capped, newest
   first), and items first seen this session are flagged "New". Sources that
   fail (offline, blocked) degrade gracefully — the curated snapshot and the
   stored running list still render. */

(function () {
  var MAX_ITEMS = 200;

  function fetchWithTimeout(url, ms) {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, ms);
    return fetch(url, ctrl ? { signal: ctrl.signal } : {}).then(function (r) {
      if (timer) clearTimeout(timer);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r;
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
  }
  function getJson(url) { return fetchWithTimeout(url, 9000).then(function (r) { return r.json(); }); }

  function clip(s, n) {
    s = String(s || "").replace(/\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s;
  }

  function daysAgoIso(days) { return new Date(Date.now() - days * 864e5).toISOString().slice(0, 10); }

  /* ---- Source: Federal Register --------------------------------------------
     opts: { term, agencies: [slug...], tag } */
  function fromFederalRegister(opts) {
    return function () {
      var url = "https://www.federalregister.gov/api/v1/documents.json?per_page=12&order=newest" +
        "&conditions[term]=" + encodeURIComponent(opts.term) +
        (opts.agencies || []).map(function (a) { return "&conditions[agencies][]=" + a; }).join("") +
        "&fields[]=title&fields[]=abstract&fields[]=publication_date&fields[]=html_url" +
        "&fields[]=agencies&fields[]=document_number";
      return getJson(url).then(function (j) {
        return (j.results || []).map(function (r) {
          var agency = (r.agencies && r.agencies[0] && r.agencies[0].name) || "U.S. Government";
          return {
            id: "fr:" + r.document_number,
            d: r.publication_date || "",
            tag: opts.tag,
            title: clip(r.title, 200),
            body: clip(r.abstract || "Official document — open the Federal Register entry for the full text.", 300),
            src: "Federal Register · " + agency,
            url: r.html_url,
            live: true,
          };
        });
      });
    };
  }

  /* ---- Source: IETF Datatracker ---------------------------------------------
     opts: { filter (querystring fragment), tag } — the API rejects
     order_by=time, so filter to recent activity and sort client-side. */
  function fromIetf(opts) {
    return function () {
      var url = "https://datatracker.ietf.org/api/v1/doc/document/?format=json&limit=50" +
        "&" + opts.filter + "&time__gte=" + daysAgoIso(400);
      return getJson(url).then(function (j) {
        return (j.objects || [])
          .sort(function (a, b) { return String(b.time).localeCompare(String(a.time)); })
          .slice(0, 8)
          .map(function (o) {
            return {
              id: "ietf:" + o.name,
              d: String(o.time || "").slice(0, 10),
              tag: opts.tag,
              title: clip(o.title, 200),
              body: clip(o.abstract || "Active IETF document — open the datatracker entry for status and text.", 300),
              src: "IETF Datatracker · " + o.name,
              url: "https://datatracker.ietf.org/doc/" + o.name + "/",
              live: true,
            };
          });
      });
    };
  }

  /* ---- Source: Crossref -------------------------------------------------------
     opts: { query, guards: [regex...], tag } — relevance search plus a recent-
     publication filter; title guards keep the list on-topic since Crossref has
     no phrase search. */
  function fromCrossref(opts) {
    return function () {
      var url = "https://api.crossref.org/works?query.bibliographic=" + encodeURIComponent(opts.query) +
        "&rows=14&filter=" + encodeURIComponent("from-pub-date:" + daysAgoIso(270) + ",type:journal-article") +
        "&select=title,issued,container-title,publisher,URL,DOI,abstract";
      return getJson(url).then(function (j) {
        return (j.message.items || [])
          .filter(function (it) {
            var t = ((it.title && it.title[0]) || "") + " " + String(it.abstract || "");
            return opts.guards.every(function (g) { return g.test(t); });
          })
          .slice(0, 8)
          .map(function (it) {
            var dp = (it.issued && it.issued["date-parts"] && it.issued["date-parts"][0]) || [];
            var d = dp.length ? dp[0] + (dp[1] ? "-" + String(dp[1]).padStart(2, "0") : "") +
              (dp[2] ? "-" + String(dp[2]).padStart(2, "0") : "") : "";
            var venue = (it["container-title"] && it["container-title"][0]) || it.publisher || "Crossref";
            return {
              id: "doi:" + it.DOI,
              d: d,
              tag: opts.tag,
              title: clip((it.title && it.title[0]) || "", 200),
              body: clip(String(it.abstract || "").replace(/<[^>]+>/g, " ") ||
                "Peer-reviewed publication — follow the DOI for the full record.", 300),
              src: "Crossref · " + clip(venue, 60),
              url: it.URL || "https://doi.org/" + it.DOI,
              live: true,
            };
          });
      });
    };
  }

  /* ---- Source: Hacker News (Algolia) -------------------------------------------
     opts: { query, domains: [...], tag } — discovery only; a strict domain
     allowlist means surfaced items are the trusted sources' own pages. */
  function hostMatches(host, domain) {
    return host === domain || host.slice(-(domain.length + 1)) === "." + domain;
  }
  function fromHackerNews(opts) {
    return function () {
      var url = "https://hn.algolia.com/api/v1/search_by_date?query=" + encodeURIComponent(opts.query) +
        "&tags=story&hitsPerPage=40&numericFilters=" + encodeURIComponent("points>2");
      return getJson(url).then(function (j) {
        var seen = {};
        return (j.hits || [])
          .filter(function (h) {
            // Junk or placeholder submission titles aren't worth a feed slot.
            if (!h.url || !h.title || h.title.length < 12) return false;
            var host;
            try { host = new URL(h.url).hostname.replace(/^www\./, ""); } catch (e) { return false; }
            if (!opts.domains.some(function (d) { return hostMatches(host, d); })) return false;
            if (seen[h.url]) return false;
            seen[h.url] = true;
            h._host = host;
            return true;
          })
          .slice(0, 8)
          .map(function (h) {
            return {
              id: "hn:" + h.objectID,
              d: String(h.created_at || "").slice(0, 10),
              tag: opts.tag,
              title: clip(h.title, 200),
              body: "Published on " + h._host + " — open the original post for details.",
              src: h._host + " · via Hacker News",
              url: h.url,
              live: true,
            };
          });
      });
    };
  }

  /* ---- Section → source registry ----------------------------------------------- */
  var PQC_GUARD = /post.?quantum|quantum.?safe|quantum.?resistant|quantum.?resilien|\bpqc\b|ml-kem|ml-dsa|slh-dsa|kyber|dilithium|lattice-based/i;
  var FIN_GUARD = /financ|bank|payment|insur|trading|market|swift|settle|ledger|custod/i;

  var FIN_AGENCIES = ["comptroller-of-the-currency", "federal-reserve-system", "treasury-department",
    "securities-and-exchange-commission", "federal-deposit-insurance-corporation",
    "financial-crimes-enforcement-network"];

  var VENDOR_DOMAINS = ["cloudflare.com", "aws.amazon.com", "microsoft.com", "azure.microsoft.com",
    "google.com", "blog.google", "googleblog.com", "ibm.com", "akamai.com", "thalesgroup.com",
    "entrust.com", "digicert.com", "letsencrypt.org", "proton.me", "gnupg.org", "openssl.org",
    "mozilla.org", "chromium.org", "security.apple.com", "signal.org", "openssh.com", "redhat.com",
    "canonical.com", "oracle.com", "cisco.com", "fortinet.com", "paloaltonetworks.com",
    "keyfactor.com", "pqshield.com", "sandboxaq.com", "theregister.com", "arstechnica.com",
    "securityweek.com", "bleepingcomputer.com", "darkreading.com", "infosecurity-magazine.com"];

  var FIN_DOMAINS = ["bis.org", "swift.com", "americanbanker.com", "finextra.com", "risk.net",
    "federalreserve.gov", "newyorkfed.org", "ecb.europa.eu", "imf.org", "sec.gov", "occ.gov",
    "fdic.gov", "fsisac.com", "dtcc.com", "nasdaq.com", "theclearinghouse.org", "visa.com",
    "mastercard.com", "reuters.com", "ft.com", "bloomberg.com", "wsj.com", "weforum.org"];

  var SECTIONS = {
    standards: {
      store: "pqc-standards-feed-v1",
      sources: [
        { name: "Federal Register", fn: fromFederalRegister({ term: '"post-quantum cryptography"', tag: "US Policy" }) },
        { name: "IETF Datatracker", fn: fromIetf({ filter: "title__icontains=post-quantum", tag: "IETF" }) },
        { name: "Crossref", fn: fromCrossref({ query: "post-quantum cryptography", guards: [PQC_GUARD], tag: "Research" }) },
      ],
    },
    guidance: {
      store: "pqc-feed-guidance-v1",
      sources: [
        { name: "IETF PQUIP WG", fn: fromIetf({ filter: "group__acronym=pquip&type=draft", tag: "IETF WG" }) },
        { name: "Federal Register (NIST)", fn: fromFederalRegister({ term: '"post-quantum"',
          agencies: ["national-institute-of-standards-and-technology"], tag: "NIST" }) },
      ],
    },
    sector: {
      store: "pqc-feed-sector-v1",
      sources: [
        { name: "Federal Register (financial regulators)", fn: fromFederalRegister({ term: '"post-quantum"',
          agencies: FIN_AGENCIES, tag: "Regulators" }) },
        { name: "Crossref", fn: fromCrossref({ query: "post-quantum cryptography financial banking sector",
          guards: [PQC_GUARD, FIN_GUARD], tag: "Research" }) },
        { name: "sector press (via HN)", fn: fromHackerNews({ query: '"post-quantum"', domains: FIN_DOMAINS, tag: "Press" }) },
      ],
    },
    vendornews: {
      store: "pqc-feed-vendornews-v3",
      sources: [
        { name: "vendor newsrooms & tech press (via HN)", fn: fromHackerNews({ query: '"post-quantum"',
          domains: VENDOR_DOMAINS, tag: "Vendors" }) },
      ],
    },
  };

  /* ---- Per-section state + persistence -------------------------------------------- */
  var FEEDS = window.FEEDS = {};

  function loadStore(key) {
    try { return JSON.parse(localStorage.getItem(key)) || { items: [] }; }
    catch (e) { return { items: [] }; }
  }
  function saveStore(key, s) {
    try { localStorage.setItem(key, JSON.stringify(s)); } catch (e) { /* private mode */ }
  }

  Object.keys(SECTIONS).forEach(function (sec) {
    var s0 = loadStore(SECTIONS[sec].store);
    FEEDS[sec] = {
      status: "idle",
      items: s0.items || [],
      errors: [],
      lastChecked: s0.lastChecked || null,
      newCount: 0,
      sessionNew: {},
      sourceNames: SECTIONS[sec].sources.map(function (s) { return s.name; }).join(", "),
    };
  });

  /* ---- Refresh: fetch, dedupe, merge into the running list -------------------------- */
  window.refreshFeeds = function (section, onDone) {
    var cfg = SECTIONS[section];
    var feed = FEEDS[section];
    if (!cfg || feed.status === "loading") return;
    feed.status = "loading";
    feed.errors = [];
    Promise.allSettled(cfg.sources.map(function (s) { return s.fn(); })).then(function (results) {
      var fresh = [];
      results.forEach(function (res, i) {
        if (res.status === "fulfilled") fresh = fresh.concat(res.value);
        else feed.errors.push(cfg.sources[i].name + " unreachable");
      });

      // Dedupe by id and by normalized URL, so the same announcement surfaced
      // twice (or by two sources) lands on the running list once.
      var normUrl = function (u) {
        return String(u || "").replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, "")
          .replace(/\.html?$/, "").replace(/\/$/, "");
      };
      var store = loadStore(cfg.store);
      var known = {}, knownUrl = {};
      (store.items || []).forEach(function (it) {
        known[it.id] = true;
        if (it.url) knownUrl[normUrl(it.url)] = true;
      });
      var added = 0;
      fresh.forEach(function (it) {
        if (!it.id || known[it.id]) return;
        if (it.url && knownUrl[normUrl(it.url)]) return;
        known[it.id] = true;
        if (it.url) knownUrl[normUrl(it.url)] = true;
        store.items.push(it);
        feed.sessionNew[it.id] = true;
        added++;
      });
      store.items.sort(function (a, b) { return String(b.d).localeCompare(String(a.d)); });
      if (store.items.length > MAX_ITEMS) store.items.length = MAX_ITEMS;
      if (results.some(function (r) { return r.status === "fulfilled"; })) {
        store.lastChecked = new Date().toISOString();
      }
      saveStore(cfg.store, store);

      feed.items = store.items;
      feed.lastChecked = store.lastChecked || null;
      feed.newCount = added;
      feed.status = "done";
      if (onDone) onDone(section);
    });
  };

  window.refreshAllFeeds = function (onSectionDone) {
    Object.keys(SECTIONS).forEach(function (sec) { refreshFeeds(sec, onSectionDone); });
  };
})();
