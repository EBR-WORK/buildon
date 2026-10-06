import type { Metadata } from "next";
import CareerEditor from "@/components/admin/CareerEditor";

export const metadata: Metadata = { title: "Careers" };

/** /admin/career — the open roles and the Life at Buildon galleries. */
export default function AdminCareerPage() {
  return <CareerEditor />;
}
