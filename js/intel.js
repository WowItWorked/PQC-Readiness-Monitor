/* PQC Readiness Monitor — intelligence views: Standards & Policy, Implementation
   Guidance, Financial Sector News, Third-Party News, and Methodology.
   Every feed section merges the curated baseline snapshot with the live
   running list (see feeds.js) and is searchable, sortable, and refreshable;
   live items link to the original source. */

(function () {
  // Curated + live, dropping live items that repeat a curated one (same link or
  // same headline) so a document never appears twice in a feed.
  function itemKey(u) {
    return String(u || "").toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, "")
      .replace(/\.html?$/, "").replace(/\/$/, "");
  }
  function mergeUnique(curated, live) {
    var seen = {};
    curated.forEach(function (it) {
      if (it.url) seen["u:" + itemKey(it.url)] = true;
      var t = it.title || it.t;
      if (t) seen["t:" + String(t).toLowerCase().trim()] = true;
    });
    return curated.concat(live.filter(function (it) {
      var t = it.title || it.t;
      return !(it.url && seen["u:" + itemKey(it.url)]) && !(t && seen["t:" + String(t).toLowerCase().trim()]);
    }));
  }

  function tag(t) { return '<span class="tag">' + esc(t) + '</span>'; }

  function newsItem(item) {
    // Every article links to a working source (verified url, mapped source, or search).
    var title = '<a href="' + esc(newsUrl({ url: item.url, t: item.title, s: item.src })) +
      '" target="_blank" rel="noopener">' + esc(item.title) + '</a>';
    return '<article class="news-item">' +
      '<span class="news-date">' + esc(item.d) + '</span>' +
      '<div><div class="news-meta">' + tag(item.tag) +
      (item._new ? '<span class="chip-new">New</span>' : '') +
      '<span class="news-src">' + esc(item.src) + '</span></div>' +
      '<h3 class="news-title">' + title + '</h3>' +
      '<p class="news-body">' + esc(item.body) + '</p></div></article>';
  }

  var PAGE_SIZE = 10;
  // Pagination control + slice bounds for a list of `total` items.
  function pager(total, page, section) {
    var pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    page = Math.min(Math.max(1, page || 1), pages);
    var from = (page - 1) * PAGE_SIZE, to = Math.min(from + PAGE_SIZE, total);
    var html = pages <= 1 ? "" :
      '<div class="pager">' +
      '<button class="pager-btn" data-action="intel-page" data-section="' + section + '" data-page="' + (page - 1) + '"' + (page <= 1 ? " disabled" : "") + '>‹ Prev</button>' +
      '<span class="pager-info">' + (from + 1) + '–' + to + ' of ' + total + ' · page ' + page + '/' + pages + '</span>' +
      '<button class="pager-btn" data-action="intel-page" data-section="' + section + '" data-page="' + (page + 1) + '"' + (page >= pages ? " disabled" : "") + '>Next ›</button>' +
      '</div>';
    return { from: from, to: to, html: html };
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
      intro: "Official rules, standards, and deadlines from U.S., U.K., and EU government bodies. The dates that matter " +
        "most: today's common encryption starts to be retired after 2030 and is no longer allowed after 2035 (NIST), and the " +
        "G7 aims to have critical financial systems upgraded by 2030–2032. Every item links to its official source.",
      curated: function () { return window.PQC_NEWS.standards; },
      foot: "Sources are official government only: the Federal Register API (U.S. policy documents) and the " +
        "GOV.UK Search API (U.K. — HM Treasury, DSIT, NCSC). EU policy (ENISA, European Commission) is included " +
        "as verified curated links, as the EU has no browser-accessible live API.",
    },
    sector: {
      intro: "What financial institutions are actually doing — pilots, public statements, and the business pressures " +
        "that drive preparation even without a legal requirement. Every item links to its source.",
      curated: function () { return window.PQC_NEWS.sector; },
      foot: "Live items are pulled from the Federal Register API (U.S. financial regulators) and an allowlist of " +
        "sector institutions and financial press (BIS, Swift, DTCC, Reuters, FT, and similar) surfaced via the " +
        "Hacker News API. Curated items link to authoritative sector sources (BIS, DTCC, FSSCC).",
    },
    vendornews: {
      intro: "What the sector's technology providers are delivering. Cloud and hosting providers are furthest along, " +
        "security-tool vendors are enabling the change, and core banking providers — which most institutions depend on — " +
        "are often the deciding factor in how fast a bank can move. Every item links to its source.",
      curated: function () { return window.PQC_NEWS.vendors; },
      foot: "Live items are vendor newsroom posts and reputable technology press surfaced via the Hacker News " +
        "API, restricted to a domain allowlist so links always go to the original trusted source. Curated items " +
        "link to vendors' own post-quantum pages (AWS, Google, Cloudflare, IBM, Thales, DigiCert).",
    },
    guidance: {
      intro: "Practical guidance on how to prepare, drawn from U.S., U.K., and EU government agencies and financial-sector " +
        "bodies. The cards summarize the main recommendations in plain terms; the documents below are the full sources.",
      curated: function () { return window.PQC_NEWS.guidance; },
      foot: "Best-practice cards cite NIST NCCoE, CISA/NSA, NCSC, FS-ISAC, and FSSCC. The documents list combines " +
        "verified authoritative guidance with live NIST notices (Federal Register) and U.K. guidance (GOV.UK).",
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
      '<input class="feed-search" type="search" aria-label="Filter this feed" placeholder="Filter this feed…" value="' + esc(opts.q || "") +
      '" data-action="intel-search" data-section="' + section + '">' +
      '<select class="select-ctl" aria-label="Sort order" data-action="intel-sort" data-section="' + section + '">' + sortOptions + '</select>' +
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
      // Guidance: curated best-practice cards (each linked to its authoritative
      // source) on top, then curated authoritative documents + live feed below.
      var cards = cfg.curated().filter(function (g) {
        return !q || (g.title + " " + g.body + " " + (g.src || "")).toLowerCase().indexOf(q) !== -1;
      }).map(function (g, i) {
        var source = g.url
          ? '<a class="guidance-src" href="' + esc(g.url) + '" target="_blank" rel="noopener">' +
            icon("file-check", 13) + esc(g.src || "Source") + '</a>'
          : '';
        return '<div class="guidance-card">' +
          '<div class="guidance-head"><span class="guidance-icon">' + icon(g.icon, 17) + '</span>' +
          '<span class="guidance-num">' + String(i + 1).padStart(2, "0") + '</span></div>' +
          '<h3 class="guidance-title">' + esc(g.title) + '</h3>' +
          '<p class="guidance-body">' + esc(g.body) + '</p>' + source + '</div>';
      }).join('');
      var curatedDocs = (window.PQC_NEWS.guidanceDocs || []).map(function (n, i) {
        return Object.assign({ id: "guidance-doc:" + i }, n);
      });
      var docs = sortItems(mergeUnique(curatedDocs, live).filter(function (it) { return matchesQuery(it, q); }), opts.sort);
      var dpg = pager(docs.length, opts.page, section);
      return (cards ? '<div class="guidance-grid">' + cards + '</div>'
          : emptyHtml("No practices match. Try a different search.")) +
        '<div class="intel-subhead">Authoritative guidance &amp; reference documents</div>' +
        (docs.length ? card({ pad: "6px 24px" }, docs.slice(dpg.from, dpg.to).map(newsItem).join('')) + dpg.html
          : emptyHtml(q ? "No documents match." : "Nothing on the running list yet — sources are checked on every load."));
    }

    var curated = cfg.curated().map(function (n, i) { return Object.assign({ id: section + "-curated:" + i }, n); });
    var items = sortItems(mergeUnique(curated, live).filter(function (it) { return matchesQuery(it, q); }), opts.sort);
    if (!items.length) return emptyHtml("No items match. Try a different search.");
    var pg = pager(items.length, opts.page, section);
    return card({ pad: "6px 24px" }, items.slice(pg.from, pg.to).map(newsItem).join('')) + pg.html;
  };

  /* ---- Full section view ---------------------------------------------------------- */
  window.renderIntelSection = function (section, opts) {
    var cfg = INTEL[section];
    var wide = cfg.cards;
    return '<div class="' + (wide ? 'guidance-wrap' : 'news-wrap') + '">' +
      '<p class="' + (wide ? 'guidance-intro' : 'news-intro') + '">' + esc(cfg.intro) + '</p>' +
      toolbarHtml(section, opts) +
      '<div id="intel-list">' + renderIntelList(section, opts) + '</div>' +
      '<div class="register-footnote">' + esc(cfg.foot) + ' Live material accumulates in a local running list ' +
      'across sessions and is checked on every page load; the published site is also refreshed each morning (U.S. Eastern). ' +
      'Every item links to its authoritative source.</div>' +
      '</div>';
  };

  window.renderMethodology = function () {
    function S(title, body) {
      return '<section class="method-section"><h3>' + esc(title) + '</h3><div class="body">' + body + '</div></section>';
    }
    function term(t, d) { return '<div class="gloss-row"><dt>' + t + '</dt><dd>' + d + '</dd></div>'; }
    var f = pqcFreshness();
    var inner =
      S("Key terms in plain English",
        '<dl class="gloss">' +
        term("Quantum computer", "A new kind of computer that, once powerful enough, is expected to break the encryption most organizations use today to protect data and transactions.") +
        term("Post-quantum cryptography (PQC)", "New, quantum-safe encryption designed to resist those computers. U.S. standards for it were published in 2024; organizations now need to adopt it.") +
        term("Quantum-safe", "Protected with this new encryption, so information stays private even after powerful quantum computers exist.") +
        term("&ldquo;Harvest now, decrypt later&rdquo;", "Attackers can copy encrypted data today and store it until they can decrypt it. Information that must stay confidential for years is therefore already at risk.") +
        term("Third party / provider", "A company that supplies technology or services to financial institutions — for example core banking systems, cloud hosting, payments, or security tools.") +
        term("Readiness score", "A 0&ndash;100 summary of the public evidence that an organization is preparing. Higher means stronger evidence, not a finished upgrade.") +
        '</dl>') +
      S("What the ratings mean",
        "<strong>Advanced</strong> (70+): strong public evidence of an established program. " +
        "<strong>In progress</strong> (45&ndash;69): clear signs of planning or early upgrade work. " +
        "<strong>Early stage</strong> (25&ndash;44): limited evidence, mostly industry-group membership and technology choices. " +
        "<strong>Not evident</strong> (under 25): no public evidence found. " +
        "A low rating means we could not find evidence &mdash; not proof that nothing is happening.") +
      S("What we look at",
        "For each institution, four areas that can be seen from the outside: (1) whether its main website already uses " +
        "quantum-safe encryption; (2) whether it has publicly described a plan or program; (3) whether it takes part in " +
        "industry and government working groups; and (4) how easily its technology choices allow it to upgrade. " +
        "For providers, we look at whether the products financial institutions buy already offer quantum-safe protection, " +
        "how clearly the provider has published its plans, its industry participation, and how many institutions depend on it.") +
      S("How strong is the evidence?",
        "Every rating carries an evidence level. <strong>Documented</strong>: based on the organization&rsquo;s own public " +
        "announcements, filings, or research. <strong>Inferred</strong>: worked out from its technology choices and industry " +
        "participation. <strong>Estimated</strong>: a placeholder until we research it in detail &mdash; most institutions under " +
        "$100B in assets are currently Estimated. Treat Estimated ratings as a starting point for questions, not a finding.") +
      S("What the ratings do not cover",
        "Anything that cannot be seen from outside the organization: its internal inventory of where encryption is used, " +
        "upgrades to internal systems and payment connections, or the terms of its contracts with providers. A high score " +
        "means strong public evidence, not a completed upgrade.") +
      S("How often information is updated",
        "<strong>Website check &mdash; daily.</strong> An automated check tests each institution&rsquo;s main website every day " +
        "(last run " + esc(f.tls) + "). It can move a score by up to 12 points. To avoid false alarms, a change is published only " +
        "after two days in a row agree. " +
        "<strong>Ratings &mdash; on each research pass.</strong> Plans, industry participation, and technology choices are reviewed " +
        "by researchers (last reviewed " + esc(f.ratings) + "). " +
        "<strong>Standards &amp; guidance &mdash; monthly.</strong> Reviewed each month (last reviewed " + esc(f.intel) + "), with " +
        "official government updates added automatically whenever the page loads. The <strong>Trends</strong> page records " +
        "every institution&rsquo;s score once a day, so changes over time are visible.") +
      S("Who is covered",
        "The 100 largest U.S. financial institutions by approximate total assets (Q1 2026) &mdash; banks, U.S. operations of " +
        "foreign banks, custodians, brokerages, card companies, a credit union, and digital banks &mdash; and 100 key providers " +
        "to the sector, ranked by approximate annual revenue. Figures are rounded.") +
      S("Key dates",
        "2024: first U.S. quantum-safe encryption standards published (NIST). After 2030: U.S. standards body begins retiring " +
        "today&rsquo;s most common encryption. 2030&ndash;2032: G7 target for upgrading critical financial systems. 2035: today&rsquo;s " +
        "encryption no longer allowed under U.S. federal guidance, and the U.S. government&rsquo;s own target for completing the move.") +
      S("Technical detail (for IT and security teams)",
        "Website check: a daily GitHub Action dials each institution&rsquo;s primary domain (and <code>www.</code> when the apex is not " +
        "live) offering only the hybrid group <code>X25519MLKEM768</code> (X25519 + ML-KEM-768, FIPS 203). A completed TLS 1.3 " +
        "handshake records <strong>Quantum-safe</strong>; a classical-only handshake records <strong>Not yet</strong>; an " +
        "unreachable host keeps its last known result. Standards referenced: FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 " +
        "(SLH-DSA), NIST IR 8547 (RSA/ECC deprecated after 2030, disallowed after 2035). Live feeds: Federal Register API and " +
        "GOV.UK Search API for government material; an allowlisted Hacker News API query for sector and vendor news.");
    return '<div class="method-wrap">' + card({ pad: "26px" }, inner) + '</div>';
  };
})();
