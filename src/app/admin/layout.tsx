import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { site } from "@/lib/content";
import { ToastProvider } from "@/components/admin/Toast";

/**
 * The admin shell.
 *
 * Outside the site's own chrome on purpose: no SiteHeader, no SiteFooter, no
 * reveal animations. An editor should be able to tell at a glance whether they
 * are looking at the site or at the tool that edits it.
 *
 * noindex on the whole group — these pages have no business in search results,
 * and the sitemap excludes them too.
 */

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Buildon Admin" },
  robots: { index: false, follow: false },
};

const sections = [
  {
    title: "Pages",
    links: [
      { href: "/admin/home", label: "Home", note: "Hero · Testimonials" },
      { href: "/admin/products", label: "Products", note: "Grid · 9 products" },
      { href: "/admin/projects", label: "Projects", note: "24 developments" },
      { href: "/admin/blog", label: "Blog", note: "33 articles" },
      { href: "/admin/faq", label: "FAQs", note: "3 sections · 18 questions" },
      { href: "/admin/career", label: "Careers", note: "3 openings" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-svh bg-surface text-ink-900">
        <div className="mx-auto flex min-h-svh w-full max-w-[90rem] flex-col lg:flex-row">
          {/* Rail. Static below lg so a phone does not lose half its screen to
              navigation; sticky beside the form from lg up. */}
          <aside className="shrink-0 border-b border-line bg-white lg:w-64 lg:border-r lg:border-b-0">
            {/* h-svh caps the column at the viewport, so the nav between the
                logo and the footer is what scrolls. Both ends stay put: "View
                site" was being pushed off the bottom once the sixth page was
                added. */}
            <div className="flex flex-col gap-5 p-5 lg:sticky lg:top-0 lg:h-svh">
              <Link href="/admin" className="flex shrink-0 items-center gap-3">
                <Image
                  src="/brand/logo.png"
                  alt=""
                  width={120}
                  height={36}
                  className="h-8 w-auto object-contain"
                />
                <span className="font-display text-sm font-semibold tracking-wide text-ink-500 uppercase">
                  Admin
                </span>
              </Link>

              {/* min-h-0 is what makes the scroll work: a flex child defaults
                  to min-height:auto, which refuses to shrink below its content
                  and so overflows the column instead of scrolling inside it. */}
              <nav className="-mx-2 min-h-0 flex-1 overflow-y-auto px-2 [scrollbar-width:thin]">
                {sections.map((section) => (
                  <div key={section.title}>
                    <p className="mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                      {section.title}
                    </p>
                    <ul className="space-y-1">
                      {section.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="block rounded-xl px-3 py-2.5 transition hover:bg-surface"
                          >
                            <span className="block text-[15px] font-medium">{link.label}</span>
                            <span className="block text-sm text-ink-500">{link.note}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>

              {/* The way back to the real site, and a reminder of which stage
                  this is: the draft lives in this browser until it is exported. */}
              <div className="shrink-0 border-t border-line pt-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 transition hover:text-brand-600"
                >
                  View site
                  <span aria-hidden>&rarr;</span>
                </Link>
                <p className="mt-2.5 text-xs leading-relaxed text-ink-500">
                  Draft stage. Changes are kept in this browser until you export
                  them. {site.name}
                </p>
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
