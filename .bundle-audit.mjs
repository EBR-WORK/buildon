/**
 * Which visible strings are still compiled into the shared JS bundle?
 *
 * That bundle is served to /, /mr and /hi alike, so anything in it renders in
 * English whatever language the page is — this is the list of what still
 * reverts after React hydrates.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { collect } from "./scripts/lib/html-text.mjs";

const strings = new Set();
const pages = [];
const walk = (d) => {
  for (const e of readdirSync(d)) {
    const f = join(d, e);
    if (statSync(f).isDirectory()) { if (!["_next", "mr", "hi"].includes(e)) walk(f); }
    else if (e.endsWith(".html") && !["mr.html", "hi.html"].includes(e)) pages.push(f);
  }
};
walk("out");
for (const p of pages) collect(readFileSync(p, "utf8"), strings);

const chunks = [];
const walkChunks = (d) => {
  for (const e of readdirSync(d)) {
    const f = join(d, e);
    if (statSync(f).isDirectory()) walkChunks(f);
    else if (e.endsWith(".js")) chunks.push(f);
  }
};
walkChunks("out/_next/static/chunks");
const haystack = chunks.map((f) => readFileSync(f, "utf8")).join("\n");

const all = [...strings];
const stuck = all.filter((s) => s.length > 3 && haystack.includes(s));

const o = [];
o.push(`strings on the site:       ${all.length}`);
o.push(`still baked into the JS:   ${stuck.length}  (${Math.round(100 * stuck.length / all.length)}%)`);
o.push("");
o.push("still in the bundle:");
for (const s of stuck.slice(0, 40)) o.push(`   ${s.slice(0, 70)}`);
if (stuck.length > 40) o.push(`   ... and ${stuck.length - 40} more`);

writeFileSync(".bundle-audit.txt", o.join("\n"), "utf8");
