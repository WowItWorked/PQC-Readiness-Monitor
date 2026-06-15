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
  g.PQC_SCORE = { adjust: adjust, TLS_POINTS: TLS_POINTS };
})(typeof window !== "undefined" ? window : globalThis);
