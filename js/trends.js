/* PQC Readiness Monitor — Trends: readiness transitions over time, built from
   the daily snapshot history (window.PQC_HISTORY, appended by the daily Action).
   Charts are inline SVG — no chart library, consistent with the rest of the app.
   CSS variables must be set via style="" (presentation attributes don't take var()). */

(function () {
  function band(score) {
    return score >= 70 ? "Advanced" : score >= 45 ? "In progress" : score >= 25 ? "Early stage" : "Not evident";
  }
  function bandColor(status) { return (window.READINESS[status] || {}).c || "var(--fg-3)"; }

  function hist() { return window.PQC_HISTORY || { dates: [], inst: {}, vendor: {} }; }

  function avgSeries(group, dates) {
    return dates.map(function (_, i) {
      var sum = 0, n = 0;
      Object.keys(group).forEach(function (k) { var v = group[k][i]; if (v != null) { sum += v; n++; } });
      return n ? Math.round(sum / n) : null;
    });
  }

  function statusCounts(group, i) {
    var c = { "Advanced": 0, "In progress": 0, "Early stage": 0, "Not evident": 0 };
    Object.keys(group).forEach(function (k) { var v = group[k][i]; if (v != null) c[band(v)]++; });
    return c;
  }

  /* ---- SVG line chart -------------------------------------------------------- */
  function lineChart(dates, series, opts) {
    opts = opts || {};
    var W = 700, H = opts.h || 240, padL = 34, padR = 14, padT = 14, padB = 30;
    var n = dates.length;
    var X = function (i) { return n <= 1 ? (padL + (W - padL - padR) / 2) : padL + i * (W - padL - padR) / (n - 1); };
    var Y = function (v) { return padT + (1 - v / 100) * (H - padT - padB); };
    var svg = '';
    [0, 25, 50, 75, 100].forEach(function (g) {
      var yy = Y(g);
      svg += '<line x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy + '" style="stroke:var(--line-1);stroke-width:1"/>';
      svg += '<text x="' + (padL - 6) + '" y="' + (yy + 3) + '" text-anchor="end" style="font-size:10px;fill:var(--fg-3);font-family:var(--font-mono)">' + g + '</text>';
    });
    dates.forEach(function (d, i) {
      if (n > 8 && i % Math.ceil(n / 8) !== 0 && i !== n - 1) return;
      svg += '<text x="' + X(i) + '" y="' + (H - 9) + '" text-anchor="middle" style="font-size:9.5px;fill:var(--fg-3);font-family:var(--font-mono)">' + d.slice(5) + '</text>';
    });
    series.forEach(function (s) {
      var dstr = '', started = false, dots = '', pts = 0;
      s.points.forEach(function (v) { if (v != null) pts++; });
      s.points.forEach(function (v, i) {
        if (v == null) { started = false; return; }
        var px = X(i), py = Y(v);
        dstr += (started ? "L" : "M") + px.toFixed(1) + " " + py.toFixed(1) + " ";
        started = true;
        if (pts <= 1) dots += '<circle cx="' + px + '" cy="' + py + '" r="3.5" style="fill:' + s.color + '"/>';
      });
      svg += '<path d="' + dstr + '" style="fill:none;stroke:' + s.color + ';stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round"/>' + dots;
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="line chart">' + svg + '</svg>';
  }

  /* ---- SVG stacked bars (status mix per date) -------------------------------- */
  function stackedBars(dates, group) {
    var W = 700, H = 240, padL = 28, padR = 14, padT = 10, padB = 30;
    var n = dates.length;
    var plotH = H - padT - padB, plotW = W - padL - padR;
    var total = Object.keys(group).length || 1;
    var bw = Math.min(46, (plotW / n) * 0.6);
    var svg = '';
    dates.forEach(function (d, i) {
      var cx = n <= 1 ? padL + plotW / 2 : padL + i * plotW / (n - 1);
      var x = cx - bw / 2, yTop = padT + plotH;
      window.STATUS_ORDER.slice().reverse().forEach(function (st) { // Not evident at bottom → Advanced on top
        var c = statusCounts(group, i)[st];
        var h = (c / total) * plotH;
        if (h > 0) { yTop -= h; svg += '<rect x="' + x.toFixed(1) + '" y="' + yTop.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" style="fill:' + bandColor(st) + '"/>'; }
      });
      svg += '<text x="' + cx + '" y="' + (H - 9) + '" text-anchor="middle" style="font-size:9.5px;fill:var(--fg-3);font-family:var(--font-mono)">' + d.slice(5) + '</text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="status mix">' + svg + '</svg>';
  }

  function legend(items) {
    return '<div class="legend">' + items.map(function (it) {
      return '<span class="legend-item"><span class="legend-swatch" style="background:' + it.c + '"></span>' + esc(it.label) + '</span>';
    }).join('') + '</div>';
  }

  /* ---- Movers (biggest score change across the window) ----------------------- */
  function movers(group) {
    var out = [];
    Object.keys(group).forEach(function (k) {
      var arr = group[k].filter(function (v) { return v != null; });
      if (arr.length < 2) return;
      var delta = arr[arr.length - 1] - arr[0];
      if (delta !== 0) out.push({ name: k, delta: delta, now: arr[arr.length - 1] });
    });
    out.sort(function (a, b) { return Math.abs(b.delta) - Math.abs(a.delta); });
    return out;
  }

  /* ---- Per-entity explorer --------------------------------------------------- */
  function entityChart(dates, scores) {
    var pts = scores.filter(function (v) { return v != null; });
    var first = pts[0], last = pts[pts.length - 1], delta = (pts.length >= 2) ? last - first : 0;
    var chart = lineChart(dates, [{ color: bandColor(band(last)), points: scores }], { h: 200 });
    var deltaTxt = pts.length < 2 ? "Single snapshot so far"
      : delta === 0 ? "No change over the captured window"
      : (delta > 0 ? "+" : "") + delta + " points since " + dates.find(function (_, i) { return scores[i] != null; });
    return { chart: chart, last: last, delta: delta, deltaTxt: deltaTxt };
  }

  window.renderTrends = function (opts) {
    opts = opts || {};
    var h = hist();
    var dates = h.dates || [];
    var cohort = opts.cohort === "vendor" ? "vendor" : "inst";
    var group = cohort === "vendor" ? h.vendor : h.inst;
    var cohortLabel = cohort === "vendor" ? "Third parties" : "Institutions";

    if (!dates.length) {
      return '<div class="view-pad"><div class="feed-empty">No snapshot history yet. The daily job records one snapshot per day; charts appear once data accumulates.</div></div>';
    }

    var range = dates.length === 1 ? dates[0] : dates[0] + " → " + dates[dates.length - 1];
    var instAvg = avgSeries(h.inst, dates), vAvg = avgSeries(h.vendor, dates);

    // Cohort average line
    var avgCard = card({ title: "Average readiness over time", sub: "Mean score across each cohort · 0–100" },
      lineChart(dates, [
        { label: "Institutions", color: "var(--pnc-navy)", points: instAvg },
        { label: "Third parties", color: "var(--pnc-orange)", points: vAvg },
      ]) +
      legend([{ label: "Institutions", c: "var(--pnc-navy)" }, { label: "Third parties", c: "var(--pnc-orange)" }]));

    // Status mix stacked bars with cohort toggle
    var toggle = '<div class="trends-toggle">' +
      ['inst', 'vendor'].map(function (cv) {
        return '<button data-action="trends-cohort" data-cohort="' + cv + '"' + (cohort === cv ? ' class="active"' : '') + '>' +
          (cv === "vendor" ? "Third parties" : "Institutions") + '</button>';
      }).join('') + '</div>';
    var mixCard = card({ title: "Status distribution over time", sub: cohortLabel + " · share of each readiness band per snapshot" },
      toggle + stackedBars(dates, group) +
      legend(window.STATUS_ORDER.map(function (st) { return { label: st, c: bandColor(st) }; })));

    // Movers
    var mv = movers(group);
    var moversInner;
    if (!mv.length) {
      moversInner = '<div class="feed-empty" style="padding:24px 16px">No rating changes captured yet — snapshots are identical so far. Movers appear here automatically once a score changes between days.</div>';
    } else {
      moversInner = '<div style="display:grid;gap:2px">' + mv.slice(0, 8).map(function (m) {
        var up = m.delta > 0;
        return '<div class="mover-row" data-action="' + (cohort === "vendor" ? "open-vendor" : "open-inst") + '" data-name="' + esc(m.name) + '">' +
          '<span class="mover-name" style="grid-column:1/2">' + esc(m.name) + '</span>' +
          '<span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:' + (up ? "var(--success)" : "var(--danger)") + '">' +
          (up ? "▲ +" : "▼ ") + m.delta + '</span>' +
          '<span style="font-family:var(--font-mono);font-size:13px;color:var(--fg-3)">now ' + m.now + '</span></div>';
      }).join('') + '</div>';
    }
    var moversCard = card({ title: "Biggest movers", sub: cohortLabel + " · score change across the captured window" }, moversInner);

    // Per-entity explorer
    var sel = opts.entity || ("inst::" + Object.keys(h.inst)[0]);
    var parts = sel.split("::"), selGroupKey = parts[0] === "vendor" ? "vendor" : "inst", selName = parts.slice(1).join("::");
    var selGroup = selGroupKey === "vendor" ? h.vendor : h.inst;
    if (!selGroup[selName]) { selName = Object.keys(selGroup)[0]; sel = selGroupKey + "::" + selName; }
    var ec = entityChart(dates, selGroup[selName]);
    var options = ['<optgroup label="Institutions">' +
      Object.keys(h.inst).map(function (nm) { return '<option value="inst::' + esc(nm) + '"' + (sel === "inst::" + nm ? " selected" : "") + '>' + esc(nm) + '</option>'; }).join('') + '</optgroup>',
      '<optgroup label="Third parties">' +
      Object.keys(h.vendor).map(function (nm) { return '<option value="vendor::' + esc(nm) + '"' + (sel === "vendor::" + nm ? " selected" : "") + '>' + esc(nm) + '</option>'; }).join('') + '</optgroup>'].join('');
    var explorerCard = card({ title: "Track a single entity", sub: "Readiness score over time for one institution or third party" },
      '<div class="trends-explorer-head">' +
      '<select class="select-ctl" data-action="trends-entity">' + options + '</select>' +
      '<span class="trends-entity-now">' + readinessBadge(band(ec.last)) +
      '<span class="trends-entity-delta">' + esc(ec.deltaTxt) + '</span></span></div>' +
      ec.chart);

    return '<div class="trends">' +
      '<div class="trends-summary">' + icon("trending-up", 16, "var(--pnc-orange)") +
      '<span><strong>' + dates.length + ' snapshot' + (dates.length === 1 ? "" : "s") + '</strong> captured · ' + esc(range) +
      '. A new snapshot is recorded each day; the charts show how readiness transitions over time.</span></div>' +
      avgCard +
      '<div class="trends-grid">' + mixCard + moversCard + '</div>' +
      explorerCard +
      '<div class="register-footnote">Scores are the published readiness ratings captured at each daily snapshot. ' +
      'Lines are flat while the underlying curated data is unchanged; transitions appear automatically as ratings ' +
      'move (e.g. when a live TLS scan or research pass updates a record).</div>' +
      '</div>';
  };
})();
