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
    ["vendors", "Providers"],
    ["trends", "Trends"],
    ["standards", "Standards & guidance"],
    ["methodology", "How we rate"],
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
      '<a class="lp-cta" href="#overview" data-view="overview"><span class="lp-cta-full">Open dashboard</span>' +
        '<span class="lp-cta-short">Dashboard</span> ' + icon("arrow-right", 15) + '</a>' +
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
      item("shield-check", "Website check", f.tls, "Automated daily check of whether each bank's website uses quantum-safe encryption") +
      item("landmark", "Ratings last reviewed", f.ratings, "Plans, industry participation, and technology choices — reviewed by researchers") +
      item("scale", "Standards & guidance reviewed", f.intel, "Reviewed monthly; official government updates are added automatically on each visit") +
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
      { k: live + " vs " + active, t: "Websites are ahead of plans",
        b: live + " bank websites already use quantum-safe encryption, but only " + active +
          " banks show visible plans to prepare. Much of today's protection comes automatically from the hosting and cloud providers banks use, rather than from a deliberate decision.",
        v: "institutions", l: "See all institutions" },
      { k: bigPct + "% vs " + smallPct + "%", t: "Larger banks show more preparation",
        b: bigPct + "% of the " + big.length + " banks with over $250B in assets show active preparation, compared with " +
          smallPct + "% of the " + small.length + " banks under $50B." +
          (smallEst >= 50 ? " Note: " + smallEst + "% of the smaller banks have not yet been researched in detail, so part of this gap may reflect missing information rather than inaction." : ""),
        v: "overview", l: "Readiness by size" },
      { k: shipping + " vs " + advanced, t: "Providers are ahead of banks",
        b: shipping + " of " + vendors.length + " key providers already offer quantum-safe protection in products banks buy, while " + advanced +
          (advanced === 1 ? " bank is" : " banks are") + " rated Advanced. Asking providers about their plans in due diligence and contract renewals is one of the fastest levers most institutions have.",
        v: "vendors", l: "See all providers" },
    ];
    return '<section class="lp-section"><div class="lp-head">' +
      '<div class="lp-eyebrow">Key findings</div>' +
      '<h2 class="lp-h2">What the evidence shows</h2></div>' +
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
      ["overview", "layout-dashboard", "Dashboard", "The overall picture: ratings, size comparison, key deadlines, and a watch list."],
      ["institutions", "landmark", "Institutions", "The " + data.length + " largest U.S. financial institutions — search and open any rating."],
      ["vendors", "boxes", "Third-party providers", vendors.length + " key technology, payments, and security providers the sector relies on."],
      ["trends", "trending-up", "Trends", days + " days of daily records showing how ratings change over time."],
      ["standards", "scale", "Standards & guidance", "Official rules, deadlines, and practical guidance, each linked to its source."],
      ["methodology", "book-open", "How we rate", "What the ratings mean, how we gather evidence, and key terms explained."],
    ];
    return '<section class="lp-section"><div class="lp-head">' +
      '<div class="lp-eyebrow">Explore</div><h2 class="lp-h2">Find what you need</h2></div>' +
      '<div class="lp-explore">' + sections.map(function (s) {
        return '<a class="lp-card" href="#' + s[0] + '" data-view="' + s[0] + '">' +
          '<span class="lp-card-icon">' + icon(s[1], 18) + '</span>' +
          '<span class="lp-card-t">' + esc(s[2]) + '</span>' +
          '<span class="lp-card-b">' + esc(s[3]) + '</span></a>';
      }).join('') + '</div></section>';
  }

  /* ---- Audience guide: what each kind of reader should do with this -------- */
  function audiences() {
    var groups = [
      { icon: "users", t: "Board and executive leadership", v: "overview", l: "Open the dashboard",
        b: "See where your institution and its peers stand, how strong the evidence is, and which deadlines matter.",
        q: ["Do we know where our organization relies on encryption?", "Who owns our quantum-safe plan, and what is the timeline?",
            "When will our most critical providers be ready?"] },
      { icon: "file-check", t: "Third-party risk and procurement", v: "vendors", l: "Check a provider",
        b: "Review a provider's public readiness before onboarding or renewal, and use it to shape due-diligence questions.",
        q: ["Do you have a published plan, with dates, for quantum-safe security?", "Which of the products we use already support it?",
            "How and when will you tell us about changes that affect us?"] },
      { icon: "shield-check", t: "Technology and security teams", v: "methodology", l: "See the technical detail",
        b: "Every rating opens a detail panel with the underlying technical evidence, standards references, and sources.",
        q: ["Which algorithms and protocols were observed?", "Which standards bodies and working groups are involved?",
            "What does the daily website check actually test?"] },
    ];
    return '<section class="lp-section"><div class="lp-head">' +
      '<div class="lp-eyebrow">How to use this monitor</div><h2 class="lp-h2">Questions to ask, by role</h2></div>' +
      '<div class="lp-findings">' + groups.map(function (g) {
        return '<article class="lp-finding lp-audience">' +
          '<span class="lp-card-icon">' + icon(g.icon, 18) + '</span>' +
          '<h3 class="lp-finding-t">' + esc(g.t) + '</h3>' +
          '<p class="lp-finding-b">' + esc(g.b) + '</p>' +
          '<ul class="lp-questions">' + g.q.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
          '<a class="lp-more" href="#' + g.v + '" data-view="' + g.v + '">' + esc(g.l) + ' ' + icon("arrow-right", 14) + '</a>' +
          '</article>';
      }).join('') + '</div></section>';
  }

  function footer() {
    var f = window.pqcFreshness();
    return '<footer class="lp-foot"><div class="lp-foot-inner">' +
      '<div><strong>PQC Readiness Monitor</strong> · Emerging Tech Risk</div>' +
      '<div>Ratings are based on publicly available evidence and are not an audit of any organization. ' +
      'Website check ' + esc(f.tls) + ' · ratings reviewed ' + esc(f.ratings) + '. ' +
      '<a href="#methodology" data-view="methodology">How we rate</a></div>' +
      '</div></footer>';
  }

  window.renderLanding = function (data) {
    return '<div class="lp">' + window.prototypeBanner() + topbar() +
      window.renderHero(data) +
      '<main class="lp-main" id="main">' +
      freshness() +
      findings(data) +
      audiences() +
      '<section class="lp-section">' + window.renderTimeline() + '</section>' +
      explore(data) +
      '</main>' + footer() + '</div>';
  };
})();
