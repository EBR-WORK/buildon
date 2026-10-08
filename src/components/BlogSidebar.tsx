import Link from "next/link";
import { publishedBlog } from "@/lib/cms/published";
import { blogTags } from "@/lib/blogDetails";
import SearchBox from "./SearchBox";
import { ChevronRightIcon } from "./icons";

/**
 * The reference's blog sidebar: search, categories, tags.
 *
 * Each widget is its own white card — background #fff, 25px/20px of padding and
 * a 3% shadow — with the heading carrying a 3px skin-coloured bar pinned to the
 * card's left edge. Search is the exception there too: the reference strips its
 * card away and lets the field stand on its own.
 *
 * The reference's cards are square-cornered. These are not: every other card on
 * this site is rounded-2xl, and a square sidebar beside rounded post cards read
 * as a piece of another design.
 *
 * Everything here is chrome shared by the listing and the post pages, so it
 * lives in one component rather than being written out twice.
 */

/**
 * The reference types a good third of its tags in lower case — "buildon",
 * "plaster", "gypsum plaster services" — beside others that are capitalised, so
 * the cloud reads as two different lists. Only the first letter of each word is
 * raised: the rest is left alone, so "P20", "&" and the reference's own casing
 * inside a word survive.
 */
function capitalise(label: string) {
  return label.replace(/(^|\s)(\p{Ll})/gu, (_, gap, letter) => gap + letter.toUpperCase());
}

/** One widget card, heading bar included. */
function Widget({
  title,
  children,
  bare = false,
}: {
  title: string;
  children: React.ReactNode;
  /** Search sits outside a card on the reference. */
  bare?: boolean;
}) {
  if (bare) return <div className="mb-6">{children}</div>;

  return (
    <section className="mb-6 rounded-2xl border border-line bg-white px-5 py-6 shadow-[0_0_12px_0_rgba(50,50,50,0.03)]">
      {/* The bar is 3px by 31px at the card's left edge, which is what the
          reference's left: -20px comes to against its 20px of padding. */}
      <h2 className="relative mb-5 font-display text-xl leading-snug font-semibold text-ink-900 before:absolute before:top-1 before:-left-5 before:h-[31px] before:w-[3px] before:bg-brand-500 before:content-['']">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function BlogSidebar({
  className = "",
  searchId = "sidebar-search",
  showSearch = true,
}: {
  className?: string;
  searchId?: string;
  /** The listing leaves it out; the post pages keep it. */
  showSearch?: boolean;
}) {
  return (
    <aside className={className}>
      {showSearch && (
        <Widget title="Search" bare>
          <SearchBox id={searchId} />
        </Widget>
      )}

      <Widget title="Categories">
        {/* One category, as on the reference — but the count is this site's own
            post total rather than the reference's 33, which counts drafts and
            pages the listing never shows. */}
        <ul>
          <li className="flex items-center justify-between gap-3">
            <Link
              href="/blog"
              className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-ink-700 transition hover:text-brand-500"
            >
              <ChevronRightIcon className="size-4 text-brand-500" />
              Blog
            </Link>

            <span className="grid size-[23px] place-items-center rounded-full bg-brand-500 text-[11px] font-semibold text-white">
              {publishedBlog.cards.length}
            </span>
          </li>
        </ul>
      </Widget>

      <Widget title="Tags">
        {/* The reference's own pill: 7px/25px inside a 2em radius, 1px #7d7d7d
            on white, 14px semibold #35382f, filling with the skin colour on
            hover as its border fades out. Inert, because the /tag/ archives it
            links to are WordPress routes with no counterpart here — so each
            one runs a site search for its own words instead, which lands the
            reader on the posts and products that tag would have collected. */}
        <ul className="flex flex-wrap gap-2.5">
          {blogTags.map((tag) => (
            <li key={tag.slug}>
              <Link
                href={`/search?q=${encodeURIComponent(tag.label)}`}
                className="inline-block rounded-full border border-ink-500 bg-white px-6 py-[7px] text-sm font-semibold text-ink-700 transition duration-300 hover:border-transparent hover:bg-brand-500 hover:text-white focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {capitalise(tag.label)}
              </Link>
            </li>
          ))}
        </ul>
      </Widget>
    </aside>
  );
}
