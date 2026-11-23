/* Turn the scanner's results.json into js/data/tls-scan.js.
   Guarded: if the scan produced no usable results (all unknown, or the file is
   missing/empty), the existing tls-scan.js is left untouched so a transient
   scan failure never wipes good data. Usage: node build-tls-scan.mjs <results.json>

   Stabilised against one-day flaps (a timeout or a single bad handshake used to
   swing a score by up to 12 points for a day and back, permanently in history):
     - an "unknown" observation carries forward the last published value;
     - a changed observation is published only once two consecutive daily scans
       agree on it; until then it is held in `pending`. */

import fs from "node:fs";
import vm from "node:vm";

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

// Previously published results (and any change awaiting confirmation).
let prev = { results: {}, pending: {} };
if (fs.existsSync(outPath)) {
  try {
    const ctx = { window: {} };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(outPath, "utf8"), ctx);
    prev = Object.assign(prev, ctx.window.PQC_TLS || {});
  } catch (e) { console.log("Previous tls-scan.js unreadable; treating every result as new."); }
}

const merged = {}, pending = {};
let held = 0, carried = 0;
for (const domain of Object.keys(results)) {
  const obs = results[domain];
  const last = (prev.results || {})[domain];
  if (!obs || obs === "unknown") {
    merged[domain] = last || "unknown";
    if (last && last !== "unknown") carried++;
  } else if (!last || last === "unknown" || obs === last) {
    merged[domain] = obs;
  } else if ((prev.pending || {})[domain] === obs) {
    merged[domain] = obs; // confirmed by a second consecutive scan
  } else {
    merged[domain] = last;
    pending[domain] = obs;
    held++;
  }
}

const today = new Date().toISOString().slice(0, 10);
const payload = { scannedAt: today, results: merged, pending: pending };
const header =
  "/* PQC Readiness Monitor — latest live TLS scan results.\n" +
  "   Overwritten each day by the GitHub Action (scanner/scan.go). `results` maps a\n" +
  "   primary domain to the observed key-exchange posture: \"live\" (hybrid PQC\n" +
  "   negotiated), \"none\" (classical only), or \"unknown\" (inconclusive).\n" +
  "   `pending` holds changes seen once and awaiting a confirming second scan. */\n";
fs.writeFileSync(outPath, header + "window.PQC_TLS = " + JSON.stringify(payload) + ";\n");

const counts = Object.values(merged).reduce((m, v) => { m[v] = (m[v] || 0) + 1; return m; }, {});
console.log(`Wrote ${outPath} — ${today}: ${JSON.stringify(counts)} across ${Object.keys(merged).length} domains` +
  ` (${held} change(s) awaiting confirmation, ${carried} carried forward from a failed scan).`);
