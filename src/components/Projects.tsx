import { projects } from "@/lib/content";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

/**
 * On buildon.co.in this is a plain grey band: centred heading, one line of
 * intro, and a skin-colour "VIEW MORE" pill. No image grid.
 */
export default function Projects() {
  return (
    <section
      id="projects"
      className="section-y scroll-mt-28 bg-surface text-center"
    >
      <Reveal className="container-page">
        <SectionHeading title={projects.title} intro={projects.intro} align="center" />

        <div className="mt-8 sm:mt-10">
          <a
            href={projects.cta.href}
            className="inline-flex items-center justify-center rounded-full bg-brand-500 px-8 py-3.5 font-display font-medium tracking-wide text-white transition hover:bg-brand-600"
          >
            {projects.cta.label}
          </a>
        </div>
      </Reveal>
    </section>
  );
}
