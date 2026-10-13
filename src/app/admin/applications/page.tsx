import type { Metadata } from "next";
import ApplicationsList from "@/components/admin/ApplicationsList";

export const metadata: Metadata = { title: "Applications" };

/** /admin/applications — who has applied to the openings. */
export default function AdminApplicationsPage() {
  return <ApplicationsList />;
}
