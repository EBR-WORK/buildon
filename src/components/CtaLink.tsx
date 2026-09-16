import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

type Props = {
  /** Straight from content.ts. Empty means "not wired up yet". */
  href: string;
  className?: string;
  children: ReactNode;
  /**
   * Passed to whichever element renders. The product carousel uses it to stop a
   * mouse press moving focus, which would scroll the row out from under the
   * cursor before the click lands.
   */
  onMouseDown?: MouseEventHandler<HTMLElement>;
};

/**
 * A call to action that follows its href in content.ts, so filling in or
 * clearing a link there is the whole job — no component change needed:
 *
 * - empty             → an inert <button>. Never <a href="">, which reloads
 *                       the page.
 * - "/about-us", "#…"  → next/link, so in-site navigation stays client-side.
 * - "https://…"       → a plain <a> that opens in a new tab.
 * - "mailto:", "tel:"  → a plain <a>.
 *
 * suppressHydrationWarning on the button: password managers and autofill
 * extensions stamp their own attribute (fdprocessedid) onto form controls
 * between the HTML arriving and React hydrating it, and React reports that
 * attribute as a hydration mismatch. It is the visitor's browser doing this, so
 * the warning is silenced on the element they touch — attribute diffing on that
 * one element only, not its children. Links are not stamped, so need nothing.
 */
export default function CtaLink({ href, className, children, onMouseDown }: Props) {
  if (!href) {
    return (
      <button
        suppressHydrationWarning
        type="button"
        className={className}
        onMouseDown={onMouseDown}
      >
        {children}
      </button>
    );
  }

  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} className={className} onMouseDown={onMouseDown}>
        {children}
      </Link>
    );
  }

  const external = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      className={className}
      onMouseDown={onMouseDown}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
