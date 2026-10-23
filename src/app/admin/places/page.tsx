import type { Metadata } from "next";
import PlacesEditor from "@/components/admin/PlacesEditor";

export const metadata: Metadata = { title: "Branches" };

/** /admin/places — super admins only, which AuthGate and the policies enforce. */
export default function AdminPlacesPage() {
  return <PlacesEditor />;
}
