import type { Metadata } from "next";
import TeamEditor from "@/components/admin/TeamEditor";

export const metadata: Metadata = { title: "Team" };

/** /admin/team — who may edit the site. Super admins only. */
export default function AdminTeamPage() {
  return <TeamEditor />;
}
