"use client";

import type { ReactNode } from "react";
import { CheckIcon, PencilIcon, TrashIcon } from "@/components/icons";

/**
 * One collapsible row in a list of entries — a product, a project, an opening,
 * a post, a question.
 *
 * The header is a div rather than one big button because Delete sits inside
 * it. A button nested in a button is invalid, and browsers recover from it by
 * dropping one of them, so the two controls are siblings and only the title
 * area toggles.
 *
 * Delete is always visible, not revealed on hover and not hidden behind the
 * open panel: an editor clearing out old entries should not have to open each
 * one to find the control, and a button that appears only on hover cannot be
 * found on a touch screen at all.
 */
export default function EntryRow({
  title,
  subtitle,
  badge,
  thumb,
  isOpen,
  onToggle,
  onDelete,
  deleteLabel,
  live,
  onToggleLive,
  children,
}: {
  title: string;
  subtitle?: string;
  /** "New" on an entry that has no page on the live site yet. */
  badge?: ReactNode;
  /** An optional square preview to the left of the title. */
  thumb?: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
  /** Spoken label — "Delete opening". The icon carries no text. */
  deleteLabel: string;
  /** Whether this entry reaches the site. Omit where nothing can be drafted. */
  live?: boolean;
  onToggleLive?: () => void;
  children: ReactNode;
}) {
  const draft = live === false;
  return (
    <li className="overflow-hidden rounded-2xl border border-line">
      <div
        className={`flex items-center gap-2 pr-3 transition ${
          isOpen ? "bg-surface" : "bg-white hover:bg-surface"
        }`}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-4 pl-5 text-left"
        >
          {thumb}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-[15px] font-semibold text-ink-900">
              {title}
            </span>
            {subtitle !== undefined && (
              <span className="block truncate text-sm text-ink-500">
                {subtitle}
                {badge}
                {draft && (
                  <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-ink-500">
                    Draft
                  </span>
                )}
              </span>
            )}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {/* Reads as a state, not a command: it says what the entry IS, and
              clicking changes it. A button labelled "Publish" next to one
              already live is the commonest way to make this confusing. */}
          {onToggleLive && (
            <button
              type="button"
              onClick={onToggleLive}
              aria-pressed={!draft}
              title={
                draft
                  ? "Draft — not on the site. Click to publish."
                  : "Live on the site. Click to make it a draft."
              }
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                draft
                  ? "border-line text-ink-500 hover:border-brand-200 hover:text-brand-500"
                  : "border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100"
              }`}
            >
              {!draft && <CheckIcon className="size-3.5" />}
              {draft ? "Draft" : "Live"}
            </button>
          )}

          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-brand-500 transition hover:bg-brand-50"
          >
            <PencilIcon className="size-4" />
            <span className="hidden sm:inline">{isOpen ? "Close" : "Edit"}</span>
          </button>

          {/* Red only on hover. A row of permanently red buttons down the list
              reads as a page full of errors. */}
          <button
            type="button"
            onClick={onDelete}
            aria-label={deleteLabel}
            title={deleteLabel}
            className="grid size-9 cursor-pointer place-items-center rounded-lg text-ink-400 transition hover:bg-signal-50 hover:text-signal-500"
          >
            <TrashIcon className="size-4" />
          </button>
        </div>
      </div>

      {isOpen && <div className="space-y-5 border-t border-line bg-white p-5">{children}</div>}
    </li>
  );
}
