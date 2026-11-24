/* PQC Readiness Monitor — shared TLS scoring overlay.
   Loaded both in the browser (window) and by the daily snapshot script (Node vm),
   so the displayed score and the recorded-history score never diverge.

   The published readiness score embeds an assumed web-TLS contribution. The daily
   scanner replaces that assumption with what the server actually negotiates, and
   `adjust()` shifts the score by the difference:

     points:  live (hybrid PQC negotiated) = 12 · partial (capable) = 6 · none = 0
     delta = points[observed] - points[assumed],  clamped to 0..100

   So a host that was assumed merely "capable" but is observed negotiating hybrid
   PQC gains +6; one assumed "live" but observed classical loses 12; an unknown
   (failed scan) leaves the score untouched. */

(function (g) {
  var TLS_POINTS = { live: 12, partial: 6, none: 0, unknown: 0 };
  function adjust(baseline, assumedTls, observedTls) {
    if (!observedTls || observedTls === "unknown") return baseline;
    var d = (TLS_POINTS[observedTls] || 0) - (TLS_POINTS[assumedTls] || 0);
    var s = baseline + d;
    return s < 0 ? 0 : s > 100 ? 100 : s;
  }
  // Single source of truth for status: always derived from the (scan-adjusted)
  // score, so labels, filters, trends, and history can never disagree.
  function band(score) {
    return score >= 70 ? "Advanced" : score >= 45 ? "In progress" : score >= 25 ? "Early stage" : "Not evident";
  }
  // Apply an observed TLS result to an institution record in place, then
  // re-derive its status. Shared by the browser overlay and the snapshot script.
  function applyScan(b, observed, scannedAt) {
    if (b.rubric) b.score = rubricScore(b, "inst"); // baseline from evidence
    if (observed && observed !== "unknown") {
      b.score = adjust(b.score, b.tls, observed);
      b.tls = observed;
      b.tlsObserved = true;
      if (scannedAt) b.tlsScanned = scannedAt;
    }
    b.status = band(b.score);
    return b;
  }
  // Published rubric (November 2026 research pass). Each component has
  // discrete levels; points per level are fixed and shown on "How We Rate".
  var RUBRIC = {
    inst: {
      commitment:    { label: "Public commitment",      points: [0, 10, 20, 30, 40] },
      participation: { label: "Industry participation", points: [0, 7, 14, 20] },
      upgrade:       { label: "Ability to upgrade",     points: [0, 0, 19, 28] }, // level 1 = known dependency on a provider with no plan: a risk, not readiness
    },
    vendor: {
      plans:         { label: "Published plans",        points: [0, 8, 16, 25] },
      participation: { label: "Industry participation", points: [0, 7, 14, 20] },
      guidance:      { label: "Customer guidance",      points: [0, 5, 10] },
    },
  };
  var PQC_POINTS = { shipping: 45, roadmap: 28, research: 12, none: 0 };

  function pts(kind, key, level) {
    var p = RUBRIC[kind][key].points;
    var l = Math.max(0, Math.min(p.length - 1, level | 0));
    return p[l];
  }
  // Score = sum of rubric points. Institutions add the website-encryption
  // points for the curated `tls` value; the daily scan then adjusts that part.
  function rubricScore(e, kind) {
    var r = e.rubric || {};
    var total = kind === "vendor" ? (PQC_POINTS[e.pqc] || 0) : (TLS_POINTS[e.tls] || 0);
    Object.keys(RUBRIC[kind]).forEach(function (k) { total += pts(kind, k, (r[k] || {}).level); });
    return Math.max(0, Math.min(100, total));
  }
  // Recompute score (when researched) and status for any entity.
  function finalize(e, kind) {
    if (e.rubric) e.score = rubricScore(e, kind);
    e.status = band(e.score);
    return e;
  }

  g.PQC_SCORE = { adjust: adjust, band: band, applyScan: applyScan, TLS_POINTS: TLS_POINTS,
    RUBRIC: RUBRIC, PQC_POINTS: PQC_POINTS, points: pts, rubricScore: rubricScore, finalize: finalize };
})(typeof window !== "undefined" ? window : globalThis);
