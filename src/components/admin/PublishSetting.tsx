"use client";

import { useEffect, useState } from "react";
import { getBuildHook, setBuildHook } from "@/lib/cms/deploy";
import { useToast } from "./Toast";

/**
 * Where the Publish button points, set by a super admin.
 *
 * In the panel rather than in an environment variable, because the browser is
 * where the button lives and the only variables that reach a browser are the
 * NEXT_PUBLIC_ ones — which are inlined into the bundle every visitor
 * downloads. See 0004_settings.sql.
 *
 * The field shows the hook rather than masking it. Masking a value the person
 * reading it is allowed to read, on a screen only super admins can open, buys
 * nothing and makes "is this the right one?" unanswerable.
 */
export default function PublishSetting() {
  const { notify } = useToast();
  const [value, setValue] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getBuildHook().then((hook) => {
      if (!alive) return;
      setValue(hook ?? "");
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function save() {
    setBusy(true);
    try {
      await setBuildHook(value);
      notify(
        value.trim() ? "Publish hook saved" : "Publish hook cleared",
        value.trim() ? "The Publish button is live for every editor." : undefined,
        "success",
      );
    } catch (e) {
      notify("Could not save it", e instanceof Error ? e.message : undefined, "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-line bg-white p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold sm:text-xl">Publishing</h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-500">
        Saving writes to the database straight away. The live site is built HTML, so it
        keeps showing the last build until a new one runs — that is what Publish starts.
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
        Paste the build hook from Netlify:{" "}
        <strong className="font-semibold text-ink-900">
          Site configuration → Build &amp; deploy → Build hooks → Add build hook
        </strong>
        . Leave it empty to hide the Publish button.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="url"
          value={value}
          disabled={!loaded}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://api.netlify.com/build_hooks/…"
          aria-label="Netlify build hook"
          className="min-w-0 flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-[15px] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy || !loaded}
          className="shrink-0 cursor-pointer rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Said plainly, because it is the one thing that makes this different
          from a password field. */}
      <p className="mt-3 text-sm leading-relaxed text-ink-500">
        Anyone signed in to this panel can use the hook to start a build. That is all it
        can do — it cannot read or change anything.
      </p>
    </section>
  );
}
