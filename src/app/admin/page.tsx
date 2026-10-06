import type { Metadata } from "next";
import Overview from "@/components/admin/Overview";

export const metadata: Metadata = { title: "Overview" };

/** /admin — the landing screen. The screen itself is a client component
    because what it offers depends on who is signed in. */
export default function AdminOverviewPage() {
  return <Overview />;
}
