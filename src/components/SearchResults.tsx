"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Reveal from "@/components/Reveal";
import { countResults, searchSite } from "@/lib/search";

/**
 * The results, grouped the way the reference groups them: Page results, Product
 * results, Post results, each with a "View more" to that section's listing.
 *
 * The query is read from ?q= and matched in the browser, because a static
 * export has no server to run the search on.
 */
export default function SearchResults() {
  const query = (useSearchParams().get("q") ?? "").trim();
  const groups = searchSite(query);
  const total = countResults(groups);

  if (!query) {
    return (
      <p className="text-base text-ink-500">
        Type a word above to search the products, projects and posts on this site.
      </p>
    );
  }

  if (total === 0) {
    return (
      <p className="text-base text-ink-500">
        Nothing matched <strong className="font-semibold text-ink-900">{query}</strong>. Try a
        single word, such as “perlite”, “bondit” or “ceiling”.
      </p>
    );
  }

  return (
    <>
      <p className="text-base text-ink-500">
        {total} {total === 1 ? "result" : "results"} for{" "}
        <strong className="font-semibold text-ink-900">{query}</strong>.
      </p>

      {groups.map((group, groupIndex) => (
        <section key={group.title} className={groupIndex > 0 ? "mt-12" : "mt-10"}>
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
            <h2 className="font-display text-xl leading-snug font-semibold text-ink-900 sm:text-2xl">
              {group.title}{" "}
              <span className="text-base font-medium text-ink-500">({group.results.length})</span>
            </h2>

            <Link
              href={group.href}
              className="text-sm font-semibold text-brand-500 transition hover:text-brand-600"
            >
              View more &gt;
            </Link>
          </div>

          <ul className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-6">
            {group.results.map((result, i) => {
              const inner = (
                <>
                  {result.image && (
                    <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl bg-surface sm:w-32">
                      <Image
                        src={result.image}
                        alt=""
                        fill
                        sizes="8rem"
                        loading="lazy"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-base leading-snug font-semibold text-ink-900 transition-colors group-hover:text-brand-500 sm:text-lg">
                      {result.title}
                    </h3>
                    {result.body && (
                      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-500 line-clamp-2">
                        {result.body}
                      </p>
                    )}
                  </div>
                </>
              );

              const shell =
                "group flex w-full items-start gap-4 rounded-2xl border border-line bg-white p-4 sm:p-5";

              return (
                <Reveal as="li" key={`${result.title}-${i}`} delay={Math.min(i, 3) * 0.05} className="flex">
                  {/* A result whose page is not built yet still tells the reader
                      it exists, but is not a link that goes nowhere. */}
                  {result.href ? (
                    <Link
                      href={result.href}
                      className={`${shell} transition hover:-translate-y-0.5 hover:shadow-card focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none`}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className={shell}>{inner}</div>
                  )}
                </Reveal>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
