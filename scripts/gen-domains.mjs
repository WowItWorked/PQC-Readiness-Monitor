/* Emit the list of institution primary domains for the TLS scanner.
   Reads js/data/institutions.js in a sandbox and writes {"domains":[...]} to the
   path given as argv[2]. Institutions only — web TLS is a rated institution
   signal; third parties are scored on product PQC, not their website. */

import fs from "node:fs";
import vm from "node:vm";

function loadWindow(path) {
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path, "utf8"), ctx, { filename: path });
  return ctx.window;
}

const inst = loadWindow("js/data/institutions.js").INSTITUTIONS || [];
const domains = inst.map((b) => b.domain).filter(Boolean);
const out = process.argv[2] || "domains.json";
fs.writeFileSync(out, JSON.stringify({ domains: domains }));
console.log(`Wrote ${domains.length} domains to ${out}`);
