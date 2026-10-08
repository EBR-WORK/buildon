"use client";

import { useCallback, useEffect, useState } from "react";
import { ConflictError, repository } from "@/lib/cms/repository";
import { cloneDefaults, type SiteContent } from "@/lib/cms/schema";
import { TextField } from "./Fields";
import RichDocEditor from "./RichDocEditor";
import SaveBar, { type Status } from "./SaveBar";
import { describeProblems, validateFaq } from "@/lib/cms/validate";
import { useToast } from "./Toast";

/**
 * The FAQ editor.
 *
 * Two levels, because the page has two: groups are the accordion's sections
 * and questions live inside them. A group is a heading on /faq, so deleting one
 * takes its questions with it — which the confirmation says out loud, since the
 * count is the part an editor is most likely to have forgotten.
 *
 * Answers are plain text. The accordion renders one paragraph and the reference
 * sets no links inside an answer, so a rich text field here would offer
 * formatting the page would not show.
 */
export default function FaqEditor() {
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

    /* Checked here too, not only in the disabled button: a stale render or
       a keyboard submit must not get past it. */
    const blocking = validateFaq(content);
    if (blocking.length > 0) {
      setStatus("error");
      setError(describeProblems(blocking));
      notify("Not saved", describeProblems(blocking), "danger");
      return;
    }

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
    notify("Reset", "Back to what the site ships with.");
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

  /* Recomputed on every render rather than on save: an editor should see
     a problem while they can still fix it, not after pressing Save. */
  const problems = content ? validateFaq(content) : [];

  if (!content) {
    return (
      <div className="p-6 sm:p-10">
        <p className="text-[15px] text-ink-500">Loading…</p>
      </div>
    );
  }

  const { faq } = content;
  /* Counted from the document, so the header says what the page will show
     rather than how many blocks were typed. */
  const sections = faq.body.filter((block) => block.kind === "h2").length;
  const questions = faq.body.filter((block) => block.kind === "h3").length;

  return (
    <div className="pb-28">
      <header className="border-b border-line bg-white px-6 py-6 sm:px-10 sm:py-8">
        <h1 className="font-display text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold">
          FAQs
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          {sections} {sections === 1 ? "section" : "sections"}, {questions}{" "}
          {questions === 1 ? "question" : "questions"}. Each question also feeds the
          page&rsquo;s structured data for search engines.
        </p>
      </header>

      <div className="space-y-8 p-6 sm:p-10">
        <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <div className="mb-6 max-w-md">
            <TextField
              label="Page heading"
              required
              value={faq.title}
              onChange={(next) => edit((d) => void (d.faq.title = next))}
            />
          </div>

          {/* One document, not a tree of forms.
              The page reads as a run of sections, questions and answers, so
              that is how it is written — the dropdown on each block says which
              of the three it is, and published.ts rebuilds the accordion from
              the order they are in. */}
          <RichDocEditor
            blocks={faq.body}
            onChange={(next) => edit((d) => void (d.faq.body = next))}
            labels={{
              h2: "Section",
              h3: "Question",
              paragraph: "Answer",
              bulletList: "Answer list",
              orderedList: "Answer steps",
            }}
          />

          <div className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm leading-relaxed text-ink-500">
            <strong className="font-semibold text-ink-900">Section</strong> starts a group.{" "}
            <strong className="font-semibold text-ink-900">Question</strong> starts a question
            inside it. Everything else is the answer to the question above it. Anything written
            before the first section has nowhere to appear, and the save bar will say so.
          </div>
        </section>
      </div>

      <SaveBar
        status={status}
        dirty={dirty}
        error={error}
        problems={problems}
        onSave={save}
        onReset={reset}
        onExport={exportJson}
      />
    </div>
  );
}
