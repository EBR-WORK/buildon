/**
 * The project detail pages, transcribed from the reference site.
 *
 * Same rule as content.ts and productDetails.ts: every string is the reference
 * site's own, punctuation and typos included. Fix them there first, then
 * mirror the fix here.
 *
 * The reference publishes these at the site root — buildon.co.in/aparna-one-
 * hyderabad/ — rather than under /projects/. They live at /projects/<slug>
 * here so the listing and its pages read as one section, matching how
 * /products/<slug> already works.
 *
 * Each page is the same shape: a heading, one photograph and a few paragraphs
 * of body copy, so unlike the products there is no typed section list — only
 * `paragraphs`, in order. Entries are added one project at a time as each page
 * is transcribed; `projectsPage.items` in content.ts carries the listing, and
 * a card links out only once its detail page exists here.
 */

import { cityPageHref } from "./cityPages";

export type ProjectDetail = {
  readonly slug: string;
  /** The name the listing card and the projects grid use. */
  readonly name: string;
  /** The page's own heading, which the reference writes differently to the card. */
  readonly title: string;
  /** The photograph under the heading — the reference reuses its card crop. */
  readonly image: string;
  /** Body copy, one string per paragraph, in the reference's order. */
  readonly paragraphs: readonly string[];
};

export const projectDetails: readonly ProjectDetail[] = [
  {
    slug: "aparna-one-hyderabad",
    name: "Aparna One, Hyderabad",
    title: "Aparna One - Hyderabad",
    image: "/projects/mask-group-29.webp",
    paragraphs: [
      "Aparna One is a project of ultra-luxurious residential gated community flats for sale in Shaikpet, Hyderabad. These magnificent smart apartments are the perfect combination of class and convenience, that’ll redefine the experience of luxury living.",
      "Located at a central location in close proximity to Hyderabad’s poshest localities like Banjara Hills, Jubilee Hills, Hi-tech City, and Gachibowli, Aparna One flats for sale in Shaikpet, are poised to be one of the most sought-after luxury homes of Hyderabad.",
      "Aparna One has spacious 3 and 4-BHK, flats for sale in Shaikpet, with exclusive personal lobbies for each. The community is spread across 9.7 acres of land with 6 residential blocks and one entire block dedicated to the clubhouse along with a wide range of amenities.",
    ],
  },
  {
    slug: "aparna-zenon-hyderabad",
    /* The listing writes the name with an en dash, the page's own heading with
       a hyphen. Both kept as they are — `name` is what projectHref matches on. */
    name: "Aparna Zenon – Hyderabad",
    title: "Aparna Zenon - Hyderabad",
    image: "/projects/mask-group-3.webp",
    paragraphs: [
      /* One paragraph on the reference, broken by a stray <br> before "your
         work" — a layout artifact, not a sentence break, so it is closed up. */
      "Flats for sale in Nanakramguda, Hyderabad. The project offers luxurious 2 & 3 BHK apartments for sale in Nanakramguda, Puppalaguda. Nanakramguda Financial District is an IT, real estate, and architectural suburb in Serlingampally Mandal, in Hyderabad, India. The first phase of the financial district is home to TSI Business parks making it a sought-after place, for people to reside close to. Located at a considerable distance from the city yet surrounded by prime commercial facilities, apartments for sale in Nanakramguda offer you the balance between your work and family life.",
    ],
  },
];

/**
 * The "Posts" widget the reference hangs down the left of every project page:
 * its eight city landing pages, which it publishes but never lists on /blog.
 * Titles and order are the reference's; each row's href is resolved from
 * cityPages.ts, so a row links through the moment its page is built and stays
 * inert until then. "View More" goes where the reference sends it: /projects.
 */
export const projectPostsWidget = {
  title: "Posts",
  viewMore: { label: "View More >", href: "/projects" },
  items: [
    "gypsum-plaster-in-bhubaneswar",
    "gypsum-plaster-in-jharkhand",
    "gypsum-plaster-in-jamshedpur",
    "gypsum-plaster-in-ranchi",
    "gypsum-plaster-in-cuttack",
    "gypsum-plaster-in-orissa",
    "gypsum-plaster-in-siliguri",
    "gypsum-plaster-in-durgapur",
  ].map((slug) => ({
    slug,
    /* "gypsum-plaster-in-bhubaneswar" → "Gypsum Plaster in Bhubaneswar", the
       reference's own capitalisation. */
    title: slug
      .split("-")
      .map((word, i) => (i === 2 ? word : word[0].toUpperCase() + word.slice(1)))
      .join(" "),
    href: cityPageHref(slug),
  })),
} as const;

export function getProjectDetail(slug: string) {
  return projectDetails.find((project) => project.slug === slug);
}

/** Whether the listing should link a card through to a detail page. */
export function projectHref(name: string) {
  const project = projectDetails.find((detail) => detail.name === name);
  return project ? `/projects/${project.slug}` : "";
}
