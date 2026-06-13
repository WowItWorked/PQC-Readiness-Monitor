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
      return '<div class="dist-row" data-action="pick-status" data-status="' + esc(st) + '">' +
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
    var now = 2026.44;
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
        'border:2.5px solid var(--pnc-navy);z-index:2"></div>' +
        stem +
        '<div style="position:absolute;left:0;right:0;' + laneStyle[m.lane] + '">' +
        '<div style="font-size:12px;font-weight:700;color:var(--fg-1);line-height:1.25">' + m.label + '</div>' +
        '<div style="font-size:10.5px;color:var(--fg-3);margin-top:2px;line-height:1.3">' + m.sub + '</div>' +
        '</div></div>';
    }).join('');

    var inner =
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
      '<div style="position:absolute;top:' + AXIS + 'px;left:0;width:' + pos(now) + ';height:4px;background:var(--pnc-blue);border-radius:2px"></div>' +
      // today: tick through the axis + caption in the clear zone below
      '<div style="position:absolute;left:' + pos(now) + ';top:' + (AXIS - 12) + 'px;transform:translateX(-50%);text-align:center">' +
      '<div style="width:2px;height:28px;background:var(--pnc-orange);margin:0 auto"></div>' +
      '<div style="font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;' +
      'color:var(--pnc-orange);margin-top:4px;white-space:nowrap">Today</div></div>' +
      marksHtml +
      '</div>' +
      '<div class="tl-axis-years">' + [2024, 2026, 2028, 2030, 2032, 2034, 2036].map(function (y) {
        return '<span>' + y + '</span>';
      }).join('') + '</div>' +
      '<div class="tl-footnote">Google Quantum AI research (May 2025) cut the estimated cost of breaking RSA-2048 ' +
      'twenty-fold — to under one million noisy qubits running for about a week. Expert surveys now put 10-year ' +
      'CRQC probability at 28–49%, the highest recorded. Google responded by committing to complete its own PQC ' +
      'migration by 2029.</div>';

    return card({
      title: "Migration deadline timeline",
      sub: "Standards, policy, and industry projections — Google now believes a CRQC could break standard encryption and has set itself a 2029 migration deadline",
    }, inner);
  }

  /* ---- Leaders / watch list ---------------------------------------------- */
  function moverList(items, valueColor) {
    return items.map(function (b) {
      return '<a class="mover-row" data-action="open-inst" data-name="' + esc(b.name) + '">' +
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

  window.renderOverview = function (data) {
    var live = data.filter(function (b) { return b.tls === "live"; }).length;
    var active = data.filter(function (b) { return b.status === "Advanced" || b.status === "In progress"; }).length;
    var documented = data.filter(function (b) { return b.conf === "Documented"; }).length;
    var median = data.map(function (b) { return b.score; }).sort(function (a, b) { return a - b; })[Math.floor(data.length / 2)];
    return '<div class="overview">' +
      '<div class="kpi-grid">' +
      kpiCard("landmark", "Institutions tracked", data.length, "Top U.S. institutions by total assets") +
      kpiCard("shield-check", "Hybrid TLS live", live, "ML-KEM key exchange on primary website") +
      kpiCard("activity", "Active programs", active, "Advanced or in-progress public signals") +
      kpiCard("gauge", "Median readiness", String(median), "of 100 · " + documented + " institutions with documented evidence") +
      '</div>' +
      '<div class="dist-grid">' + distribution(data) + sizeTiers(data) + '</div>' +
      timeline() +
      movers(data) +
      '</div>';
  };
})();
