"use client";

import { useMemo, useState } from "react";
import CtaLink from "@/components/CtaLink";
import Reveal from "@/components/Reveal";
/* Type only: a value import pulls every opening and the whole career
   content into the browser bundle, which is shared by /, /mr and /hi and
   therefore cannot be translated. The page passes the data down. */
import type { publishedCareer } from "@/lib/cms/published";
import { ArrowIcon, ChevronDownIcon, PinIcon, ShieldIcon } from "./icons";

/* The filter's "everything" option. A prop rather than a constant here,
   because a constant in a client component is compiled into the bundle
   in English and would stay English on the Marathi and Hindi pages. */

/**
 * The openings list, filtered by location.
 *
 * Reads content/career.json through publishedCareer, so a role added in the
 * admin panel appears here after the next build — the listing is no longer a
 * second copy of the job data kept in content.ts.
 *
 * The reference does this with a select posting to WordPress, which reloads the
 * page for a list of three. There is no server here, and no need for one: the
 * whole list is already on the page, so the filter is local state and the
 * results change as the select does.
 *
 * The unfiltered list is what renders on the server, so every opening is in the
 * static HTML for crawlers and for anyone without JavaScript — who also never
 * sees the control, since it would do nothing for them.
 */
export default function JobOpenings({
  jobs,
  moreLabel,
  allLabel,
}: {
  jobs: typeof publishedCareer.jobs;
  moreLabel: string;
  allLabel: string;
}) {
  const ALL = allLabel;
  const [location, setLocation] = useState(ALL);

  /* Built from the openings themselves rather than a fixed list, so a new city
     appears in the filter as soon as a job in it is added. */
  const locations = useMemo(
    () => [ALL, ...Array.from(new Set(jobs.map((job) => job.location)))],
    [jobs, ALL],
  );

  const items =
    location === ALL
      ? jobs
      : jobs.filter((job) => job.location === location);

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
        <label htmlFor="job-location" className="text-sm font-medium text-ink-700">
          Filter by location
        </label>

        {/* The native arrow sits hard against the right edge, which on a pill
            this round reads as falling outside it, so appearance-none drops it
            and the chevron is drawn inside instead.

            The wrapper is inline-flex and the select is NOT w-full: a w-full
            select inside an auto-width wrapper sizes itself from a width that
            is itself derived from the select, which left the padding short and
            the text running under the arrow. Sized by its own content, the
            padding holds: 20px of text inset on the left, 48px on the right,
            with the 16px chevron centred in the 32px that leaves. */}
        <div className="relative inline-flex">
          <select
            id="job-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="h-11 cursor-pointer appearance-none rounded-full border border-line bg-white pr-12 pl-5 text-[15px] font-medium text-ink-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            {locations.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <ChevronDownIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink-500"
          />
        </div>

        {/* Announced when the count changes, so the filter is not silent to a
            screen reader. */}
        <p aria-live="polite" className="text-sm text-ink-500">
          {items.length} {items.length === 1 ? "opening" : "openings"}
          {location === ALL ? "" : ` in ${location}`}
        </p>
      </div>

      <ul className="mt-6 space-y-4 sm:mt-8">
        {items.map((job, i) => (
          <Reveal as="li" key={job.slug} delay={i * 0.08}>
            <article className="group flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 transition hover:border-brand-200 hover:shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div className="min-w-0">
                <h3 className="font-display text-xl leading-snug font-semibold transition-colors group-hover:text-brand-500 sm:text-2xl">
                  {job.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-ink-500">
                  <span className="inline-flex items-center gap-2">
                    <ShieldIcon className="size-4 shrink-0 text-brand-500" />
                    {job.type}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <PinIcon className="size-4 shrink-0 text-brand-500" />
                    {job.location}
                  </span>
                </div>
              </div>

              <CtaLink
                href={`/career/${job.slug}`}
                className="inline-flex shrink-0 cursor-pointer items-center gap-2 self-start text-sm font-semibold text-brand-500 transition hover:text-brand-600 sm:self-auto"
              >
                {moreLabel}
                <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
              </CtaLink>
            </article>
          </Reveal>
        ))}
      </ul>
    </>
  );
}
