import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import { cityPages, getCityPage } from "@/lib/cityPages";
import { site } from "@/lib/content";

/**
 * /<city-page> — the reference's local landing pages, at its own root-level
 * URLs, which is why this segment sits at the top of the app rather than under
 * a folder. Only the slugs in cityPages.ts are built, and dynamicParams is off,
 * so every other single-segment path still falls through to not-found.
 *
 * The page is the home page with the city's name in three headings and no
 * enquiry form — the reference's own section order, kept in one place here so
 * a change to any section reaches every city at once. It deliberately does not
 * use PageBanner: these pages open on the same hero slider the home page does.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return cityPages.map((page) => ({ cityPage: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cityPage: string }>;
}): Promise<Metadata> {
  const { cityPage } = await params;
  const page = getCityPage(cityPage);
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

export default async function CityPage({
  params,
}: {
  params: Promise<{ cityPage: string }>;
}) {
  const { cityPage } = await params;
  const page = getCityPage(cityPage);
  if (!page) notFound();

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
