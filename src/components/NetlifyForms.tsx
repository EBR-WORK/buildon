import { contact } from "@/lib/content";

/**
 * The form definitions Netlify reads at deploy time.
 *
 * Netlify finds forms by parsing the HTML it is given, which is a problem for
 * a form React draws: the enquiry dialog is not in any page's markup until
 * someone opens it, so Netlify would never see it and would reject every
 * submission it sent as "form not found".
 *
 * This is the documented answer — a hidden copy of each form, present in the
 * built HTML, listing every field a submission may carry. Nobody sees it and
 * nothing posts to it. It exists so the real forms, which post with JavaScript,
 * have something registered to post to.
 *
 * Two rules it has to keep, or submissions are silently dropped:
 *   - every `name` the real form sends must appear here, or the value is
 *     discarded on arrival;
 *   - `name` on the form must match the `form-name` the real one posts.
 *
 * Server component on purpose: this must be in the prerendered HTML, which is
 * the only thing Netlify's parser ever reads.
 */

/** The one form name. EnquiryForm posts under this. */
export const ENQUIRY_FORM = "enquiry";

export default function NetlifyForms() {
  return (
    <form
      name={ENQUIRY_FORM}
      data-netlify="true"
      netlify-honeypot="bot-field"
      hidden
    >
      <input type="hidden" name="form-name" value={ENQUIRY_FORM} readOnly />
      {/* The trap. A real visitor never sees this field, so anything that
          fills it is a bot and Netlify drops the submission without telling
          it — which is the point. */}
      <input name="bot-field" readOnly />
      <input name="name" readOnly />
      <input name="email" readOnly />
      <input name="phone" readOnly />
      {/* Only the dialog's longer version sends these two, and a field missing
          from a submission is fine. A field missing from THIS list is not. */}
      <input name="company" readOnly />
      <input name="enquiryType" readOnly />
      <textarea name="message" readOnly />
      {/* Which of the three places on the site it came from, so the office can
          tell a quote request from a contact-page enquiry. */}
      <input name="source" readOnly />
      <input name="page" readOnly />
      {/* Listed so the enquiry types stay in one place rather than being
          retyped here. Rendered as a datalist, not a select: Netlify only
          needs the field name, and this keeps the markup inert. */}
      <datalist id="netlify-enquiry-types">
        {contact.enquiryTypes.map((type) => (
          <option key={type} value={type} />
        ))}
      </datalist>
    </form>
  );
}
