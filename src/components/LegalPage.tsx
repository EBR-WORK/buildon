import PageBanner from "./PageBanner";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import type { LegalPageContent } from "@/lib/content";

/**
 * The shared body of /privacy-policy and /user-agreement: the title bar, then
 * the text across the full page container. The reference sets both as plain
 * stacked paragraphs under the page title; sections with a heading get one here
 * so the real policy text, once it lands, has somewhere to put its structure.
 */
export default function LegalPage({ content }: { content: LegalPageContent }) {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageBanner image={content.banner.image} headingLines={content.banner.headingLines} />

        <section className="section-y">
          <Reveal className="container-page">
            <div>
              <SectionHeading title={content.title} />

              <div className="mt-8 space-y-10 sm:mt-10">
                {content.sections.map((section, i) => (
                  <div key={section.heading ?? i}>
                    {section.heading && (
                      <h3 className="mb-4 font-display text-xl leading-snug font-semibold">
                        {section.heading}
                      </h3>
                    )}
                    <div className="space-y-5">
                      {section.paragraphs.map((paragraph, j) => (
                        <p key={j} className="text-base leading-relaxed text-ink-500">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
