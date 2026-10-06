"use client";

import { repository } from "@/lib/cms/repository";

export type Status = "loading" | "idle" | "saving" | "saved" | "error";

/**
 * The bar every editor screen ends with.
 *
 * Fixed to the bottom: these forms run to several screens, and a save button
 * below the last field is a button nobody finds. The status line is
 * aria-live, so a save is announced rather than only shown.
 *
 * `lg:pl-[17rem]` clears the admin rail, which is fixed at that width from lg.
 */
export default function SaveBar({
  status,
  dirty,
  error,
  onSave,
  onReset,
  onExport,
}: {
  status: Status;
  dirty: boolean;
  error: string;
  onSave: () => void;
  onReset: () => void;
  onExport: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-end gap-3 px-6 py-4 sm:px-10 lg:pl-[17rem]">
        <p aria-live="polite" className="mr-auto text-sm text-ink-500">
          {status === "saving" && "Saving…"}
          {status === "saved" && !dirty && `Saved to ${repository.destination}.`}
          {status === "error" && <span className="text-signal-500">{error}</span>}
          {status === "idle" && dirty && "Unsaved changes."}
          {status === "idle" && !dirty && "No changes yet."}
        </p>

        <button
          type="button"
          onClick={onReset}
          className="cursor-pointer rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={onExport}
          className="cursor-pointer rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
        >
          Export JSON
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || status === "saving"}
          className="cursor-pointer rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  );
}
