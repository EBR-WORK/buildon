"use client";

import { useState, type FormEvent } from "react";
import { newsletter, site } from "@/lib/content";
import { ArrowIcon, MailIcon } from "./icons";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * The reference's single white pill: mail glyph on the left, round skin-colour
 * submit tucked inside the right edge.
 *
 * No mailing-list backend is wired up yet, so a valid address opens a
 * pre-filled subscribe mail. Swap the handler for a POST when one exists.
 */
export default function NewsletterForm() {
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("email") as HTMLInputElement;
    const email = input.value.trim();

    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      input.focus();
      return;
    }

    setError("");
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(
      "Newsletter subscription",
    )}&body=${encodeURIComponent(`Please add ${email} to the Buildon newsletter.`)}`;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto w-full max-w-xl">
      <div className="relative">
        <label htmlFor="newsletter-email" className="sr-only">
          {newsletter.placeholder}
        </label>
        <MailIcon className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-ink-400" />
        <input
          suppressHydrationWarning
          id="newsletter-email"
          name="email"
          type="email"
          placeholder={newsletter.placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "newsletter-error" : undefined}
          className={`w-full rounded-full border bg-white py-4 pr-16 pl-13 text-base text-ink-900 outline-none transition placeholder:text-ink-400 sm:text-[15px] ${
            error ? "border-signal-500" : "border-transparent focus:border-brand-500"
          }`}
        />
        <button
          suppressHydrationWarning
          type="submit"
          aria-label={newsletter.submit}
          className="absolute top-1/2 right-2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-500 text-white transition hover:bg-brand-600"
        >
          <ArrowIcon className="size-5" />
        </button>
      </div>
      {error && (
        <p id="newsletter-error" className="mt-2 text-sm text-signal-300">
          {error}
        </p>
      )}
    </form>
  );
}
