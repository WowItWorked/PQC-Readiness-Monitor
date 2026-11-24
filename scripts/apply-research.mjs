/* Apply a research pass to the institution and third-party datasets.
   Usage: node scripts/apply-research.mjs <researched YYYY-MM> <output.json>...

   Each output file is a JSON array produced by the research spec (one object
   per organization, matched by exact name). For every matched record this
   replaces the prior unsourced assessment with the researched one: rubric
   levels and plain-English reasons, evidence level, summary, sources and
   news with URLs. The score is then recomputed from the published rubric in
   js/data/score-model.js, so a score can never drift from its evidence.

   Validation is strict: unknown names, out-of-range levels, non-https URLs,
   or `conf: "Estimated"` fail the run and nothing is written. */

import fs from "node:fs";
import vm from "node:vm";

const [researched, ...files] = process.argv.slice(2);
if (!/^\d{4}-\d{2}$/.test(researched || "") || !files.length) {
  console.error("usage: node scripts/apply-research.mjs <YYYY-MM> <output.json>...");
  process.exit(2);
}

function load(path) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path, "utf8"), ctx, { filename: path });
  return ctx.window;
}
const model = load("js/data/score-model.js").PQC_SCORE;
const DATA = {
  inst: { path: "js/data/institutions.js", key: "INSTITUTIONS", kind: "inst" },
  vendor: { path: "js/data/vendors.js", key: "VENDORS", kind: "vendor" },
};
const lists = {};
for (const k of Object.keys(DATA)) lists[k] = load(DATA[k].path)[DATA[k].key];
const byName = {};
for (const k of Object.keys(lists)) lists[k].forEach((e) => { byName[e.name] = { kind: k, e }; });

const errors = [];
const httpsUrl = (u) => typeof u === "string" && /^https:\/\/[^\s"<>]+$/i.test(u);
const ym = (d) => typeof d === "string" && /^\d{4}(-\d{2})?$/.test(d);
const clean = (s, max = 600) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, max) : "");

const results = [];
for (const f of files) {
  let arr;
  try { arr = JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { errors.push(`${f}: unreadable JSON (${e.message})`); continue; }
  if (!Array.isArray(arr)) { errors.push(`${f}: not an array`); continue; }
  for (const r of arr) {
    const hit = byName[r && r.name];
    if (!hit) { errors.push(`${f}: unknown organization "${r && r.name}"`); continue; }
    const kind = DATA[hit.kind].kind;
    const def = model.RUBRIC[kind];
    if (!["Documented", "Inferred"].includes(r.conf)) errors.push(`${r.name}: conf must be Documented or Inferred`);
    for (const key of Object.keys(def)) {
      const c = (r.rubric || {})[key];
      const max = def[key].points.length - 1;
      if (!c || !Number.isInteger(c.level) || c.level < 0 || c.level > max) errors.push(`${r.name}: rubric.${key}.level must be 0-${max}`);
      else if (!clean(c.why)) errors.push(`${r.name}: rubric.${key}.why missing`);
    }
    if (kind === "vendor" && !(r.pqc in model.PQC_POINTS)) errors.push(`${r.name}: invalid pqc "${r.pqc}"`);
    for (const n of r.news || []) if (!httpsUrl(n.url) || !ym(n.d)) errors.push(`${r.name}: news item needs https url and YYYY-MM date`);
    for (const s of r.sources || []) if (!httpsUrl(s.url)) errors.push(`${r.name}: source needs an https url`);
    results.push({ hit, kind, r });
  }
}
if (errors.length) {
  console.error(`Validation failed (${errors.length}):\n  ` + errors.slice(0, 60).join("\n  "));
  process.exit(1);
}

const COMMIT_TEXT = ["None public", "Acknowledges the risk", "Indirect activity", "Named program", "Dated plan / in production"];
for (const { hit, kind, r } of results) {
  const e = hit.e;
  const rubric = {};
  for (const key of Object.keys(model.RUBRIC[kind])) {
    const c = r.rubric[key];
    rubric[key] = { level: c.level, why: clean(c.why), ...(clean(c.tech) ? { tech: clean(c.tech, 900) } : {}) };
  }
  e.rubric = rubric;
  e.conf = r.conf;
  e.researched = researched;
  e.summary = clean(r.summary, 700) || e.summary;
  e.news = (r.news || []).slice(0, 3).map((n) => ({ d: n.d, t: clean(n.t, 200), s: clean(n.s, 80), url: n.url }));
  e.sources = (r.sources || []).slice(0, 8).map((s) => ({ t: clean(s.t, 200), url: s.url, ...(ym(s.d) ? { d: s.d } : {}), ...(s.primary ? { primary: true } : {}) }));
  delete e.note; delete e.infraNotes; // superseded by sourced summary + rubric
  if (kind === "inst") {
    if (clean(r.edge)) e.edge = clean(r.edge, 80);
    e.signals = {
      roadmap: COMMIT_TEXT[rubric.commitment.level],
      standards: (r.standards || []).map((x) => clean(x, 80)).filter(Boolean),
      infra: rubric.upgrade.why,
    };
  } else {
    e.pqc = r.pqc;
    if (clean(r.pqcWhy)) e.pqcWhy = clean(r.pqcWhy); else delete e.pqcWhy;
    if (clean(r.pqcTech)) e.pqcTech = clean(r.pqcTech, 900); else delete e.pqcTech;
  }
  e.score = model.rubricScore(e, kind);
  e.status = model.band(e.score);
}

// Write back, preserving each file's header comment.
for (const k of Object.keys(DATA)) {
  const { path, key } = DATA[k];
  const src = fs.readFileSync(path, "utf8");
  const header = src.slice(0, src.indexOf("window." + key));
  const body = lists[k].map((e) => { const o = { ...e }; delete o.rank; delete o.kind; return "  " + JSON.stringify(o); }).join(",\n");
  fs.writeFileSync(path, header + "window." + key + " = [\n" + body + "\n];\n" + tail(src, key));
}
function tail(src, key) {
  // Keep any code after the array (e.g. rank/kind assignment) intact.
  const start = src.indexOf("window." + key);
  const end = src.indexOf("];", start);
  return src.slice(end + 2).replace(/^\n/, "");
}

const done = results.length;
console.log(`Applied research to ${done} organizations (researched ${researched}).`);
