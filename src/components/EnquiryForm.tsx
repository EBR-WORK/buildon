"use client";

import { useState, type FormEvent } from "react";
import { contact, site } from "@/lib/content";
import { ArrowIcon } from "./icons";

type Errors = Partial<Record<"name" | "email" | "phone" | "message", string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * The enquiry form itself, with no section chrome — shared by the home page's
 * "Send Us Message" block and the /contact-us page.
 */
export default function EnquiryForm({ className = "" }: { className?: string }) {
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

  return (
<form onSubmit={handleSubmit} noValidate className={className}>
  <Field name="name" label={contact.fields.name} error={errors.name} autoComplete="name" />
  <Field
    name="email"
    label={contact.fields.email}
    type="email"
    error={errors.email}
    autoComplete="email"
  />
  <Field
    name="phone"
    label={contact.fields.phone}
    type="tel"
    error={errors.phone}
    autoComplete="tel"
  />
  <Field name="message" label={contact.fields.message} error={errors.message} multiline />

  <button
    type="submit"
    className="group mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-8 py-3.5 font-display font-medium tracking-wide text-white transition hover:bg-brand-600 sm:w-auto"
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
  label,
  type = "text",
  error,
  autoComplete,
  multiline = false,
}: {
  name: string;
  label: string;
  type?: string;
  error?: string;
  autoComplete?: string;
  multiline?: boolean;
}) {
  const field =
    "peer w-full border-b bg-transparent pt-6 pb-2 text-base outline-none sm:text-[15px] " +
    (error ? "border-signal-500" : "border-line");

  return (
    <div className="mb-2">
      <div className="relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-brand-500 after:transition-all after:duration-300 after:content-[''] has-[:focus]:after:w-full">
        {multiline ? (
          <textarea
            id={name}
            name={name}
            rows={4}
            placeholder=" "
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${name}-error` : undefined}
            aria-required
            className={`${field} resize-y`}
          />
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            autoComplete={autoComplete}
            placeholder=" "
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${name}-error` : undefined}
            aria-required
            className={field}
          />
        )}
        <label
          htmlFor={name}
          className="pointer-events-none absolute top-6 left-0 text-base text-ink-500 transition-all duration-200 peer-focus:top-0 peer-focus:text-xs peer-focus:text-brand-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs sm:text-[15px]"
        >
          {label}
        </label>
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-signal-500">
          {error}
        </p>
      )}
    </div>
  );
}
