import type { Metadata } from "next";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { PlusIcon } from "@/components/icons";
import { faqPage, site } from "@/lib/content";

export const metadata: Metadata = {
  title: faqPage.title,
  description: faqPage.banner.subheadingLines.join(" "),
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "website",
    url: `${site.url}/faq/`,
    title: `${faqPage.title} | ${site.name}`,
    description: faqPage.banner.subheadingLines.join(" "),
  },
};

/**
 * The reference drives its accordion with JavaScript. This uses <details> and
 * <summary> instead: it opens and closes with no script, is keyboard operable
 * for free, and the answers stay in the page for search engines and find-in-page.
 */
export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqPage.groups.flatMap((group) =>
      group.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    ),
  };

  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* Title bar */}
        <section className="relative isolate overflow-hidden bg-secondary">
          <Image
            src={faqPage.banner.image}
            alt=""
            fill
            sizes="100vw"
            priority
            className="-z-10 object-cover object-[20%_center] sm:object-center"
          />
          {/* The artwork carries the heading on its own dark panel; the wash is
              only needed below sm, where bg-cover crops that panel away. */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-linear-to-r from-secondary/75 via-secondary/35 to-transparent sm:hidden"
          />

          <div className="container-page flex min-h-[14rem] flex-col justify-center py-14 sm:min-h-[18rem] lg:min-h-[22rem] lg:py-20">
            <h1 className="font-display text-[clamp(1.75rem,2vw+1rem,2.5rem)] leading-[1.25] font-medium tracking-wide text-white uppercase">
              {faqPage.banner.heading}
            </h1>
            <p className="mt-3 max-w-md font-display text-lg leading-snug font-medium text-white/85 sm:text-xl">
              {faqPage.banner.subheadingLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </div>
        </section>

        {faqPage.groups.map((group, groupIndex) => (
          <section
            key={group.title}
            className={`section-y ${groupIndex > 0 ? "border-t border-line" : ""} ${
              groupIndex % 2 === 1 ? "bg-surface" : ""
            }`}
          >
            <div className="container-page">
              <Reveal>
                <SectionHeading title={group.title} />
              </Reveal>

              <ul className="mt-8 space-y-3 sm:mt-10">
                {group.items.map((item, i) => (
                  <Reveal
                    as="li"
                    key={item.question}
                    delay={Math.min(i, 4) * 0.05}
                    className="overflow-hidden rounded-2xl border border-line bg-white"
                  >
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-start gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
                        <h3 className="flex-1 font-display text-lg leading-snug font-semibold">
                          {item.question}
                        </h3>
                        <PlusIcon
                          aria-hidden
                          className="mt-0.5 size-5 shrink-0 text-brand-500 transition-transform duration-300 group-open:rotate-45"
                        />
                      </summary>
                      <p className="px-5 pb-5 text-[15px] leading-relaxed text-ink-500 sm:px-6 sm:pb-6">
                        {item.answer}
                      </p>
                    </details>
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </main>

      <SiteFooter />

      <script
        type="application/ld+json"
        // Static, locally-authored object — no user input reaches this string.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
