"use client";

/**
 * Name every block, and outline the one the cursor is in.
 *
 * A rich text document looks like prose, which is the point — and it hides
 * what it is made of. Two paragraphs and one paragraph with a line break read
 * identically on screen and render differently, and an editor who cannot see
 * which they have is editing blind. So each top-level block carries its type
 * as a label, and the one holding the cursor is outlined.
 *
 * Done with decorations rather than by writing attributes into the document:
 * a decoration is a view-layer annotation that ProseMirror recomputes as the
 * selection moves. Nothing here reaches the stored content, so no label or
 * highlight can ever be saved into a post.
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseNode } from "@tiptap/pm/model";

const key = new PluginKey("blockLabels");

/** What a block is called, in whatever words the surrounding screen uses. */
export type BlockLabelSet = {
  h2?: string;
  h3?: string;
  paragraph?: string;
  bulletList?: string;
  orderedList?: string;
  image?: string;
};

const DEFAULTS: Required<BlockLabelSet> = {
  h2: "Heading",
  h3: "Sub-heading",
  paragraph: "Paragraph",
  bulletList: "Bulleted list",
  orderedList: "Numbered list",
  image: "Image",
};

function labelFor(node: ProseNode, labels: Required<BlockLabelSet>) {
  switch (node.type.name) {
    case "heading":
      return node.attrs.level === 3 ? labels.h3 : labels.h2;
    case "bulletList":
      return labels.bulletList;
    case "orderedList":
      return labels.orderedList;
    case "image":
      return labels.image;
    case "paragraph":
      return labels.paragraph;
    default:
      return node.type.name;
  }
}

export const BlockLabels = Extension.create<{ labels: BlockLabelSet }>({
  name: "blockLabels",

  addOptions() {
    return { labels: {} };
  },

  addProseMirrorPlugins() {
    const labels = { ...DEFAULTS, ...this.options.labels };

    return [
      new Plugin({
        key,
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];

            /* The block the cursor is inside, found by walking up to depth 1 —
               a cursor in a list item is three levels deep, and the list is
               what should be outlined, not the item. */
            const { $from } = state.selection;
            const activePos = $from.depth > 0 ? $from.before(1) : null;

            state.doc.forEach((node, offset) => {
              decorations.push(
                Decoration.node(offset, offset + node.nodeSize, {
                  "data-block": labelFor(node, labels),
                  class: offset === activePos ? "block-active" : "",
                }),
              );
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
