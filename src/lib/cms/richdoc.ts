"use client";

/**
 * Between the blocks the site renders and the document the editor edits.
 *
 * The site stores a post body as `RichBlock[]` — a flat list of five
 * kinds, each paragraph a list of runs carrying bold and href. TipTap holds a
 * ProseMirror document: nested nodes with marks. Neither shape is going to
 * change, so the whole of the mapping lives here and nowhere else.
 *
 * Why this file is worth reading carefully: thirty-three posts carry a hundred
 * and fifty inline links, and those links have been lost twice already to
 * markup bugs. A converter that is nearly right loses a few of them silently —
 * which is why scripts/check-richdoc.mjs round-trips every published post and
 * asserts deep equality before any of this is trusted.
 *
 * The schema is deliberately narrower than TipTap's default. The editor can
 * produce only what the renderer understands, so there is no blockquote or
 * table to be typed, saved, and then dropped on the way out.
 */

import { newId, type RichBlock, type RichRun } from "./schema";

/* ProseMirror's JSON, as much of it as this file touches. */
export type DocNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

export type RichDoc = { type: "doc"; content: DocNode[] };

/* ------------------------------------------------------------ runs -> doc */

/**
 * Runs become text nodes carrying marks.
 *
 * Empty runs are dropped: ProseMirror rejects a text node with no text, and a
 * run with none says nothing anyway.
 */
function runsToNodes(runs: readonly RichRun[]): DocNode[] {
  return runs.flatMap((run) => {
    if (!run.text) return [];

    const marks: DocNode["marks"] = [];
    /* Order matters for nothing in ProseMirror, but keeping link first makes
       the round-trip comparison readable when it fails. */
    if (run.href) marks.push({ type: "link", attrs: { href: run.href } });
    if (run.bold) marks.push({ type: "bold" });

    return [{ type: "text", text: run.text, ...(marks.length ? { marks } : {}) }];
  });
}

/**
 * A heading, with the one phrase that may carry a link.
 *
 * The stored shape keeps `text` whole and names a substring to link, because
 * that is what the renderer splits on. Here it has to become real nodes, so
 * the heading is cut into up to three pieces around the phrase.
 */
function headingToNodes(text: string, linkText?: string, linkHref?: string): DocNode[] {
  if (!linkText || !linkHref) return text ? [{ type: "text", text }] : [];

  const at = text.indexOf(linkText);
  /* A phrase that is not in the heading would be dropped by the renderer too,
     so it is not linked here either — the words still show. */
  if (at === -1) return text ? [{ type: "text", text }] : [];

  const before = text.slice(0, at);
  const after = text.slice(at + linkText.length);

  return [
    ...(before ? [{ type: "text", text: before }] : []),
    { type: "text", text: linkText, marks: [{ type: "link", attrs: { href: linkHref } }] },
    ...(after ? [{ type: "text", text: after }] : []),
  ];
}

export function blocksToDoc(blocks: readonly RichBlock[]): RichDoc {
  const content = blocks.flatMap((block): DocNode[] => {
    switch (block.kind) {
      case "h2":
      case "h3":
        return [
          {
            type: "heading",
            attrs: { level: block.kind === "h2" ? 2 : 3 },
            content: headingToNodes(block.text, block.linkText, block.linkHref),
          },
        ];

      case "ul":
      case "ol":
        return [
          {
            type: block.kind === "ol" ? "orderedList" : "bulletList",
            content: block.items.map((item) => ({
              type: "listItem",
              /* A listItem must contain a block, never text directly. */
              content: [{ type: "paragraph", content: runsToNodes(item) }],
            })),
          },
        ];

      case "image":
        return [
          {
            type: "image",
            attrs: {
              src: block.src,
              alt: block.alt,
              width: block.width,
              height: block.height,
            },
          },
        ];

      default:
        return [{ type: "paragraph", content: runsToNodes(block.runs) }];
    }
  });

  /* An empty document is invalid: ProseMirror needs at least one block to put
     a cursor in. */
  return { type: "doc", content: content.length > 0 ? content : [{ type: "paragraph" }] };
}

/* ------------------------------------------------------------ doc -> runs */

function nodesToRuns(nodes: DocNode[] | undefined): RichRun[] {
  if (!nodes) return [];

  const runs: RichRun[] = [];

  for (const node of nodes) {
    /* A hard break is the only non-text inline the starter kit allows, and the
       site renders paragraphs as single blocks — so it becomes a space, which
       is what the transcription did with the reference's own <br>. */
    if (node.type === "hardBreak") {
      const last = runs.at(-1);
      if (last && !last.text.endsWith(" ")) last.text += " ";
      continue;
    }

    if (node.type !== "text" || !node.text) continue;

    const bold = node.marks?.some((mark) => mark.type === "bold") ?? false;
    const href = node.marks?.find((mark) => mark.type === "link")?.attrs?.href;

    const run: RichRun = { text: node.text };
    if (bold) run.bold = true;
    if (typeof href === "string" && href) run.href = href;

    /* Merged where the formatting matches. ProseMirror splits text at every
       mark boundary and at some edit boundaries besides, so without this a
       paragraph typed into slowly comes back as a trail of one-character runs
       that are identical to read and different to compare. */
    const last = runs.at(-1);
    if (last && !!last.bold === !!run.bold && last.href === run.href) last.text += run.text;
    else runs.push(run);
  }

  return runs;
}

/** The inverse of headingToNodes: whole text, plus the linked phrase. */
function nodesToHeading(nodes: DocNode[] | undefined) {
  const runs = nodesToRuns(nodes);
  const text = runs.map((run) => run.text).join("");
  const linked = runs.find((run) => run.href);

  return {
    text,
    ...(linked ? { linkText: linked.text, linkHref: linked.href } : {}),
  };
}

export function docToBlocks(doc: RichDoc | null | undefined): RichBlock[] {
  if (!doc?.content) return [];

  return doc.content.flatMap((node): RichBlock[] => {
    switch (node.type) {
      case "heading": {
        const level = Number(node.attrs?.level) === 3 ? "h3" : "h2";
        const heading = nodesToHeading(node.content);
        /* A heading with nothing in it is a gap in the article, not content. */
        if (!heading.text.trim()) return [];
        return [{ id: newId(), kind: level, ...heading }];
      }

      case "bulletList":
      case "orderedList": {
        const items = (node.content ?? [])
          .map((item) => nodesToRuns(item.content?.[0]?.content))
          .filter((runs) => runs.length > 0);
        if (items.length === 0) return [];
        return [{ id: newId(), kind: node.type === "orderedList" ? "ol" : "ul", items }];
      }

      case "image": {
        const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
        if (!src) return [];
        return [
          {
            id: newId(),
            kind: "image",
            src,
            alt: typeof node.attrs?.alt === "string" ? node.attrs.alt : "",
            /* The stored width and height are what next/image reserves space
               with, so a missing one falls back to the cap rather than zero —
               which would throw at render. */
            width: Number(node.attrs?.width) || 1600,
            height: Number(node.attrs?.height) || 1200,
          },
        ];
      }

      case "paragraph": {
        const runs = nodesToRuns(node.content);
        /* An empty paragraph is how someone presses Enter twice; the site has
           no blank-paragraph spacing, so it would render as nothing. */
        return runs.length > 0 ? [{ id: newId(), kind: "p", runs }] : [];
      }

      default:
        return [];
    }
  });
}

/**
 * Compare two bodies ignoring ids.
 *
 * Ids are regenerated on every conversion by design — they identify a row in
 * the editor, not a thing in the content — so a comparison that included them
 * would never pass and would hide the differences that matter.
 */
export function sameBlocks(a: readonly RichBlock[], b: readonly RichBlock[]) {
  return stableJson(normalise(a)) === stableJson(normalise(b));
}

/**
 * Merge adjacent runs that are formatted the same.
 *
 * Applied to both sides of a comparison, because it is a difference in how the
 * same words are stored rather than in the words. The transcription left some
 * paragraphs split into two plain runs where a tag had been stripped; the site
 * renders those as two adjacent spans, which is indistinguishable from one.
 *
 * This is the form the editor produces, so normalising both sides is what lets
 * the round-trip check answer the question it is actually asking: does the
 * article come back the same, not is the JSON byte-identical.
 */
function normalise(blocks: readonly RichBlock[]): RichBlock[] {
  const mergeRuns = (runs: readonly RichRun[]): RichRun[] => {
    const out: RichRun[] = [];
    for (const run of runs) {
      const last = out.at(-1);
      if (last && !!last.bold === !!run.bold && last.href === run.href) last.text += run.text;
      else out.push({ ...run });
    }
    return out;
  };

  return blocks.map((block) => {
    if (block.kind === "p") return { ...block, runs: mergeRuns(block.runs) };
    if (block.kind === "ul" || block.kind === "ol") {
      return { ...block, items: block.items.map(mergeRuns) };
    }
    return block;
  });
}

/**
 * JSON with its keys in a fixed order, and ids left out.
 *
 * Key order is not content. The stored runs were written `{bold, href, text}`
 * and this file builds them `{text, bold, href}` — the same run either way,
 * and a plain stringify calls every one of them a difference. Ids are dropped
 * because they identify a row in the editor rather than a thing in the
 * article, and are regenerated on every conversion by design.
 */
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key, item]) => key !== "id" && item !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
  }

  return JSON.stringify(value) ?? "null";
}
