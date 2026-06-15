/* Records one daily snapshot of every institution's and third party's readiness
   score into js/data/history.js. Run by the daily GitHub Action.

   The data files assign to a `window` global, so we evaluate them in a tiny
   sandbox (no DOM needed) and read the arrays back. Idempotent: if today's date
   is already recorded, it does nothing — so the workflow's safety-net run is a
   harmless no-op. */

import fs from "node:fs";
import vm from "node:vm";

function loadWindow(path) {
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path, "utf8"), ctx, { filename: path });
  return ctx.window;
}

const inst = loadWindow("js/data/institutions.js").INSTITUTIONS || [];
const vend = loadWindow("js/data/vendors.js").VENDORS || [];

// Apply the same live-TLS overlay the browser uses, so recorded history matches
// the displayed (scan-adjusted) scores exactly.
try {
  const adjust = (loadWindow("js/data/score-model.js").PQC_SCORE || {}).adjust;
  const tls = fs.existsSync("js/data/tls-scan.js") ? (loadWindow("js/data/tls-scan.js").PQC_TLS || {}) : {};
  const scan = tls.results || {};
  if (adjust) {
    inst.forEach((b) => {
      const obs = scan[b.domain];
      if (obs && obs !== "unknown") { b.score = adjust(b.score, b.tls, obs); b.tls = obs; }
    });
  }
} catch (e) { /* no scan yet — record baseline scores */ }

const histPath = "js/data/history.js";
let hist = { dates: [], inst: {}, vendor: {} };
if (fs.existsSync(histPath)) {
  try { hist = loadWindow(histPath).PQC_HISTORY || hist; } catch (e) { /* start fresh */ }
}

const today = new Date().toISOString().slice(0, 10);
if (hist.dates.includes(today)) {
  console.log(`Snapshot for ${today} already present; nothing to do.`);
  process.exit(0);
}

const idx = hist.dates.length; // count of prior dates each series should hold
hist.dates.push(today);

function append(group, list) {
  const present = {};
  list.forEach((x) => {
    present[x.name] = true;
    if (!group[x.name]) { group[x.name] = []; }
    while (group[x.name].length < idx) group[x.name].push(null); // backfill new entities
    group[x.name].push(x.score);
  });
  // entities that dropped out of the current dataset get a null for today
  Object.keys(group).forEach((k) => {
    if (!present[k]) { while (group[k].length < idx) group[k].push(null); group[k].push(null); }
  });
}
append(hist.inst, inst);
append(hist.vendor, vend);

const header =
  "/* PQC Readiness Monitor — daily snapshot history.\n" +
  "   Appended once per day by the GitHub Action (scripts/snapshot.mjs): each entity\n" +
  "   maps to an array of readiness scores aligned to `dates` (null = not yet tracked\n" +
  "   on that date). Status bands are derived from score (>=70 Advanced, 45-69 In\n" +
  "   progress, 25-44 Early stage, <25 Not evident). */\n";
fs.writeFileSync(histPath, header + "window.PQC_HISTORY = " + JSON.stringify(hist) + ";\n");
console.log(`Appended snapshot for ${today} (${Object.keys(hist.inst).length} institutions, ${Object.keys(hist.vendor).length} third parties).`);
