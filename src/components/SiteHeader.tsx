"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { contact, nav, site } from "@/lib/content";
import { CloseIcon, MenuIcon, PhoneIcon } from "./icons";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

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
              className="h-14 w-auto sm:h-16"
            />
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-0.5 xl:gap-1">
              {nav.map((item) => {
                const style =
                  "block rounded-md px-2 py-2 font-display text-[15px] font-normal whitespace-nowrap xl:px-3 xl:text-base";
                return (
                  <li key={item.label}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={`${style} text-ink-700 transition hover:bg-brand-50 hover:text-brand-500`}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        aria-disabled
                        className={`${style} cursor-default text-ink-500`}
                      >
                        {item.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            {/* Until the nav appears at lg, the phone is the one-tap action */}
            <a
              href={site.primaryPhoneHref}
              aria-label={`Call ${site.primaryPhone}`}
              className="inline-flex size-11 items-center justify-center rounded-md border border-line text-brand-700 lg:hidden"
            >
              <PhoneIcon className="size-5" />
            </a>
            <button
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
                  <li key={item.label}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block py-3.5 font-display text-lg font-normal text-ink-900"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        aria-disabled
                        className="block py-3.5 font-display text-lg font-normal text-ink-500"
                      >
                        {item.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="rounded-full bg-brand-500 px-5 py-3 text-center font-display font-medium tracking-wide text-white"
              >
                {contact.title}
              </a>
              <a
                href={site.primaryPhoneHref}
                className="rounded-full border border-line px-5 py-3 text-center font-display font-medium tracking-wide text-ink-900"
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
