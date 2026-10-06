import type { Metadata } from "next";
import ProductsEditor from "@/components/admin/ProductsEditor";

export const metadata: Metadata = { title: "Products" };

/** /admin/products — the grid's heading plus each product's copy. */
export default function AdminProductsPage() {
  return <ProductsEditor />;
}
