/**
 * The content the site actually renders.
 *
 * `content/*.json` are the published files: the admin saves to Supabase,
 * `npm run db:pull` writes them here, they are committed, and the next build
 * reads them. Everything downstream reads from this module rather than from
 * the TypeScript content modules, so an edit in the panel reaches the site.
 *
 * Why files and not a query at render time: the site is a static export, so
 * the build is the only moment content can be read. A committed file is also
 * reviewable in a pull request and revertible with git, which a row in a table
 * is not — and a build cannot fail because a database was briefly down.
 *
 * The TypeScript modules stay as the fallback. Every field is validated here,
 * and anything missing or malformed falls back to what the repo ships rather
 * than rendering a hole.
 */

import blogJson from "@/../content/blog.json";
import homeJson from "@/../content/home.json";
import productsJson from "@/../content/products.json";
import projectsJson from "@/../content/projects.json";
import careerJson from "@/../content/career.json";
import faqJson from "@/../content/faq.json";
import { applicationFields, jobOpenings as fallbackJobs } from "@/lib/careerDetails";
import { blogPosts as fallbackPosts, type BlogPost } from "@/lib/blogDetails";
import { projectDetails } from "@/lib/projectDetails";
import type { RichRun } from "@/lib/cms/schema";
import {
  careerPage,
  faqPage,
  hero,
  productCatalogue,
  productsPage,
  projectsPage,
  testimonials,
} from "@/lib/content";

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value : fallback;

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/**
 * Whether a row reaches the site.
 *
 * Only an explicit `false` holds it back. A row written before the flag existed
 * has no `live` key at all, and treating that as a draft would empty the site
 * the moment this shipped.
 */
const isLive = (row: Record<string, unknown>) => row.live !== false;

/* -------------------------------------------------------------------- home */

type PublishedCta = { readonly label: string; readonly href: string };

/**
 * A call to action, both halves or neither.
 *
 * A button with words and no destination renders as a dead control, and one
 * with a destination and no words renders as a gap — so a half-filled CTA
 * falls back whole rather than being patched field by field.
 */
function readCta(value: unknown, fallback: PublishedCta): PublishedCta {
  if (!isObject(value)) return fallback;
  const label = typeof value.label === "string" ? value.label.trim() : "";
  const href = typeof value.href === "string" ? value.href.trim() : "";
  return label && href ? { label, href } : fallback;
}

/** Non-empty strings only, and only if any survive. */
function readLines(value: unknown, fallback: readonly string[]): readonly string[] {
  if (!Array.isArray(value)) return fallback;
  const lines = value.filter(
    (line): line is string => typeof line === "string" && line.trim().length > 0,
  );
  return lines.length > 0 ? lines : fallback;
}

const homeFile = (isObject(homeJson) ? homeJson : {}) as Record<string, unknown>;
const heroFile = (isObject(homeFile.hero) ? homeFile.hero : {}) as Record<string, unknown>;

export const publishedHero = {
  eyebrow: text(heroFile.eyebrow, hero.eyebrow),
  /* Two lines, coloured differently — the split is the design, not a wrap. */
  titleLines: readLines(heroFile.titleLines, hero.titleLines),
  intro: text(heroFile.intro, hero.intro),
  primaryCta: readCta(heroFile.primaryCta, hero.primaryCta),
  videoCta: readCta(heroFile.videoCta, hero.videoCta),
  /* An empty video is allowed: the banner falls back to its background colour,
     which is a design the editor may have chosen. A data URL is not — it would
     be an upload that never made it into public/, and would 404 on the live
     site after inflating the page by megabytes. */
  video: (() => {
    const value = typeof heroFile.video === "string" ? heroFile.video.trim() : null;
    if (value === null) return hero.video;
    return value.startsWith("data:") ? hero.video : value;
  })(),
} as const;

const testimonialsFile = (
  isObject(homeFile.testimonials) ? homeFile.testimonials : {}
) as Record<string, unknown>;

function readQuotes(value: unknown) {
  if (!Array.isArray(value)) return null;
  const items = value.flatMap((row) => {
    if (!isObject(row) || !isLive(row)) return [];
    const quote = typeof row.quote === "string" ? row.quote.trim() : "";
    const author = typeof row.author === "string" ? row.author.trim() : "";
    /* An unattributed quote is the one thing this carousel cannot show: the
       author line is what makes it a testimonial rather than a slogan. */
    return quote && author ? [{ quote, author }] : [];
  });
  return items.length > 0 ? items : null;
}

const videoFile = (
  isObject(testimonialsFile.video) ? testimonialsFile.video : {}
) as Record<string, unknown>;

export const publishedTestimonials = {
  title: text(testimonialsFile.title, testimonials.title),
  cta: readCta(testimonialsFile.cta, testimonials.cta),
  video: {
    src: text(videoFile.src, testimonials.video.src),
    poster: text(videoFile.poster, testimonials.video.poster),
  },
  items: readQuotes(testimonialsFile.items) ?? testimonials.items.map((item) => ({
    quote: item.quote,
    author: item.author,
  })),
} as const;

/* ---------------------------------------------------------------- products */

export type PublishedProduct = {
  readonly slug: string;
  readonly name: string;
  /** The card's one-line summary on the grid. */
  readonly cardBody: string;
  readonly image: string;
  /** Always /products/<slug>; derived, never stored, so the two cannot drift. */
  readonly href: string;
  /** The opening paragraph of the product's own page. */
  readonly intro: readonly RichRun[];
};

/**
 * Runs, kept only where there is something to render.
 *
 * Shared by products and the blog: an empty run would render an empty <span>
 * and, where the text is a link, an empty clickable target.
 */
function readRuns(value: unknown): RichRun[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((run) => {
    if (!isObject(run) || typeof run.text !== "string" || !run.text) return [];
    return [
      {
        text: run.text,
        ...(run.bold === true ? { bold: true as const } : {}),
        ...(typeof run.href === "string" && run.href ? { href: run.href } : {}),
      },
    ];
  });
}

/** Runs as plain text, for a meta description or an alt attribute. */
export function runsToText(runs: readonly RichRun[]) {
  return runs.map((run) => run.text).join("");
}

function readProducts(value: unknown): PublishedProduct[] | null {
  if (!Array.isArray(value)) return null;

  const items = value.flatMap((row): PublishedProduct[] => {
    if (!isObject(row)) return [];

    if (!isLive(row)) return [];

    const slug = typeof row.slug === "string" ? row.slug.trim() : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    /* Without both there is no card to draw and no page to link it to. */
    if (!slug || !name) return [];

    const image = typeof row.image === "string" ? row.image.trim() : "";

    return [
      {
        slug,
        name,
        cardBody: text(row.cardBody, ""),
        /* A data URL here would be an upload that never reached public/: it
           would 404 once built and carry megabytes into every page that shows
           the grid. */
        image: image.startsWith("data:") ? "" : image,
        href: `/products/${slug}`,
        intro: readRuns(row.intro),
      },
    ];
  });

  return items.length > 0 ? items : null;
}

const productsFile = (isObject(productsJson) ? productsJson : {}) as Record<string, unknown>;

export const publishedProducts = {
  heading: text(productsFile.heading, productsPage.heading),
  intro: text(productsFile.intro, productsPage.intro),
  /* The order here is the order of the grid, and of the previous/next links on
     a product page, so it is the editor's to arrange. */
  items:
    readProducts(productsFile.items) ??
    productCatalogue.map((product) => ({
      slug: product.slug,
      name: product.name,
      cardBody: product.body,
      image: product.image,
      href: product.href,
      intro: [] as readonly RichRun[],
    })),
} as const;

export function getPublishedProduct(slug: string) {
  return publishedProducts.items.find((product) => product.slug === slug);
}

/* ---------------------------------------------------------------- projects */

export type PublishedProject = {
  readonly slug: string;
  /** As the listing card writes it — en dashes and all. */
  readonly name: string;
  /** The heading on the project's own page, which often differs from `name`. */
  readonly title: string;
  readonly cardBody: string;
  readonly image: string;
  /** Body copy, one entry per paragraph. */
  readonly paragraphs: readonly (readonly RichRun[])[];
  /**
   * Whether this project has a page.
   *
   * A card only links where there is somewhere to go. The reference lists
   * developments it never wrote a page for, and a card linking to a 404 is
   * worse than a card that does not link.
   */
  readonly hasPage: boolean;
};

function readProjects(value: unknown): PublishedProject[] | null {
  if (!Array.isArray(value)) return null;

  const items = value.flatMap((row): PublishedProject[] => {
    if (!isObject(row)) return [];

    if (!isLive(row)) return [];

    const name = typeof row.name === "string" ? row.name.trim() : "";
    const slug = typeof row.slug === "string" ? row.slug.trim() : "";
    /* The name is the card; without it there is nothing to show. */
    if (!name) return [];

    const image = typeof row.image === "string" ? row.image.trim() : "";
    const paragraphs = Array.isArray(row.paragraphs)
      ? row.paragraphs.map(readRuns).filter((runs) => runs.length > 0)
      : [];

    return [
      {
        slug,
        name,
        title: text(row.title, name),
        cardBody: text(row.cardBody, ""),
        image: image.startsWith("data:") ? "" : image,
        paragraphs,
        /* A page is built for any project with an address and something to say
           on it — which is also the condition generateStaticParams uses, so a
           card can never link somewhere that was not built. */
        hasPage: Boolean(slug) && paragraphs.length > 0,
      },
    ];
  });

  return items.length > 0 ? items : null;
}

const projectsFile = (isObject(projectsJson) ? projectsJson : {}) as Record<string, unknown>;

export const publishedProjects = {
  readMore: text(projectsFile.readMore, projectsPage.readMore),
  items:
    readProjects(projectsFile.items) ??
    projectsPage.items.map((item) => {
      const detail = projectDetails.find((entry) => entry.name === item.name);
      return {
        slug: detail?.slug ?? "",
        name: item.name,
        title: detail?.title ?? item.name,
        cardBody: item.body,
        image: item.image,
        paragraphs: detail ? detail.paragraphs.map((line) => [{ text: line }]) : [],
        hasPage: Boolean(detail),
      };
    }),
} as const;

export function getPublishedProject(slug: string) {
  return publishedProjects.items.find((project) => project.slug === slug && project.hasPage);
}

/** The card's link, empty while a project has no page. */
export function publishedProjectHref(name: string) {
  const project = publishedProjects.items.find((entry) => entry.name === name);
  return project?.hasPage ? `/projects/${project.slug}` : "";
}

/* ------------------------------------------------------------------ career */

export type PublishedJob = {
  readonly slug: string;
  readonly title: string;
  readonly category: string;
  readonly type: string;
  readonly location: string;
  readonly responsibilities: readonly string[];
};

/**
 * Only rows with the fields a page needs are kept.
 *
 * A half-finished opening saved in the panel — no title, no address — would
 * otherwise become a live page with an empty heading, and
 * `generateStaticParams` would try to build a route with no slug.
 */
function readJobs(value: unknown): PublishedJob[] | null {
  if (!Array.isArray(value)) return null;

  const jobs = value.flatMap((row): PublishedJob[] => {
    if (!isObject(row)) return [];

    if (!isLive(row)) return [];

    const slug = typeof row.slug === "string" ? row.slug.trim() : "";
    const title = typeof row.title === "string" ? row.title.trim() : "";
    if (!slug || !title) return [];

    return [
      {
        slug,
        title,
        category: text(row.category, title),
        type: text(row.type, ""),
        location: text(row.location, ""),
        responsibilities: Array.isArray(row.responsibilities)
          ? row.responsibilities.filter(
              (line): line is string => typeof line === "string" && line.trim().length > 0,
            )
          : [],
      },
    ];
  });

  /* An empty file is a mistake, not an instruction to close every vacancy. */
  return jobs.length > 0 ? jobs : null;
}

const careerFile = careerJson as Record<string, unknown>;

export const publishedCareer = {
  openingsTitle: text(careerFile.openingsTitle, careerPage.openings.title),
  moreLabel: text(careerFile.moreLabel, careerPage.openings.more),
  jobs:
    readJobs(careerFile.jobs) ??
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

/* --------------------------------------------------------------------- faq */

export type PublishedFaqItem = {
  readonly question: string;
  readonly answer: string;
  /** A procedure, shown as a numbered list. `answer` holds the same words. */
  readonly steps?: readonly string[];
};

export type PublishedFaqGroup = {
  readonly title: string;
  readonly items: readonly PublishedFaqItem[];
};

function readFaqGroups(value: unknown): PublishedFaqGroup[] | null {
  if (!Array.isArray(value)) return null;

  const groups = value.flatMap((row): PublishedFaqGroup[] => {
    if (!isObject(row)) return [];
    if (!isLive(row)) return [];

    const title = typeof row.title === "string" ? row.title.trim() : "";
    if (!title || !Array.isArray(row.items)) return [];

    /* A question with no answer is worse than no question: the accordion opens
       on nothing, and the FAQ structured data would carry an empty entry. */
    const items = row.items.flatMap((item) => {
      if (!isObject(item) || !isLive(item)) return [];
      const question = typeof item.question === "string" ? item.question.trim() : "";
      const answer = typeof item.answer === "string" ? item.answer.trim() : "";
      if (!question || !answer) return [];

      const steps = Array.isArray(item.steps)
        ? item.steps.filter(
            (step): step is string => typeof step === "string" && step.trim().length > 0,
          )
        : [];

      return [{ question, answer, ...(steps.length > 0 ? { steps } : {}) }];
    });

    return items.length > 0 ? [{ title, items }] : [];
  });

  return groups.length > 0 ? groups : null;
}

const faqFile = faqJson as Record<string, unknown>;

export const publishedFaq = {
  title: text(faqFile.title, faqPage.title),
  groups:
    readFaqGroups(faqFile.groups) ??
    faqPage.groups.map((group) => ({
      title: group.title,
      items: group.items.map((item) => ({
        question: item.question,
        answer: item.answer,
        ...("steps" in item && item.steps ? { steps: item.steps } : {}),
      })),
    })),
} as const;

/* -------------------------------------------------------------------- blog */

/**
 * Posts, validated back into the shape the renderer already understands.
 *
 * The admin's block model carries an `id` on every block and flattens a
 * heading's link into two fields; the renderer wants neither. Converting here
 * keeps that difference out of the page components, which should not know the
 * CMS exists.
 */
function readPosts(value: unknown): BlogPost[] | null {
  if (!Array.isArray(value)) return null;

  const posts = value.flatMap((row): BlogPost[] => {
    if (!isObject(row)) return [];

    if (!isLive(row)) return [];

    const slug = typeof row.slug === "string" ? row.slug.trim() : "";
    const title = typeof row.title === "string" ? row.title.trim() : "";
    if (!slug || !title) return [];

    const body = Array.isArray(row.body) ? row.body.flatMap(readBlock) : [];

    return [
      {
        slug,
        title,
        description: text(row.description, ""),
        image: text(row.image, ""),
        published: text(row.published, ""),
        modified: text(row.modified, text(row.published, "")),
        author: text(row.author, "buildon co"),
        body,
      },
    ];
  });

  return posts.length > 0 ? posts : null;
}

function readBlock(value: unknown): BlogPost["body"][number][] {
  if (!isObject(value)) return [];

  switch (value.kind) {
    case "h2":
    case "h3": {
      const heading = typeof value.text === "string" ? value.text : "";
      if (!heading) return [];
      /* The link is only honoured when its phrase is actually in the heading —
         the renderer splits on it, and a phrase that is not there would make
         the heading render unchanged with a link silently dropped. */
      const linkText = typeof value.linkText === "string" ? value.linkText : "";
      const linkHref = typeof value.linkHref === "string" ? value.linkHref : "";
      const link =
        linkText && linkHref && heading.includes(linkText)
          ? { text: linkText, href: linkHref }
          : undefined;
      return [{ kind: value.kind, text: heading, ...(link ? { link } : {}) }];
    }

    case "ul": {
      const items = Array.isArray(value.items)
        ? value.items.map(readRuns).filter((runs) => runs.length > 0)
        : [];
      return items.length > 0 ? [{ kind: "ul", items }] : [];
    }

    case "image": {
      const src = typeof value.src === "string" ? value.src : "";
      const width = Number(value.width);
      const height = Number(value.height);
      /* next/image throws without both, and a data URL left over from an
         upload that was never saved into public/ would 404 on the live site. */
      if (!src || src.startsWith("data:") || !width || !height) return [];
      return [
        {
          kind: "image",
          src,
          alt: typeof value.alt === "string" ? value.alt : "",
          width,
          height,
        },
      ];
    }

    default: {
      const runs = readRuns(value.runs);
      return runs.length > 0 ? [{ kind: "p", runs }] : [];
    }
  }
}

const blogFile = blogJson as Record<string, unknown>;

export const publishedPosts: readonly BlogPost[] =
  readPosts(blogFile.items) ?? fallbackPosts;

export function getPublishedPost(slug: string) {
  return publishedPosts.find((post) => post.slug === slug);
}

/* The application form's option lists are not content an editor changes, so
   they stay where they are. */
export { applicationFields };
