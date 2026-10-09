"use client";

import { useState, type FormEvent } from "react";
import { contact, site } from "@/lib/content";
import { ArrowIcon, ChevronDownIcon } from "./icons";

type Errors = Partial<Record<"name" | "email" | "phone" | "message", string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * The enquiry form itself, with no section chrome — shared by the home page's
 * "Send Us Message" block, the /contact-us page and the quote panel.
 *
 * `idPrefix` exists because two of those can be on screen at once: the quote
 * panel opens over a page that already has this form, and without a prefix both
 * copies would claim the ids "name", "email" and so on. Duplicate ids point
 * every label at the first copy, so clicking a label in the panel would focus
 * the field behind it. The `name` attributes stay unprefixed — they are what
 * the submission reads.
 */
export default function EnquiryForm({
  className = "",
  idPrefix = "",
  detailed = false,
}: {
  className?: string;
  idPrefix?: string;
  /**
   * Adds company and enquiry type, and sets phone and email side by side.
   *
   * Only the quote dialog asks for them. The home page's "Send Us Message"
   * block and /contact-us are deliberately short — a form that wants six
   * answers before it will take a question is a form fewer people finish, and
   * those two are already doing their job.
   */
  detailed?: boolean;
}) {
  const [errors, setErrors] = useState<Errors>({});

  /**
   * No backend is wired up yet, so a valid submission composes the enquiry as a
   * mail draft to info@buildon.co.in. Swap this for a POST to a route handler
   * (or the CRM endpoint) when one exists — the validation below stays as is.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const next: Errors = {};
    if (name.length < 2) next.name = "Please enter your name.";
    if (!emailPattern.test(email)) next.email = "Please enter a valid email address.";
    if (phone.replace(/\D/g, "").length < 8) next.phone = "Please enter a reachable phone number.";
    if (message.length < 10) next.message = "Tell us a little about your requirement.";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }

    const body = [`Name: ${name}`, `Email: ${email}`, `Phone: ${phone}`, "", message].join("\n");

    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(
      `Enquiry from ${name}`,
    )}&body=${encodeURIComponent(body)}`;
  }

  /* Two field styles, because the two places this appears are different
     shapes. The page forms are a single column in a narrow band, where an
     underlined field with a floating label is light and reads as part of the
     page. The dialog is a wide white card with six fields in it, where filled
     boxes with their labels above are easier to scan — and the reference does
     exactly that. */
  if (detailed) {
    return (
      <form onSubmit={handleSubmit} noValidate className={className}>
        <Filled
          name="name"
          idPrefix={idPrefix}
          label="Name"
          placeholder={contact.placeholders.name}
          error={errors.name}
          autoComplete="name"
        />

        <div className="gap-x-5 sm:grid sm:grid-cols-2">
          <Filled
            name="phone"
            idPrefix={idPrefix}
            label="Phone Number"
            placeholder={contact.placeholders.phone}
            type="tel"
            error={errors.phone}
            autoComplete="tel"
          />
          <Filled
            name="email"
            idPrefix={idPrefix}
            label="Email"
            placeholder={contact.placeholders.email}
            type="email"
            error={errors.email}
            autoComplete="email"
          />
        </div>

        <Filled
          name="company"
          idPrefix={idPrefix}
          label="Company Name (if applicable)"
          placeholder={contact.placeholders.company}
          autoComplete="organization"
        />

        <Filled
          name="enquiryType"
          idPrefix={idPrefix}
          label="Enquiry Type"
          placeholder={contact.placeholders.enquiryType}
          options={contact.enquiryTypes}
        />

        <Filled
          name="message"
          idPrefix={idPrefix}
          label="Type Your Enquiry"
          placeholder={contact.placeholders.message}
          error={errors.message}
          multiline
        />

        {/* The same button the rest of the site uses — the pill, not the
            split white-and-orange control the reference has. A dialog is a
            worse place than most to invent a one-off shape. */}
        <button
          suppressHydrationWarning
          type="submit"
          className="group mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-500 px-8 py-3.5 font-display font-medium tracking-wide text-white transition hover:bg-brand-600 sm:w-auto"
        >
          {contact.submitDialog}
          <ArrowIcon className="size-5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={className}>
      <Field
        name="name"
        idPrefix={idPrefix}
        label={contact.fields.name}
        error={errors.name}
        autoComplete="name"
      />
      <Field
        name="email"
        idPrefix={idPrefix}
        label={contact.fields.email}
        type="email"
        error={errors.email}
        autoComplete="email"
      />
      <Field
        name="phone"
        idPrefix={idPrefix}
        label={contact.fields.phone}
        type="tel"
        error={errors.phone}
        autoComplete="tel"
      />
      <Field
        name="message"
        idPrefix={idPrefix}
        label={contact.fields.message}
        error={errors.message}
        multiline
      />

      <button
        suppressHydrationWarning
        type="submit"
        className="group mt-8 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-500 px-8 py-3.5 font-display font-medium tracking-wide text-white transition hover:bg-brand-600 sm:w-auto"
      >
        {contact.submit}
        <ArrowIcon className="size-5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </form>
  );
}

/**
 * An underlined field whose label starts in the input and rises out of it once
 * the field is focused or filled — the reference's look, but with a real
 * <label> rather than a placeholder that vanishes as soon as you type.
 *
 * The blue underline sweeps in on focus, so the focus cue is a change of weight
 * and not colour alone.
 */
function Field({
  name,
  idPrefix = "",
  label,
  type = "text",
  error,
  autoComplete,
  multiline = false,
}: {
  name: string;
  idPrefix?: string;
  label: string;
  type?: string;
  error?: string;
  autoComplete?: string;
  multiline?: boolean;
}) {
  const id = `${idPrefix}${name}`;
  const errorId = `${id}-error`;
  const field =
    "peer w-full border-b bg-transparent pt-6 pb-2 text-base outline-none sm:text-[15px] " +
    (error ? "border-signal-500" : "border-line");

  return (
    <div className="mb-2">
      <div className="relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-brand-500 after:transition-all after:duration-300 after:content-[''] has-[:focus]:after:w-full">
        {multiline ? (
          <textarea
            suppressHydrationWarning
            id={id}
            name={name}
            rows={4}
            placeholder=" "
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            aria-required
            className={`${field} resize-y`}
          />
        ) : (
          <input
            suppressHydrationWarning
            id={id}
            name={name}
            type={type}
            autoComplete={autoComplete}
            placeholder=" "
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            aria-required
            className={field}
          />
        )}
        <label
          htmlFor={id}
          className="pointer-events-none absolute top-6 left-0 text-base text-ink-500 transition-all duration-200 peer-focus:top-0 peer-focus:text-xs peer-focus:text-brand-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs sm:text-[15px]"
        >
          {label}
        </label>
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-signal-500">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * A filled field, labelled from above.
 *
 * One component for input, select and textarea: they differ by a handful of
 * attributes and share the box, the label, the placeholder colour and the
 * error. Three near-identical components drift — one gets a focus ring the
 * others never do.
 *
 * The label is above rather than floating. A floating label needs the field to
 * start empty to have somewhere to float from, and a select never is; this way
 * every row in the dialog is built the same.
 */
function Filled({
  name,
  idPrefix = "",
  label,
  placeholder,
  type = "text",
  error,
  autoComplete,
  multiline,
  options,
}: {
  name: string;
  idPrefix?: string;
  label: string;
  placeholder?: string;
  type?: string;
  error?: string;
  autoComplete?: string;
  multiline?: boolean;
  /** Present for a select; the placeholder becomes its empty first option. */
  options?: readonly string[];
}) {
  const id = `${idPrefix}${name}`;
  const errorId = `${id}-error`;

  /* The resting state has no border — the fill is what marks the field. A
     border appears only on focus and on error, so both read as something
     happening rather than as the normal state with a colour change. */
  const box =
    "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-[15px] text-ink-900 outline-none transition " +
    "placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500/15 " +
    (error ? "border-signal-500" : "border-transparent focus:border-brand-500");

  return (
    <div className="mb-3.5">
      <label htmlFor={id} className="mb-1.5 block text-sm text-ink-700">
        {label}
      </label>

      {options ? (
        <div className="relative">
          <select
            suppressHydrationWarning
            id={id}
            name={name}
            defaultValue=""
            aria-invalid={Boolean(error)}
            className={`${box} cursor-pointer appearance-none pr-10`}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-500"
          />
        </div>
      ) : multiline ? (
        <textarea
          suppressHydrationWarning
          id={id}
          name={name}
          rows={3}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          /* Fixed height: the drag handle let the box be pulled past the
             dialog's edge, and three rows is already enough to read back. */
          className={`${box} resize-none`}
        />
      ) : (
        <input
          suppressHydrationWarning
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={box}
        />
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm font-medium text-signal-500">
          {error}
        </p>
      )}
    </div>
  );
}
