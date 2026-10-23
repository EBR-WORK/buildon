"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { describeRole } from "@/lib/cms/auth";
import { panelsFor } from "@/lib/cms/roles";
import { loadNotifications, type Stream } from "@/lib/cms/notifications";
import { site } from "@/lib/content";
import { RESET_PATH } from "@/lib/cms/auth";
import { useAdminMaybe } from "./AuthGate";

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

/* The rail is whatever this role may open, from src/lib/cms/roles.ts. One
   list for every role, so adding a role is an entry in that file rather than a
   hunt through components. */

export default function AdminRail() {
  const admin = useAdminMaybe();
  const pathname = usePathname();
  const profile = admin?.profile ?? null;

  /* Counts for the rail, so somebody learns about work wherever they are.

     The dashboard carries the same notifications in full, but it is not where
     most roles land: homeFor() sends them to their first panel, and Presales
     — who can be assigned leads — never opens /admin at all. A badge in the
     rail is on every screen, which is where a notification has to be to be
     one.

     Declared before the early return below, because a hook that runs on some
     renders and not others changes React's hook order between them. */
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!profile?.id) return;
    let alive = true;
    loadNotifications(profile).then((streams: Stream[]) => {
      if (!alive) return;
      /* Keyed by the screen the work is on, because that is what the rail
         knows about. Two streams can land on the same screen — leads assigned
         to you and leads waiting to be assigned are both Leads — and the badge
         should say how many things are new there, not how many kinds. */
      const byHref: Record<string, number> = {};
      for (const stream of streams) {
        byHref[stream.href] = (byHref[stream.href] ?? 0) + stream.items.length;
      }
      setCounts(byHref);
    });
    return () => {
      alive = false;
    };
  }, [profile, pathname]);

  /* No rail on the reset screen: it renders outside the gate, for someone who
     is not signed in, so every link and the Sign out button would be furniture
     for a session that does not exist. */
  if (!admin || pathname === RESET_PATH) return null;

  const { signOut } = admin;

  const pages = panelsFor(profile?.role);

  /* Defined once, rendered in both layouts. The two differ enough that sharing
     the surrounding markup would cost more in conditional classes than it
     saves, but these two controls must not drift apart. */
  const actions = (
    <>
      {/* The Publish button was here.
          
          It was removed because publishing is no longer something a person
          does: a change to the content now triggers the rebuild by itself —
          see supabase/migrations/0017_autopublish.sql. A button that says
          "Publish" beside a site that publishes itself is a button people
          press to find out whether it is needed. */}

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
              {(counts[page.href] ?? 0) > 0 && (
                <span className="ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full bg-brand-500 px-1.5 text-xs font-semibold text-white">
                  {counts[page.href]}
                </span>
              )}
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
          {/* No "Pages" / "Settings" split any more. That made sense when every
              account saw the same list and the only question was whether Team
              was on the end of it. With six roles the list IS the role, and a
              salesperson's one entry under a heading called Pages reads as a
              page whose siblings have gone missing. */}
          <ul className="space-y-1">
            {pages.map((page) => (
              <li key={page.href}>
                <RailLink {...page} active={pathname === page.href} count={counts[page.href] ?? 0} />
              </li>
            ))}
          </ul>
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
  count,
}: {
  href: string;
  label: string;
  note: string;
  active: boolean;
  /** How much is new here. Zero shows nothing at all. */
  count: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`block rounded-xl px-3 py-2.5 transition ${
        active ? "bg-brand-50 text-brand-600" : "hover:bg-surface"
      }`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[15px] font-medium">{label}</span>
        {count > 0 && (
          /* Counted for a screen reader as well, because a number alone beside
             a link says nothing about what it counts. */
          <span
            className="inline-flex min-w-[1.4rem] justify-center rounded-full bg-brand-500 px-1.5 py-0.5 text-xs font-semibold text-white"
            aria-label={`${count} new`}
          >
            {count}
          </span>
        )}
      </span>
      <span className={`block text-sm ${active ? "text-brand-500" : "text-ink-500"}`}>
        {note}
      </span>
    </Link>
  );
}
