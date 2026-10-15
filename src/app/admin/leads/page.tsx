import type { Metadata } from "next";
import LeadsTable from "@/components/admin/LeadsTable";

export const metadata: Metadata = { title: "Leads" };

/** /admin/leads — every enquiry, as a table somebody can work through. */
export default function AdminLeadsPage() {
  return <LeadsTable />;
}
