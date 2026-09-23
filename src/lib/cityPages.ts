/**
 * The city landing pages — buildon.co.in/gypsum-plaster-in-bhubaneswar/ and
 * its siblings, which the reference links from the "Posts" rail on every
 * project page.
 *
 * These are not articles. Each one is the home page with the city's name
 * dropped into three places — the Why Us heading, the product section's
 * heading and intro, and the Meet Our Clients line — and the enquiry form
 * left out. So there is no body copy to transcribe: a city needs only its
 * slug and its name here, and `WhyUs`, `Products` and `Clients` take it as a
 * prop.
 *
 * They keep the reference's own root-level URLs rather than moving under a
 * folder, because these are the pages it ranks for locally and a changed path
 * throws that away.
 *
 * All eight are pure city-name swaps: diffing the Bhubaneswar and Jharkhand
 * pages turns up nothing but the name in those four places and the <title> —
 * same 45 images, same order, same copy throughout. So a new city is one line
 * here, and projectPostsWidget in projectDetails.ts links its rail row through
 * as soon as it lands.
 */

export type CityPage = {
  /** The reference's own path, without slashes: "gypsum-plaster-in-ranchi". */
  readonly slug: string;
  /** The city as the reference writes it into the headings. */
  readonly city: string;
};

export const cityPages: readonly CityPage[] = [
  { slug: "gypsum-plaster-in-bhubaneswar", city: "Bhubaneswar" },
  { slug: "gypsum-plaster-in-jharkhand", city: "Jharkhand" },
  { slug: "gypsum-plaster-in-jamshedpur", city: "Jamshedpur" },
  { slug: "gypsum-plaster-in-ranchi", city: "Ranchi" },
  { slug: "gypsum-plaster-in-cuttack", city: "Cuttack" },
  { slug: "gypsum-plaster-in-orissa", city: "Orissa" },
  { slug: "gypsum-plaster-in-siliguri", city: "Siliguri" },
  { slug: "gypsum-plaster-in-durgapur", city: "Durgapur" },
];

export function getCityPage(slug: string) {
  return cityPages.find((page) => page.slug === slug);
}

/** The href for a "Posts" rail item, or "" while its page is still to come. */
export function cityPageHref(slug: string) {
  return getCityPage(slug) ? `/${slug}` : "";
}
