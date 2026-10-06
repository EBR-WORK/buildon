import type { Metadata } from "next";
import AdminRail from "@/components/admin/AdminRail";
import AuthGate from "@/components/admin/AuthGate";
import { ToastProvider } from "@/components/admin/Toast";

/**
 * The admin shell.
 *
 * Outside the site's own chrome on purpose: no SiteHeader, no SiteFooter, no
 * reveal animations. An editor should be able to tell at a glance whether they
 * are looking at the site or at the tool that edits it.
 *
 * noindex on the whole group — these pages have no business in search results,
 * and the sitemap excludes them too. That hides the panel; it does not protect
 * it. What protects it is row level security: see AuthGate.
 *
 * AuthGate sits inside ToastProvider so a signed-out screen can still raise a
 * notice, and outside AdminRail because the rail reads the signed-in profile
 * to decide whether to offer Team.
 */

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Buildon Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthGate>
        <div className="min-h-svh bg-surface text-ink-900">
          <div className="mx-auto flex min-h-svh w-full max-w-[90rem] flex-col lg:flex-row">
            <AdminRail />
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </div>
      </AuthGate>
    </ToastProvider>
  );
}
