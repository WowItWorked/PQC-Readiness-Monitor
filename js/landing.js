/* PQC Readiness Monitor — front page.
   A standalone landing layout (top bar, no sidebar): hero, freshness, findings
   computed from the data, the deadline timeline, and entry points into each
   dashboard view. Every figure is derived at render time so nothing goes stale
   between curated updates. */

(function () {
  function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }
  function isActive(b) { return b.status === "Advanced" || b.status === "In progress"; }

  /* ---- Top bar ------------------------------------------------------------- */
  var LINKS = [
    ["overview", "Dashboard"],
    ["institutions", "Institutions"],
    ["vendors", "Third parties"],
    ["trends", "Trends"],
    ["standards", "Intelligence"],
    ["methodology", "Methodology"],
  ];

  function topbar() {
    return '<header class="lp-top"><div class="lp-top-inner">' +
      '<a class="lp-brand" href="#" data-view="home" aria-label="PQC Readiness Monitor — front page">' +
      logoMark() +
      '<span class="lp-brand-text"><span class="logo-kicker">Emerging Tech Risk</span>' +
      '<span>PQC Readiness Monitor</span></span></a>' +
      '<nav class="lp-links" aria-label="Sections">' + LINKS.map(function (l) {
        return '<a href="#' + l[0] + '" data-view="' + l[0] + '">' + esc(l[1]) + '</a>';
      }).join('') + '</nav>' +
      '<a class="lp-cta" href="#overview" data-view="overview">Open dashboard ' + icon("arrow-right", 15) + '</a>' +
      '</div></header>';
  }

  /* ---- Freshness: say exactly how current each input is ---------------------- */
  function freshness() {
    var f = window.pqcFreshness();
    function item(iconName, label, value, note) {
      return '<div class="lp-fresh-item">' + icon(iconName, 16) +
        '<div><div class="lp-fresh-label">' + esc(label) + '</div>' +
        '<div class="lp-fresh-value">' + esc(value) + '</div>' +
        '<div class="lp-fresh-note">' + esc(note) + '</div></div></div>';
    }
    return '<section class="lp-fresh" aria-label="How current this data is">' +
      item("shield-check", "Website TLS scan", f.tls, "Automated daily handshake scan of each bank's primary site") +
      item("landmark", "Firm ratings reviewed", f.ratings, "Roadmap, standards, and infrastructure signals — curated research pass") +
      item("scale", "Standards & guidance reviewed", f.intel, "Curated baseline; live government feeds extend it on every visit") +
      '</section>';
  }

  /* ---- Findings (computed) ---------------------------------------------------- */
  function findings(data) {
    var vendors = window.VENDORS || [];
    var live = data.filter(function (b) { return b.tls === "live"; }).length;
    var active = data.filter(isActive).length;
    var big = data.filter(function (b) { return b.assets >= 250; });
    var small = data.filter(function (b) { return b.assets < 50; });
    var bigPct = pct(big.filter(isActive).length, big.length);
    var smallPct = pct(small.filter(isActive).length, small.length);
    var smallEst = pct(small.filter(function (b) { return b.conf === "Estimated"; }).length, small.length);
    var shipping = vendors.filter(function (v) { return v.pqc === "shipping"; }).length;
    var advanced = data.filter(function (b) { return b.status === "Advanced"; }).length;

    var cards = [
      { k: live + " vs " + active, t: "Infrastructure is ahead of strategy",
        b: live + " bank websites already negotiate hybrid ML-KEM key exchange, but only " + active +
          " institutions show an active PQC program. Much of today's protection is inherited from CDN and cloud providers, not chosen.",
        v: "institutions", l: "See the register" },
      { k: bigPct + "% vs " + smallPct + "%", t: "Size predicts readiness",
        b: "Share of institutions with active programs: " + bigPct + "% of the " + big.length + " banks over $250B in assets, versus " +
          smallPct + "% of the " + small.length + " under $50B." +
          (smallEst >= 50 ? " Caution: " + smallEst + "% of the smaller banks are still placeholder estimates, so part of this gap may reflect missing research rather than inactivity." : ""),
        v: "overview", l: "Readiness by size" },
      { k: shipping + " vs " + advanced, t: "Vendors lead, banks follow",
        b: shipping + " of " + vendors.length + " key third parties already ship PQC in products banks consume, while " + advanced +
          " banks rate Advanced. Vendor due-diligence is the fastest lever for most institutions.",
        v: "vendors", l: "Third-party register" },
    ];
    return '<section class="lp-section"><div class="lp-head">' +
      '<div class="lp-eyebrow">What the data shows</div>' +
      '<h2 class="lp-h2">Three things stand out</h2></div>' +
      '<div class="lp-findings">' + cards.map(function (c) {
        return '<article class="lp-finding">' +
          '<div class="lp-finding-k">' + esc(c.k) + '</div>' +
          '<h3 class="lp-finding-t">' + esc(c.t) + '</h3>' +
          '<p class="lp-finding-b">' + esc(c.b) + '</p>' +
          '<a class="lp-more" href="#' + c.v + '" data-view="' + c.v + '">' + esc(c.l) + ' ' + icon("arrow-right", 14) + '</a>' +
          '</article>';
      }).join('') + '</div></section>';
  }

  /* ---- Explore ---------------------------------------------------------------- */
  function explore(data) {
    var vendors = window.VENDORS || [];
    var days = ((window.PQC_HISTORY || {}).dates || []).length;
    var sections = [
      ["overview", "layout-dashboard", "Dashboard", "Distribution, size tiers, deadlines, leaders and watch list."],
      ["institutions", "landmark", "Institutions", data.length + " largest U.S. institutions — filter, search, open any rating."],
      ["vendors", "boxes", "Third parties", vendors.length + " core, cloud, payments, and PKI providers the sector depends on."],
      ["trends", "trending-up", "Readiness trends", days + " daily snapshots — movement by cohort and by firm."],
      ["standards", "scale", "Intelligence", "Standards, implementation guidance, sector and vendor news — each linked to source."],
      ["methodology", "book-open", "Methodology", "How scores, evidence levels, and the TLS scan work."],
    ];
    return '<section class="lp-section"><div class="lp-head">' +
      '<div class="lp-eyebrow">Explore</div><h2 class="lp-h2">Go deeper</h2></div>' +
      '<div class="lp-explore">' + sections.map(function (s) {
        return '<a class="lp-card" href="#' + s[0] + '" data-view="' + s[0] + '">' +
          '<span class="lp-card-icon">' + icon(s[1], 18) + '</span>' +
          '<span class="lp-card-t">' + esc(s[2]) + '</span>' +
          '<span class="lp-card-b">' + esc(s[3]) + '</span></a>';
      }).join('') + '</div></section>';
  }

  function footer() {
    var f = window.pqcFreshness();
    return '<footer class="lp-foot"><div class="lp-foot-inner">' +
      '<div><strong>PQC Readiness Monitor</strong> · Emerging Tech Risk</div>' +
      '<div>Assessments are built from public signals and are not an audit of any institution. ' +
      'TLS scan ' + esc(f.tls) + ' · ratings reviewed ' + esc(f.ratings) + '. ' +
      '<a href="#methodology" data-view="methodology">Methodology</a></div>' +
      '</div></footer>';
  }

  window.renderLanding = function (data) {
    return '<div class="lp">' + window.prototypeBanner() + topbar() +
      window.renderHero(data) +
      '<main class="lp-main" id="main">' +
      freshness() +
      findings(data) +
      '<section class="lp-section">' + window.renderTimeline() + '</section>' +
      explore(data) +
      '</main>' + footer() + '</div>';
  };
})();
