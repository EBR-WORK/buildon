"use client";

import { useEffect, useState } from "react";
import { getBuildHook, triggerDeploy } from "@/lib/cms/deploy";
import { useToast } from "./Toast";

/**
 * The button that puts saved work on the live site.
 *
 * It exists because this site is a static export, which splits one idea an
 * editor has — "make this change" — into two: Save writes to the database and
 * is instant; the public pages were built into HTML and keep showing what they
 * were built with until another build runs.
 *
 * Nothing in the panel used to say that. An editor saved a post, opened the
 * site, saw the old one, and could only conclude the save had failed.
 *
 * What it cannot do is report the outcome. The build hook sends no CORS
 * headers, so the browser starts the deploy and is then refused the reply —
 * see triggerDeploy. "Asked" is the most this can honestly claim, and the
 * wording stops short of saying published.
 */

/** Long enough that a double-press cannot queue two builds by accident. */
const COOLDOWN_MS = 60_000;

export default function PublishButton({ className = "" }: { className?: string }) {
  const { confirm, notify } = useToast();
  const [hook, setHook] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    getBuildHook().then((value) => {
      if (alive) setHook(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  /* Clears itself, so the button comes back without a reload. */
  useEffect(() => {
    if (sentAt === null) return;
    const timer = window.setTimeout(() => setSentAt(null), COOLDOWN_MS);
    return () => window.clearTimeout(timer);
  }, [sentAt]);

  /* Nothing at all when no hook is set.
     It used to explain itself here — "no publish hook set, add one under
     Team" — which put a paragraph of instructions in a 14rem column that is
     otherwise two words per line, and wrapped to five. The Team screen says
     the same thing where there is room for it and where the person who can
     act on it is already standing. */
  if (!hook) return null;

  async function publish() {
    const ok = await confirm({
      title: "Publish the site now?",
      body: "This rebuilds the site with everything saved so far — including anything another editor has saved. It takes a couple of minutes.",
      confirmLabel: "Publish",
    });
    if (!ok) return;

    setBusy(true);
    try {
      await triggerDeploy(hook!);
      setSentAt(Date.now());
      notify(
        "Build started",
        "The site rebuilds in a couple of minutes. Reload it then to see the change.",
        "success",
      );
    } catch (e) {
      notify(
        "Could not start the build",
        e instanceof Error ? e.message : "Check the hook under Team.",
        "danger",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void publish()}
      disabled={busy || sentAt !== null}
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {busy ? "Starting…" : sentAt !== null ? "Building…" : "Publish"}
    </button>
  );
}
