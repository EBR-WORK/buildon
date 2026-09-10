import type { Metadata } from "next";
import PageBanner from "@/components/PageBanner";
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
 *
 * Every panel shares one `name`, so only one answer is open at a time across
 * the whole page — including across group headings.
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
        <PageBanner
          image={faqPage.banner.image}
          headingLines={[faqPage.banner.heading]}
          subheadingLines={faqPage.banner.subheadingLines}
        />

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
                    {/* A shared `name` makes these an exclusive accordion:
                        the browser closes whichever one is open when another
                        is opened, the same way same-named radios work. No
                        script, no state. A browser too old to know the
                        attribute ignores it and simply allows several open at
                        once, which is where this started. */}
                    <details name="faq" className="group">
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
