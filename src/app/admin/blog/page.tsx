import type { Metadata } from "next";
import BlogEditor from "@/components/admin/BlogEditor";

export const metadata: Metadata = { title: "Blog" };

/** /admin/blog — every article, its details and its body. */
export default function AdminBlogPage() {
  return <BlogEditor />;
}
