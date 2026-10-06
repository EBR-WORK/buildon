"use client";

import { useCallback, useEffect, useState } from "react";
import { ConflictError, repository } from "@/lib/cms/repository";
import { cloneDefaults, newId, type SiteContent } from "@/lib/cms/schema";
import { ChevronDownIcon, PlusIcon, TrashIcon } from "@/components/icons";
import EntryRow from "./EntryRow";
import { RepeatableList, TextAreaField, TextField } from "./Fields";
import SaveBar, { type Status } from "./SaveBar";
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
  const [open, setOpen] = useState<string | null>(null);

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

  function addGroup() {
    const id = newId();
    edit((d) => void d.faq.groups.push({ id, title: "", items: [] }));
    setOpen(id);
  }

  async function removeGroup(id: string, title: string, count: number) {
    const ok = await confirm({
      title: `Delete the “${title || "untitled"}” section?`,
      body:
        count > 0
          ? `Its ${count} ${count === 1 ? "question goes" : "questions go"} with it. This cannot be undone.`
          : "It has no questions in it. This cannot be undone.",
      confirmLabel: "Delete section",
    });
    if (!ok) return;

    edit((d) => void (d.faq.groups = d.faq.groups.filter((group) => group.id !== id)));
    setOpen(null);
    notify("Deleted", `The “${title || "untitled"}” section is gone from the draft.`);
  }

  async function removeItem(groupIndex: number, itemId: string, question: string) {
    const ok = await confirm({
      title: "Delete this question?",
      body: question || "It has no question text yet.",
      confirmLabel: "Delete question",
    });
    if (!ok) return;

    edit(
      (d) =>
        void (d.faq.groups[groupIndex].items = d.faq.groups[groupIndex].items.filter(
          (item) => item.id !== itemId,
        )),
    );
    notify("Deleted", "The question is gone from the draft.");
  }

  if (!content) {
    return (
      <div className="p-6 sm:p-10">
        <p className="text-[15px] text-ink-500">Loading…</p>
      </div>
    );
  }

  const { faq } = content;
  const total = faq.groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="pb-28">
      <header className="border-b border-line bg-white px-6 py-6 sm:px-10 sm:py-8">
        <h1 className="font-display text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold">
          FAQs
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          The questions on /faq, grouped as the page groups them.
        </p>
      </header>

      <div className="space-y-10 p-6 sm:p-10">
        <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <header className="mb-6 border-b border-line pb-4">
            <h2 className="font-display text-xl leading-snug font-semibold sm:text-2xl">
              Sections
            </h2>
            <p className="mt-1.5 text-[15px] text-ink-500">
              {faq.groups.length} {faq.groups.length === 1 ? "section" : "sections"}, {total}{" "}
              {total === 1 ? "question" : "questions"} in all. Each question also feeds the
              page&rsquo;s structured data for search engines.
            </p>
          </header>

          <div className="mb-6">
            <TextField
              label="Page heading"
              value={faq.title}
              onChange={(next) => edit((d) => void (d.faq.title = next))}
            />
          </div>

          <ul className="space-y-3">
            {faq.groups.map((group, groupIndex) => (
              <EntryRow
                key={group.id}
                title={group.title || "Untitled section"}
                subtitle={`${group.items.length} ${group.items.length === 1 ? "question" : "questions"}`}
                isOpen={open === group.id}
                onToggle={() => setOpen(open === group.id ? null : group.id)}
                onDelete={() => void removeGroup(group.id, group.title, group.items.length)}
                deleteLabel={`Delete the ${group.title || "untitled"} section`}
              >
                <TextField
                  label="Section heading"
                  value={group.title}
                  onChange={(next) => edit((d) => void (d.faq.groups[groupIndex].title = next))}
                />

                <div className="border-t border-line pt-5">
                  <div className="mb-3 flex items-baseline justify-between gap-4">
                    <h3 className="text-sm font-semibold text-ink-900">Questions</h3>
                    <span className="text-sm text-ink-500">
                      {group.items.length}{" "}
                      {group.items.length === 1 ? "question" : "questions"}
                    </span>
                  </div>

                  {group.items.length === 0 ? (
                    <p className="rounded-xl bg-surface px-4 py-5 text-center text-sm text-ink-500">
                      No questions in this section yet.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {group.items.map((item, itemIndex) => (
                        <li key={item.id} className="rounded-2xl border border-line p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                              {itemIndex + 1}
                            </span>

                            <div className="flex items-center gap-1">
                              <IconButton
                                label="Move up"
                                disabled={itemIndex === 0}
                                onClick={() =>
                                  edit((d) => {
                                    const list = d.faq.groups[groupIndex].items;
                                    [list[itemIndex - 1], list[itemIndex]] = [
                                      list[itemIndex],
                                      list[itemIndex - 1],
                                    ];
                                  })
                                }
                              >
                                <ChevronDownIcon className="size-4 rotate-180" />
                              </IconButton>
                              <IconButton
                                label="Move down"
                                disabled={itemIndex === group.items.length - 1}
                                onClick={() =>
                                  edit((d) => {
                                    const list = d.faq.groups[groupIndex].items;
                                    [list[itemIndex], list[itemIndex + 1]] = [
                                      list[itemIndex + 1],
                                      list[itemIndex],
                                    ];
                                  })
                                }
                              >
                                <ChevronDownIcon className="size-4" />
                              </IconButton>
                              <IconButton
                                label="Delete question"
                                danger
                                onClick={() =>
                                  void removeItem(groupIndex, item.id, item.question)
                                }
                              >
                                <TrashIcon className="size-4" />
                              </IconButton>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <TextField
                              label="Question"
                              value={item.question}
                              onChange={(next) =>
                                edit(
                                  (d) =>
                                    void (d.faq.groups[groupIndex].items[itemIndex].question =
                                      next),
                                )
                              }
                            />
                            <TextAreaField
                              label="Answer"
                              hint="Shown as a paragraph, and used for the page's structured data."
                              rows={4}
                              value={item.answer}
                              onChange={(next) =>
                                edit(
                                  (d) =>
                                    void (d.faq.groups[groupIndex].items[itemIndex].answer = next),
                                )
                              }
                            />

                            {/* Optional, and rare: one answer on the site is a
                                procedure. When steps are present the page
                                renders them numbered instead of the paragraph
                                — but the answer above still has to carry the
                                same words, because the FAQ structured data is
                                one string either way. */}
                            <details
                              className="rounded-xl border border-line bg-surface px-4 py-3"
                              open={Boolean(item.steps?.length)}
                            >
                              <summary className="cursor-pointer text-sm font-semibold text-ink-900">
                                Show this answer as numbered steps
                              </summary>

                              <div className="mt-4">
                                <RepeatableList
                                  label="Steps"
                                  hint="One per row. Leave empty to show the answer as a paragraph."
                                  items={item.steps ?? []}
                                  min={0}
                                  addLabel="Add step"
                                  blank={() => ""}
                                  onChange={(next) =>
                                    edit((d) => {
                                      const target = d.faq.groups[groupIndex].items[itemIndex];
                                      if (next.length === 0) delete target.steps;
                                      else target.steps = next;
                                    })
                                  }
                                  render={(step, update) => (
                                    <TextAreaField
                                      label="Step"
                                      rows={2}
                                      value={step}
                                      onChange={update}
                                    />
                                  )}
                                />
                              </div>
                            </details>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      edit((d) =>
                        void d.faq.groups[groupIndex].items.push({
                          id: newId(),
                          question: "",
                          answer: "",
                        }),
                      )
                    }
                    className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
                  >
                    <PlusIcon className="size-4" />
                    Add a question
                  </button>
                </div>
              </EntryRow>
            ))}
          </ul>

          <button
            type="button"
            onClick={addGroup}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
          >
            <PlusIcon className="size-4" />
            Add a section
          </button>
        </section>
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

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-8 cursor-pointer place-items-center rounded-lg text-ink-500 transition disabled:cursor-not-allowed disabled:opacity-30 ${
        danger ? "hover:bg-signal-50 hover:text-signal-500" : "hover:bg-surface hover:text-ink-900"
      }`}
    >
      {children}
    </button>
  );
}
