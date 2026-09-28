"use client";

import { useRef, useState, type FormEvent } from "react";
import { site } from "@/lib/content";
import { applicationFields } from "@/lib/careerDetails";
import { ArrowIcon, ChevronDownIcon } from "./icons";

type Field = "firstName" | "lastName" | "email" | "phone" | "qualification" | "experience" | "ctc" | "preference" | "cv";
type Errors = Partial<Record<Field, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const FIELD_CLASS =
  "h-12 w-full rounded-xl border border-line bg-white px-4 text-[15px] text-ink-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

/** The message under a control, hoisted so it is not redefined each render. */
function FieldError({ name, errors }: { name: Field; errors: Errors }) {
  if (!errors[name]) return null;
  return (
    <p id={`${name}-error`} className="mt-1.5 text-sm text-signal-500">
      {errors[name]}
    </p>
  );
}

/** What the reference's own upload accepts, and a ceiling it does not set. */
const CV_TYPES = [".pdf", ".doc", ".docx"];
const CV_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Strip anything that could add a header to the mail draft.
 *
 * A mailto: URL is parsed by the mail client, and a newline in a value it
 * interpolates can start a new header — a CC to somewhere else, a different
 * subject. encodeURIComponent alone does not prevent that, because the client
 * decodes before parsing, so line breaks are removed from the values first.
 */
function singleLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/**
 * The job application form.
 *
 * The reference posts this to WordPress. This site is a static export with no
 * server to receive a POST — and no server means no safe place to accept an
 * uploaded file — so a valid application opens a mail draft to the company
 * with the answers filled in, and asks the applicant to attach the CV they
 * chose. The file is checked and named but never uploaded, which the form says
 * plainly rather than pretending to send it.
 *
 * Three things the reference's own form gets wrong are fixed here: its work
 * experience and location preference selects share one `name`, so one answer
 * overwrites the other; its upload sets no size limit; and its required fields
 * are marked with a bare asterisk that screen readers do not announce.
 */
export default function ApplicationForm({ jobTitle }: { jobTitle: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [cvName, setCvName] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const read = (name: string) => singleLine(String(data.get(name) ?? ""));

    const values = {
      firstName: read("firstName"),
      lastName: read("lastName"),
      email: read("email"),
      phone: read("phone"),
      qualification: read("qualification"),
      experience: read("experience"),
      ctc: read("ctc"),
      preference: read("preference"),
    };

    const next: Errors = {};
    if (values.firstName.length < 2) next.firstName = "Please enter your first name.";
    if (values.lastName.length < 1) next.lastName = "Please enter your last name.";
    if (!emailPattern.test(values.email)) next.email = "Please enter a valid email address.";
    if (values.phone.replace(/\D/g, "").length < 8)
      next.phone = "Please enter a reachable phone number.";
    if (!values.qualification) next.qualification = "Please choose your qualification.";
    if (!values.experience) next.experience = "Please choose your experience.";
    if (!values.ctc) next.ctc = "Please choose your current CTC.";
    if (!values.preference) next.preference = "Please choose a location.";

    const cv = data.get("cv");
    if (cv instanceof File && cv.size > 0) {
      const named = cv.name.toLowerCase();
      if (!CV_TYPES.some((ext) => named.endsWith(ext)))
        next.cv = "Please choose a PDF or Word document.";
      else if (cv.size > CV_MAX_BYTES) next.cv = "Please choose a file under 5 MB.";
    }

    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const body = [
      `Position: ${jobTitle}`,
      "",
      `Name: ${values.firstName} ${values.lastName}`,
      `Email: ${values.email}`,
      `Phone: ${values.phone}`,
      `Qualification: ${values.qualification}`,
      `Total work experience: ${values.experience}`,
      `Current CTC: ${values.ctc}`,
      `Location preference: ${values.preference}`,
      "",
      cvName ? `CV: ${cvName} — please attach it to this email.` : "Please attach your CV.",
    ].join("\n");

    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(
      singleLine(`Application: ${jobTitle} — ${values.firstName} ${values.lastName}`),
    )}&body=${encodeURIComponent(body)}`;
  }

  /** Ties a control to its message for assistive tech. */
  function invalid(name: Field) {
    return errors[name]
      ? ({ "aria-invalid": true, "aria-describedby": `${name}-error` } as const)
      : {};
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-ink-700">
            First name <span className="text-signal-500">*</span>
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            maxLength={80}
            required
            className={FIELD_CLASS}
            {...invalid("firstName")}
          />
          <FieldError name="firstName" errors={errors} />
        </div>

        <div>
          <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-ink-700">
            Last name <span className="text-signal-500">*</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            maxLength={80}
            required
            className={FIELD_CLASS}
            {...invalid("lastName")}
          />
          <FieldError name="lastName" errors={errors} />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-700">
            Email <span className="text-signal-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={120}
            required
            className={FIELD_CLASS}
            {...invalid("email")}
          />
          <FieldError name="email" errors={errors} />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink-700">
            Phone <span className="text-signal-500">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            required
            className={FIELD_CLASS}
            {...invalid("phone")}
          />
          <FieldError name="phone" errors={errors} />
        </div>

        {/* The four selects. Each has its own name — the reference gives two of
            them the same one, so one answer silently replaces the other. */}
        {(
          [
            ["qualification", applicationFields.qualification],
            ["experience", applicationFields.experience],
            ["ctc", applicationFields.ctc],
            ["preference", applicationFields.preference],
          ] as const
        ).map(([name, field]) => (
          <div key={name}>
            <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink-700">
              {field.label} <span className="text-signal-500">*</span>
            </label>
            {/* Same treatment as the openings filter: the native arrow sits
                against the field's edge, so it is dropped and the chevron drawn
                inside, with pr-12 keeping the longest option clear of it. Here
                the wrapper is a grid cell with a width of its own, so the
                select can take w-full. */}
            <div className="relative">
              <select
                id={name}
                name={name}
                required
                defaultValue=""
                className={`${FIELD_CLASS} cursor-pointer appearance-none pr-12`}
                {...invalid(name)}
              >
                <option value="" disabled>
                  Select
                </option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <ChevronDownIcon
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink-500"
              />
            </div>
            <FieldError name={name} errors={errors} />
          </div>
        ))}
      </div>

      <div className="mt-5">
        <label htmlFor="cv" className="mb-1.5 block text-sm font-medium text-ink-700">
          Upload resume
        </label>
        <input
          id="cv"
          name="cv"
          type="file"
          accept={CV_TYPES.join(",")}
          onChange={(event) => setCvName(event.target.files?.[0]?.name ?? "")}
          className="w-full cursor-pointer rounded-xl border border-line bg-white p-3 text-[15px] text-ink-500 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-600 hover:file:bg-brand-100"
          {...invalid("cv")}
        />
        <FieldError name="cv" errors={errors} />
        <p className="mt-1.5 text-sm text-ink-500">
          PDF or Word, up to 5 MB. Your details open in an email — attach the file there before
          sending.
        </p>
      </div>

      <button
        type="submit"
        className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Apply Now
        <ArrowIcon className="size-4" />
      </button>
    </form>
  );
}
