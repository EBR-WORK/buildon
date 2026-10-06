"use client";

import Link from "next/link";
import { canManageTeam } from "@/lib/cms/auth";
import { useAdmin } from "./AuthGate";

/**
 * The admin's landing screen.
 *
 * One card per editable page. Every admin sees the same panel: the six content
 * pages are identical whatever your role, because both roles may edit all of
 * them. Team is the single exception, and it is added below rather than being
 * shown and then refused — offering a door that will not open is worse than
 * not showing it.
 *
 * Hiding it is courtesy, not security. /admin/team turns an ordinary admin
 * away on its own, and the policies underneath refuse them whatever the UI
 * does.
 */

const pages = [
  {
    href: "/admin/home",
    title: "Home",
    body: "The hero banner and the client testimonials carousel.",
    sections: ["Hero", "Testimonials"],
  },
  {
    href: "/admin/products",
    title: "Products",
    body: "The grid heading and each product's name, card summary and opening paragraph.",
    sections: ["Grid", "9 products", "Rich text"],
  },
  {
    href: "/admin/projects",
    title: "Projects",
    body: "The developments grid and the page behind each card.",
    sections: ["24 developments", "Photographs", "Rich text"],
  },
  {
    href: "/admin/blog",
    title: "Blog",
    body: "Every article: its details, its featured image and its body, block by block.",
    sections: ["33 articles", "Block editor", "Rich text"],
  },
  {
    href: "/admin/faq",
    title: "FAQs",
    body: "The grouped questions and answers, which also feed the page's structured data.",
    sections: ["3 sections", "18 questions"],
  },
  {
    href: "/admin/career",
    title: "Careers",
    body: "The open roles and their responsibilities.",
    sections: ["3 openings"],
  },
];

/** Super admins only — see the note on the component. */
const TEAM_CARD = {
  href: "/admin/team",
  title: "Team",
  body: "Who may edit the site, and who may decide that.",
  sections: ["Admins", "Invites", "Roles"],
};

export default function Overview() {
  const { profile } = useAdmin();
  const cards = canManageTeam(profile) ? [...pages, TEAM_CARD] : pages;

  return (
    <div className="p-6 sm:p-10">
      <header className="max-w-2xl">
        <h1 className="font-display text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold">
          Content
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
          Edit the words, links and media on the site without touching the code.
          Changes are saved as a draft in this browser; export them when you are
          happy and they go live with the next build.
        </p>
      </header>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:max-w-3xl">
        {cards.map((page) => (
          <li key={page.href} className="flex">
            <Link
              href={page.href}
              className="group w-full rounded-2xl border border-line bg-white p-6 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-card focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <h2 className="font-display text-xl leading-snug font-semibold transition-colors group-hover:text-brand-500">
                {page.title}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{page.body}</p>

              <ul className="mt-4 flex flex-wrap gap-2">
                {page.sections.map((section) => (
                  <li
                    key={section}
                    className="rounded-full bg-surface px-3 py-1 text-sm font-medium text-ink-500"
                  >
                    {section}
                  </li>
                ))}
              </ul>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 max-w-2xl text-sm leading-relaxed text-ink-500">
        Not here: the Life at Buildon galleries, which are fixed event albums,
        and the blog&rsquo;s authors and tags &mdash; three bios on file and a tag
        cloud whose archives this site does not build.
      </p>
    </div>
  );
}
