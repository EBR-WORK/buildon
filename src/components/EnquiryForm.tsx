"use client";

import { useState, type FormEvent } from "react";
import { contact, site } from "@/lib/content";
import { submitEnquiry } from "@/lib/cms/enquiries";
import { keepDigits } from "@/lib/phone";
import { usePathname } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { localeOf } from "@/lib/i18n/config";
import { ENQUIRY_FORM } from "./NetlifyForms";
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
  withProduct = true,
  defaultProduct,
  source,
}: {
  className?: string;
  idPrefix?: string;
  /**
   * What the desk sees as the origin of the enquiry.
   *
   * A prop rather than something derived from the shape of the form: every
   * form on the site now asks the same questions, so nothing about it says
   * where the enquiry came from — and that is the one thing this field exists
   * to record.
   */
  source?: string;
  /**
   * Whether to ask which product.
   *
   * On by default, with everything else. It is here for the one place that
   * cannot use it: a form that is already about a named product, where the
   * dropdown would ask a question the page has answered.
   */
  withProduct?: boolean;
  /**
   * Which product to start the dropdown on.
   *
   * Set when the form is opened from a product's own page: the visitor is
   * already looking at the answer, and making them pick it from a list of ten
   * is asking a question they have just answered by being there.
   */
  defaultProduct?: string;
}) {
  const [errors, setErrors] = useState<Errors>({});
  /* The words, in the language of the page this form is standing on.
  
     They used to come from content.ts, which is imported into this client
     component and therefore compiled into the shared JavaScript bundle — one
     copy for all three languages. The Marathi page painted Marathi labels from
     its markup and React put the English back the moment it hydrated. The
     dictionary is read at render, so it cannot disagree with the URL. */
  const t = getDictionary(localeOf(usePathname() ?? "/")).enquiry;

  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  /* Which product is chosen — the only answer on this form that changes what
     else it asks. Everything else is read out of the FormData on submit; this
     one has to be known while the form is still being filled in. */
  const [product, setProduct] = useState(defaultProduct ?? "");

  /**
   * Send it to Netlify, which emails it on to the enquiry desk.
   *
   * There is no server here to post to — the site is a static export — so the
   * host does the receiving. Netlify records every submission against the site
   * and forwards it to whichever address is set under Forms → Notifications,
   * which is where Marketing@buildon.co.in belongs.
   *
   * The mail draft that used to be the whole mechanism is now only the
   * fallback, for when that POST cannot work: on localhost, where there is no
   * Netlify to answer it, and on a deploy with form handling off. It is a poor
   * substitute — it opens the visitor's mail app and asks them to press send,
   * and on a desktop with no mail client it does nothing at all. Which is
   * exactly why it is no longer the primary path.
   */
  /**
   * Record it, then tell the host about it.
   *
   * The database is the one that has to work: it is reached the same way from
   * localhost, from Netlify and from wherever this site is hosted next, so an
   * enquiry is kept whatever happens to the deploy. If that insert fails,
   * nothing was received and the visitor gets their words back as a draft.
   *
   * Netlify is told afterwards, and only because it is what emails the desk.
   * Its failure is not the visitor's problem — the enquiry is already stored
   * and visible in the admin panel — so it is swallowed rather than surfaced.
   * On a host that is not Netlify this simply never succeeds, and nothing
   * about the form changes.
   */
  /**
   * Tell the host, after the fact and without waiting.
   *
   * This is only what emails the desk; the enquiry is already stored by the
   * time it runs. Awaiting it kept the visitor on "Sending…" for as long as
   * the network took — on a slow connection, long enough to give up, reload
   * and send a second copy — for a request whose outcome does not concern
   * them. Its failure is swallowed for the same reason. On a host that is not
   * Netlify it simply never succeeds, and nothing about the form changes.
   */
  function notifyHost(data: FormData) {
    /* The dev server answers a POST to "/" with 200 rather than refusing it,
       so there is nothing in the response to tell a delivered form from a
       page. Skipped outright rather than trusted. */
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)) return;

    void fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data as unknown as Record<string, string>).toString(),
    }).catch(() => {});
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    /* Both ends of each range, and the upper ones are the insert policy's own
       numbers (0003_enquiries.sql). Without them an over-long message passes
       the form, is refused by the database, and the visitor is dropped into
       the mail-draft fallback with no idea which field was the problem. */
    const next: Errors = {};
    if (name.length < 2) next.name = t.errors.name;
    else if (name.length > 120) next.name = t.errors.nameLong;
    if (!emailPattern.test(email)) next.email = t.errors.email;
    else if (email.length > 200) next.email = t.errors.emailLong;
    if (phone.replace(/\D/g, "").length < 8) next.phone = t.errors.phone;
    else if (phone.length > 40) next.phone = t.errors.phoneLong;
    if (message.length < 10) next.message = t.errors.message;
    else if (message.length > 5000)
      next.message = t.errors.messageLong;

    setErrors(next);
    if (Object.keys(next).length > 0) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }

    data.set("form-name", ENQUIRY_FORM);
    const origin = source ?? "Page form";
    data.set("source", origin);
    data.set("page", window.location.pathname);

    /* Its own column since 0025. It used to ride inside the message, which
       put it in the admin panel's message box — where correcting it meant
       editing the visitor's own words, and nothing could total or sort by
       it. */
    const typed = Number(String(data.get("quantity") ?? "").trim());
    const quantity = Number.isFinite(typed) && typed > 0 ? typed : undefined;

    setStatus("sending");

    submitEnquiry({
      name,
      email,
      phone,
      message,
      company: String(data.get("company") ?? ""),
      enquiryType: String(data.get("enquiryType") ?? ""),
      product: String(data.get("product") ?? ""),
      quantity,
      source: origin,
      page: window.location.pathname,
    }).then(
      () => {
        /* Stored. Everything after this point is housekeeping, and none of it
           may reach the catch below — a thrown reset would otherwise open a
           mail draft for an enquiry that is already in the database, and the
           desk would get it twice. */
        setStatus("sent");
        try {
          form.reset();
          notifyHost(data);
        } catch {
          /* Nothing here is worth telling the visitor about. */
        }
      },
      () => {
        /* Nothing received it. Hand the visitor their own words back rather
           than an apology — a draft they can send beats a form that ate the
           message — but say so first, because a mail client that does not
           open leaves an otherwise silent failure. */
        setStatus("idle");
        setErrors({ message: t.failed });

        const lines = [
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone}`,
        ];
        const company = String(data.get("company") ?? "").trim();
        const enquiryType = String(data.get("enquiryType") ?? "").trim();
        const chosen = String(data.get("product") ?? "").trim();
        if (company) lines.push(`Company: ${company}`);
        if (enquiryType) lines.push(`Enquiry type: ${enquiryType}`);
        if (chosen) lines.push(`Product: ${chosen}`);
        if (quantity) lines.push(`Quantity: ${quantity} bags`);
        lines.push("", message);

        window.location.href = `mailto:${site.enquiryEmail}?subject=${encodeURIComponent(
          `Enquiry from ${name}`,
        )}&body=${encodeURIComponent(lines.join("\n"))}`;
      },
    );
  }

  /* Sent. The form is replaced rather than left on screen with a notice above
     it: a form still sitting there invites a second send, and the commonest
     reason anyone does that is not being sure the first one worked. */
  if (status === "sent") {
    return (
      <div
        role="status"
        className={`rounded-2xl border border-brand-200 bg-brand-50/50 p-6 text-center ${className}`}
      >
        <p className="font-display text-lg font-semibold">{t.sentTitle}</p>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{t.sentBody}</p>
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-5 cursor-pointer text-sm font-semibold text-brand-500 transition hover:text-brand-600"
        >
          {t.sentAgain}
        </button>
      </div>
    );
  }

  /*
   * One form, everywhere.
   *
   * There were two: a short one on the home page and /contact-us with
   * underlined fields, and this one — boxed fields, company, enquiry type
   * and product — behind Get a Quote. The short one was deliberate, on the
   * reasoning that a form asking six questions before it will take a
   * message is a form fewer people finish.
   *
   * It also meant the desk got a different shape of enquiry depending on
   * where the visitor happened to be standing, and no way to tell whether a
   * missing company name meant "none" or "never asked". Buildon asked for
   * the quote form everywhere, so that is what this is.
   */
  return (
    <form
      name={ENQUIRY_FORM}
      method="POST"
      onSubmit={handleSubmit}
      noValidate
      className={className}
    >
      {/* Carried so a submission still arrives if the POST above never runs
          — JavaScript blocked, or a browser that falls back to a plain
          form submit. Netlify matches it to the hidden definition. */}
      <input type="hidden" name="form-name" value={ENQUIRY_FORM} />
      <Filled
        name="name"
        idPrefix={idPrefix}
        label={t.labels.name}
        placeholder={t.placeholders.name}
        error={errors.name}
        autoComplete="name"
      />

      <div className="gap-x-5 sm:grid sm:grid-cols-2">
        <Filled
          name="phone"
          idPrefix={idPrefix}
          label={t.labels.phone}
          placeholder={t.placeholders.phone}
          type="tel"
          error={errors.phone}
          autoComplete="tel"
        />
        <Filled
          name="email"
          idPrefix={idPrefix}
          label={t.labels.email}
          placeholder={t.placeholders.email}
          type="email"
          error={errors.email}
          autoComplete="email"
        />
      </div>

      <Filled
        name="company"
        idPrefix={idPrefix}
        label={t.labels.company}
        placeholder={t.placeholders.company}
        autoComplete="organization"
      />

      {/* Side by side when both are here, full width when the product
          dropdown is not: a lone select in a half-width column beside empty
          space reads as a field that lost its partner. */}
      <div className={withProduct ? "gap-x-5 sm:grid sm:grid-cols-2" : ""}>
        <Filled
          name="enquiryType"
          idPrefix={idPrefix}
          label={t.labels.enquiryType}
          placeholder={t.placeholders.enquiryType}
          options={t.types}
        />
        {withProduct && (
          <Filled
            name="product"
            idPrefix={idPrefix}
            label={t.labels.product}
            placeholder={t.placeholders.product}
            options={contact.productOptions}
            defaultValue={defaultProduct}
            onChange={setProduct}
          />
        )}
      </div>

      {/* How much, once there is a something to count.
          
          Not on the form from the start: "How much do you need?" above an
          empty product dropdown is a question with no subject, and a field
          that cannot be answered yet is one people skip and then forget to
          come back to. Choosing a product is what makes it a real question, so
          that is when it appears. */}
      {product && (
        <Filled
          name="quantity"
          idPrefix={idPrefix}
          label={t.labels.quantity}
          placeholder={t.placeholders.quantity}
          type="number"
        />
      )}

      <Filled
        name="message"
        idPrefix={idPrefix}
        label={t.labels.message}
        placeholder={t.placeholders.message}
        error={errors.message}
        multiline
      />

      {/* The same button the rest of the site uses — the pill, not the
          split white-and-orange control the reference has. A dialog is a
          worse place than most to invent a one-off shape. */}
      <button
        suppressHydrationWarning
        type="submit"
        disabled={status === "sending"}
        className="group mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-500 px-8 py-3.5 font-display font-medium tracking-wide text-white transition hover:bg-brand-600 sm:w-auto"
      >
        {status === "sending" ? t.sending : t.submit}
        <ArrowIcon className="size-5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </form>
  );
}

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
  defaultValue,
  onChange,
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
  /** Preselected, for a form opened from the thing it is about. */
  defaultValue?: string;
  /** For a select whose answer changes what else the form asks. */
  onChange?: (value: string) => void;
}) {
  const id = `${idPrefix}${name}`;
  const errorId = `${id}-error`;

  /* White with a quiet border, which is the only pair that survives both
     backgrounds this form now sits on.

     It used to be a grey fill with no border: inside the white dialog the fill
     was the whole edge of the field, and that was enough. On the home page and
     /contact-us the band behind it is the same grey, so the fields vanished —
     eight labels above eight pieces of placeholder text floating on nothing.
     The border is what marks the field now, and the fill no longer has to. */
  const box =
    "w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] text-ink-900 outline-none transition " +
    "placeholder:text-ink-400 focus:ring-2 focus:ring-brand-500/15 " +
    (error ? "border-signal-500" : "border-line focus:border-brand-500");

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
            /* key, so React rebuilds the select when the preselection changes
               — an uncontrolled field keeps its first defaultValue otherwise,
               and the dialog is reused for every product on the page. */
            key={defaultValue ?? ""}
            defaultValue={defaultValue ?? ""}
            onChange={onChange ? (event) => onChange(event.target.value) : undefined}
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
          /* A quantity is a whole positive number, and on a phone it should
             open the keypad rather than the alphabet. The spinner arrows are
             hidden in globals.css: they are a fiddly way to reach 500. */
          {...(type === "number"
            ? { inputMode: "numeric", min: 1, step: 1 }
            : {})}
          /* A phone box takes digits and nothing else — see lib/phone.ts. */
          {...(type === "tel"
            ? { inputMode: "tel", maxLength: 15, onInput: keepDigits }
            : {})}
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
