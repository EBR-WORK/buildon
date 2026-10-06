import type { Metadata } from "next";
import HomeEditor from "@/components/admin/HomeEditor";

export const metadata: Metadata = { title: "Home" };

/**
 * /admin/home — the first slice of the CMS.
 *
 * The editor is a client component: the whole panel runs in the browser while
 * the content repository is a browser draft, so this route only carries the
 * metadata.
 */
export default function AdminHomePage() {
  return <HomeEditor />;
}
