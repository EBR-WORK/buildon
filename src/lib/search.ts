/**
 * Site-wide search, as the reference does it.
 *
 * Its box posts to /?s=<term> and WordPress returns one page grouped by what
 * was matched — Pages, Post results, Product results, each with a "View more".
 * This mirrors that grouping over the content already in content.ts and the
 * detail modules, and runs in the browser: the site is a static export, so
 * there is no server to run a query on.
 *
 * Matching is deliberately plain — every term must appear somewhere in the
 * entry's text — which is enough for a catalogue this size and behaves the way
 * a reader expects when they add a second word to narrow a search.
 */

import { blogPage, nav, productCatalogue, projectsPage } from "./content";
import { blogHref } from "./blogDetails";
import { projectHref } from "./projectDetails";

export type SearchResult = {
  readonly title: string;
  readonly href: string;
  readonly body: string;
  readonly image?: string;
};

export type SearchGroup = {
  readonly title: string;
  /** Where its "View more" goes — the section's own listing. */
  readonly href: string;
  readonly results: readonly SearchResult[];
};

/** The static pages, described well enough to be findable by name. */
const pages: readonly SearchResult[] = [
  /* nav allows a null href for an item that is not wired up; those cannot be
     results. */
  ...nav
    .filter((link): link is { label: string; href: string } => typeof link.href === "string")
    .map((link) => ({ title: link.label, href: link.href, body: "" })),
  { title: "Testimonials", href: "/testimonials", body: "What our clients say about Buildon." },
  { title: "Privacy Policy", href: "/privacy-policy", body: "" },
  { title: "User Agreement", href: "/user-agreement", body: "" },
];

function matches(query: string, ...fields: (string | undefined)[]) {
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export function searchSite(query: string): readonly SearchGroup[] {
  const q = query.trim();
  if (!q) return [];

  const groups: SearchGroup[] = [
    {
      title: "Page results",
      href: "/",
      results: pages
        .filter((page) => matches(q, page.title, page.body))
        .map((page) => ({ ...page })),
    },
    {
      title: "Product results",
      href: "/products",
      results: productCatalogue
        .filter((product) => matches(q, product.name, product.body))
        .map((product) => ({
          title: product.name,
          href: product.href,
          body: product.body,
          image: product.image,
        })),
    },
    {
      title: "Project results",
      href: "/projects",
      results: projectsPage.items
        .filter((project) => matches(q, project.name, project.body))
        .map((project) => ({
          title: project.name,
          href: project.href || projectHref(project.name),
          body: project.body,
          image: project.image,
        })),
    },
    {
      title: "Post results",
      href: "/blog",
      results: blogPage.items
        .filter((post) => matches(q, post.title, post.excerpt))
        .map((post) => ({
          title: post.title,
          href: post.href || blogHref(post.title),
          body: post.excerpt,
          image: post.image,
        })),
    },
  ];

  return groups.filter((group) => group.results.length > 0);
}

export function countResults(groups: readonly SearchGroup[]) {
  return groups.reduce((total, group) => total + group.results.length, 0);
}
