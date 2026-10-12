import type { Metadata } from "next";
import EnquiriesList from "@/components/admin/EnquiriesList";

export const metadata: Metadata = { title: "Enquiries" };

/** /admin/enquiries — what the public forms have sent in. */
export default function AdminEnquiriesPage() {
  return <EnquiriesList />;
}
