import type { Metadata } from "next";
import Dashboard from "@/components/admin/Dashboard";

export const metadata: Metadata = { title: "Dashboard" };

/** /admin — the landing screen. A client component, because what it counts
    and what it offers both depend on who is signed in. */
export default function AdminDashboardPage() {
  return <Dashboard />;
}
