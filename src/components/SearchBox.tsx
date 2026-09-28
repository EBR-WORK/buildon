"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchIcon } from "./icons";

/**
 * The site search box, as the reference's sidebar has it.
 *
 * The reference posts to /?s=<term> and WordPress searches the whole site —
 * pages, posts and products alike — so this does the same, sending the term to
 * /search?q= rather than filtering one listing. There is no server here, so the
 * results page does the matching in the browser.
 *
 * The field is a real <form> with a submit button, so Enter works and the
 * control is announced as a search box either way.
 *
 * It deliberately does not read the current ?q= back out of the URL: doing so
 * needs useSearchParams, which would opt this box out of prerendering and leave
 * a hole where the sidebar's search should be in the static HTML. The results
 * page names the term it searched for instead.
 */
export default function SearchBox({
  className = "",
  autoFocus = false,
  id = "site-search",
}: {
  className?: string;
  autoFocus?: boolean;
  /** Unique per instance: the blog listing carries two, one per breakpoint. */
  id?: string;
}) {
  const router = useRouter();
  const [term, setTerm] = useState("");

  return (
    <form
      role="search"
      className={`relative ${className}`}
      onSubmit={(event) => {
        event.preventDefault();
        const q = term.trim();
        if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
      }}
    >
      <label className="sr-only" htmlFor={id}>
        Search this site
      </label>

      {/* The reference's field: white, square, its own soft shadow rather than
          a border, with the magnifier sitting inside on the right. */}
      <input
        id={id}
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Search ..."
        autoFocus={autoFocus}
        /* The reference's field is square; everything else on this site is not,
           so it takes the same full radius the tag pills and buttons use. */
        className="h-12 w-full rounded-full border border-black/[0.07] bg-white pr-12 pl-5 text-[15px] text-ink-700 shadow-[0_0_10px_0_rgba(3,59,74,0.1)] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />

      <button
        type="submit"
        aria-label="Search"
        className="absolute top-0 right-0 grid size-12 cursor-pointer place-items-center rounded-full text-ink-500 transition hover:text-brand-500"
      >
        <SearchIcon className="size-5" />
      </button>
    </form>
  );
}
