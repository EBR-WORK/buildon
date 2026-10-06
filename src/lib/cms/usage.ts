/**
 * What points at a thing before you delete it.
 *
 * Deleting a live page is not just removing a row: the grid links to it, other
 * pages suggest it, and blog articles link to it mid-sentence. Those links do
 * not disappear with the page — they become dead ends.
 *
 * So the editor is told what will break, with counts, rather than a generic
 * "are you sure?". The numbers are read from the content modules the site
 * actually renders from, not guessed.
 */

import { blogPosts } from "@/lib/blogDetails";
import { productDetails } from "@/lib/productDetails";
import { projectDetails } from "@/lib/projectDetails";

export type Usage = {
  /** Inline links inside blog articles. */
  readonly fromPosts: number;
  /** "More Products" / "More Projects" rows on other detail pages. */
  readonly fromRelated: number;
  readonly total: number;
};

const EMPTY: Usage = { fromPosts: 0, fromRelated: 0, total: 0 };

/** How many blog paragraphs link to a path, however the reference wrote it. */
function postLinksTo(path: string) {
  let count = 0;
  for (const post of blogPosts) {
    for (const block of post.body) {
      const runs =
        block.kind === "p"
          ? block.runs
          : block.kind === "ul"
            ? block.items.flat()
            : [];
      for (const run of runs) {
        if (!run.href) continue;
        const target = run.href
          .replace(/^https?:\/\/(www\.)?buildon\.co\.in/, "")
          .replace(/\/+$/, "");
        if (target === path) count += 1;
      }
    }
  }
  return count;
}

export function productUsage(slug: string): Usage {
  const fromPosts = postLinksTo(`/products/${slug}`);
  const fromRelated = productDetails.filter(
    (product) => product.slug !== slug && product.related.includes(slug),
  ).length;

  return { fromPosts, fromRelated, total: fromPosts + fromRelated };
}

export function projectUsage(slug: string): Usage {
  const fromPosts = postLinksTo(`/projects/${slug}`);
  /* Project pages pick their "More Projects" row at render time from whichever
     projects have pages, so every other project effectively suggests this one. */
  const fromRelated = projectDetails.some((project) => project.slug === slug)
    ? Math.min(3, Math.max(0, projectDetails.length - 1))
    : 0;

  return { fromPosts, fromRelated, total: fromPosts + fromRelated };
}

export function jobUsage(slug: string): Usage {
  const fromPosts = postLinksTo(`/career/${slug}`);
  return { ...EMPTY, fromPosts, total: fromPosts };
}

/**
 * What points at a blog post.
 *
 * Posts link to each other heavily — the reference cross-references its own
 * articles mid-sentence — so this is the count most likely to be non-zero, and
 * the one most worth seeing before a post goes.
 */
export function postUsage(slug: string): Usage {
  const fromPosts = postLinksTo(`/blog/${slug}`);
  /* Every other post's sidebar draws from the same pool, so a published post
     is suggested by the three-up "More Posts" row wherever it lands. */
  const fromRelated = blogPosts.some((post) => post.slug === slug)
    ? Math.min(3, Math.max(0, blogPosts.length - 1))
    : 0;

  return { fromPosts, fromRelated, total: fromPosts + fromRelated };
}

/** A sentence for the confirmation dialog. */
export function describeUsage(usage: Usage, what: string) {
  if (usage.total === 0) {
    return `Nothing on the site links to this ${what}.`;
  }

  const parts: string[] = [];
  if (usage.fromPosts > 0) {
    parts.push(`${usage.fromPosts} link${usage.fromPosts === 1 ? "" : "s"} inside blog articles`);
  }
  if (usage.fromRelated > 0) {
    parts.push(`${usage.fromRelated} suggestion${usage.fromRelated === 1 ? "" : "s"} on other pages`);
  }

  return `${parts.join(" and ")} will stop working.`;
}
