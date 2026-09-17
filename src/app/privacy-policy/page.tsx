import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { privacyPage, site } from "@/lib/content";

export const metadata: Metadata = {
  title: privacyPage.title,
  description: `${privacyPage.title} for ${site.legalName}.`,
  alternates: { canonical: privacyPage.path },
  openGraph: {
    type: "website",
    url: `${site.url}${privacyPage.path}/`,
    title: `${privacyPage.title} | ${site.name}`,
  },
};

export default function Page() {
  return <LegalPage content={privacyPage} />;
}
