import Link from "next/link";
import type { RichRun } from "@/lib/cms/schema";

/**
 * A paragraph assembled from runs — plain, bold, or linked.
 *
 * Shared so that a link written in the admin panel behaves the same wherever it
 * is rendered. The rules match the blog's, which were worked out against the
 * reference's own markup:
 *
 *   - A buildon.co.in URL is rewritten to the local path, because the whole
 *     point of rebuilding the site is not to send readers back to the old one.
 *   - Any other external URL stays a link and opens in a new tab, so the page
 *     being read is not lost behind a citation.
 *   - A run marked bold renders bold. So does a run whose link target does not
 *     exist here yet: the phrase was emphasised either way, and a link to
 *     nothing is worse than no link.
 */

const LINK_CLASS =
  "font-medium text-brand-500 underline underline-offset-2 transition hover:text-brand-600";

/** An internal path, or null if this should not be a local link. */
function localHref(href: string | undefined) {
  if (!href) return null;
  if (href.startsWith("/")) return href;

  const match = /^https?:\/\/(www\.)?buildon\.co\.in(\/.*)?$/.exec(href);
  if (!match) return null;

  const path = (match[2] ?? "/").replace(/\/+$/, "");
  return path || "/";
}

export function RichRuns({ runs }: { runs: readonly RichRun[] }) {
  return (
    <>
      {runs.map((run, index) => {
        const href = localHref(run.href);

        if (href) {
          return (
            <Link key={index} href={href} className={LINK_CLASS}>
              {run.text}
            </Link>
          );
        }

        if (run.href) {
          return (
            <a
              key={index}
              href={run.href}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
            >
              {run.text}
            </a>
          );
        }

        if (run.bold) {
          return (
            <strong key={index} className="font-semibold text-ink-900">
              {run.text}
            </strong>
          );
        }

        return <span key={index}>{run.text}</span>;
      })}
    </>
  );
}
