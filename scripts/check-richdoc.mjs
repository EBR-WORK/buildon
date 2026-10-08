/**
 * Does a post survive a trip through the editor unchanged?
 *
 *   npm run check:richdoc
 *
 * Every published post is converted to the editor's document and back, and the
 * result compared to what went in. The links are counted separately, because
 * they are the part that has been lost twice already and the part a nearly
 * correct converter drops quietly.
 *
 * This is a gate, not a report. If it fails, the rich text editor is not safe
 * to put in front of an editor — opening a post in it and pressing Save would
 * rewrite the article into whatever the converter managed.
 */

import { createJiti } from "jiti";
import path from "node:path";
import { readFileSync, existsSync } from "node:fs";

const jiti = createJiti(import.meta.url, { alias: { "@": path.resolve("src") } });
const { blocksToDoc, docToBlocks, sameBlocks } = await jiti.import(
  path.resolve("src/lib/cms/richdoc.ts"),
);

/* The published file where there is one, the shipped defaults otherwise, so
   this runs on a fresh clone with no database. */
let posts;
if (existsSync("content/blog.json")) {
  posts = JSON.parse(readFileSync("content/blog.json", "utf8")).items;
} else {
  const { defaults } = await jiti.import(path.resolve("src/lib/cms/schema.ts"));
  posts = defaults.blog.items;
}

const countLinks = (blocks) => {
  let n = 0;
  for (const block of blocks) {
    const runs = block.kind === "p" ? block.runs : block.kind === "ul" ? block.items.flat() : [];
    for (const run of runs) if (run.href) n += 1;
    if ((block.kind === "h2" || block.kind === "h3") && block.linkHref) n += 1;
  }
  return n;
};

const countBlocks = (blocks) => {
  const by = {};
  for (const block of blocks) by[block.kind] = (by[block.kind] ?? 0) + 1;
  return by;
};

let failed = 0;
let linksIn = 0;
let linksOut = 0;
let blocksIn = 0;

for (const post of posts) {
  const before = post.body ?? [];
  const after = docToBlocks(blocksToDoc(before));

  blocksIn += before.length;
  linksIn += countLinks(before);
  linksOut += countLinks(after);

  if (sameBlocks(before, after)) continue;

  failed += 1;
  console.log(`\nFAIL  ${post.slug}`);
  console.log(`      blocks  ${JSON.stringify(countBlocks(before))}`);
  console.log(`      became  ${JSON.stringify(countBlocks(after))}`);
  console.log(`      links   ${countLinks(before)} -> ${countLinks(after)}`);

  /* The first block that differs, which is almost always enough to see why. */
  for (let i = 0; i < Math.max(before.length, after.length); i += 1) {
    if (sameBlocks([before[i]].filter(Boolean), [after[i]].filter(Boolean))) continue;
    console.log(`      first difference at block ${i + 1}:`);
    console.log(`        was  ${JSON.stringify(before[i])?.slice(0, 220)}`);
    console.log(`        now  ${JSON.stringify(after[i])?.slice(0, 220)}`);
    break;
  }
}

console.log(`\n${posts.length} posts, ${blocksIn} blocks, ${linksIn} links`);
console.log(`links after the round trip: ${linksOut}`);

if (failed > 0 || linksOut !== linksIn) {
  console.log(`\n${failed} post(s) did not survive unchanged.`);
  process.exitCode = 1;
} else {
  console.log("\nEvery post survived the round trip unchanged.");
}
