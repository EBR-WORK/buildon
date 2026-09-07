import Link from "next/link";
import { footerHeadings, footerLinks, newsletter, site, social } from "@/lib/content";
import { socialIcons } from "./icons";
import NewsletterForm from "./NewsletterForm";

const columns = [
  { heading: footerHeadings.about, links: footerLinks.about },
  { heading: footerHeadings.quick, links: footerLinks.quick },
  { heading: footerHeadings.support, links: footerLinks.support },
];

/**
 * Follows buildon.co.in's footer order: the phone block, the newsletter, four
 * link columns — the last being the email and the social icons — then a centred
 * copyright bar.
 */
export default function SiteFooter() {
  return (
    <footer className="relative bg-footer text-white/70">
      {/* The reference's own .footer photo. The file ships pre-darkened — its
          luminance only spans 33-43 of 255 — so it is laid down at full
          opacity (as the reference does) and its range is stretched with a
          brightness/contrast lift. At any lower opacity, or under a blend
          mode, ten levels of detail simply vanish into the ground colour. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[url('/brand/footer-bg.jpg')] bg-cover bg-center brightness-[1.4] contrast-[1.4]"
      />

      {/*
        The reference's tm-phone-block: a skincolor block that rides up over the
        section above. `relative -top-*` does the lift without moving the
        footer's own background; the matching -mb-* keeps the spacing below it.
      */}
      <div className="relative container-page flex justify-end">
        <a
          href={site.primaryPhoneHref}
          className="relative z-10 -top-2 -mb-2 inline-block rounded-md bg-brand-500 px-6 py-3.5 text-center transition hover:bg-brand-600 sm:px-8"
        >
          <h3 className="font-display text-xl leading-snug font-semibold whitespace-nowrap text-white sm:text-2xl">
            {site.callUs}
          </h3>
        </a>
      </div>

      {/* Newsletter */}
      <div className="relative container-page border-b border-white/10 py-12 text-center sm:py-14">
        <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
          {newsletter.titleLead}
          <span className="text-brand-400">{newsletter.titleAccent}</span>
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-[15px]">{newsletter.intro}</p>

        <div className="mt-7">
          <NewsletterForm />
        </div>
      </div>

      {/* Link columns */}
      <div className="relative container-page grid gap-10 py-12 sm:grid-cols-2 sm:gap-x-8 sm:py-14 lg:grid-cols-4">
        {columns.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="font-display text-lg font-semibold text-white">{column.heading}</h2>
            <ul className="mt-5 space-y-3 text-[15px]">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="font-display text-lg font-semibold text-white">
            {footerHeadings.connect}
          </h2>
          <a
            href={`mailto:${site.email}`}
            className="mt-5 block text-[15px] transition hover:text-white"
          >
            {site.email}
          </a>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {social.map((item) => {
              const Icon = socialIcons[item.icon];
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    aria-label={item.label}
                    className="inline-flex size-10 items-center justify-center rounded-full bg-brand-500 text-white transition hover:bg-brand-600"
                  >
                    <Icon className="size-4.5" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="relative bg-footer-bar">
        <div className="container-page py-6 text-center text-sm">
          <p>
            {site.copyright.lead}
            <a href={site.url} className="font-semibold text-brand-400 hover:text-brand-300">
              {site.copyright.brand}
            </a>
            {site.copyright.tail}
          </p>
        </div>
      </div>
    </footer>
  );
}
