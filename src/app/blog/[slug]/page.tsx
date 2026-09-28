import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import BlogSidebar from "@/components/BlogSidebar";
import { blogPage, productCatalogue, site } from "@/lib/content";
import {
  blogAuthors,
  blogHref,
  blogPosts,
  getBlogPost,
  type BlogBlock,
  type BlogRun,
} from "@/lib/blogDetails";

/**
 * /blog/<slug> — one template for every post.
 *
 * The body is the typed block list in blogDetails.ts, so a new post is content
 * only. Paragraph runs carry the reference's own bold and links, which is what
 * keeps this readable without injecting raw HTML.
 *
 * The reference hangs Search, Categories and a tag cloud down the right of each
 * post. The tag cloud is reproduced here to its own spec; its /tag/ archives do
 * not exist, so the pills are inert. Search needs script, and Categories lists
 * the single category every post is in, so both are left out, and the rail
 * opens with the other posts instead — the same job the theme's Posts widget
 * does on a project page.
 */

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url: `${site.url}/blog/${post.slug}/`,
      title: `${post.title} | ${site.name}`,
      description: post.description,
      images: [`${site.url}${post.image}`],
      publishedTime: post.published,
      modifiedTime: post.modified,
    },
  };
}

/**
 * A run becomes a link only when its target exists here. The reference's own
 * cross-links point at posts still to be transcribed; sending a reader to the
 * old site would be worse than plain text, so those render unlinked until the
 * post they name lands in blogDetails.ts.
 */
const REFERENCE_PAGES: Record<string, string> = {
  "": "/",
  products: "/products",
  projects: "/projects",
  "about-us": "/about-us",
  "contact-us": "/contact-us",
  clientele: "/clientele",
  faq: "/faq",
  blog: "/blog",
};

function runHref(href: string | undefined) {
  if (!href) return undefined;
  if (href.startsWith("/")) return href;

  const path = href
    .replace(/^https?:\/\/(www\.)?buildon\.co\.in/, "")
    .replace(/^\/|\/$/g, "");

  if (path in REFERENCE_PAGES) return REFERENCE_PAGES[path];

  /* The reference puts its products under the same /products/<slug> paths this
     site uses, so those carry straight over. */
  if (productCatalogue.some((product) => product.href === `/${path}`)) return `/${path}`;

  const post = blogPosts.find((entry) => entry.slug === path);
  return post ? `/blog/${post.slug}` : undefined;
}

/**
 * The eight posts after this one in the listing, wrapping round at the end.
 *
 * Taking the first eight every time put the same rail on every post, which
 * says nothing about where the reader is and never surfaces the rest of the
 * blog — rotating from the current post gives each page a different window,
 * the same way More Projects rotates on a project page.
 */
function railPosts(title: string) {
  const items = blogPage.items;
  const index = Math.max(
    0,
    items.findIndex((item) => item.title === title),
  );

  return Array.from({ length: 8 }, (_, step) => items[(index + step + 1) % items.length]).filter(
    (item) => item.title !== title,
  );
}

const LINK_CLASS =
  "font-medium text-brand-500 underline underline-offset-2 transition hover:text-brand-600";

function renderRun(run: BlogRun, key: number) {
  const href = runHref(run.href);

  if (href) {
    return (
      <Link key={key} href={href} className={LINK_CLASS}>
        {run.text}
      </Link>
    );
  }

  /* The reference cites outside sources — ScienceDirect, Wikipedia, government
     PDFs. Those are real references and stay links, opening in a new tab so the
     article is not lost behind them. */
  if (run.href && !/^https?:\/\/(www\.)?buildon\.co\.in/.test(run.href)) {
    return (
      <a
        key={key}
        href={run.href}
        target="_blank"
        rel="noopener noreferrer"
        className={LINK_CLASS}
      >
        {run.text}
      </a>
    );
  }

  /* Bold, or a cross-link whose target is not here yet — the reference
     emphasises those phrases either way. */
  if (run.bold || run.href) {
    return (
      <strong key={key} className="font-semibold text-ink-900">
        {run.text}
      </strong>
    );
  }

  return <span key={key}>{run.text}</span>;
}

function renderBlock(block: BlogBlock, i: number) {
  switch (block.kind) {
    case "h2":
      return (
        <Reveal key={`${i}-${block.text}`} y={12}>
          <h2 className="mt-10 font-display text-[clamp(1.35rem,1.4vw+0.9rem,1.75rem)] leading-snug font-semibold text-ink-900 sm:mt-12">
            {block.text}
          </h2>
        </Reveal>
      );

    case "h3":
      return (
        <Reveal key={`${i}-${block.text}`} y={12}>
          <h3 className="mt-7 font-display text-xl leading-snug font-semibold text-ink-900 sm:mt-8">
            {block.text}
          </h3>
        </Reveal>
      );

    case "image":
      return (
        <Reveal key={`${i}-${block.src}`}>
          <Image
            src={block.src}
            alt={block.alt}
            width={block.width}
            height={block.height}
            loading="lazy"
            className="mt-8 h-auto w-full rounded-2xl bg-surface sm:mt-10"
          />
        </Reveal>
      );

    case "ul":
      return (
        <Reveal key={i} y={12}>
          <ul className="mt-4 space-y-2 text-[15px] leading-relaxed text-ink-500 sm:text-base">
            {block.items.map((item, j) => (
              <li key={j} className="relative pl-6 before:absolute before:top-[0.6em] before:left-0 before:size-1.5 before:rounded-full before:bg-brand-500">
                {item.map((run, k) => renderRun(run, k))}
              </li>
            ))}
          </ul>
        </Reveal>
      );

    case "p":
      return (
        <p key={i} className="mt-4 text-[15px] leading-relaxed text-ink-500 sm:text-base">
          {block.runs.map((run, j) => renderRun(run, j))}
        </p>
      );
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const others = railPosts(post.title);
  // Only credited authors have a card on the reference; the "buildon co"
  // marketing account has no portrait, and its posts end without one.
  const author = blogAuthors[post.author];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: `${site.url}${post.image}`,
    datePublished: post.published,
    dateModified: post.modified,
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: site.name },
    mainEntityOfPage: `${site.url}/blog/${post.slug}/`,
  };

  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* Posts have no artwork of their own on the reference, so they share
            the blog listing's titlebar — but without its heading: the article
            sets the title as its own <h1> directly below, and some of these run
            to eight lines across the banner. */}
        <PageBanner image={blogPage.banner.image} />

        <section className="section-y">
          <div className="container-page">
            {/* The reference splits this row 9/3 — col-md-9 body, col-md-3
                rail, and on posts the rail sits on the right. */}
            <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] lg:gap-12">
              <article>
                <Reveal>
                  <h1 className="font-display text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold text-ink-900">
                    {post.title}
                  </h1>

                </Reveal>

                {/* No featured image on the page itself: it is the listing
                    card's square crop, a poster with the headline already set
                    into the artwork, so under the same headline it only repeats
                    it. It still carries the card and the social preview. */}

                <div className="mt-8">{post.body.map(renderBlock)}</div>

                {/* Credited posts on the reference close with its author
                    plugin's card: portrait, name, biography. The name is not a
                    link here, because its /author/<slug>/ archive is a
                    WordPress route with no counterpart. */}
                {author?.avatar && (
                  <Reveal y={12}>
                    <div className="mt-12 flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:mt-14 sm:flex-row sm:gap-6 sm:p-7">
                      <Image
                        src={author.avatar}
                        alt={author.name}
                        width={200}
                        height={200}
                        loading="lazy"
                        className="size-20 shrink-0 rounded-full object-cover sm:size-24"
                      />

                      <div className="min-w-0">
                        <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                          Author
                        </p>
                        <p className="mt-1 font-display text-xl leading-snug font-semibold text-ink-900">
                          {author.name}
                        </p>
                        {author.bio && (
                          <p className="mt-2.5 text-[15px] leading-relaxed text-ink-500">
                            {author.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </Reveal>
                )}
              </article>

              {/* The reference's own right rail: search, categories, tags,
                  then the other posts — which stands in for the theme's Posts
                  widget and rotates from this one, so each page opens on a
                  different window of the blog. */}
              {/* Not wrapped in Reveal: this rail is taller than the viewport,
                  and Reveal only fades an element in once 15% of it is on
                  screen — a threshold a very tall element can take half a page
                  of scrolling to meet, leaving white space where the sidebar
                  should be. It is above the fold, so it has nothing to animate
                  in from anyway. */}
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <BlogSidebar />

                <section className="rounded-2xl border border-line bg-white px-5 py-6 shadow-[0_0_12px_0_rgba(50,50,50,0.03)]">
                  <h2 className="relative mb-5 font-display text-xl leading-snug font-semibold text-ink-900 before:absolute before:top-1 before:-left-5 before:h-[31px] before:w-[3px] before:bg-brand-500 before:content-['']">
                    More Posts
                  </h2>

                  <ul className="-mx-5 -mb-6 overflow-hidden rounded-b-2xl border-t border-line">
                    {others.map((item) => {
                      const href = blogHref(item.title);
                      const className =
                        "relative block w-full cursor-pointer px-5 py-4 text-left font-display text-[15px] leading-snug font-medium text-ink-700 transition-all duration-300 ease-linear hover:text-brand-500 hover:shadow-[0_20px_20px_0_rgba(0,0,0,0.06)] before:absolute before:bottom-1/2 before:left-0 before:h-0 before:w-[5px] before:bg-brand-500 before:transition-all before:duration-300 before:[transition-timing-function:cubic-bezier(.645,.045,.355,1)] hover:before:bottom-0 hover:before:h-full";

                      return (
                        <li key={item.title} className="border-b border-line last:border-b-0">
                          {/* Same rail treatment as the project pages. A post
                              with no page yet stays an inert row rather than a
                              dead link. */}
                          {href ? (
                            <Link href={href} className={className}>
                              {item.title}
                            </Link>
                          ) : (
                            <span className={`${className} cursor-default`}>{item.title}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <script
        type="application/ld+json"
        // Static, locally-authored object — no user input reaches this string.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
    </>
  );
}
