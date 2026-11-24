/* PQC Readiness Monitor — Overview: KPIs, distribution, size-tier breakdown,
   migration deadline timeline (four staggered label lanes), leaders/watch list. */

(function () {
  function kpiCard(iconName, label, value, foot) {
    return '<div class="card">' +
      '<div class="kpi-head">' + icon(iconName, 15) + '<span class="kpi-label">' + esc(label) + '</span></div>' +
      '<div class="kpi-value">' + esc(value) + '</div>' +
      '<div class="kpi-foot">' + esc(foot) + '</div></div>';
  }

  /* ---- Readiness distribution (status counts) --------------------------- */
  function distribution(data) {
    var total = data.length;
    var rows = STATUS_ORDER.map(function (st) {
      var n = data.filter(function (b) { return b.status === st; }).length;
      var m = READINESS[st];
      return '<div class="dist-row" tabindex="0" role="button" data-action="pick-status" data-status="' + esc(st) + '">' +
        '<span class="dist-row-label">' + esc(st) + '</span>' +
        '<div class="dist-track"><div class="dist-fill" style="width:' + (n / total) * 100 + '%;background:' + m.c + '"></div></div>' +
        '<span class="dist-count">' + n + '</span></div>';
    }).join('');
    return card({ title: "Where institutions stand", sub: total + " institutions · rated on public evidence of preparation" },
      '<div style="display:grid;gap:14px">' + rows + '</div>' +
      '<div class="card-footnote">Select a row to see those institutions.</div>');
  }

  /* ---- Readiness by size tier (stacked bars) ----------------------------- */
  var TIERS = [
    ["Over $1T", function (b) { return b.assets >= 1000; }],
    ["$250B – $1T", function (b) { return b.assets >= 250 && b.assets < 1000; }],
    ["$100B – $250B", function (b) { return b.assets >= 100 && b.assets < 250; }],
    ["$50B – $100B", function (b) { return b.assets >= 50 && b.assets < 100; }],
    ["Under $50B", function (b) { return b.assets < 50; }],
  ];

  function sizeTiers(data) {
    var rows = TIERS.map(function (t) {
      var tier = data.filter(t[1]);
      var segs = STATUS_ORDER.map(function (st) {
        var n = tier.filter(function (b) { return b.status === st; }).length;
        if (!n) return '';
        return '<div title="' + esc(st) + ': ' + n + '" style="width:' + (n / tier.length) * 100 + '%;background:' + READINESS[st].c + '"></div>';
      }).join('');
      return '<div class="tier-row"><span class="tier-label">' + esc(t[0]) + '</span>' +
        '<div class="tier-track">' + segs + '</div>' +
        '<span class="tier-count">' + tier.length + '</span></div>';
    }).join('');
    var legend = STATUS_ORDER.map(function (st) {
      return '<span class="legend-item"><span class="legend-swatch" style="background:' + READINESS[st].c + '"></span>' + esc(st) + '</span>';
    }).join('');
    return card({ title: "Readiness by institution size", sub: "Grouped by total assets · share of each group by rating" },
      '<div style="display:grid;gap:14px">' + rows + '</div>' +
      '<div class="legend">' + legend + '</div>');
  }

  /* ---- Migration deadline timeline --------------------------------------- */
  function timeline() {
    var start = 2024, end = 2036.5;
    var pos = function (y) { return ((y - start) / (end - start)) * 100 + "%"; };
    // "Today" marker tracks the real date so it never goes stale between deploys.
    var d = new Date();
    var now = d.getFullYear() + (d.getMonth() + d.getDate() / 31) / 12;
    var crqcStart = 2030;
    var marks = [
      { y: 2024.62, lane: "t2", anchor: "start", label: "First quantum-safe standards", sub: "NIST · Aug 2024" },
      { y: 2025.4,  lane: "b2", label: "Research: encryption easier to break", sub: "Google · May 2025" },
      { y: 2026.04, lane: "t1", label: "G7 financial-sector roadmap", sub: "UK Treasury · Jan 2026" },
      { y: 2029,    lane: "b1", label: "Google &amp; Cloudflare targets", sub: "Own 2029 upgrade deadlines" },
      { y: 2030,    lane: "t2", label: "Retirement of today\u2019s encryption begins", sub: "NIST · EU critical infra" },
      { y: 2032,    lane: "b2", label: "Critical financial systems upgraded", sub: "G7 target" },
      { y: 2035,    lane: "t1", label: "Today\u2019s encryption no longer allowed", sub: "NIST · U.S. federal target" },
    ];
    // Four label lanes around the axis so neighbours never collide:
    // t2 (high) · t1 (near, 2-line budget) · AXIS · b1 (near) · b2 (low)
    var AXIS = 114, H = 230, LW = 150;
    var laneStyle = {
      t1: "bottom:" + (H - AXIS + 14) + "px",
      t2: "bottom:" + (H - AXIS + 64) + "px",
      b1: "top:" + (AXIS + 22) + "px",
      b2: "top:" + (AXIS + 58) + "px",
    };

    var marksHtml = marks.map(function (m) {
      var startAnchored = m.anchor === "start";
      var far = m.lane === "t2" || m.lane === "b2";
      var stem = far
        ? '<div style="position:absolute;width:1px;background:var(--line-2);left:' + (startAnchored ? "0" : "50%") + ';top:' +
          (m.lane === "t2" ? AXIS - 60 : AXIS + 9) + 'px;height:' + (m.lane === "t2" ? 54 : 44) + 'px"></div>'
        : '';
      return '<div style="position:absolute;left:' + pos(m.y) + ';top:0;height:' + H + 'px;' +
        'transform:' + (startAnchored ? "none" : "translateX(-50%)") + ';width:' + LW + 'px;' +
        'text-align:' + (startAnchored ? "left" : "center") + '">' +
        '<div style="position:absolute;top:' + (AXIS - 3) + 'px;left:' + (startAnchored ? "0" : "50%") + ';' +
        'transform:translateX(-50%);width:10px;height:10px;border-radius:50%;background:#fff;' +
        'border:2.5px solid var(--brand-ink);z-index:2"></div>' +
        stem +
        '<div style="position:absolute;left:0;right:0;' + laneStyle[m.lane] + '">' +
        '<div style="font-size:12px;font-weight:700;color:var(--fg-1);line-height:1.25">' + m.label + '</div>' +
        '<div style="font-size:10.5px;color:var(--fg-3);margin-top:2px;line-height:1.3">' + m.sub + '</div>' +
        '</div></div>';
    }).join('');

    var inner =
      '<div class="tl-scroll"><div class="tl-inner">' +
      '<div style="position:relative;height:' + H + 'px;margin:6px 6px 0">' +
      // projected CRQC window
      '<div style="position:absolute;top:0;height:' + (H - 24) + 'px;left:' + pos(crqcStart) + ';right:0;' +
      'background:var(--warning-bg);border-left:1px dashed var(--warning);' +
      'border-radius:0 var(--radius-sm) var(--radius-sm) 0"></div>' +
      '<div style="position:absolute;top:' + (H - 18) + 'px;right:6px;font-size:11px;font-weight:700;' +
      'letter-spacing:0.05em;text-transform:uppercase;color:var(--warning);white-space:nowrap;text-align:right">' +
      'When a code-breaking quantum computer may arrive — most estimates 2030+</div>' +
      // axis
      '<div style="position:absolute;top:' + AXIS + 'px;left:0;right:0;height:4px;background:var(--gray-100);border-radius:2px"></div>' +
      '<div style="position:absolute;top:' + AXIS + 'px;left:0;width:' + pos(now) + ';height:4px;background:var(--brand-blue);border-radius:2px"></div>' +
      // today: tick through the axis + caption in the clear zone below
      '<div style="position:absolute;left:' + pos(now) + ';top:' + (AXIS - 12) + 'px;transform:translateX(-50%);text-align:center">' +
      '<div style="width:2px;height:28px;background:var(--brand-accent);margin:0 auto"></div>' +
      '<div style="font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;' +
      'color:var(--brand-accent);margin-top:4px;white-space:nowrap">Today</div></div>' +
      marksHtml +
      '</div>' +
      '<div class="tl-axis-years">' + [2024, 2026, 2028, 2030, 2032, 2034, 2036].map(function (y) {
        return '<span>' + y + '</span>';
      }).join('') + '</div>' +
      '</div></div>' +
      '<div class="tl-footnote">Why the urgency: in 2025, Google researchers estimated that the encryption most ' +
      'organizations rely on could be broken with far less quantum computing power than previously thought. Expert ' +
      'surveys in 2025 put the chance of such a machine within ten years at roughly 28&ndash;49%. Information stolen ' +
      'today can be stored and decrypted later, so long-lived sensitive data is already at risk.</div>';

    return card({
      title: "Key deadlines",
      sub: "Key standards, policy deadlines, and industry targets for upgrading to quantum-safe encryption",
    }, inner);
  }

  /* ---- Landing hero ------------------------------------------------------- */
  // Decorative lattice — a nod to the lattice math behind ML-KEM / ML-DSA.
  function latticeSvg() {
    var pts = [], lines = [], cols = 11, rows = 7, dx = 56, dy = 52;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = c * dx + (r % 2 ? dx / 2 : 0) + 20, y = r * dy + 20;
        pts.push('<circle cx="' + x + '" cy="' + y + '" r="' + ((r * 7 + c * 3) % 5 === 0 ? 3.2 : 1.6) + '"/>');
        if (c < cols - 1) lines.push('<line x1="' + x + '" y1="' + y + '" x2="' + (x + dx) + '" y2="' + y + '"/>');
        if (r < rows - 1) {
          var nx = x + (r % 2 ? dx / 2 : -dx / 2);
          lines.push('<line x1="' + x + '" y1="' + y + '" x2="' + nx + '" y2="' + (y + dy) + '"/>');
        }
      }
    }
    return '<svg class="hero-lattice" viewBox="0 0 640 360" aria-hidden="true" focusable="false">' +
      '<g class="hero-lattice-lines">' + lines.join('') + '</g>' +
      '<g class="hero-lattice-dots">' + pts.join('') + '</g></svg>';
  }

  // NIST IR 8547: quantum-vulnerable public-key algorithms deprecated after 2030.
  var DEPRECATION = new Date(2031, 0, 1);

  // `evidence` is pre-built HTML describing how well-grounded the figure is.
  function heroStat(value, label, evidence) {
    return '<div class="hero-stat"><div class="hero-stat-value">' + value + '</div>' +
      '<div class="hero-stat-label">' + esc(label) + '</div>' +
      '<div class="hero-evidence">' + evidence + '</div></div>';
  }

  // Evidence mix for a set of ratings: a thin proportional bar plus counts,
  // so a reader can see how much of a headline figure rests on disclosure.
  var CONF_ORDER = ["Documented", "Inferred", "Estimated"];
  function evidenceMix(list) {
    var n = list.length;
    var c = { Documented: 0, Inferred: 0, Estimated: 0 };
    list.forEach(function (x) { if (c[x.conf] != null) c[x.conf]++; });
    var bar = n ? '<span class="ev-bar" aria-hidden="true">' + CONF_ORDER.map(function (k) {
      return c[k] ? '<span class="ev-' + k.toLowerCase() + '" style="width:' + (c[k] / n) * 100 + '%"></span>' : '';
    }).join('') + '</span>' : '';
    var text = CONF_ORDER.filter(function (k) { return c[k]; }).map(function (k) {
      return '<span class="ev-key ev-key-' + k.toLowerCase() + '">' + c[k] + ' ' + k.toLowerCase() + '</span>';
    }).join(' · ');
    return bar + '<span class="ev-text">' + text + '</span>';
  }

  function hero(data) {
    var vendors = window.VENDORS || [];
    var activeList = data.filter(function (b) { return b.status === "Advanced" || b.status === "In progress"; });
    var shippingList = vendors.filter(function (v) { return v.pqc === "shipping"; });
    var liveList = data.filter(function (b) { return b.tls === "live"; });
    var observed = liveList.filter(function (b) { return b.tlsObserved; }).length;
    var scanned = data.filter(function (b) { return b.tlsObserved; }).length;
    var estimated = data.filter(function (b) { return b.conf === "Estimated"; }).length;
    var documentedAll = data.filter(function (b) { return b.conf === "Documented"; }).length;
    var tlsEvidence = '<span class="ev-text">' + (observed === liveList.length
      ? (liveList.length ? "All " + observed : "None") + " confirmed by our daily automated website check"
      : observed + " confirmed by our daily check · " + (liveList.length - observed) + " assumed") +
      (scanned ? " (" + scanned + " websites checked)" : "") + '</span>';
    var years = Math.max(0, (DEPRECATION - new Date()) / (365.25 * 864e5));
    return '<section class="hero" aria-labelledby="hero-title">' + latticeSvg() +
      '<div class="hero-inner">' +
      '<div class="hero-eyebrow">Post-quantum readiness &middot; U.S. financial sector</div>' +
      '<h1 class="hero-title" id="hero-title">A transparent view of how financial institutions and their providers are preparing for quantum-safe security</h1>' +
      '<p class="hero-lead">Future quantum computers are expected to break the encryption that protects today&rsquo;s ' +
      'payments, accounts, and records. Every financial institution &mdash; and every provider it relies on &mdash; will ' +
      'need to upgrade. This monitor brings together the public evidence of that preparation for the ' + data.length +
      ' largest U.S. financial institutions and ' + vendors.length + ' key third-party providers, and shows how strong ' +
      'that evidence is, so leaders can see where the sector stands and ask better questions.</p>' +
      '<div class="hero-ctas">' +
      '<a class="hero-btn primary" href="#overview" data-view="overview">Open the dashboard ' + icon("arrow-right", 16) + '</a>' +
      '<a class="hero-btn" href="#institutions" data-view="institutions">Explore institutions</a>' +
      '<a class="hero-link" href="#methodology" data-view="methodology">How we rate organizations</a>' +
      '</div>' +
      '<div class="hero-stats">' +
      heroStat(activeList.length + '<span>/' + data.length + '</span>', "Institutions showing active preparation", evidenceMix(activeList)) +
      heroStat(shippingList.length + '<span>/' + vendors.length + '</span>', "Key providers offering quantum-safe products", evidenceMix(shippingList)) +
      heroStat(String(liveList.length), "Bank websites already using quantum-safe encryption", tlsEvidence) +
      heroStat(years.toFixed(1) + '<span> yrs</span>', "Until U.S. standards begin retiring today\u2019s encryption",
        '<span class="ev-text">NIST guidance: phase-out begins after 2030</span>') +
      '</div>' +
      (estimated ? '<p class="hero-caveat">' + icon("info", 15) + '<span><strong>' + estimated + ' of ' + data.length +
        ' institution ratings are still placeholder estimates</strong> until we research them in detail, so treat ' +
        'these counts as a guide, not a verdict. The website checks and publicly documented ratings are the most reliable figures. ' +
        '<a href="#methodology" data-view="methodology">How ratings are evidenced</a></span></p>'
      : '<p class="hero-caveat">' + icon("info", 15) + '<span><strong>Every rating is researched and sourced.</strong> ' +
        documentedAll + ' of ' + data.length + ' institution ratings rest on the organizations&rsquo; own disclosures or official ' +
        'records; the rest rely on reputable reporting, or on finding no public evidence &mdash; which is not proof of inaction. ' +
        '<a href="#methodology" data-view="methodology">How ratings are evidenced</a></span></p>') +
      '</div></section>';
  }

  /* ---- Leaders / watch list ---------------------------------------------- */
  function moverList(items, valueColor) {
    return items.map(function (b) {
      return '<a class="mover-row" tabindex="0" role="button" data-action="open-inst" data-name="' + esc(b.name) + '">' +
        '<span class="mover-rank">' + String(b.rank).padStart(2, "0") + '</span>' +
        '<span class="mover-name">' + esc(b.name) + '</span>' +
        readinessBadge(b.status) +
        '<span class="mover-score" style="color:' + valueColor + '">' + b.score + '</span></a>';
    }).join('');
  }

  function movers(data) {
    var leaders = data.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, 5);
    var exposed = data.filter(function (b) { return b.assets >= 100; })
      .sort(function (a, b) { return a.score - b.score; }).slice(0, 5);
    return '<div class="movers-grid">' +
      card({ title: "Furthest along", sub: "Institutions with the strongest public evidence of preparation" },
        '<div style="display:grid">' + moverList(leaders, "var(--success)") + '</div>') +
      card({ title: "Watch list", sub: "Large institutions ($100B+ in assets) with the least public evidence of preparation" },
        '<div style="display:grid">' + moverList(exposed, "var(--danger)") + '</div>') +
      '</div>';
  }

  // Change in the institutions' average score over the last 30 recorded days.
  function trend30() {
    var h = window.PQC_HISTORY;
    if (!h || !h.dates || h.dates.length < 2) return "—";
    var last = h.dates.length - 1, first = Math.max(0, last - 30);
    function avg(i) {
      var sum = 0, n = 0;
      Object.keys(h.inst).forEach(function (k) { var v = h.inst[k][i]; if (v != null) { sum += v; n++; } });
      return n ? sum / n : null;
    }
    var a = avg(first), b = avg(last);
    if (a == null || b == null) return "—";
    var d = Math.round((b - a) * 10) / 10;
    return (d > 0 ? "+" : d < 0 ? "−" : "±") + Math.abs(d).toFixed(1);
  }

  window.renderHero = hero;
  window.renderTimeline = timeline;

  window.renderOverview = function (data) {
    var activeList = data.filter(function (b) { return b.status === "Advanced" || b.status === "In progress"; });
    var conf = { Documented: 0, Inferred: 0, Estimated: 0 };
    activeList.forEach(function (b) { if (conf[b.conf] != null) conf[b.conf]++; });
    var live = data.filter(function (b) { return b.tls === "live"; }).length;
    var sorted = data.map(function (b) { return b.score; }).sort(function (a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    var median = !sorted.length ? "—" : sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    return '<div class="overview">' +
      '<div class="kpi-grid">' +
      kpiCard("activity", "Showing active preparation", activeList.length + " / " + data.length,
        conf.Documented + " documented · " + conf.Inferred + " inferred · " + conf.Estimated + " estimated") +
      kpiCard("shield-check", "Quantum-safe websites", live, "confirmed by our daily website check") +
      kpiCard("gauge", "Typical score", String(median), "median of 100, across " + data.length + " institutions") +
      kpiCard("trending-up", "30-day change", trend30(), "in the institutions' average score") +
      '</div>' +
      '<div class="dist-grid">' + distribution(data) + sizeTiers(data) + '</div>' +
      timeline() +
      movers(data) +
      '</div>';
  };
})();
