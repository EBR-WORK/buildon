import { projects } from "@/lib/content";
import CtaLink from "./CtaLink";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

/**
 * The grey band from buildon.co.in: centred heading, one line of intro, and the
 * skin-colour "VIEW MORE" pill beneath. No image grid.
 *
 * The reference row puts ~50px above the heading and 100px below the button;
 * the padding here is those values on the spacing scale.
 */
export default function Projects() {
  return (
    <section
      id="projects"
      className="scroll-mt-28 bg-surface pt-14 pb-20 text-center sm:pt-16 sm:pb-24"
    >
      <Reveal className="container-page">
        <SectionHeading title={projects.title} intro={projects.intro} align="center" />
        <CtaLink
          href={projects.cta.href}
          className="mt-8 inline-flex cursor-pointer items-center justify-center rounded-full bg-brand-500 px-8 py-3.5 font-display font-medium tracking-wide text-white transition hover:bg-brand-600"
        >
          {projects.cta.label}
        </CtaLink>
      </Reveal>
    </section>
  );
}
