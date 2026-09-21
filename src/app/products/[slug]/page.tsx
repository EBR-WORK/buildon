import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import EnquiryForm from "@/components/EnquiryForm";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { contact, productCatalogue, site } from "@/lib/content";
import {
  getProductDetail,
  productDetails,
  type ProductSection,
} from "@/lib/productDetails";

/**
 * /products/<slug> — one template for all nine products.
 *
 * The reference builds each of these as a separate Elementor page, and they do
 * not carry the same blocks: only four document an application process, three
 * list tools, and the two Bondit pages have usage sections the plasters lack.
 * So the body is driven by the typed `sections` array in productDetails.ts and
 * rendered by `renderSection` below — a product needs no code change, only
 * content, which is also what makes this template portable to the CMS.
 *
 * Order follows the reference exactly: banner, product summary, the first
 * block, the enquiry form, the remaining blocks, specifications, application
 * process, more products.
 */

export function generateStaticParams() {
  return productDetails.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductDetail(slug);
  if (!product) return {};

  const description = product.intro.slice(0, 155);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      url: `${site.url}/products/${product.slug}/`,
      title: `${product.name} | ${site.name}`,
      description,
      images: product.hero ? [`${site.url}${product.hero}`] : undefined,
    },
  };
}

/**
 * "More Products" is a hand-picked list on the reference, not a derived one —
 * most pages show the two Bondits and P-20 whatever the product, the Bondit
 * pages included (their own card among them). That choice is carried in
 * `related`; where a page names fewer than three, the catalogue tops the row
 * up in order.
 */
function otherProducts(slug: string, related: readonly string[]) {
  const picked = related
    .map((other) => productCatalogue.find((product) => product.slug === other))
    .filter((product) => product !== undefined);

  const index = productCatalogue.findIndex((product) => product.slug === slug);
  for (let step = 1; picked.length < 3; step += 1) {
    const candidate = productCatalogue[(index + step) % productCatalogue.length];
    if (candidate.slug !== slug && !picked.includes(candidate)) picked.push(candidate);
  }

  return picked.slice(0, 3);
}

/** A block that is a single note — Health & Safety, Storage, Precautions. */
function isNote(section: ProductSection) {
  return (
    (section.kind === "icon_text" || section.kind === "icon_grid") && section.items.length === 1
  );
}

type Run =
  | { readonly kind: "block"; readonly section: ProductSection }
  | { readonly kind: "notes"; readonly sections: readonly ProductSection[] };

/**
 * Adjacent single notes are gathered into one run. On the reference each is a
 * full-width section holding two lines of text, which reads as mostly empty
 * page; side by side as cards they read as what they are — the practical
 * small print next to each other.
 */
function groupNotes(sections: readonly ProductSection[]): Run[] {
  const runs: Run[] = [];
  for (const section of sections) {
    const last = runs.at(-1);
    if (isNote(section) && last?.kind === "notes") {
      runs[runs.length - 1] = { kind: "notes", sections: [...last.sections, section] };
    } else if (isNote(section)) {
      runs.push({ kind: "notes", sections: [section] });
    } else {
      runs.push({ kind: "block", section });
    }
  }
  return runs;
}

/** The reference centres every block heading except the two at the end. */
function headingAlign(section: ProductSection) {
  return section.kind === "steps" || section.kind === "rich_text" ? "left" : "center";
}

function renderSection(section: ProductSection) {
  switch (section.kind) {
    // Photographs of the surfaces the plaster goes on, captioned underneath.
    case "applied_on":
      return (
        <ul className="mt-8 grid grid-cols-2 gap-5 sm:mt-10 sm:grid-cols-3 sm:gap-8 lg:mx-auto lg:max-w-4xl">
          {section.items.map((item, i) => (
            <Reveal as="li" key={item.text} delay={Math.min(i, 2) * 0.08} className="text-center">
              {item.icon && (
                <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-surface">
                  <Image
                    src={item.icon}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 18rem, 45vw"
                    loading="lazy"
                    className="object-cover"
                  />
                </div>
              )}
              <h3 className="mt-3 font-display text-[15px] leading-snug font-semibold sm:text-base">
                {item.text}
              </h3>
            </Reveal>
          ))}
        </ul>
      );

    // Separate rows washed over the room photograph, stacked on the left —
    // the reference's own arrangement, its green swapped for our blue.
    case "features":
      return (
        <Reveal className="mt-8 sm:mt-10 lg:max-w-xl">
          <ul className="space-y-1.5">
            {section.items.map((item) => (
              <li
                key={item.text}
                /* brand-600 at 85%: the room shows through, and white type measures
                   ~5.9:1 against it even over the bright window behind. */
                className="flex items-center gap-4 rounded-sm bg-brand-600/85 px-4 py-3 backdrop-blur-[1px] sm:px-5"
              >
                {item.icon && (
                  <Image
                    src={item.icon}
                    alt=""
                    width={40}
                    height={40}
                    loading="lazy"
                    /* Dark line art drawn for a light panel; inverted to sit on the wash. */
                    className="size-8 shrink-0 object-contain brightness-0 invert"
                  />
                )}
                <span className="font-display text-[15px] leading-snug font-medium text-white sm:text-base">
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      );

    // Icon above a short label, in a row of cards — Advantages, Benefits.
    case "icon_cards":
      return (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:mt-10 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {section.items.map((item, i) => (
            <Reveal
              as="li"
              key={item.text}
              delay={Math.min(i % 4, 3) * 0.06}
              className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white p-5 text-center transition hover:border-brand-200 hover:shadow-card sm:p-6"
            >
              {item.icon && (
                <Image
                  src={item.icon}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                  className="size-12 object-contain sm:size-14"
                />
              )}
              <h3 className="font-display text-[15px] leading-snug font-semibold sm:text-base">
                {item.text}
              </h3>
            </Reveal>
          ))}
        </ul>
      );

    // Icon above a full sentence, four across — Application of Gypsum,
    // Direction For Use.
    case "icon_text":
      // A lone item (P-20's Health & Safety and Storage, the Bondits'
      // Precautions) is a note, not a set: the reference sets it as an icon over
      // a paragraph, uncarded, rather than one card stranded in a grid.
      if (section.items.length === 1) {
        const [item] = section.items;
        return (
          <Reveal className="mt-8 max-w-xl sm:mt-10">
            {item.icon && (
              <Image
                src={item.icon}
                alt=""
                width={64}
                height={64}
                loading="lazy"
                className="size-12 object-contain sm:size-14"
              />
            )}
            <p className="mt-4 text-[15px] leading-relaxed text-ink-500 sm:text-base">{item.text}</p>
          </Reveal>
        );
      }
      return (
        <ul className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {section.items.map((item, i) => (
            <Reveal
              as="li"
              key={item.text}
              delay={Math.min(i % 4, 3) * 0.06}
              className="rounded-2xl border border-line bg-white p-5 sm:p-6"
            >
              {item.icon && (
                <Image
                  src={item.icon}
                  alt=""
                  width={56}
                  height={56}
                  loading="lazy"
                  className="size-11 object-contain sm:size-12"
                />
              )}
              <p className="mt-4 text-[15px] leading-relaxed text-ink-500">{item.text}</p>
            </Reveal>
          ))}
        </ul>
      );

    // Procedural steps — Direction For Use and the Bondit blocks — as cards,
    // three across: one step to a card, read left to right.
    case "icon_grid":
      return (
        <ul className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {section.items.map((item, i) => (
            <Reveal
              as="li"
              key={item.text}
              delay={Math.min(i % 3, 2) * 0.05}
              className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"
            >
              {item.icon && (
                <Image
                  src={item.icon}
                  alt=""
                  width={56}
                  height={56}
                  loading="lazy"
                  className="size-11 object-contain sm:size-12"
                />
              )}
              <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{item.text}</p>
            </Reveal>
          ))}
        </ul>
      );

    // The reference runs these as a carousel on a coloured band; a wrapping
    // grid shows all seven at once and needs no script.
    case "tools":
      return (
        <Reveal className="mt-8 sm:mt-10">
          <ul className="grid grid-cols-2 gap-8 py-14 sm:grid-cols-4 sm:py-16 lg:grid-cols-7">
            {section.items.map((item) => (
              <li key={item.text} className="flex flex-col items-center gap-4 text-center">
                <span className="font-display text-sm leading-snug font-semibold text-white">
                  {item.text}
                </span>
                {item.icon && (
                  <Image
                    src={item.icon}
                    alt=""
                    width={72}
                    height={72}
                    loading="lazy"
                    className="size-14 object-contain brightness-0 invert sm:size-16"
                  />
                )}
              </li>
            ))}
          </ul>
        </Reveal>
      );

    // Application Process: six landscape tiles in a row, caption centred
    // underneath, as the reference lays them out.
    case "steps":
      return (
        <ol className="mt-8 grid grid-cols-2 gap-x-5 gap-y-7 sm:mt-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-6">
          {section.items.map((item, i) => (
            <Reveal
              as="li"
              key={item.text}
              delay={Math.min(i % 6, 5) * 0.05}
              className="flex flex-col items-center text-center"
            >
              {/* Held at the reference's ~142x108 box rather than stretched to
                  the column, with its black outline — here rounded. */}
              {item.icon && (
                <div className="relative aspect-4/3 w-full max-w-[9rem] rounded-xl border border-ink-900 bg-white">
                  <Image
                    src={item.icon}
                    alt=""
                    fill
                    sizes="9rem"
                    loading="lazy"
                    className="object-contain p-3.5"
                  />
                </div>
              )}
              <p className="mt-3 max-w-[10rem] text-sm leading-snug font-medium text-ink-900">
                {item.text}
              </p>
            </Reveal>
          ))}
        </ol>
      );

    // Plain prose — Precautions, Health & Safety, Storage, usage notes.
    case "rich_text":
      return (
        <div className="mt-6 max-w-3xl space-y-4 sm:mt-8">
          {section.items.map((item) => (
            <p key={item.text} className="text-[15px] leading-relaxed text-ink-500">
              {item.text}
            </p>
          ))}
        </div>
      );
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductDetail(slug);
  if (!product) notFound();

  const related = otherProducts(product.slug, product.related);
  // The reference puts the specification table before the application process
  // and the enquiry form directly after the first block.
  const steps = product.sections.filter((section) => section.kind === "steps");
  const blocks = product.sections.filter((section) => section.kind !== "steps");

  /**
   * The tools and features blocks sit on a photograph under a colour wash on
   * the reference — green there, our brand blue here. The heading stays above
   * the artwork, as it does on the reference, so only the block itself is laid
   * over the picture.
   */
  const renderBlock = (section: ProductSection, i: number) => {
    const heading = (
      <Reveal>
        <SectionHeading
          title={section.heading}
          intro={section.intro ?? undefined}
          align={headingAlign(section)}
        />
      </Reveal>
    );

    if (section.background) {
      return (
        <section key={section.heading} className="section-y border-t border-line">
          <div className="container-page">{heading}</div>

          <div className="relative isolate mt-8 overflow-hidden sm:mt-10">
            <Image
              src={section.background}
              alt=""
              fill
              sizes="100vw"
              loading="lazy"
              className="-z-20 object-cover"
            />
            {/* Tools washes the whole band, as the reference does; features
                leaves the room photograph alone and colours only its rows. */}
            {section.kind === "tools" && (
              /* A duotone, which is what the reference's band actually is: the
                 `color` blend keeps the room's own light and shade and takes
                 only the hue from our blue, so the furniture stays readable
                 rather than being flattened under a wash. The second layer is
                 the small amount of darkening white labels need on top. */
              <>
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 bg-brand-500 mix-blend-color"
                />
                <div aria-hidden className="absolute inset-0 -z-10 bg-secondary/15" />
              </>
            )}
            {/* Features sits its rows on the photograph with room above and
                below; the tools band carries its own padding in its list. */}
            <div
              className={`container-page ${section.kind === "features" ? "pb-10 sm:pb-14" : ""}`}
            >
              {renderSection(section)}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section
        key={section.heading}
        className={`section-y border-t border-line ${i % 2 === 1 ? "bg-surface" : ""}`}
      >
        <div className="container-page">
          {heading}
          {renderSection(section)}
        </div>
      </section>
    );
  };

  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* The reference gives every product its own titlebar artwork, built
            like the other inner pages: a colour panel carrying the heading with
            a photograph beside it. Same component, so the heights, the mobile
            wash and the type scale all match the rest of the site. */}
        <PageBanner
          image={product.banner}
          eyebrow={product.eyebrow}
          headingLines={[product.title]}
          scrim={product.bannerScrim}
        />

        {/* Product summary: the shot beside the intro, approvals and catalogue */}
        <section className="section-y">
          <div className="container-page">
            {/* The reference gives the photograph a third of the row and the
                copy two thirds, tops aligned — the picture supports the text
                rather than competing with it. */}
            <div className="grid items-start gap-8 md:grid-cols-[1fr_2fr] lg:gap-10">
              <Reveal className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden md:max-w-none">
                {product.hero && (
                  <Image
                    src={product.hero}
                    /* Not always packaging: several heroes are room photographs. */
                    alt={product.name}
                    fill
                    sizes="(min-width: 1280px) 24rem, (min-width: 768px) 32vw, 92vw"
                    priority
                    className="object-cover"
                  />
                )}
              </Reveal>

              <Reveal delay={0.08}>
                <h2 className="sr-only">{product.name}</h2>
                <p className="text-base leading-relaxed text-ink-500">{product.intro}</p>

                {product.approvals.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-display text-lg leading-snug font-semibold">Approved by</h3>
                    {/* Spread evenly across the column with a rule between
                        each, as the reference sets them — large enough that
                        the marks themselves are legible. */}
                    {/* Four products show three marks; the other five show a
                        single IGBC mark, which keeps the same height and sits
                        at the start of the row rather than stretching. */}
                    <ul className="mt-5 flex items-center divide-x divide-ink-900/60">
                      {product.approvals.map((approval) => (
                        <li
                          key={approval}
                          className={
                            product.approvals.length > 1
                              ? "flex flex-1 justify-center px-3 sm:px-6"
                              : "flex"
                          }
                        >
                          <Image
                            src={approval}
                            alt=""
                            width={200}
                            height={140}
                            className="h-16 w-auto max-w-full object-contain sm:h-24 lg:h-28"
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Reveal>
            </div>

            {/* The reference centres this button under the whole row */}
            {product.catalogue && (
              <Reveal className="mt-10 text-center sm:mt-12">
                <a
                  href={product.catalogue.href}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex cursor-pointer items-center justify-center rounded-md bg-brand-500 px-8 py-3.5 font-display text-sm font-medium tracking-wide text-white uppercase transition hover:bg-brand-600 sm:text-[15px]"
                >
                  {product.catalogue.label}
                </a>
              </Reveal>
            )}
          </div>
        </section>

        {/* First block, then the enquiry form, as the reference orders them */}
        {blocks.slice(0, 1).map(renderBlock)}

{/* Three pages carry no form on the reference (Master, Vermiculite,
            Bondit-151); the site-wide Get a Quote tab still offers one there. */}
        {product.hasEnquiry && (
                  <section id="enquiry" className="section-y scroll-mt-28 border-t border-line bg-surface">
            <div className="container-page">
              <Reveal className="overflow-hidden rounded-2xl bg-white shadow-card">
                <div className="grid lg:grid-cols-2">
                  <div className="p-6 sm:p-8 lg:p-10">
                    <h2 className="font-display text-2xl leading-snug font-semibold">
                      {contact.formTitle}
                    </h2>
                    <EnquiryForm idPrefix={`${product.slug}-`} className="mt-6" />
                  </div>
  
                  <div className="relative order-first min-h-[16rem] lg:order-last lg:min-h-0">
                    <Image
                      src="/projects/plastering.webp"
                      alt="A plasterer smoothing a ceiling with a trowel"
                      fill
                      sizes="(min-width: 1024px) 34rem, 100vw"
                      loading="lazy"
                      className="object-cover"
                    />
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* The rest of the product's blocks, with adjacent notes grouped */}
        {groupNotes(blocks.slice(1)).map((run, i) =>
          run.kind === "block" ? (
            renderBlock(run.section, i + 1)
          ) : (
            <section
              key={run.sections.map((section) => section.heading).join("|")}
              /* Lighter than section-y: one row of cards does not need a
                 full section's worth of air around it. */
              className="border-t border-line bg-surface py-12 sm:py-16"
            >
              <div className="container-page">
                <h2 className="sr-only">
                  {run.sections.map((section) => section.heading).join(" and ")}
                </h2>
                <ul
                  className={`grid gap-5 sm:gap-6 ${
                    run.sections.length > 1 ? "md:grid-cols-2" : "lg:max-w-3xl"
                  }`}
                >
                  {run.sections.map((section, j) => {
                    const [item] = section.items;
                    return (
                      <Reveal
                        as="li"
                        key={section.heading}
                        delay={j * 0.08}
                        className="flex gap-5 rounded-2xl border border-line border-l-4 border-l-brand-500 bg-white p-6 shadow-card sm:p-8"
                      >
                        {item.icon && (
                          <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-brand-50 sm:size-16">
                            <Image
                              src={item.icon}
                              alt=""
                              width={48}
                              height={48}
                              loading="lazy"
                              className="size-8 object-contain sm:size-9"
                            />
                          </span>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-display text-xl leading-snug font-semibold">
                            {section.heading}
                          </h3>
                          <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
                            {item.text}
                          </p>
                        </div>
                      </Reveal>
                    );
                  })}
                </ul>
              </div>
            </section>
          ),
        )}

        {/* Technical specifications beside the pack shot */}
        {product.specs.length > 0 && (
          <section className="section-y border-t border-line">
            <div className="container-page">
              <Reveal>
                <SectionHeading title="Technical Specifications" />
              </Reveal>

              <div className="mt-8 grid gap-10 sm:mt-10 lg:grid-cols-[3fr_2fr] lg:gap-14">
                <Reveal>
                  <dl className="overflow-hidden rounded-2xl border border-line bg-white">
                    {product.specs.map((spec, i) => (
                      <div
                        key={spec.label}
                        className={`grid gap-1 px-5 py-4 sm:grid-cols-2 sm:gap-4 sm:px-6 ${
                          i > 0 ? "border-t border-line" : ""
                        }`}
                      >
                        <dt className="font-display text-[15px] leading-snug font-semibold">
                          {spec.label}
                        </dt>
                        <dd className="text-[15px] leading-relaxed text-ink-500">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>

                {product.pack && (
                  <Reveal delay={0.08} className="relative min-h-[18rem] lg:min-h-0">
                    <Image
                      src={product.pack}
                      alt={`${product.name} packaging`}
                      fill
                      sizes="(min-width: 1024px) 24rem, 92vw"
                      loading="lazy"
                      className="object-contain"
                    />
                  </Reveal>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Application Process sits after the specifications on the reference */}
        {/* The reference sets this block on a mid grey (#ededed), darker than
            the site's usual pale surface, so the white tiles stand out. */}
        {steps.map((section) => (
          <section key={section.heading} className="section-y border-t border-line bg-[#ededed]">
            <div className="container-page">
              <Reveal>
                <SectionHeading title={section.heading} />
              </Reveal>
              {renderSection(section)}
            </div>
          </section>
        ))}

        {/* More Products */}
        <section className="section-y border-t border-line">
          <div className="container-page">
            <Reveal>
              <SectionHeading
                title="More Products"
                intro="Explore products that will meet your needs,"
                align="center"
              />
            </Reveal>

            <ul className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {related.map((item, i) => (
                <Reveal as="li" key={item.slug} delay={Math.min(i, 2) * 0.08} className="flex">
                  {/* The whole card is the link — no separate Read More button,
                      so the target is the full card and screen readers hear one
                      link named after the product instead of "Read More" three
                      times over. */}
                  <Link
                    href={item.href}
                    aria-current={item.slug === product.slug ? "page" : undefined}
                    className="group flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <div className="relative aspect-[720/544] overflow-hidden bg-surface">
                      <Image
                        /* The reference's own card crop where it has one. */
                        src={getProductDetail(item.slug)?.cardImage ?? item.image}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 24rem, (min-width: 640px) 45vw, 92vw"
                        loading="lazy"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5 sm:p-7">
                      <h3 className="text-xl leading-snug font-semibold transition-colors group-hover:text-brand-500">
                        {item.name}
                      </h3>
                      <p className="mt-2.5 text-[15px] leading-relaxed text-ink-500">{item.body}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
