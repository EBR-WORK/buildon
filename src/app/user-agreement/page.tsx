import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { userAgreementPage, site } from "@/lib/content";

export const metadata: Metadata = {
  title: userAgreementPage.title,
  description: `${userAgreementPage.title} for ${site.legalName}.`,
  alternates: { canonical: userAgreementPage.path },
  openGraph: {
    type: "website",
    url: `${site.url}${userAgreementPage.path}/`,
    title: `${userAgreementPage.title} | ${site.name}`,
  },
};

export default function Page() {
  return <LegalPage content={userAgreementPage} />;
}
