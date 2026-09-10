import About from "@/components/About";
import Clients from "@/components/Clients";
import ContactDetails from "@/components/ContactDetails";
import ContactForm from "@/components/ContactForm";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import Projects from "@/components/Projects";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import Testimonials from "@/components/Testimonials";
import WhyUs from "@/components/WhyUs";

// Section order mirrors buildon.co.in: the enquiry form sits between the
// product grid and the About block, with the contact details near the end.
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <WhyUs />
        <Products />
        <ContactForm />
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
