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
import { site } from "@/lib/content";

/**
 * /gypsum-plaster-manufacturer-and-supplier-in-india
 *
 * A national landing page, built exactly like the city pages: the home page
 * with a phrase dropped into two headings and no enquiry form. Here the phrase
 * is "manufacturer and supplier in India" rather than "in <city>", which is why
 * WhyUs and Products take a `phrase` as well as a `city`.
 *
 * It keeps the reference's own root-level URL, which is what it ranks on, and
 * exists because six blog posts link to it — without it those phrases were dead
 * bold text inside articles that are already live.
 */

const PHRASE = "manufacturer and supplier in India";

const description =
  "Buildon is a leading gypsum plaster manufacturer, supplier and importer in India — one coat, master, perlite and vermiculite plasters, 40% harder and whiter than any other gypsum in the Indian market.";

export const metadata: Metadata = {
  title: "Gypsum Plaster in India, Manufacturer, Supplier & Importer",
  description,
  alternates: { canonical: "/gypsum-plaster-manufacturer-and-supplier-in-india" },
  openGraph: {
    type: "website",
    url: `${site.url}/gypsum-plaster-manufacturer-and-supplier-in-india/`,
    title: `Gypsum Plaster in India | ${site.name}`,
    description,
  },
};

export default function GypsumPlasterIndiaPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <WhyUs phrase={PHRASE} />
        <Products phrase={PHRASE} />
        {/* No ContactForm: the reference drops it from these landing pages,
            running the product grid straight into About. */}
        <About />
        <Clients />
        <Projects />
        <Testimonials />
        <ContactDetails />
      </main>
      <SiteFooter />
    </>
  );
}
