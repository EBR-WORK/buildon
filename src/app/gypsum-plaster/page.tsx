import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { PlusIcon } from "@/components/icons";
import BlogCards from "@/components/BlogCards";
import { blogPage, productCatalogue, products, site } from "@/lib/content";
import { getBlogPost } from "@/lib/blogDetails";
import { gypsumPlasterPage as page } from "@/lib/gypsumPlasterPage";

/**
 * /gypsum-plaster — the reference's overview of the material itself.
 *
 * Six blog posts link here, which is why it exists: without it those phrases
 * were dead bold text inside articles that are already live.
 *
 * Its own page repeats the nine products and a row of recent posts at the
 * bottom. Both are already in this site's data, so the variants section is
 * rendered from productCatalogue rather than transcribed a second time.
 */

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: "/gypsum-plaster" },
  openGraph: {
    type: "website",
    url: `${site.url}/gypsum-plaster/`,
    title: `${page.title} | ${site.name}`,
    description: page.description,
  },
};

export default function GypsumPlasterPage() {
  /* The three posts by the titles the reference names, looked up in the
     listing so their cards carry the same image and excerpt as everywhere
     else. */
  const latest = page.latest.slugs
    .map((slug) => getBlogPost(slug))
    .filter((post) => post !== undefined)
    .map((post) => blogPage.items.find((item) => item.title === post.title))
    .filter((item) => item !== undefined);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* No heading in the bar: the page sets its own <h1> below. */}
        <PageBanner image="/blog/banner.webp" />

        <section className="section-y">
          <div className="container-page max-w-4xl">
            <Reveal>
              <h1 className="font-display text-[clamp(1.7rem,2.4vw+0.7rem,2.4rem)] leading-[1.15] font-semibold text-ink-900">
                {page.title}
              </h1>
            </Reveal>

            {page.sections.map((section, i) => (
              <Reveal key={section.heading} delay={Math.min(i, 2) * 0.05} y={12}>
                <h2 className="mt-10 font-display text-[clamp(1.35rem,1.4vw+0.9rem,1.75rem)] leading-snug font-semibold text-ink-900 sm:mt-12">
                  {section.heading}
                </h2>

                {section.kind === "prose" &&
                  section.paragraphs.map((text) => (
                    <p
                      key={text}
                      className="mt-4 text-[15px] leading-relaxed text-ink-500 sm:text-base"
                    >
                      {text}
                    </p>
                  ))}

                {section.kind === "list" && (
                  <>
                    {section.intro && (
                      <p className="mt-4 text-[15px] leading-relaxed text-ink-500 sm:text-base">
                        {section.intro}
                      </p>
                    )}
                    <ul className="mt-4 space-y-2 text-[15px] leading-relaxed text-ink-500 sm:text-base">
                      {section.items.map((item) => (
                        <li
                          key={item}
                          className="relative pl-6 before:absolute before:top-[0.6em] before:left-0 before:size-1.5 before:rounded-full before:bg-brand-500"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {section.kind === "cards" && (
                  <ul className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-5">
                    {section.items.map((item) => (
                      <li
                        key={item.title}
                        className="rounded-2xl border border-line bg-white p-5 sm:p-6"
                      >
                        <h3 className="font-display text-lg leading-snug font-semibold text-ink-900">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{item.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Reveal>
            ))}
          </div>
        </section>

        {/* "Send Us Message" sits here on the reference — between the
            applications and the comparison — not at the foot of the page. */}
        <ContactForm />

        {/* Comparison table */}
        <section className="section-y border-t border-line bg-surface">
          <div className="container-page max-w-4xl">
            <Reveal>
              {/* The reference makes this heading a link to the article on the
                  same subject, so it is one here too. */}
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold">
                  <Link
                    href={page.comparison.href}
                    className="text-brand-500 underline underline-offset-4 transition hover:text-brand-600"
                  >
                    {page.comparison.heading}
                  </Link>
                </h2>
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              {/* Scrolls sideways on a phone rather than squeezing three
                  columns into 320px. */}
              <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-white sm:mt-10">
                <table className="w-full min-w-[34rem] border-collapse text-left">
                  <thead>
                    <tr className="bg-brand-500 text-white">
                      {page.comparison.columns.map((column) => (
                        <th
                          key={column}
                          scope="col"
                          className="px-5 py-4 font-display text-[15px] font-semibold sm:px-6"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {page.comparison.rows.map((row) => (
                      <tr key={row[0]} className="border-t border-line even:bg-surface">
                        <th
                          scope="row"
                          className="px-5 py-3.5 text-[15px] font-semibold text-ink-900 sm:px-6"
                        >
                          {row[0]}
                        </th>
                        {row.slice(1).map((cell, i) => (
                          <td
                            key={cell + i}
                            className="px-5 py-3.5 text-[15px] text-ink-500 sm:px-6"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Product variants — from the catalogue, not a second copy of it */}
        <section className="section-y">
          <div className="container-page">
            <Reveal>
              <SectionHeading
                title={page.variants.heading}
                intro={page.variants.intro}
                align="center"
              />
            </Reveal>

            <ul className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {productCatalogue.map((product, i) => (
                <Reveal as="li" key={product.slug} delay={Math.min(i % 3, 2) * 0.06} className="flex">
                  <Link
                    href={product.href}
                    className="group flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <div className="relative aspect-4/3 overflow-hidden bg-white">
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 24rem, (min-width: 640px) 45vw, 92vw"
                        loading="lazy"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <h3 className="text-xl leading-snug font-semibold transition-colors group-hover:text-brand-500">
                        {product.name}
                      </h3>
                      <p className="mt-2 flex-1 text-[15px] leading-relaxed text-ink-500 sm:mt-2.5">
                        {product.body}
                      </p>
                      {/* Display only: the card itself is the link, so this
                          adds no second tab stop and screen readers hear the
                          product's name rather than "Read More". Same as the
                          /products grid. */}
                      <span
                        aria-hidden
                        className="mt-4 inline-flex items-center self-start text-sm font-semibold text-brand-500 transition group-hover:text-brand-600 sm:mt-5"
                      >
                        {products.readMore}
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* How to apply */}
        <section className="section-y border-t border-line bg-surface">
          <div className="container-page max-w-4xl">
            <Reveal>
              <SectionHeading title={page.steps.heading} align="center" />
            </Reveal>

            <ol className="mt-8 space-y-4 sm:mt-10">
              {page.steps.items.map((step, i) => (
                <Reveal as="li" key={step.title} delay={Math.min(i, 3) * 0.06}>
                  <div className="rounded-2xl border border-line bg-white p-6 sm:p-7">
                    <h3 className="font-display text-lg leading-snug font-semibold text-ink-900 sm:text-xl">
                      {step.title}
                    </h3>
                    <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-ink-500">
                      {step.points.map((point) => (
                        <li
                          key={point}
                          className="relative pl-6 before:absolute before:top-[0.6em] before:left-0 before:size-1.5 before:rounded-full before:bg-brand-500"
                        >
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Why Buildon */}
        <section className="section-y">
          <div className="container-page max-w-4xl">
            <Reveal>
              <SectionHeading title={page.why.heading} intro={page.why.intro} align="center" />
            </Reveal>

            <ul className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5">
              {page.why.items.map((item, i) => (
                <Reveal as="li" key={item.title} delay={Math.min(i, 3) * 0.05}>
                  <div className="h-full rounded-2xl border border-line border-l-4 border-l-brand-500 bg-white p-6">
                    <h3 className="font-display text-lg leading-snug font-semibold text-ink-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{item.body}</p>
                  </div>
                </Reveal>
              ))}
            </ul>

            <Reveal delay={0.1}>
              <p className="mt-8 text-center text-[15px] leading-relaxed text-ink-500 sm:text-base">
                {page.why.outro}
              </p>
            </Reveal>
          </div>
        </section>

        {/* FAQs — the same script-free accordion /faq uses */}
        <section className="section-y border-t border-line bg-surface">
          <div className="container-page max-w-4xl">
            <Reveal>
              <SectionHeading title={page.faqs.heading} align="center" />
            </Reveal>

            <ul className="mt-8 space-y-3 sm:mt-10">
              {page.faqs.items.map((item, i) => (
                <Reveal
                  as="li"
                  key={item.question}
                  delay={Math.min(i, 4) * 0.05}
                  className="overflow-hidden rounded-2xl border border-line bg-white"
                >
                  <details name="gypsum-faq" className="faq-panel group">
                    <summary className="flex cursor-pointer list-none items-start gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
                      <h3 className="flex-1 font-display text-lg leading-snug font-semibold">
                        {item.question}
                      </h3>
                      <PlusIcon
                        aria-hidden
                        className="mt-0.5 size-5 shrink-0 text-brand-500 transition duration-300 group-hover:text-accent-500 group-open:rotate-45"
                      />
                    </summary>
                    <p className="faq-answer px-5 pb-5 text-[15px] leading-relaxed text-ink-500 sm:px-6 sm:pb-6">
                      {item.answer}
                    </p>
                  </details>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="section-y border-t border-line">
          <div className="container-page">
            <Reveal>
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold text-ink-900">
                  {page.cta.heading}
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-500 sm:text-base">
                  {page.cta.body}
                </p>
                <Link
                  href={page.cta.href}
                  className="mt-7 inline-flex items-center rounded-full bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {page.cta.label}
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Our Latest Updates — the three posts the reference closes with,
            rendered from the blog listing rather than a second copy of it. */}
        <section className="section-y border-t border-line bg-surface">
          <div className="container-page">
            <Reveal>
              <SectionHeading title={page.latest.heading} align="center" />
            </Reveal>

            <div className="mt-8 sm:mt-10">
              <BlogCards items={latest} />
            </div>
          </div>
        </section>
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
