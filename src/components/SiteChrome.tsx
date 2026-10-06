"use client";

import { usePathname } from "next/navigation";
import BackToTop from "./BackToTop";
import QuotePanel from "./QuotePanel";

/**
 * The floating furniture that belongs to the public site: the back-to-top
 * button and the "Get a Quote" tab.
 *
 * Both are rendered by the root layout, which the admin panel also sits under —
 * so a "Get a Quote" tab was floating over the content editor. They are hidden
 * under /admin: the admin is a tool, not a page a visitor is being sold to, and
 * the tab overlapped its save bar.
 */
export default function SiteChrome() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <BackToTop />
      <QuotePanel />
    </>
  );
}
