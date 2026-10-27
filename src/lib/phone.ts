/**
 * A phone box that only takes digits.
 *
 * Every form on the site asks for a number, and every one of them accepted
 * whatever was typed: "call me" and "98765 anytime after 6" both reached the
 * leads table, where a salesperson found them at the moment they were trying
 * to ring. The length checks in the insert policy pass either way — fifteen
 * characters of prose is still fifteen characters.
 *
 * So the field refuses anything that is not a digit as it is typed, rather
 * than complaining afterwards. A paste is cleaned the same way: pasting
 * "+91 98765 43210" from a contact card leaves 919876543210, which is the same
 * number and is dialable.
 *
 * WHY NOT ALLOW "+", SPACES AND HYPHENS
 *
 * Because then the column holds four spellings of one number and nothing can
 * match them. The country code is not lost: a number pasted with +91 keeps its
 * 91, and one typed without it is an Indian mobile, which is what nearly every
 * enquiry here is. If overseas dealers ever need the plus sign back, this is
 * the one place to relax it.
 */

/** Digits, and at most fifteen of them — the E.164 maximum. */
export const toDigits = (value: string) => value.replace(/\D/g, "").slice(0, 15);

/**
 * For an uncontrolled input: cleans the box in place as it is typed.
 *
 * The caret jumps to the end when something is actually removed. That only
 * happens on a character this field was never going to keep, so the
 * alternative is leaving it there, which is worse.
 */
export function keepDigits(event: React.FormEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  const cleaned = toDigits(input.value);
  if (cleaned !== input.value) input.value = cleaned;
}
