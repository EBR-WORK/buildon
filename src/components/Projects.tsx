import { projects } from "@/lib/content";
import Reveal from "./Reveal";

/**
 * A plain grey band holding the skin-colour "VIEW MORE" pill. No image grid.
 *
 * Deliberately not `section-y`. That padding is sized for a heading and a body
 * of content; around a lone button it left up to 112px above and below, on top
 * of the logo section's own bottom padding.
 */
export default function Projects() {
  return (
    <section
      id="projects"
      className="scroll-mt-28 bg-surface py-10 text-center sm:py-12 lg:py-14"
    >
      <Reveal className="container-page">
        <button
          suppressHydrationWarning
          type="button"
          className="inline-flex cursor-pointer items-center justify-center rounded-full bg-brand-500 px-8 py-3.5 font-display font-medium tracking-wide text-white transition hover:bg-brand-600"
        >
          {projects.cta.label}
        </button>
      </Reveal>
    </section>
  );
}
