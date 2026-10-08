"use client";

/**
 * What an entry needs before it can go live.
 *
 * These are not style rules. Each one names something that visibly breaks: a
 * project with no address gets no page, so its card links nowhere; a product
 * with no name renders a card with an empty heading; two entries sharing an
 * address means one of them silently never builds.
 *
 * published.ts already drops incomplete rows on the way out, so a half-finished
 * entry cannot reach the site either way. The difference is who finds out —
 * without this, an editor saves, sees "Saved", and discovers days later that
 * the page never appeared. Saying so in the panel is the whole point.
 *
 * Drafts are exempt. A draft does not reach the site, so nothing about it can
 * break; demanding a photograph before someone is allowed to save a half-typed
 * name would make the draft flag useless for the one thing it is for. The
 * requirements apply the moment an entry is set live.
 */

import type { SiteContent } from "./schema";

export type Problem = {
  /** Which entry, by its stable id, so the editor can open the right row. */
  readonly id: string;
  /** The row's name, for a message an editor can act on. */
  readonly label: string;
  readonly message: string;
};

const blank = (value: unknown) => typeof value !== "string" || value.trim().length === 0;

/** Only an explicit false is a draft — see the note on `live` in schema.ts. */
const isLive = (entry: { live?: boolean }) => entry.live !== false;

/** Entries whose address collides with another's. */
function duplicateSlugs(items: readonly { id: string; slug: string }[]) {
  const seen = new Map<string, number>();
  for (const item of items) {
    if (!item.slug) continue;
    seen.set(item.slug, (seen.get(item.slug) ?? 0) + 1);
  }
  return new Set([...seen].filter(([, count]) => count > 1).map(([slug]) => slug));
}

export function validateProducts(content: SiteContent): Problem[] {
  const problems: Problem[] = [];

  if (blank(content.products.heading)) {
    problems.push({ id: "products", label: "The products grid", message: "needs a heading." });
  }
  if (blank(content.products.intro)) {
    problems.push({ id: "products", label: "The products grid", message: "needs its intro line." });
  }
  const live = content.products.items.filter(isLive);
  const duplicates = duplicateSlugs(live);

  for (const item of live) {
    const label = item.name || item.slug || "Untitled product";
    if (blank(item.name)) problems.push({ id: item.id, label, message: "needs a name." });
    if (blank(item.slug)) {
      problems.push({ id: item.id, label, message: "needs a web address, or it gets no page." });
    } else if (duplicates.has(item.slug)) {
      problems.push({ id: item.id, label, message: `shares the address /products/${item.slug} with another product.` });
    }
    if (blank(item.cardBody)) {
      problems.push({ id: item.id, label, message: "needs a card summary — the grid shows an empty card without one." });
    }
    if (blank(item.image)) {
      problems.push({ id: item.id, label, message: "needs a thumbnail." });
    }
  }

  return problems;
}

export function validateProjects(content: SiteContent): Problem[] {
  const problems: Problem[] = [];

  if (blank(content.projects.readMore)) {
    problems.push({ id: "projects", label: "The card link", message: "needs words on it." });
  }
  const live = content.projects.items.filter(isLive);
  const duplicates = duplicateSlugs(live);

  for (const item of live) {
    const label = item.name || item.slug || "Untitled project";
    if (blank(item.name)) problems.push({ id: item.id, label, message: "needs a name." });
    if (blank(item.slug)) {
      problems.push({ id: item.id, label, message: "needs a web address, or its card will not link anywhere." });
    } else if (duplicates.has(item.slug)) {
      problems.push({ id: item.id, label, message: `shares the address /projects/${item.slug} with another project.` });
    }
    if (blank(item.image)) problems.push({ id: item.id, label, message: "needs a photograph." });
    if (blank(item.cardBody)) {
      problems.push({ id: item.id, label, message: "needs a card summary." });
    }

    /* Without a paragraph there is nothing on the page, so the site does not
       build one — which is why the card would have nowhere to point. */
    const words = item.paragraphs.flat().map((run) => run.text.trim()).join("");
    if (words.length === 0) {
      problems.push({ id: item.id, label, message: "needs at least one paragraph, or no page is built for it." });
    }
  }

  return problems;
}

export function validateJobs(content: SiteContent): Problem[] {
  const problems: Problem[] = [];

  if (blank(content.career.openingsTitle)) {
    problems.push({ id: "career", label: "The openings list", message: "needs a section heading." });
  }
  if (blank(content.career.moreLabel)) {
    problems.push({ id: "career", label: "The card link", message: "needs words on it." });
  }
  const live = content.career.jobs.filter(isLive);
  const duplicates = duplicateSlugs(live);

  for (const job of live) {
    const label = job.title || job.slug || "Untitled opening";
    if (blank(job.title)) problems.push({ id: job.id, label, message: "needs a job title." });
    if (blank(job.slug)) {
      problems.push({ id: job.id, label, message: "needs a web address, or it gets no page." });
    } else if (duplicates.has(job.slug)) {
      problems.push({ id: job.id, label, message: `shares the address /career/${job.slug} with another opening.` });
    }
    if (blank(job.location)) {
      problems.push({ id: job.id, label, message: "needs a location — it drives the filter on /career." });
    }
  }

  return problems;
}

export function validatePosts(content: SiteContent): Problem[] {
  const problems: Problem[] = [];
  const live = content.blog.items.filter(isLive);
  const duplicates = duplicateSlugs(live);

  for (const post of live) {
    const label = post.title || post.slug || "Untitled post";
    if (blank(post.title)) problems.push({ id: post.id, label, message: "needs a title." });
    if (blank(post.slug)) {
      problems.push({ id: post.id, label, message: "needs a web address, or it gets no page." });
    } else if (duplicates.has(post.slug)) {
      problems.push({ id: post.id, label, message: `shares the address /blog/${post.slug} with another post.` });
    }
    if (blank(post.image)) problems.push({ id: post.id, label, message: "needs a featured image." });
    if (post.body.length === 0) problems.push({ id: post.id, label, message: "has no body yet." });

    if (blank(post.published)) {
      problems.push({ id: post.id, label, message: "needs a published date." });
    }

    /* Backwards dates are not cosmetic: both go into the article's structured
       data, and a modified date before the published one is the kind of thing
       a search engine treats as a signal that the page is not trustworthy. */
    if (
      !blank(post.published) &&
      !blank(post.modified) &&
      post.modified < post.published
    ) {
      problems.push({
        id: post.id,
        label,
        message: "was last updated before it was published — one of the two dates is wrong.",
      });
    }
  }

  return problems;
}

/** One sentence for the save bar. */
export function describeProblems(problems: readonly Problem[]) {
  if (problems.length === 0) return "";
  const [first] = problems;
  const rest = problems.length - 1;
  return `${first.label} ${first.message}${rest > 0 ? ` And ${rest} other problem${rest === 1 ? "" : "s"}.` : ""}`;
}

/* ------------------------------------------------------- section headings */

/**
 * Headings are required for a reason that is easy to miss: published.ts falls
 * back to the shipped copy when a field is empty, so clearing a heading does
 * not blank the site — it quietly puts the old wording back. An editor who
 * meant to remove it sees their change ignored and no explanation. Refusing the
 * save is the only honest answer.
 */
export function validateHome(content: SiteContent): Problem[] {
  const problems: Problem[] = [];
  const { hero, testimonials } = content.home;

  if (hero.titleLines.length === 0 || hero.titleLines.every(blank)) {
    problems.push({ id: "hero", label: "The hero", message: "needs a headline." });
  }
  if (blank(hero.eyebrow)) {
    problems.push({ id: "hero", label: "The hero", message: "needs the small line above the headline." });
  }
  if (blank(hero.intro)) {
    problems.push({ id: "hero", label: "The hero", message: "needs its intro paragraph." });
  }
  if (blank(hero.primaryCta.label)) {
    problems.push({ id: "hero", label: "The hero button", message: "needs words on it." });
  }
  if (blank(testimonials.title)) {
    problems.push({ id: "testimonials", label: "Testimonials", message: "needs a section heading." });
  }

  for (const item of content.home.testimonials.items) {
    if (item.live === false) continue;
    const label = item.author || "A testimonial";
    if (blank(item.quote)) problems.push({ id: item.id, label, message: "has no quote." });
    if (blank(item.author)) {
      problems.push({ id: item.id, label: "A testimonial", message: "needs an author — an unattributed quote is a slogan." });
    }
  }

  return problems;
}

export function validateFaq(content: SiteContent): Problem[] {
  const problems: Problem[] = [];

  if (blank(content.faq.title)) {
    problems.push({ id: "faq", label: "The FAQ page", message: "needs a heading." });
  }

  /* The document is read the way published.ts reads it, so the panel reports
     exactly the shapes that would be dropped on the way to the page rather
     than a set of rules that only resemble them. */
  let section: string | null = null;
  let question: string | null = null;
  let answered = false;
  let sections = 0;
  let questions = 0;

  const closeQuestion = () => {
    if (question && !answered) {
      problems.push({ id: "faq", label: `"${question}"`, message: "has no answer under it." });
    }
  };

  for (const block of content.faq.body) {
    if (block.kind === "h2") {
      closeQuestion();
      if (!block.text.trim()) {
        problems.push({ id: block.id, label: "A section", message: "has no heading." });
      }
      section = block.text.trim();
      question = null;
      answered = false;
      sections += 1;
      continue;
    }

    if (block.kind === "h3") {
      closeQuestion();
      if (!section) {
        problems.push({
          id: block.id,
          label: `"${block.text.trim() || "A question"}"`,
          message: "comes before any section, so the page has nowhere to show it.",
        });
      }
      if (!block.text.trim()) {
        problems.push({ id: block.id, label: "A question", message: "has no text." });
      }
      question = block.text.trim();
      answered = false;
      questions += 1;
      continue;
    }

    if (!question) {
      problems.push({
        id: block.id,
        label: "An answer",
        message: "has no question above it, so the page has nowhere to show it.",
      });
      continue;
    }
    answered = true;
  }

  closeQuestion();

  if (sections === 0 || questions === 0) {
    problems.push({ id: "faq", label: "The FAQ page", message: "needs at least one section with a question in it." });
  }

  return problems;
}

