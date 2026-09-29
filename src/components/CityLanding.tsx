import type { Metadata } from "next";
import About from "@/components/About";
import Clients from "@/components/Clients";
import ContactDetails from "@/components/ContactDetails";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import Projects from "@/components/Projects";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import Testimonials from "@/components/Testimonials";
import WhyUs from "@/components/WhyUs";
import { getCityPage } from "@/lib/cityPages";
import { site } from "@/lib/content";

/**
 * One city landing page: the home page with the city's name in three headings
 * and no enquiry form — the reference's own section order.
 *
 * Each city has its own route folder rather than sharing a dynamic `[city]`
 * segment at the app root. A root-level dynamic segment catches EVERY unknown
 * single-segment path, and with `output: export` that makes an unmatched URL a
 * build-time error instead of a 404 — so /wrongsomething returned a 500 in
 * development rather than the not-found page. Concrete routes leave unknown
 * paths unclaimed, which is what lets them 404 properly.
 *
 * Everything else lives here, so a change to any section reaches every city.
 */

export function cityMetadata(slug: string): Metadata {
  const page = getCityPage(slug);
  if (!page) return {};

  const title = `Gypsum Plaster in ${page.city}`;
  const description = `Buildon is the leading manufacturer and importer of gypsum plaster in ${page.city} — one coat, master, perlite and vermiculite plasters, 40% harder and whiter than any other gypsum in the Indian market.`;

  return {
    title,
    description,
    alternates: { canonical: `/${page.slug}` },
    openGraph: {
      type: "website",
      url: `${site.url}/${page.slug}/`,
      title: `${title} | ${site.name}`,
      description,
    },
  };
}

export default function CityLanding({ slug }: { slug: string }) {
  const page = getCityPage(slug);
  if (!page) return null;

  const { city } = page;

  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <WhyUs city={city} />
        <Products city={city} />
        {/* No ContactForm: the reference drops it from these pages, running
            the product grid straight into About. */}
        <About />
        <Clients city={city} />
        <Projects />
        <Testimonials />
        <ContactDetails />
      </main>
      <SiteFooter />
    </>
  );
}
