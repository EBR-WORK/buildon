import type { Metadata } from "next";
import PresalesTracker from "@/components/admin/PresalesTracker";

export const metadata: Metadata = { title: "Presales" };

/** /admin/presales — who is assigned where, and what has to happen next. */
export default function AdminPresalesPage() {
  return <PresalesTracker />;
}
