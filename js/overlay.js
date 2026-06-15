/* PQC Readiness Monitor — apply live TLS scan results to the institution data.
   Runs once at load, after the data files, tls-scan, and score-model are present
   and before any view renders. For each institution with an observed scan result
   it overwrites the displayed web-TLS posture and re-derives the readiness score
   via the shared overlay, so the register's TLS column and every score reflect
   the most recent real handshake. Idempotent and a no-op when no scan exists. */

(function () {
  var pqcTls = window.PQC_TLS || { results: {} };
  var scan = pqcTls.results || {};
  var at = pqcTls.scannedAt || null;
  var adjust = (window.PQC_SCORE || {}).adjust;
  if (!adjust) return;

  (window.INSTITUTIONS || []).forEach(function (b) {
    var obs = scan[b.domain];
    if (!obs || obs === "unknown") return;
    // b.score / b.tls are the curated baseline at load; adjust before overwriting.
    b.score = adjust(b.score, b.tls, obs);
    b.tls = obs;
    b.tlsObserved = true;
    b.tlsScanned = at;
  });
})();
