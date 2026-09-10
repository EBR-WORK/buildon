import { projects } from "@/lib/content";
import Reveal from "./Reveal";

/** A plain grey band holding the skin-colour "VIEW MORE" pill. No image grid. */
export default function Projects() {
  return (
    <section
      id="projects"
      className="section-y scroll-mt-28 bg-surface text-center"
    >
      <Reveal className="container-page">
        <div>
          <button
            suppressHydrationWarning
            type="button"
            className="inline-flex cursor-pointer items-center justify-center rounded-full bg-brand-500 px-8 py-3.5 font-display font-medium tracking-wide text-white transition hover:bg-brand-600"
          >
            {projects.cta.label}
          </button>
        </div>
      </Reveal>
    </section>
  );
}
