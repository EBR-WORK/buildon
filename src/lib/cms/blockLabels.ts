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

/** What to call each node, in the words the editor's own menus use. */
function labelFor(node: ProseNode) {
  switch (node.type.name) {
    case "heading":
      return node.attrs.level === 3 ? "Sub-heading" : "Heading";
    case "bulletList":
      return "Bulleted list";
    case "image":
      return "Image";
    case "paragraph":
      return "Paragraph";
    default:
      return node.type.name;
  }
}

export const BlockLabels = Extension.create({
  name: "blockLabels",

  addProseMirrorPlugins() {
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
                  "data-block": labelFor(node),
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
