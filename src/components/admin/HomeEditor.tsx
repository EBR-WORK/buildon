"use client";

import { useCallback, useEffect, useState } from "react";
import { ConflictError, repository } from "@/lib/cms/repository";
import { cloneDefaults, type SiteContent } from "@/lib/cms/schema";
import { CtaField, RepeatableList, TextAreaField, TextField } from "./Fields";
import ImageField from "./ImageField";
import SaveBar, { type Status } from "./SaveBar";
import VideoField from "./VideoField";
import { useToast } from "./Toast";

/**
 * The home page editor: the hero and the testimonials carousel.
 *
 * Two sections rather than two screens, because they are one page to the person
 * editing them — the plan calls this a one-page setup.
 *
 * Everything runs in the browser. The site is a static export with no server to
 * POST to, so the draft is held by the repository and exported as JSON to
 * commit. When Supabase arrives, only the repository changes.
 */

export default function HomeEditor() {
  const { confirm, notify } = useToast();

  const [content, setContent] = useState<SiteContent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    repository.load().then((loaded) => {
      setContent(loaded);
      setStatus("idle");
    });
  }, []);

  /* Warn before a reload or a tab close takes unsaved work with it. */
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const edit = useCallback((change: (draft: SiteContent) => void) => {
    setContent((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      change(next);
      return next;
    });
    setDirty(true);
    setStatus("idle");
  }, []);

  async function save() {
    if (!content) return;
    setStatus("saving");
    try {
      await repository.save(content);
      setDirty(false);
      setStatus("saved");
      setError("");
      notify("Saved", `Stored in ${repository.destination}.`);
    } catch (e) {
      setStatus("error");
      const message = e instanceof Error ? e.message : "Could not save.";
      setError(message);
      /* A conflict is not a failed save, it is a refused one, and the editor
         has to decide what to do — so it gets a toast rather than only a line
         in the bar they may have scrolled past. */
      if (e instanceof ConflictError) {
        notify("Not saved", message, "danger");
      }
    }
  }

  async function reset() {
    const ok = await confirm({
      title: "Discard every change?",
      body: "Everything goes back to what the site ships with. This cannot be undone.",
      confirmLabel: "Discard",
    });
    if (!ok) return;
    await repository.reset();
    setContent(cloneDefaults());
    setDirty(false);
    setStatus("idle");
  }

  function exportJson() {
    if (!content) return;
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "buildon-content.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!content) {
    return (
      <div className="p-6 sm:p-10">
        <p className="text-[15px] text-ink-500">Loading…</p>
      </div>
    );
  }

  const { hero, testimonials } = content.home;

  return (
    <div className="pb-28">
      <header className="border-b border-line bg-white px-6 py-6 sm:px-10 sm:py-8">
        <h1 className="font-display text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold">
          Home
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          The banner at the top of the site and the client testimonials further
          down.
        </p>
      </header>

      <div className="space-y-10 p-6 sm:p-10">
        {/* ---------------------------------------------------------- Hero */}
        <Section
          title="Hero banner"
          note="The first thing a visitor sees: the headline over the looping video."
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
            <div className="space-y-5">
              <TextField
                label="Eyebrow"
                hint="The small red pill above the headline."
                value={hero.eyebrow}
                maxLength={60}
                onChange={(next) => edit((d) => void (d.home.hero.eyebrow = next))}
              />

              <RepeatableList
                label="Headline"
                hint="One line per row. The second line is shown in light blue. Three lines is the most the layout holds."
                items={hero.titleLines}
                min={1}
                max={3}
                addLabel="Add line"
                blank={() => ""}
                onChange={(next) => edit((d) => void (d.home.hero.titleLines = next))}
                render={(line, update) => (
                  <TextField label="Line" value={line} maxLength={48} onChange={update} />
                )}
              />

              <TextAreaField
                label="Intro"
                hint="One sentence under the headline."
                value={hero.intro}
                onChange={(next) => edit((d) => void (d.home.hero.intro = next))}
              />

              <CtaField
                label="Primary button"
                value={hero.primaryCta}
                onChange={(next) => edit((d) => void (d.home.hero.primaryCta = next))}
              />

              <CtaField
                label="Video button"
                external
                value={hero.videoCta}
                onChange={(next) => edit((d) => void (d.home.hero.videoCta = next))}
              />

              <VideoField
                label="Background video"
                hint="Plays muted and loops behind the headline. Pick one already here, or upload a file to add to the gallery."
                value={hero.video}
                onChange={(next) => edit((d) => void (d.home.hero.video = next))}
              />
            </div>

            <HeroPreview hero={hero} />
          </div>
        </Section>

        {/* -------------------------------------------------- Testimonials */}
        <Section
          title="Testimonials"
          note="The client video and the quotes that scroll beside it."
        >
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Section heading"
                value={testimonials.title}
                onChange={(next) => edit((d) => void (d.home.testimonials.title = next))}
              />
              <div />
            </div>

            <CtaField
              label="Link under the carousel"
              value={testimonials.cta}
              onChange={(next) => edit((d) => void (d.home.testimonials.cta = next))}
            />

            <fieldset className="rounded-2xl border border-line bg-surface p-4">
              <legend className="px-2 text-sm font-semibold text-ink-900">Client video</legend>

              <div className="space-y-5">
                <VideoField
                  label="Video"
                  hint="The client testimonial. Pick one already here, or upload a file to add to the gallery."
                  value={testimonials.video.src}
                  onChange={(next) => edit((d) => void (d.home.testimonials.video.src = next))}
                />
                <ImageField
                  label="Poster image"
                  hint="The still shown before the video plays. Upload one, or choose from the gallery."
                  folder="brand"
                  value={testimonials.video.poster}
                  onChange={(next) => edit((d) => void (d.home.testimonials.video.poster = next))}
                />
              </div>
            </fieldset>

            <RepeatableList
              label="Quotes"
              hint="Shown one at a time. Drag order is the display order; use the arrows to move one."
              items={testimonials.items}
              min={1}
              addLabel="Add testimonial"
              blank={() => ({ quote: "", author: "" })}
              onChange={(next) => edit((d) => void (d.home.testimonials.items = next))}
              render={(item, update) => (
                <div className="space-y-4">
                  <TextAreaField
                    label="Quote"
                    rows={4}
                    value={item.quote}
                    onChange={(quote) => update({ ...item, quote })}
                  />
                  <TextField
                    label="Who said it"
                    hint="Name, place, and how long they have been a customer."
                    value={item.author}
                    onChange={(author) => update({ ...item, author })}
                  />
                </div>
              )}
            />
          </div>
        </Section>
      </div>

      <SaveBar
        status={status}
        dirty={dirty}
        error={error}
        onSave={save}
        onReset={reset}
        onExport={exportJson}
      />
    </div>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
      <header className="mb-6 border-b border-line pb-4">
        <h2 className="font-display text-xl leading-snug font-semibold sm:text-2xl">{title}</h2>
        <p className="mt-1.5 text-[15px] text-ink-500">{note}</p>
      </header>
      {children}
    </section>
  );
}

/**
 * A scaled-down hero, so the editor can see the shape of what they are typing
 * — how the headline breaks, whether the eyebrow is too long — without leaving
 * the form. Not pixel-exact, and it does not play the video: it is a sketch.
 */
function HeroPreview({ hero }: { hero: SiteContent["home"]["hero"] }) {
  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <p className="mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">Preview</p>

      <div className="overflow-hidden rounded-2xl border border-line bg-secondary px-5 py-8 text-center">
        {hero.eyebrow && (
          <p className="inline-block bg-accent-500 px-3 py-1.5 font-display text-[11px] font-medium tracking-[0.08em] text-white">
            {hero.eyebrow}
          </p>
        )}

        <p className="mt-4 font-display text-xl leading-[1.12] font-semibold text-white">
          {hero.titleLines.map((line, i) => (
            <span key={i} className={i === 1 ? "block text-brand-300" : "block"}>
              {line}
            </span>
          ))}
        </p>

        <p className="mt-3 text-xs leading-relaxed text-white/80">{hero.intro}</p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full bg-brand-500 px-4 py-2 font-display text-[11px] font-medium tracking-wide text-white">
            {hero.primaryCta.label}
          </span>
          <span className="font-display text-[11px] font-medium tracking-wide text-white">
            {hero.videoCta.label}
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-500">
        A sketch of the layout, not the finished banner — the video and exact
        type sizes only appear on the site itself.
      </p>
    </aside>
  );
}
