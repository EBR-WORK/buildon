import type { Metadata } from "next";
import Image from "next/image";
import DetailBlock from "@/components/DetailBlock";
import EnquiryForm from "@/components/EnquiryForm";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { contactPage, site } from "@/lib/content";

export const metadata: Metadata = {
  title: contactPage.title,
  description: `${contactPage.branchDetails.title}. ${contactPage.form.intro}`,
  alternates: { canonical: "/contact-us" },
  openGraph: {
    type: "website",
    url: `${site.url}/contact-us/`,
    title: `${contactPage.title} | ${site.name}`,
    description: contactPage.form.intro,
  },
};

export default function ContactUsPage() {
  const branches = contactPage.branchDetails.branches.split("|").map((b) => b.trim());

  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* Title bar */}
        <section className="relative isolate overflow-hidden bg-secondary">
          <Image
            src={contactPage.banner.image}
            alt=""
            fill
            sizes="100vw"
            priority
            className="-z-10 object-cover object-[20%_center] sm:object-center"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-linear-to-r from-secondary/75 via-secondary/35 to-transparent"
          />

          <div className="container-page flex min-h-[14rem] flex-col justify-center py-14 sm:min-h-[18rem] lg:py-20">
            <h1 className="font-display text-[clamp(1.75rem,2vw+1rem,2.5rem)] leading-[1.25] font-medium tracking-wide text-white uppercase">
              {contactPage.banner.headingLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
          </div>
        </section>

        {/* Branch details — 1/3 of head-office facts beside 2/3 of branches */}
        <section className="section-y">
          <Reveal className="container-page">
            <SectionHeading title={contactPage.branchDetails.title} />

            <div className="mt-8 grid gap-10 sm:mt-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
              <div className="space-y-6">
                <DetailBlock
                  label={contactPage.branchDetails.headOfficeLabel}
                  value={contactPage.branchDetails.headOffice}
                />
                <DetailBlock
                  label={contactPage.branchDetails.addressLabel}
                  value={contactPage.branchDetails.address}
                />
                <DetailBlock
                  label={contactPage.branchDetails.gstLabel}
                  value={contactPage.branchDetails.gst}
                />
              </div>

              <div>
                <h3 className="font-display text-lg leading-snug font-semibold">
                  {contactPage.branchDetails.branchesLabel}
                </h3>
                <span
                  aria-hidden
                  className="mt-4 block h-0.5 w-7 bg-brand-600"
                />
                {/* The reference runs these as one pipe-separated line */}
                <ul className="mt-6 flex flex-wrap gap-2.5">
                  {branches.map((branch) => (
                    <li
                      key={branch}
                      className="rounded-full border border-line bg-white px-5 py-2.5 text-[15px] font-medium text-ink-700"
                    >
                      {branch}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Factories — three across */}
        <section className="section-y border-t border-line bg-surface">
          <div className="container-page">
            <Reveal>
              <SectionHeading title={contactPage.factories.title} />
            </Reveal>

            {/* Each factory is two of the same label/value blocks stacked, the
                pattern the reference uses throughout its contact pages. */}
            <ul className="mt-8 grid gap-x-10 gap-y-8 sm:mt-10 lg:grid-cols-3">
              {contactPage.factories.items.map((factory, i) => (
                <Reveal as="li" key={factory.location} delay={i * 0.08} className="space-y-6">
                  <DetailBlock label={factory.zone} value={factory.location} />
                  <DetailBlock
                    label={contactPage.factories.addressLabel}
                    value={factory.address}
                  />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* Map — the same embed the home page uses */}
        <section className="border-t border-line">
          <iframe
            src={site.mapEmbedUrl}
            title={`${site.name} on Google Maps`}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-[20rem] w-full border-0 sm:h-[26rem]"
          />
        </section>

        {/* Send Us Message — 1/3 of copy beside the form */}
        <section id="enquiry" className="section-y scroll-mt-28 bg-surface">
          <div className="container-page grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <Reveal>
              <SectionHeading title={contactPage.form.title} />
              <p className="mt-5 text-base leading-relaxed text-ink-500">
                {contactPage.form.intro}
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <EnquiryForm />
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
