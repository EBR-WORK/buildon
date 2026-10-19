import About from "@/components/About";
import Clients from "@/components/Clients";
import { publishedTestimonials } from "@/lib/cms/published";
import Counters from "@/components/Counters";
import ContactDetails from "@/components/ContactDetails";
import ContactForm from "@/components/ContactForm";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import Projects from "@/components/Projects";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import Testimonials from "@/components/Testimonials";
import WhyUs from "@/components/WhyUs";
import { counters, products } from "@/lib/content";

// Section order mirrors buildon.co.in: the enquiry form sits between the
// product grid and the About block, with the contact details near the end.
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <WhyUs />
        <Products copy={products} />
        <ContactForm />
        <About />
        {/* Placeholder figures — see `counters` in content.ts.
            Passed down rather than imported by the component: Counters is a
            client component, and anything it imports is compiled into the
            shared JS bundle, where it cannot be translated per language. */}
        <Counters
          title={counters.title}
          intro={counters.intro}
          items={counters.items}
        />
        <Clients />
        <Projects />
        <Testimonials copy={publishedTestimonials} />
        <ContactDetails />
      </main>
      <SiteFooter />
    </>
  );
}
