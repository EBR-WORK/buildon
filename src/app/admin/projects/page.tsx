import type { Metadata } from "next";
import ProjectsEditor from "@/components/admin/ProjectsEditor";

export const metadata: Metadata = { title: "Projects" };

/** /admin/projects — the 24 developments, their cards and their pages. */
export default function AdminProjectsPage() {
  return <ProjectsEditor />;
}
