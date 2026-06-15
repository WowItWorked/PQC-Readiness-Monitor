/* Turn the scanner's results.json into js/data/tls-scan.js.
   Guarded: if the scan produced no usable results (all unknown, or the file is
   missing/empty), the existing tls-scan.js is left untouched so a transient
   scan failure never wipes good data. Usage: node build-tls-scan.mjs <results.json> */

import fs from "node:fs";

const resultsPath = process.argv[2] || "results.json";
const outPath = "js/data/tls-scan.js";

let results = {};
try { results = JSON.parse(fs.readFileSync(resultsPath, "utf8")) || {}; }
catch (e) { console.log("No readable results; leaving tls-scan.js unchanged."); process.exit(0); }

const known = Object.keys(results).filter((k) => results[k] && results[k] !== "unknown");
if (known.length === 0) {
  console.log("Scan returned no live/none results; leaving tls-scan.js unchanged.");
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
const payload = { scannedAt: today, results: results };
const header =
  "/* PQC Readiness Monitor — latest live TLS scan results.\n" +
  "   Overwritten each day by the GitHub Action (scanner/scan.go). `results` maps a\n" +
  "   primary domain to the observed key-exchange posture: \"live\" (hybrid PQC\n" +
  "   negotiated), \"none\" (classical only), or \"unknown\" (inconclusive). */\n";
fs.writeFileSync(outPath, header + "window.PQC_TLS = " + JSON.stringify(payload) + ";\n");

const counts = known.reduce((m, k) => { m[results[k]] = (m[results[k]] || 0) + 1; return m; }, {});
console.log(`Wrote ${outPath} — ${today}: ${JSON.stringify(counts)} across ${Object.keys(results).length} domains.`);
