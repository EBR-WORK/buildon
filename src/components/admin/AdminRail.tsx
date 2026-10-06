"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { canManageTeam, describeRole } from "@/lib/cms/auth";
import { site } from "@/lib/content";
import { useAdmin } from "./AuthGate";

/**
 * The admin's navigation, and the way out of it.
 *
 * Sticky at every width, which takes two shapes rather than one:
 *
 *   lg and up   a full-height column. The page list scrolls in the middle;
 *               the identity and the two actions sit at its foot, on screen
 *               whatever the form beside them is doing.
 *   below lg    a bar pinned to the top. The same column stacked above a form
 *               several screens long scrolls away the moment you start work,
 *               which is exactly how View site and Sign out became
 *               unreachable — so on a phone the pages become a horizontal
 *               strip and the actions move up beside the logo.
 *
 * Client-side because two things depend on who is signed in: the Team link,
 * which only a super admin may use, and the footer saying who that is. Hiding
 * the link is courtesy — /admin/team refuses an ordinary admin on its own, and
 * so do the policies underneath it.
 */

const PAGES = [
  { href: "/admin/home", label: "Home", note: "Hero · Testimonials" },
  { href: "/admin/products", label: "Products", note: "Grid · 9 products" },
  { href: "/admin/projects", label: "Projects", note: "24 developments" },
  { href: "/admin/blog", label: "Blog", note: "33 articles" },
  { href: "/admin/faq", label: "FAQs", note: "3 sections · 18 questions" },
  { href: "/admin/career", label: "Careers", note: "3 openings" },
];

const TEAM = { href: "/admin/team", label: "Team", note: "Who may edit" };

export default function AdminRail() {
  const { profile, signOut } = useAdmin();
  const pathname = usePathname();

  const pages = canManageTeam(profile) ? [...PAGES, TEAM] : PAGES;

  /* Defined once, rendered in both layouts. The two differ enough that sharing
     the surrounding markup would cost more in conditional classes than it
     saves, but these two controls must not drift apart. */
  const actions = (
    <>
      {/* A new tab: an editor checking how a change looks should not lose the
          form they are halfway through filling in. */}
      <Link
        href="/"
        target="_blank"
        rel="noopener"
        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-500 transition hover:text-brand-600"
      >
        View site
        <span aria-hidden>&#8599;</span>
      </Link>

      <button
        type="button"
        onClick={() => void signOut()}
        className="shrink-0 cursor-pointer text-sm font-semibold text-ink-500 transition hover:text-signal-500"
      >
        Sign out
      </button>
    </>
  );

  return (
    <aside className="sticky top-0 z-40 shrink-0 border-b border-line bg-white lg:static lg:w-64 lg:border-r lg:border-b-0">
      {/* -------------------------------------------------- below lg: a bar */}
      <div className="lg:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/admin" className="flex shrink-0 items-center gap-2">
            <Image
              src="/brand/logo.png"
              alt=""
              width={120}
              height={36}
              className="h-7 w-auto object-contain"
            />
          </Link>

          {/* The address is dropped on the narrowest screens; the two actions
              are what has to survive. */}
          <p className="mr-auto hidden min-w-0 truncate text-sm text-ink-500 sm:block">
            {profile?.email}
          </p>
          <span className="mr-auto sm:hidden" />

          <div className="flex items-center gap-4">{actions}</div>
        </div>

        {/* The pages as a strip. Horizontal scrolling rather than a menu
            button: seven destinations is few enough to show, and a drawer adds
            a tap to every move between them. */}
        <nav className="flex gap-1 overflow-x-auto border-t border-line px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {pages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              aria-current={pathname === page.href ? "page" : undefined}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                pathname === page.href
                  ? "bg-brand-50 text-brand-600"
                  : "text-ink-500 hover:bg-surface hover:text-ink-900"
              }`}
            >
              {page.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ---------------------------------------------- lg and up: a column */}
      {/* h-svh caps it at the viewport, so the page list is what scrolls and
          both ends stay put. */}
      <div className="hidden flex-col gap-5 p-5 lg:sticky lg:top-0 lg:flex lg:h-svh">
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

        {/* min-h-0 is what makes the scroll work: a flex child defaults to
            min-height:auto and refuses to shrink below its content, so without
            it the list pushes the footer off the bottom instead of scrolling
            inside the column. */}
        <nav className="-mx-2 min-h-0 flex-1 overflow-y-auto px-2 [scrollbar-width:thin]">
          <p className="mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
            Pages
          </p>
          <ul className="space-y-1">
            {PAGES.map((page) => (
              <li key={page.href}>
                <RailLink {...page} active={pathname === page.href} />
              </li>
            ))}
          </ul>

          {canManageTeam(profile) && (
            <>
              <p className="mt-6 mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                Settings
              </p>
              <ul className="space-y-1">
                <li>
                  <RailLink {...TEAM} active={pathname === TEAM.href} />
                </li>
              </ul>
            </>
          )}
        </nav>

        <div className="shrink-0 border-t border-line pt-4">
          {profile && (
            <div className="mb-3">
              <p className="truncate text-sm font-medium text-ink-900" title={profile.email}>
                {profile.email}
              </p>
              <p className="text-xs text-ink-500">{describeRole(profile.role)}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">{actions}</div>

          <p className="mt-3 text-xs leading-relaxed text-ink-500">{site.name}</p>
        </div>
      </div>
    </aside>
  );
}

function RailLink({
  href,
  label,
  note,
  active,
}: {
  href: string;
  label: string;
  note: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`block rounded-xl px-3 py-2.5 transition ${
        active ? "bg-brand-50 text-brand-600" : "hover:bg-surface"
      }`}
    >
      <span className="block text-[15px] font-medium">{label}</span>
      <span className={`block text-sm ${active ? "text-brand-500" : "text-ink-500"}`}>
        {note}
      </span>
    </Link>
  );
}
