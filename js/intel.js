/* PQC Readiness Monitor — intelligence views: Standards & Policy, Implementation
   Guidance, Financial Sector News, Third-Party News, and Methodology.
   Every feed section merges the curated June 2026 snapshot with the live
   running list (see feeds.js) and is searchable, sortable, and refreshable;
   live items link to the original source. */

(function () {
  function tag(t) { return '<span class="tag">' + esc(t) + '</span>'; }

  function newsItem(item) {
    var title = item.url
      ? '<a href="' + esc(item.url) + '" target="_blank" rel="noopener">' + esc(item.title) + '</a>'
      : esc(item.title);
    return '<article class="news-item">' +
      '<span class="news-date">' + esc(item.d) + '</span>' +
      '<div><div class="news-meta">' + tag(item.tag) +
      (item._new ? '<span class="chip-new">New</span>' : '') +
      '<span class="news-src">' + esc(item.src) + '</span></div>' +
      '<h3 class="news-title">' + title + '</h3>' +
      '<p class="news-body">' + esc(item.body) + '</p></div></article>';
  }

  var SORTS = [
    ["newest", "Newest first"],
    ["oldest", "Oldest first"],
    ["source", "Source A–Z"],
  ];

  function sortItems(items, sort) {
    return items.slice().sort(function (a, b) {
      if (sort === "oldest") return String(a.d).localeCompare(String(b.d));
      if (sort === "source") return String(a.src).localeCompare(String(b.src)) ||
        String(b.d).localeCompare(String(a.d));
      return String(b.d).localeCompare(String(a.d));
    });
  }

  function matchesQuery(item, q) {
    if (!q) return true;
    return ((item.title || "") + " " + (item.body || "") + " " + (item.src || "") + " " +
      (item.tag || "")).toLowerCase().indexOf(q) !== -1;
  }

  /* ---- Section configuration -------------------------------------------------- */
  var INTEL = {
    standards: {
      intro: "Where the standards and policy clocks stand. The dates that matter for migration planning: " +
        "RSA and ECC deprecated after 2030, disallowed after 2035 (NIST IR 8547), with the G7 targeting " +
        "critical financial systems by 2030–2032.",
      curated: function () { return window.PQC_NEWS.standards; },
      foot: "Live items are pulled from the Federal Register API (official U.S. policy documents), the IETF " +
        "Datatracker API (post-quantum standards work), and the Crossref API (peer-reviewed research).",
    },
    sector: {
      intro: "What the financial sector is actually doing — pilots, disclosures, and the quiet commercial " +
        "pressures (insurers, vendors, browsers) that move readiness without a mandate.",
      curated: function () { return window.PQC_NEWS.sector; },
      foot: "Live items are pulled from the Federal Register API (U.S. financial regulators), the Crossref API " +
        "(peer-reviewed research on PQC in finance), and an allowlist of sector institutions and financial " +
        "press surfaced via the Hacker News API.",
    },
    vendornews: {
      intro: "What the sector's technology suppliers are shipping — cloud and edge providers are furthest " +
        "along, the PKI/HSM vendors are the enablers, and the core-banking processors are the bottleneck " +
        "most institutions actually depend on.",
      curated: function () { return window.PQC_NEWS.vendors; },
      foot: "Live items are vendor newsroom posts and reputable technology press surfaced via the Hacker News " +
        "API, restricted to a domain allowlist so links always go to the original trusted source.",
    },
    guidance: {
      intro: "Best practices distilled from NIST NCCoE, CISA/NSA joint guidance, FS-ISAC's PQC Working Group, " +
        "and the G7 CEG roadmap. The steady, unglamorous work — which is rather the point.",
      curated: function () { return window.PQC_NEWS.guidance; },
      foot: "Live items are pulled from the IETF PQUIP working group (post-quantum usage and operations " +
        "guidance) and NIST notices in the Federal Register.",
      cards: true,
    },
  };

  function feedStatusLine(section) {
    var f = window.FEEDS[section];
    if (f.status === "loading") return "Checking " + f.sourceNames + "…";
    var parts = [];
    if (f.lastChecked) {
      var t = new Date(f.lastChecked);
      parts.push("Sources checked " + t.toLocaleDateString() + " " +
        t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } else {
      parts.push("Live sources not reached yet");
    }
    parts.push(f.items.length + " live item" + (f.items.length === 1 ? "" : "s") + " on the running list" +
      (f.newCount ? " (" + f.newCount + " new)" : ""));
    if (f.errors.length) parts.push(f.errors.join(" · "));
    return parts.join(" · ");
  }

  window.intelStatusText = feedStatusLine;

  function toolbarHtml(section, opts) {
    var sortOptions = SORTS.map(function (s) {
      return '<option value="' + s[0] + '"' + (opts.sort === s[0] ? ' selected' : '') + '>' + s[1] + '</option>';
    }).join('');
    var loading = window.FEEDS[section].status === "loading";
    return '<div class="feed-toolbar">' +
      '<span class="feed-status' + (loading ? ' loading' : '') + '" id="feed-status">' +
      esc(feedStatusLine(section)) + '</span>' +
      '<span class="spacer"></span>' +
      '<input class="feed-search" type="search" placeholder="Filter this feed…" value="' + esc(opts.q || "") +
      '" data-action="intel-search" data-section="' + section + '">' +
      '<select class="select-ctl" data-action="intel-sort" data-section="' + section + '">' + sortOptions + '</select>' +
      '<button class="pill-btn" data-action="intel-refresh" data-section="' + section + '"' +
      (loading ? ' disabled' : '') + '>Refresh</button>' +
      '</div>';
  }

  function emptyHtml(msg) {
    return '<div class="feed-empty">' + esc(msg) + '</div>';
  }

  /* ---- List body (separately re-renderable so search keeps focus) -------------- */
  window.renderIntelList = function (section, opts) {
    var cfg = INTEL[section];
    var feed = window.FEEDS[section];
    var q = (opts.q || "").trim().toLowerCase();
    var live = (feed.items || []).map(function (it) {
      return Object.assign({ _new: !!feed.sessionNew[it.id] }, it);
    });

    if (cfg.cards) {
      // Guidance: curated best-practice cards on top, live documents feed below.
      var cards = cfg.curated().filter(function (g) {
        return !q || (g.title + " " + g.body).toLowerCase().indexOf(q) !== -1;
      }).map(function (g, i) {
        return '<div class="guidance-card">' +
          '<div class="guidance-head"><span class="guidance-icon">' + icon(g.icon, 17) + '</span>' +
          '<span class="guidance-num">' + String(i + 1).padStart(2, "0") + '</span></div>' +
          '<h3 class="guidance-title">' + esc(g.title) + '</h3>' +
          '<p class="guidance-body">' + esc(g.body) + '</p></div>';
      }).join('');
      var docs = sortItems(live.filter(function (it) { return matchesQuery(it, q); }), opts.sort);
      return (cards ? '<div class="guidance-grid">' + cards + '</div>'
          : emptyHtml("No practices match. Boring, in the best way.")) +
        '<div class="intel-subhead">Latest guidance &amp; reference documents</div>' +
        (docs.length ? card({ pad: "6px 24px" }, docs.map(newsItem).join(''))
          : emptyHtml(q ? "No live documents match." : "Nothing on the running list yet — sources are checked on every load."));
    }

    var curated = cfg.curated().map(function (n, i) { return Object.assign({ id: section + "-curated:" + i }, n); });
    var items = sortItems(curated.concat(live).filter(function (it) { return matchesQuery(it, q); }), opts.sort);
    return items.length
      ? card({ pad: "6px 24px" }, items.map(newsItem).join(''))
      : emptyHtml("No items match. Boring, in the best way.");
  };

  /* ---- Full section view ---------------------------------------------------------- */
  window.renderIntelSection = function (section, opts) {
    var cfg = INTEL[section];
    var wide = cfg.cards;
    return '<div class="' + (wide ? 'guidance-wrap' : 'news-wrap') + '">' +
      '<p class="' + (wide ? 'guidance-intro' : 'news-intro') + '">' + esc(cfg.intro) + '</p>' +
      toolbarHtml(section, opts) +
      '<div id="intel-list">' + renderIntelList(section, opts) + '</div>' +
      '<div class="register-footnote">' + esc(cfg.foot) + ' New material accumulates in a local running list ' +
      'across sessions, is checked on every page load, and links to the original source. ' +
      'Entries without a link are the curated June 2026 snapshot.</div>' +
      '</div>';
  };

  window.renderMethodology = function () {
    function S(title, body) {
      return '<section class="method-section"><h3>' + esc(title) + '</h3><div class="body">' + body + '</div></section>';
    }
    var inner =
      S("What this monitor measures",
        "Readiness scores (0–100) summarize four public signals per institution: (1) hybrid post-quantum " +
        "key exchange (ML-KEM / X25519MLKEM768) on the primary public website; (2) public PQC or quantum-safe " +
        "program announcements, filings, and research; (3) participation in standards and sector bodies " +
        "(NIST NCCoE, FS-ISAC PQC Working Group, G7-adjacent forums); and (4) crypto-agility signals from " +
        "edge, cloud, and core-platform choices. Statuses: <strong>Advanced</strong> (70+), " +
        "<strong>In progress</strong> (45–69), <strong>Early stage</strong> (25–44), <strong>Not evident</strong> (under 25).") +
      S("Evidence levels",
        "<strong>Documented</strong> — grounded in public announcements, filings, or published research. " +
        "<strong>Inferred</strong> — derived from observable infrastructure and sector participation. " +
        "<strong>Estimated</strong> — representative placeholder for institutions without a research pass yet; " +
        "most sub-$100B records are Estimated in this snapshot.") +
      S("What it does not measure",
        "Internal cryptographic inventories, HSM and PKI migration, payment-rail and host-to-host channel " +
        "encryption, or vendor contract status — none of which are externally observable. A high score means " +
        "strong public signals, not a completed migration; a low score means absence of evidence, not evidence " +
        "of absence.") +
      S("Cohort and data notes",
        "Cohort: top 100 U.S. financial institutions by approximate total assets (Q1 2026), including bank " +
        "holding companies, U.S. operations of foreign banks, custodians, brokerages, card networks, one credit " +
        "union, and digital banks. A parallel register tracks the top 100 third parties to the sector — core " +
        "processors, cloud and edge providers, payment networks, market utilities, security and PKI/HSM vendors — " +
        "ordered by approximate annual revenue and scored on PQC support in the products institutions consume. " +
        "Asset and revenue figures are rounded and approximate. The TLS column reflects edge-provider " +
        "capability and observed handshakes at snapshot time; wire this view to a live TLS scanner " +
        "(e.g. a scheduled scan negotiating X25519MLKEM768 against each domain) to convert Estimated rows into findings.") +
      S("Intelligence feeds",
        "Each intelligence section combines a curated June 2026 snapshot with a live running list refreshed on " +
        "every page load from trusted, browser-accessible sources: the Federal Register API (official U.S. " +
        "policy and regulator documents), the IETF Datatracker API (standards and guidance documents), the " +
        "Crossref API (peer-reviewed research), and — for press coverage — a strict domain allowlist of vendor " +
        "newsrooms, sector institutions, and reputable technology press surfaced via the Hacker News API. " +
        "Live items are deduplicated, persisted locally, capped at 200 per section, and always link to the " +
        "original source.") +
      S("Anchor dates",
        "NIST FIPS 203/204/205 final August 2024 · HQC final expected 2027 · RSA/ECC deprecated after 2030 and " +
        "disallowed after 2035 (NIST IR 8547) · G7 CEG critical-systems target 2030–2032 · U.S. federal " +
        "quantum-resistance target 2035 · Google and Cloudflare self-imposed migration deadlines 2029, set after " +
        "Google research showed RSA-2048 could be broken by under one million noisy qubits in about a week.");
    return '<div class="method-wrap">' + card({ pad: "26px" }, inner) + '</div>';
  };
})();
