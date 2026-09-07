import type { Metadata } from "next";
import { Open_Sans, Oswald } from "next/font/google";
import { site } from "@/lib/content";
import "./globals.css";

// Typography follows buildon.co.in: Oswald for display, Open Sans for body copy.
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

// Oswald tops out at 700 — never ask for an 800 weight the family does not have.
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    "gypsum plaster",
    "gypsum plaster manufacturer",
    "gypsum plaster Mumbai",
    "ready mix plaster",
    "one coat plaster",
    "Buildon",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.legalName,
    url: site.url,
    logo: `${site.url}/brand/logo.png`,
    description: site.description,
    email: site.email,
    telephone: site.phones,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.line,
      addressLocality: site.address.locality,
      postalCode: site.address.postalCode,
      addressRegion: site.address.region,
      addressCountry: "IN",
    },
  };

  return (
    <html
      lang="en-IN"
      className={`${openSans.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-md focus:bg-secondary focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          // Static, locally-authored object — no user input reaches this string.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
