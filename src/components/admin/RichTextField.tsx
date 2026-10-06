"use client";

import { useRef, useState, type ReactNode } from "react";
import { internalRoutes } from "@/lib/cms/schema";
import type { RichRun } from "@/lib/cms/schema";

/**
 * A rich text field that edits `runs` — the model the site already uses.
 *
 * Why not contentEditable: the site stores a paragraph as a list of runs, each
 * carrying its own bold flag and optional link. A contentEditable div hands
 * back HTML, which then has to be parsed into that model on every keystroke,
 * and browsers disagree about the markup they produce. Harder to keep correct
 * than it looks, and the failure mode is silent data loss — exactly what the
 * plan warns about for the 143 inline links in the blog.
 *
 * So the text and its marks are kept apart:
 *
 *   text  "Buildon P-20 is a premixed plaster"
 *   marks [{ start: 0, end: 12, bold: true }]
 *   runs  [{ text: "Buildon P-20", bold: true }, { text: " is a premixed…" }]
 *
 * The textarea edits the text. The toolbar applies a mark to whatever is
 * selected. Runs are derived from the two, so the stored shape is always valid
 * — there is no state in which a run exists that the text does not account for.
 */

export type Mark = {
  start: number;
  end: number;
  bold?: boolean;
  href?: string;
};

/** Split plain text at every mark boundary to produce the stored runs. */
export function toRuns(text: string, marks: Mark[]): RichRun[] {
  if (!text) return [];

  const edges = new Set<number>([0, text.length]);
  for (const m of marks) {
    edges.add(Math.max(0, Math.min(m.start, text.length)));
    edges.add(Math.max(0, Math.min(m.end, text.length)));
  }

  const points = [...edges].sort((a, b) => a - b);
  const runs: RichRun[] = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    const [from, to] = [points[i], points[i + 1]];
    if (to <= from) continue;

    const slice = text.slice(from, to);
    const covering = marks.filter((m) => m.start <= from && m.end >= to);
    const bold = covering.some((m) => m.bold);
    const href = covering.find((m) => m.href)?.href;

    const run: RichRun = { text: slice };
    if (bold) run.bold = true;
    if (href) run.href = href;

    /* Merge with the previous run when the formatting is identical, so typing
       inside a bold phrase does not leave a trail of one-character runs. */
    const last = runs.at(-1);
    if (last && !!last.bold === bold && last.href === href) last.text += slice;
    else runs.push(run);
  }

  return runs;
}

/** The inverse: recover text + marks from stored runs. */
export function fromRuns(runs: readonly RichRun[]): { text: string; marks: Mark[] } {
  let text = "";
  const marks: Mark[] = [];

  for (const run of runs) {
    const start = text.length;
    text += run.text;
    if (run.bold || run.href) {
      marks.push({ start, end: text.length, bold: run.bold, href: run.href });
    }
  }

  return { text, marks };
}

/**
 * Keep marks pointing at the same words after an edit.
 *
 * The change is located by comparing lengths at the caret, which is enough for
 * typing, pasting and deleting: a mark entirely after the edit shifts, one
 * spanning it grows or shrinks, one before it is untouched.
 */
function shiftMarks(marks: Mark[], at: number, delta: number): Mark[] {
  return marks
    .map((m) => {
      const start = m.start >= at ? m.start + delta : m.start;
      const end = m.end >= at ? m.end + delta : m.end;
      return { ...m, start: Math.max(0, start), end: Math.max(0, end) };
    })
    .filter((m) => m.end > m.start);
}

export default function RichTextField({
  label,
  hint,
  runs,
  onChange,
  rows = 5,
}: {
  label: string;
  hint?: string;
  runs: readonly RichRun[];
  onChange: (next: RichRun[]) => void;
  rows?: number;
}) {
  const initial = fromRuns(runs);
  const [text, setText] = useState(initial.text);
  const [marks, setMarks] = useState<Mark[]>(initial.marks);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [linking, setLinking] = useState<{ start: number; end: number } | null>(null);
  const [external, setExternal] = useState("");
  const [externalError, setExternalError] = useState("");

  const commit = (nextText: string, nextMarks: Mark[]) => {
    setText(nextText);
    setMarks(nextMarks);
    onChange(toRuns(nextText, nextMarks));
  };

  const selection = () => {
    const area = areaRef.current;
    if (!area) return null;
    const { selectionStart: start, selectionEnd: end } = area;
    return end > start ? { start, end } : null;
  };

  const applyBold = () => {
    const range = selection();
    if (!range) return;

    /* A second press on an already-bold selection clears it, which is what a
       toggle button is expected to do. */
    const covered = marks.some((m) => m.bold && m.start <= range.start && m.end >= range.end);
    const without = marks.filter((m) => !(m.bold && m.start === range.start && m.end === range.end));
    commit(text, covered ? without : [...without, { ...range, bold: true }]);
  };

  const applyLink = (href: string) => {
    if (!linking) return;
    const without = marks.filter((m) => !(m.href && m.start === linking.start && m.end === linking.end));
    commit(text, href ? [...without, { ...linking, href }] : without);
    setLinking(null);
  };

  /**
   * An outside URL, checked before it is stored.
   *
   * http and https only: a `javascript:` href in content is a script someone
   * can run on a reader's page, and the editor is the right place to stop it.
   */
  const applyExternal = () => {
    const value = external.trim();
    if (!value) {
      setExternalError("Enter a web address, or pick a page above.");
      return;
    }

    let url: URL;
    try {
      url = new URL(value);
    } catch {
      setExternalError("That is not a full web address — include https://");
      return;
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      setExternalError("Only http and https links are allowed.");
      return;
    }

    setExternal("");
    setExternalError("");
    applyLink(url.toString());
  };

  const clearFormatting = () => {
    const range = selection();
    if (!range) return;
    commit(
      text,
      marks.filter((m) => m.end <= range.start || m.start >= range.end),
    );
  };

  const derived = toRuns(text, marks);

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink-900">{label}</span>

        <div className="flex items-center gap-1">
          <ToolButton label="Bold the selected text" onClick={applyBold}>
            <span className="font-bold">B</span>
          </ToolButton>
          <ToolButton
            label="Link the selected text"
            onClick={() => {
              const range = selection();
              if (range) setLinking(range);
            }}
          >
            <span className="underline">Link</span>
          </ToolButton>
          <ToolButton label="Remove formatting from the selection" onClick={clearFormatting}>
            Clear
          </ToolButton>
        </div>
      </div>

      <textarea
        ref={areaRef}
        value={text}
        rows={rows}
        onChange={(event) => {
          const next = event.target.value;
          const at = event.target.selectionStart - (next.length - text.length);
          commit(next, shiftMarks(marks, Math.max(0, at), next.length - text.length));
        }}
        className="w-full resize-y rounded-xl border border-line bg-white px-4 py-3 text-[15px] leading-relaxed text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />

      <p className="mt-1.5 text-sm text-ink-500">
        {hint ?? "Select some words, then use Bold or Link."}
      </p>

      {linking && (
        <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-semibold text-ink-900">
            Link “{text.slice(linking.start, linking.end)}”
          </p>

          <p className="mt-3 mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
            A page on this site
          </p>
          <div className="flex flex-wrap gap-2">
            {internalRoutes.map((route) => (
              <button
                key={route}
                type="button"
                onClick={() => applyLink(route)}
                className="cursor-pointer rounded-full border border-line bg-white px-3 py-1.5 text-sm transition hover:border-brand-500 hover:text-brand-500"
              >
                {route}
              </button>
            ))}
          </div>

          {/* Somewhere else entirely — a standard, a supplier, a news piece.
              The site opens these in a new tab with rel="noopener", so the
              article is not lost behind them. */}
          <p className="mt-4 mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
            Somewhere else
          </p>
          <div className="flex flex-wrap items-start gap-2">
            <div className="min-w-0 flex-1">
              <input
                type="url"
                inputMode="url"
                value={external}
                placeholder="https://example.com/page"
                onChange={(event) => {
                  setExternal(event.target.value);
                  setExternalError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyExternal();
                  }
                }}
                className="w-full rounded-full border border-line bg-white px-4 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
              {externalError && (
                <p className="mt-1.5 text-sm text-signal-500">{externalError}</p>
              )}
            </div>

            <button
              type="button"
              onClick={applyExternal}
              className="cursor-pointer rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              Use link
            </button>
          </div>

          <div className="mt-4 flex items-center gap-4 border-t border-brand-200 pt-3">
            <button
              type="button"
              onClick={() => applyLink("")}
              className="cursor-pointer text-sm text-ink-500 underline"
            >
              Remove link
            </button>
            <button
              type="button"
              onClick={() => setLinking(null)}
              className="cursor-pointer text-sm text-ink-500 underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* The result, rendered as the site will render it. A rich text editor
          without a preview asks the editor to imagine the output. */}
      <div className="mt-3 rounded-xl border border-line bg-surface p-4">
        <p className="mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">Preview</p>
        <p className="text-[15px] leading-relaxed text-ink-500">
          {derived.length === 0 && <span className="text-ink-400">Nothing yet.</span>}
          {derived.map((run, i) => {
            if (run.href) {
              const offsite = /^https?:\/\//i.test(run.href);
              return (
                <span
                  key={i}
                  title={run.href}
                  className="font-medium text-brand-500 underline underline-offset-2"
                >
                  {run.text}
                  {offsite && <span aria-hidden className="ml-0.5 text-xs">↗</span>}
                </span>
              );
            }
            if (run.bold) {
              return (
                <strong key={i} className="font-semibold text-ink-900">
                  {run.text}
                </strong>
              );
            }
            return <span key={i}>{run.text}</span>;
          })}
        </p>

        <p className="mt-3 text-xs text-ink-500">
          {derived.length} {derived.length === 1 ? "run" : "runs"} ·{" "}
          {marks.filter((m) => m.bold).length} bold · {marks.filter((m) => m.href).length} linked
        </p>
      </div>
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      /* The press must not steal focus from the textarea: the selection it
         works on would be gone by the time the handler runs. */
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm text-ink-700 transition hover:border-brand-500 hover:text-brand-500"
    >
      {children}
    </button>
  );
}
