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
    return card({ title: "Readiness distribution", sub: total + " institutions · status of public quantum-safe signals" },
      '<div style="display:grid;gap:14px">' + rows + '</div>' +
      '<div class="card-footnote">Click a row to filter the institutions register.</div>');
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
    return card({ title: "Readiness by institution size", sub: "Total assets, approximate · share of each tier by status" },
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
      { y: 2024.62, lane: "t2", anchor: "start", label: "FIPS 203/204/205 final", sub: "NIST · Aug 2024" },
      { y: 2025.4,  lane: "b2", label: "Google: 1M qubits breaks RSA-2048", sub: "Quantum AI research · May 2025" },
      { y: 2026.04, lane: "t1", label: "G7 sector roadmap", sub: "Treasury + BoE · Jan 2026" },
      { y: 2029,    lane: "b1", label: "Google &amp; Cloudflare PQC complete", sub: "Self-imposed 2029 targets" },
      { y: 2030,    lane: "t2", label: "RSA / ECC deprecated", sub: "NIST IR 8547 · EU critical infra" },
      { y: 2032,    lane: "b2", label: "Critical systems migrated", sub: "G7 CEG target" },
      { y: 2035,    lane: "t1", label: "RSA / ECC disallowed", sub: "NIST · federal QR target" },
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
      'Projected CRQC window — estimates cluster 2030+</div>' +
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
      '<div class="tl-footnote">Google Quantum AI research (May 2025) cut the estimated cost of breaking RSA-2048 ' +
      'twenty-fold — to under one million noisy qubits running for about a week. As of 2025, expert surveys put 10-year ' +
      'CRQC probability at 28–49%, the highest recorded. Google responded by committing to complete its own PQC ' +
      'migration by 2029.</div>';

    return card({
      title: "Migration deadline timeline",
      sub: "Standards, policy, and industry projections — after its 2025 resource estimate, Google set itself a 2029 migration deadline",
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

  function heroStat(value, label, sub) {
    return '<div class="hero-stat"><div class="hero-stat-value">' + value + '</div>' +
      '<div class="hero-stat-label">' + esc(label) + '</div>' +
      (sub ? '<div class="hero-stat-sub">' + esc(sub) + '</div>' : '') + '</div>';
  }

  function hero(data) {
    var vendors = window.VENDORS || [];
    var active = data.filter(function (b) { return b.status === "Advanced" || b.status === "In progress"; }).length;
    var shipping = vendors.filter(function (v) { return v.pqc === "shipping"; }).length;
    var live = data.filter(function (b) { return b.tls === "live"; }).length;
    var years = Math.max(0, (DEPRECATION - new Date()) / (365.25 * 864e5));
    return '<section class="hero" aria-labelledby="hero-title">' + latticeSvg() +
      '<div class="hero-inner">' +
      '<div class="hero-eyebrow">Post-quantum cryptography &middot; U.S. financial sector</div>' +
      '<h1 class="hero-title" id="hero-title">Tracking the financial sector&rsquo;s race to quantum-safe encryption</h1>' +
      '<p class="hero-lead">The RSA and elliptic-curve cryptography that protects payments, accounts, and ' +
      'market infrastructure will not survive a cryptographically relevant quantum computer &mdash; and data ' +
      'harvested today can be decrypted later. This monitor tracks public evidence of post-quantum migration across ' +
      'the ' + data.length + ' largest U.S. financial institutions and the ' + vendors.length +
      ' third parties they depend on, refreshed daily.</p>' +
      '<div class="hero-ctas">' +
      '<a class="hero-btn primary" href="#institutions" data-view="institutions">Explore institutions ' + icon("arrow-right", 16) + '</a>' +
      '<a class="hero-btn" href="#vendors" data-view="vendors">Third-party providers</a>' +
      '<a class="hero-link" href="#methodology" data-view="methodology">How readiness is scored</a>' +
      '</div>' +
      '<div class="hero-stats">' +
      heroStat(active + '<span>/' + data.length + '</span>', "Institutions with active programs", "Advanced or in-progress public signals") +
      heroStat(shipping + '<span>/' + vendors.length + '</span>', "Third parties shipping PQC", "Available in products banks consume") +
      heroStat(String(live), "Bank websites on hybrid TLS", "ML-KEM key exchange observed") +
      heroStat(years.toFixed(1) + '<span> yrs</span>', "Until RSA/ECC deprecation", "NIST IR 8547 \u00b7 after 2030") +
      '</div></div></section>';
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
      card({ title: "Furthest along", sub: "Highest readiness scores in the cohort" },
        '<div style="display:grid">' + moverList(leaders, "var(--success)") + '</div>') +
      card({ title: "Watch list", sub: "Largest institutions ($100B+) with the weakest public signals" },
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

  window.renderOverview = function (data) {
    var notEvident = data.filter(function (b) { return b.status === "Not evident"; }).length;
    var documented = data.filter(function (b) { return b.conf === "Documented"; }).length;
    var sorted = data.map(function (b) { return b.score; }).sort(function (a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    var median = !sorted.length ? "—" : sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    return hero(data) + '<div class="overview">' +
      '<div class="kpi-grid">' +
      kpiCard("gauge", "Median readiness", String(median), "of 100 across " + data.length + " institutions") +
      kpiCard("activity", "30-day change", trend30(), "in the institutions' average score") +
      kpiCard("shield-x", "No public signals", notEvident, "institutions rated Not evident") +
      kpiCard("shield-check", "Documented evidence", documented, "ratings backed by direct public disclosure") +
      '</div>' +
      '<div class="dist-grid">' + distribution(data) + sizeTiers(data) + '</div>' +
      timeline() +
      movers(data) +
      '</div>';
  };
})();
