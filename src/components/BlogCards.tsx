"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
/* Cards are derived from the posts themselves — see publishedBlog. Type only:
   a value import here pulls the ENTIRE published blog into the browser bundle,
   which is both ~500KB a visitor never needed and English that cannot be
   translated for /mr and /hi. One string was doing that. */
import type { PublishedPostCard } from "@/lib/cms/published";
import { blogHref } from "@/lib/blogDetails";

type Item = PublishedPostCard;

/**
 * The listing's cards, given whichever posts should be shown.
 *
 * Kept apart from the filtering so the same markup serves twice: the page
 * prerenders the full set through this component, and BlogGrid re-renders it
 * with the matches once a search runs in the browser. That is what keeps every
 * card in the static HTML for crawlers and for anyone without JavaScript.
 */
export default function BlogCards({
  items,
  readMore,
}: {
  items: readonly Item[];
  readMore: string;
}) {
  return (
      <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {items.map((post, i) => {
          const href = post.href || blogHref(post.title);

          const body = (
            <>
              {/* Square, as the reference crops them */}
              <div className="relative aspect-square overflow-hidden bg-surface">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(min-width: 1024px) 24rem, (min-width: 640px) 45vw, 92vw"
                  loading={i < 3 ? "eager" : "lazy"}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h2 className="font-display text-lg leading-snug font-semibold transition-colors group-hover:text-brand-500 sm:text-xl">
                  {post.title}
                </h2>
                {/* Clamped so a long excerpt cannot stretch its row of cards
                    past the others. */}
                <p className="mt-2.5 flex-1 text-[15px] leading-relaxed text-ink-500 line-clamp-5">
                  {post.excerpt}
                </p>
                {/* Display only where the card itself is the link, so it adds
                    no second tab stop and screen readers hear the post's title
                    rather than "Read More". */}
                <span
                  aria-hidden
                  className="mt-4 inline-flex items-center self-start text-sm font-semibold text-brand-500 transition group-hover:text-brand-600 sm:mt-5"
                >
                  {readMore}
                </span>
              </div>
            </>
          );

          const shell =
            "group flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-white";

          return (
            <Reveal as="li" key={post.title} delay={(i % 3) * 0.06} className="flex">
              {href ? (
                <Link
                  href={href}
                  className={`${shell} transition hover:-translate-y-1 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none`}
                >
                  {body}
                </Link>
              ) : (
                <article className={shell}>{body}</article>
              )}
            </Reveal>
          );
        })}
      </ul>
  );
}
