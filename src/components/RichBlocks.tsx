import Image from "next/image";
import type { BlogBlock } from "@/lib/blogDetails";
import { RichRuns } from "./RichText";

/**
 * Rich body copy, rendered.
 *
 * The five kinds the admin's editor can produce and nothing else — which is
 * the same list the editor's schema is cut down to, so there is no block an
 * author can write that this cannot draw.
 *
 * The blog has its own renderer and keeps it. That one carries the reference's
 * article typography — heading links, image captions, the rhythm of a long
 * read — and folding the two together would mean one of them compromising. A
 * job description is a short page with a heading and some bullets.
 */
export default function RichBlocks({ blocks }: { blocks: readonly BlogBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "h2":
            return (
              <h2
                key={index}
                className="mt-10 font-display text-xl leading-snug font-semibold text-ink-900 first:mt-0 sm:mt-12 sm:text-2xl"
              >
                {block.text}
              </h2>
            );

          case "h3":
            return (
              <h3
                key={index}
                className="mt-8 font-display text-lg leading-snug font-semibold text-ink-900 first:mt-0"
              >
                {block.text}
              </h3>
            );

          case "ul":
            return (
              <ul
                key={index}
                className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-ink-500 sm:text-base"
              >
                {block.items.map((runs, n) => (
                  <li
                    key={n}
                    className="relative pl-6 before:absolute before:top-[0.6em] before:left-0 before:size-1.5 before:rounded-full before:bg-brand-500"
                  >
                    <RichRuns runs={runs} />
                  </li>
                ))}
              </ul>
            );

          /* Numbered in a circle, which is how the FAQ's one procedure has
             always been drawn — the steps moved into the body, the look did
             not. */
          case "ol":
            return (
              <ol
                key={index}
                className="mt-4 space-y-2 text-[15px] leading-relaxed text-ink-500 sm:text-base"
              >
                {block.items.map((runs, n) => (
                  <li key={n} className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">
                      {n + 1}
                    </span>
                    <span>
                      <RichRuns runs={runs} />
                    </span>
                  </li>
                ))}
              </ol>
            );

          case "image":
            return (
              <Image
                key={index}
                src={block.src}
                alt={block.alt}
                width={block.width}
                height={block.height}
                className="mt-6 h-auto w-full rounded-xl border border-line"
              />
            );

          default:
            return (
              <p
                key={index}
                className="mt-4 text-[15px] leading-relaxed text-ink-500 first:mt-0 sm:text-base"
              >
                <RichRuns runs={block.runs} />
              </p>
            );
        }
      })}
    </>
  );
}
