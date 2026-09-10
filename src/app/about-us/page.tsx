import type { Metadata } from "next";
import Image from "next/image";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { CheckIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/icons";
import { aboutPage, site } from "@/lib/content";

export const metadata: Metadata = {
  title: aboutPage.title,
  description: aboutPage.overview.body.slice(0, 155),
  alternates: { canonical: "/about-us" },
  openGraph: {
    type: "website",
    url: `${site.url}/about-us/`,
    title: `${aboutPage.title} | ${site.name}`,
    description: aboutPage.overview.body.slice(0, 155),
  },
};

const branchDetails = [
  {
    icon: PinIcon,
    label: aboutPage.branches.addressLabel,
    value: aboutPage.branches.address,
    href: site.mapsUrl,
  },
  {
    icon: MailIcon,
    label: aboutPage.branches.emailLabel,
    value: site.email,
    href: `mailto:${site.email}`,
  },
  {
    icon: PhoneIcon,
    label: aboutPage.branches.phoneLabel,
    value: aboutPage.branches.phone,
    href: site.primaryPhoneHref,
  },
];

/**
 * Layout follows buildon.co.in/about-us/ row for row: 6/6 overview, a 5/7 split
 * for the bird's-eye view, a white 6/6 card for manufacturing, a full-width
 * "Who We Serve", mission and vision side by side over the pale interior
 * artwork, then branches as 1/3 details beside 2/3 of locations.
 *
 * The photographs are real <img> elements here rather than the reference's CSS
 * backgrounds, so they carry alt text, lazy-load and ship responsive sources.
 */
export default function AboutUsPage() {
  const branches = aboutPage.branches.branches.split("|").map((b) => b.trim());

  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* Title bar — the reference sets this artwork on .tm-titlebar-wrapper */}
        <PageBanner
          image={aboutPage.banner.image}
          headingLines={aboutPage.banner.headingLines}
        />

        {/* Company Overview | team photograph */}
        <section className="section-y">
          <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            {/* The blue frame is drawn into the artwork, so it must not be cropped */}
            <Reveal className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none">
              <Image
                src={aboutPage.overview.image}
                alt={aboutPage.overview.imageAlt}
                fill
                sizes="(min-width: 1024px) 34rem, 92vw"
                className="object-contain"
              />
            </Reveal>

            <Reveal>
              <SectionHeading title={aboutPage.overview.title} />
              <p className="mt-5 text-base leading-relaxed text-ink-500">
                {aboutPage.overview.body}
              </p>

              <h2 className="mt-8 font-display text-xl font-semibold sm:text-2xl">
                {aboutPage.whyChoose.title}
              </h2>
              {/* The reference nests two col-sm-6 lists, so the items read down the
                  first column and then down the second. A plain two-column grid
                  fills across rows instead, which reorders them. */}
              <ul className="mt-4 grid gap-3 sm:grid-flow-col sm:grid-rows-3 sm:auto-cols-fr sm:gap-x-8">
                {aboutPage.whyChoose.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[15px] text-ink-700">
                    <CheckIcon className="mt-1 size-4 shrink-0 text-brand-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

          </div>
        </section>

        {/* Gypsumizing India — 5/7 with the photograph leading */}
        <section className="section-y border-t border-line bg-surface">
          <div className="container-page grid items-center gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <Reveal className="relative order-2 aspect-3/2 w-full overflow-hidden rounded-2xl lg:order-1">
              <Image
                src={aboutPage.birdsEye.image}
                alt={aboutPage.birdsEye.imageAlt}
                fill
                sizes="(min-width: 1024px) 30rem, 92vw"
                loading="lazy"
                className="object-cover"
              />
            </Reveal>

            <Reveal className="order-1 lg:order-2">
              <SectionHeading title={aboutPage.birdsEye.titleLines} />
              <p className="mt-5 text-base leading-relaxed text-ink-500">
                {aboutPage.birdsEye.body}
              </p>
            </Reveal>
          </div>
        </section>

        {/*
          The reference floats this as a white card (margin 100px, padding 30px)
          and puts BOTH "Our Manufacturing Excellence" and "Who We Serve" in its
          right-hand col-sm-6, beside a photograph that fills the left column
          top to bottom.
        */}
        <div className="container-page my-16 sm:my-20 lg:my-[100px]">
          <Reveal className="bg-white p-5 shadow-lift sm:p-[30px]">
            {/* The split waits for lg. At md the two columns are only ~350px
                each, which left the photo a slot and the body text a gutter —
                so tablets stack, photo full width above the copy. */}
            <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-0">
              {/*
                The box carries the source's own 540x668 ratio, so object-cover
                has nothing to crop and no letterbox appears at any width.

                It matters because this photograph is tall. A 4:3 band showed
                61% of it on a tablet, and letting it stretch to the copy's
                height at lg showed 70% — the copy is long, so that column runs
                far taller than the picture. Its edges are too varied for a flat
                letterbox colour to hide the difference, which rules out
                object-contain.

                Capped and centred when stacked: full-bleed at this ratio would
                be ~860px tall on a tablet, more than a screenful. At lg
                self-center opts out of the row's stretch so it keeps its shape
                beside the taller text.
              */}
              <div className="relative mx-auto aspect-[540/668] w-full max-w-[24rem] lg:max-w-none lg:self-center">
                <Image
                  src={aboutPage.manufacturing.image}
                  alt={aboutPage.manufacturing.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 30rem, 24rem"
                  loading="lazy"
                  className="object-cover object-center"
                />
              </div>

              <div className="flex flex-col justify-center lg:pr-[25px] lg:pl-[60px]">
                <SectionHeading title={aboutPage.manufacturing.title} />
                <p className="mt-5 text-base leading-relaxed text-ink-500">
                  {aboutPage.manufacturing.body}
                </p>

                <div className="mt-10">
                  <SectionHeading title={aboutPage.serve.title} />
                  <p className="mt-5 text-base leading-relaxed text-ink-500">
                    {aboutPage.serve.body}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/*
          Mission and Vision sit in a framed panel over the pale interior
          artwork: the reference nests a shadowed white column (tm-colum-shadow-
          box) around an inner white row padded 40px, with col-sm-1 spacers
          either side of the two icon/text pairs.
        */}
        <section className="relative isolate overflow-hidden bg-surface">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[url('/about/banner-about.png')] bg-cover bg-center"
          />
          <div className="container-page section-y">
            <Reveal className="bg-line/60 p-4 shadow-lift sm:p-5">
              <div className="grid gap-10 bg-white px-5 py-10 sm:px-10 sm:py-12 lg:grid-cols-2 lg:gap-14 lg:px-[8%]">
                {aboutPage.missionVision.map((item) => (
                  <div key={item.title} className="flex gap-5 sm:gap-6">
                    <Image
                      src={item.icon}
                      alt=""
                      width={69}
                      height={69}
                      loading="lazy"
                      className="size-12 shrink-0 sm:size-16"
                    />
                    <div className="min-w-0">
                      <h2 className="font-display text-2xl font-semibold">{item.title}</h2>
                      <p className="mt-3 text-base leading-relaxed text-ink-500">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Branches — 1/3 of contact details beside 2/3 of locations */}
        <section className="section-y border-t border-line">
          <div className="container-page grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <Reveal>
              <SectionHeading title={aboutPage.branches.title} />

              <ul className="mt-8 space-y-5">
                {branchDetails.map((detail) => (
                  <li key={detail.label} className="flex gap-3.5 sm:gap-4">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                      <detail.icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg leading-snug font-semibold">
                        {detail.label}
                      </h3>
                      <a
                        href={detail.href}
                        className="mt-1 block leading-[25px] text-ink-500 transition hover:text-brand-500"
                      >
                        {detail.value}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* The reference runs these as one pipe-separated line; a list of
                chips carries the same names and is far easier to scan. */}
            <Reveal delay={0.08}>
              <h2 className="font-display text-2xl font-semibold">
                {aboutPage.branches.branchesLabel}
              </h2>
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
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
