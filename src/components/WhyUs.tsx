import { whyUs } from "@/lib/content";
import { featureIcons } from "./icons";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

/**
 * `city` swaps the second heading line, which is the only thing the reference's
 * city landing pages change here: "The leader of Gypsum plaster in Bhubaneswar"
 * in place of the national line. Everything else on those pages is this
 * section verbatim.
 */
export default function WhyUs({ city }: { city?: string } = {}) {
  const titleLines = city
    ? [whyUs.titleLines[0], `The leader of Gypsum plaster in ${city}`]
    : whyUs.titleLines;


  return (
    <section id="why-us" className="section-y scroll-mt-28">
      <div className="container-page">
        <Reveal>
          <SectionHeading title={titleLines} intro={whyUs.intro} />
        </Reveal>

        <ul className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:mt-14 lg:grid-cols-4">
          {whyUs.items.map((item, i) => {
            const Icon = featureIcons[item.icon];
            return (
              <Reveal
                as="li"
                key={item.title}
                delay={i * 0.08}
                className="group relative rounded-2xl border border-line bg-white p-6 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-card sm:p-7"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 transition group-hover:bg-brand-500 group-hover:text-white sm:size-12">
                  <Icon className="size-5 sm:size-6" />
                </span>
                <h3 className="mt-4 text-xl leading-snug font-semibold sm:mt-5 sm:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-500 sm:mt-2.5">
                  {item.body}
                </p>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
