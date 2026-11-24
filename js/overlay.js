/* PQC Readiness Monitor — apply live TLS scan results to the institution data.
   Runs once at load, after the data files, tls-scan, and score-model are present
   and before any view renders. For each institution with an observed scan result
   it overwrites the displayed web-TLS posture and re-derives the readiness score
   via the shared overlay and re-derives status from the score, so the register's TLS column and every score reflect
   the most recent real handshake. Idempotent and a no-op when no scan exists. */

(function () {
  var pqcTls = window.PQC_TLS || { results: {} };
  var scan = pqcTls.results || {};
  var model = window.PQC_SCORE;
  if (!model) return;
  (window.INSTITUTIONS || []).forEach(function (b) { model.applyScan(b, scan[b.domain], pqcTls.scannedAt); });
  // Vendors have no TLS scan, but their status still follows the score bands.
  (window.VENDORS || []).forEach(function (v) { model.finalize(v, "vendor"); });
})();
