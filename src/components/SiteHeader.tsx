"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { nav, site } from "@/lib/content";
import { CloseIcon, MenuIcon } from "./icons";
import LanguageSwitch from "./LanguageSwitch";
import { getDictionary } from "@/lib/i18n";
import { localeOf, localePath } from "@/lib/i18n/config";

export default function SiteHeader() {
  /* The language is in the path, so it is read from the path rather than
     held in a context: every page already knows which language it is, and a
     provider would be a second source of the same fact. */
  const locale = localeOf(usePathname() ?? "/");
  const t = getDictionary(locale);

  /* Matched by the English label, because that is what `nav` is keyed on and
     the href is where a link actually goes. A missing key renders the English,
     which is the whole point of the merge in getDictionary. */
  const NAV_KEYS: Record<string, keyof typeof t.nav> = {
    Home: "home",
    "About Us": "about",
    Products: "products",
    Clientele: "clientele",
    Projects: "projects",
    Careers: "careers",
    Blog: "blog",
    "Contact Us": "contact",
    FAQs: "faqs",
  };
  const label = (english: string) => {
    const key = NAV_KEYS[english];
    return key ? t.nav[key] : english;
  };
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  /**
   * Home only matches exactly; every other entry also owns its sub-paths, so a
   * future /blog/<slug> still lights up "Blog".
   */
  const isCurrent = (href: string) => {
    /* Compared without the language prefix, so /mr/products lights up
       Products rather than nothing. The nav is the same nine links in every
       language; which language you are reading them in is not what decides
       which one you are on. */
    const here = localePath(pathname ?? "/", "en");
    return href === "/" ? here === "/" : here === href || here.startsWith(`${href}/`);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The drawer is mobile-only: if the viewport grows past lg it must not linger.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 64rem)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open]);

  // Close on Escape, lock background scroll, and return focus to the toggle.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      <div
        className={`bg-white/90 backdrop-blur transition-shadow ${
          scrolled ? "shadow-[0_1px_0_var(--color-line),0_6px_24px_-18px_rgb(22_24_29/0.5)]" : "border-b border-line"
        }`}
      >
        <div className="container-page flex h-20 items-center justify-between gap-3 sm:h-24 sm:gap-4">
          <Link href="/" className="shrink-0" aria-label={`${site.name} — home`}>
            <Image
              src="/brand/logo.png"
              alt={site.name}
              width={179}
              height={87}
              priority
              /* 72px on a large screen, in a 96px bar. The source artwork is
                 179x87, so this is the largest it goes before it is being
                 scaled up and softening. */
              className="h-14 w-auto sm:h-16 lg:h-[4.5rem]"
            />
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-0.5 xl:gap-1">
              {nav.map((item) => {
                const style =
                  "block rounded-md px-2 py-2 font-display text-[15px] font-normal whitespace-nowrap xl:px-3 xl:text-base";
                return (
                  <li key={label(item.label)}>
                    {item.href ? (
                      <Link
                        href={localePath(item.href, locale)}
                        aria-current={isCurrent(item.href) ? "page" : undefined}
                        className={`${style} transition hover:bg-brand-50 hover:text-brand-500 ${
                          isCurrent(item.href)
                            ? "font-medium text-brand-500"
                            : "text-ink-700"
                        }`}
                      >
                        {label(item.label)}
                      </Link>
                    ) : (
                      <span
                        aria-disabled
                        className={`${style} cursor-default text-ink-500`}
                      >
                        {label(item.label)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            {/* Beside the menu button at every width: a language choice that
                hides inside a drawer is one most visitors never find, and the
                people who need it are exactly the ones least likely to go
                looking in English. */}
            <LanguageSwitch />

            <button
              suppressHydrationWarning
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className="inline-flex size-11 items-center justify-center rounded-md border border-line text-ink-700 lg:hidden"
            >
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
              {open ? <CloseIcon className="size-6" /> : <MenuIcon className="size-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 top-0 bg-secondary/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            id="mobile-nav"
            ref={panelRef}
            className="fixed inset-x-0 top-0 z-10 flex max-h-dvh flex-col overflow-y-auto overscroll-contain rounded-b-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lift"
          >
            <div className="mb-4 flex items-center justify-between">
              <Image
                src="/brand/logo.png"
                alt=""
                width={179}
                height={87}
                className="h-12 w-auto sm:h-14"
              />
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => {
                  setOpen(false);
                  toggleRef.current?.focus();
                }}
                className="inline-flex size-11 items-center justify-center rounded-md border border-line text-ink-700"
              >
                <span className="sr-only">Close menu</span>
                <CloseIcon className="size-6" />
              </button>
            </div>
            <nav aria-label="Mobile">
              <ul className="divide-y divide-line">
                {nav.map((item) => (
                  <li key={label(item.label)}>
                    {item.href ? (
                      <Link
                        href={localePath(item.href, locale)}
                        onClick={() => setOpen(false)}
                        aria-current={isCurrent(item.href) ? "page" : undefined}
                        className={`block py-3.5 font-display text-lg ${
                          isCurrent(item.href)
                            ? "font-medium text-brand-500"
                            : "font-normal text-ink-900"
                        }`}
                      >
                        {label(item.label)}
                      </Link>
                    ) : (
                      <span
                        aria-disabled
                        className="block py-3.5 font-display text-lg font-normal text-ink-500"
                      >
                        {label(item.label)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            {/* Only "Call Us" here: the menu above already has a Contact Us
                item, and a second button of the same name under it read as two
                different destinations. The phone number is the one action the
                list does not already offer — so it takes the filled treatment
                the Contact button had, as the drawer's single call to action. */}
            <div className="mt-5">
              <a
                href={site.primaryPhoneHref}
                className="block rounded-full bg-brand-500 px-5 py-3 text-center font-display font-medium tracking-wide text-white transition hover:bg-brand-600"
              >
                {site.callUs}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
