"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Starts every route at the top.
 *
 * Next's <Link> defaults to *maintaining* scroll position — it only jumps to
 * the top when the incoming page is not already in the viewport. Our pages are
 * long, so clicking a nav link part-way down one page left you the same
 * distance down the next one.
 *
 * A hash is left alone: /#contact and the in-page anchors must still land on
 * their section, and usePathname does not change for hash-only navigation.
 */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.location.hash) return;
    // "instant" overrides the smooth scroll-behavior set on <html>, which would
    // otherwise animate the whole way back up.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
