"use client";

import { useId, type ReactNode } from "react";
import { internalRoutes } from "@/lib/cms/schema";
import { CheckIcon, ChevronDownIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { useToast } from "./Toast";

/**
 * The admin's form controls.
 *
 * Deliberately plain: an editor is a tool, so every control is labelled, every
 * hint sits under its field, and nothing depends on colour alone. The visual
 * language is the site's own tokens, so the panel does not read as a bolted-on
 * third-party screen.
 */

const FIELD =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

export function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  /** Marks the label. The save bar is what actually refuses the save. */
  required?: boolean;
  /** Shown in place of the hint, so a problem is never pushed off screen. */
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-900">
        {label}
        {required && (
          /* A word, not an asterisk: an asterisk needs a legend somewhere, and
             a form with one legend and thirty asterisks explains nothing. */
          <span className="ml-2 text-xs font-medium text-ink-400">required</span>
        )}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-sm font-medium text-signal-500">{error}</span>
      ) : (
        hint && <span className="mt-1.5 block text-sm text-ink-500">{hint}</span>
      )}
    </label>
  );
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  maxLength,
  required,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
}) {
  /* Only once something has been typed and then cleared, or on a field that
     arrived empty — either way the message appears where the field is, not
     only in the bar at the bottom of a long form. */
  const error = required && !value.trim() ? "This cannot be empty." : undefined;

  return (
    <Field label={label} hint={hint} required={required} error={error}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className={FIELD}
      />
    </Field>
  );
}

export function TextAreaField({
  label,
  hint,
  value,
  onChange,
  rows = 3,
  required,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  required?: boolean;
}) {
  const error = required && !value.trim() ? "This cannot be empty." : undefined;

  return (
    <Field label={label} hint={hint} required={required} error={error}>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className={`${FIELD} resize-y leading-relaxed`}
      />
    </Field>
  );
}

/** YYYY-MM-DD, which is both what the site stores and what <input type="date"> wants. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A date, with the browser's own picker.
 *
 * `type="date"` is the whole feature: it brings a calendar, a locale-correct
 * display, and keyboard entry, none of which is worth rebuilding. It exchanges
 * values as YYYY-MM-DD regardless of how it shows them, which is already the
 * stored format — so nothing is parsed or reformatted here.
 *
 * The catch it hides: given anything that is not YYYY-MM-DD, the control
 * renders blank. A post holding "31 July 2025" would look empty, and the first
 * touch of the field would overwrite it with nothing. So a value it cannot
 * represent falls back to a text box that shows the real contents and says
 * what is wrong, rather than quietly swallowing it.
 */
export function DateField({
  label,
  hint,
  value,
  onChange,
  required,
  max,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  /** Latest date the picker will offer — "today" for a published date. */
  max?: string;
}) {
  const malformed = Boolean(value) && !ISO_DATE.test(value);
  const error = required && !value.trim() ? "Pick a date." : undefined;

  if (malformed) {
    return (
      <Field
        label={label}
        required={required}
        error={`"${value}" is not a date the picker can show. Use YYYY-MM-DD.`}
      >
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={FIELD}
        />
      </Field>
    );
  }

  return (
    <Field label={label} hint={hint} required={required} error={error}>
      <input
        type="date"
        value={value}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        /* The picker indicator is tiny and low-contrast by default in Chrome;
           the filter darkens it to match the rest of the controls. */
        className={`${FIELD} [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100`}
      />
    </Field>
  );
}

/** Today as YYYY-MM-DD, in the editor's own timezone. */
export function today() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/**
 * A call to action: its words and where it goes.
 *
 * Internal links come from a list of real routes, because a CTA pointing at a
 * page that does not exist is the easiest mistake to make here. `external`
 * swaps the picker for a plain URL box — the PLAY VIDEO button goes to YouTube.
 */
export function CtaField({
  label,
  value,
  onChange,
  external = false,
}: {
  label: string;
  value: { label: string; href: string };
  onChange: (next: { label: string; href: string }) => void;
  external?: boolean;
}) {
  const id = useId();

  return (
    <fieldset className="rounded-2xl border border-line bg-surface p-4">
      <legend className="px-2 text-sm font-semibold text-ink-900">{label}</legend>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Button text"
          value={value.label}
          onChange={(next) => onChange({ ...value, label: next })}
        />

        {external ? (
          <TextField
            label="Link"
            hint="Full URL, including https://"
            value={value.href}
            onChange={(next) => onChange({ ...value, href: next })}
            placeholder="https://"
          />
        ) : (
          <Field label="Goes to" hint="Only pages that exist on the site.">
            <div className="relative">
              <select
                id={id}
                value={value.href}
                onChange={(event) => onChange({ ...value, href: event.target.value })}
                className={`${FIELD} cursor-pointer appearance-none pr-12`}
              >
                {internalRoutes.map((route) => (
                  <option key={route} value={route}>
                    {route}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink-500"
              />
            </div>
          </Field>
        )}
      </div>
    </fieldset>
  );
}

/**
 * A list whose length the editor controls — headline lines, testimonials.
 *
 * Reordering is by button rather than drag: a drag target needs a mouse and a
 * steady hand, and these lists are short enough that up/down is quicker and
 * works from the keyboard.
 */
export function RepeatableList<T>({
  label,
  hint,
  items,
  onChange,
  blank,
  render,
  min = 1,
  max,
  addLabel = "Add",
  liveOf,
  onToggleLive,
}: {
  label: string;
  hint?: string;
  items: T[];
  onChange: (next: T[]) => void;
  /** A fresh empty entry. */
  blank: () => T;
  render: (item: T, update: (next: T) => void, index: number) => ReactNode;
  min?: number;
  max?: number;
  addLabel?: string;
  /** Supply both to give each row a draft toggle. Omit where nothing drafts. */
  liveOf?: (item: T) => boolean;
  onToggleLive?: (index: number) => void;
}) {
  const { confirm } = useToast();

  const atMax = max !== undefined && items.length >= max;

  /* Even a one-line entry is confirmed. The control sits next to Move up and
     Move down, which are harmless, and a misfire there is otherwise silent. */
  async function remove(index: number) {
    const ok = await confirm({
      title: `Remove entry ${index + 1}?`,
      body: `From ${label.toLowerCase()}. This cannot be undone.`,
      confirmLabel: "Remove",
    });
    if (ok) onChange(items.filter((_, n) => n !== index));
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <section>
      <div className="mb-1.5 flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-semibold text-ink-900">{label}</h3>
        <span className="text-sm text-ink-500">
          {items.length} {items.length === 1 ? "entry" : "entries"}
        </span>
      </div>
      {hint && <p className="mb-3 text-sm text-ink-500">{hint}</p>}

      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="rounded-2xl border border-line bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                {i + 1}
              </span>

              <div className="flex items-center gap-1">
                {/* Same control as a list row's, in miniature: it names the
                    state and clicking changes it. */}
                {liveOf && onToggleLive && (
                  <button
                    type="button"
                    onClick={() => onToggleLive(i)}
                    aria-pressed={liveOf(item)}
                    title={
                      liveOf(item)
                        ? "Shown on the site. Click to make it a draft."
                        : "Draft — not shown. Click to publish."
                    }
                    className={`mr-1 inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                      liveOf(item)
                        ? "border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100"
                        : "border-line text-ink-500 hover:border-brand-200 hover:text-brand-500"
                    }`}
                  >
                    {liveOf(item) && <CheckIcon className="size-3" />}
                    {liveOf(item) ? "Live" : "Draft"}
                  </button>
                )}

                <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}>
                  <ChevronDownIcon className="size-4 rotate-180" />
                </IconButton>
                <IconButton
                  label="Move down"
                  disabled={i === items.length - 1}
                  onClick={() => move(i, i + 1)}
                >
                  <ChevronDownIcon className="size-4" />
                </IconButton>
                <IconButton
                  label="Remove"
                  danger
                  disabled={items.length <= min}
                  onClick={() => void remove(i)}
                >
                  <TrashIcon className="size-4" />
                </IconButton>
              </div>
            </div>

            {render(item, (next) => onChange(items.map((old, n) => (n === i ? next : old))), i)}
          </li>
        ))}
      </ul>

      {/* A greyed button with no reason is a dead end, so the limit says itself
          rather than leaving the editor clicking at nothing. */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={atMax}
          onClick={() => onChange([...items, blank()])}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PlusIcon className="size-4" />
          {addLabel}
        </button>

        {atMax && (
          <p className="text-sm text-ink-500">
            {max} is the most this section shows.
          </p>
        )}
      </div>
    </section>
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
  children: ReactNode;
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
