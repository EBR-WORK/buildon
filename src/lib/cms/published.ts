/**
 * The content the site actually renders.
 *
 * `content/career.json` is the published file: the admin exports it, it is
 * committed, and the next build reads it here. Everything downstream — the
 * openings list, the filter, the job pages, their metadata — reads from this
 * module rather than from careerDetails.ts, so adding a role in the panel is
 * enough to make it appear.
 *
 * Why a file and not a database: the site is a static export with no server, so
 * the build is the only moment content can be read. A committed JSON file is
 * also reviewable in a pull request and revertible with git, which a draft in
 * somebody's browser is not.
 *
 * The TypeScript modules stay as the fallback. If the JSON is missing a field,
 * or is malformed, the site renders what it shipped with rather than a hole.
 */

import careerJson from "@/../content/career.json";
import { applicationFields, jobOpenings as fallbackJobs } from "@/lib/careerDetails";
import { careerPage } from "@/lib/content";

export type PublishedJob = {
  readonly slug: string;
  readonly title: string;
  readonly category: string;
  readonly type: string;
  readonly location: string;
  readonly responsibilities: readonly string[];
};

type CareerFile = {
  openingsTitle?: unknown;
  moreLabel?: unknown;
  jobs?: unknown;
};

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value : fallback;

/**
 * Only rows with the fields a page needs are kept.
 *
 * A half-finished opening saved in the panel — no title, no address — would
 * otherwise become a live page with an empty heading, and `generateStaticParams`
 * would try to build a route with no slug.
 */
function readJobs(value: unknown): PublishedJob[] | null {
  if (!Array.isArray(value)) return null;

  const jobs = value.flatMap((row): PublishedJob[] => {
    if (!row || typeof row !== "object") return [];
    const job = row as Record<string, unknown>;

    const slug = typeof job.slug === "string" ? job.slug.trim() : "";
    const title = typeof job.title === "string" ? job.title.trim() : "";
    if (!slug || !title) return [];

    return [
      {
        slug,
        title,
        category: text(job.category, title),
        type: text(job.type, ""),
        location: text(job.location, ""),
        responsibilities: Array.isArray(job.responsibilities)
          ? job.responsibilities.filter(
              (line): line is string => typeof line === "string" && line.trim().length > 0,
            )
          : [],
      },
    ];
  });

  /* An empty file is a mistake, not an instruction to close every vacancy. */
  return jobs.length > 0 ? jobs : null;
}

const file = careerJson as CareerFile;

export const publishedCareer = {
  openingsTitle: text(file.openingsTitle, careerPage.openings.title),
  moreLabel: text(file.moreLabel, careerPage.openings.more),
  jobs:
    readJobs(file.jobs) ??
    fallbackJobs.map((job) => ({
      slug: job.slug,
      title: job.title,
      category: job.category,
      type: job.type,
      location: job.location,
      responsibilities: job.responsibilities,
    })),
} as const;

export function getPublishedJob(slug: string) {
  return publishedCareer.jobs.find((job) => job.slug === slug);
}

/** The listing card's link, empty while an opening has no page. */
export function publishedJobHref(title: string, location: string) {
  const job = publishedCareer.jobs.find(
    (opening) => opening.title === title && opening.location === location,
  );
  return job ? `/career/${job.slug}` : "";
}

/* The application form's option lists are not content an editor changes, so
   they stay where they are. */
export { applicationFields };
