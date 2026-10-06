import type { Metadata } from "next";
import FaqEditor from "@/components/admin/FaqEditor";

export const metadata: Metadata = { title: "FAQs" };

/** /admin/faq — the grouped questions on /faq. */
export default function AdminFaqPage() {
  return <FaqEditor />;
}
