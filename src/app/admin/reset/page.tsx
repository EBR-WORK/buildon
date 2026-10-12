"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { setNewPassword } from "@/lib/cms/auth";
import { isSupabaseConfigured, supabase } from "@/lib/cms/supabase";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

/**
 * Where the emailed reset link lands.
 *
 * Supabase puts the recovery token in the URL fragment and the client picks it
 * up on load, which gives this page a short-lived session for one job: setting
 * a password. That is why it sits outside AuthGate — the person arriving here
 * is, by definition, someone the gate would turn away.
 *
 * Four states, because three of them are failures a visitor can actually reach:
 * arriving with no token at all (a bookmarked URL), arriving with an expired
 * one (links last an hour), and the link being used twice.
 */

/** Supabase's own default floor. The dashboard can raise it; it cannot go under. */
const MIN_LENGTH = 6;

type Stage = "checking" | "ready" | "no-token" | "done";

export default function ResetPasswordPage() {
  const [stage, setStage] = useState<Stage>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /**
   * Wait for the client to turn the link into a session.
   *
   * detectSessionInUrl does the work, but it is asynchronous and there is no
   * promise to await — so this listens for the event it fires, and also asks
   * once directly for the case where the session was already established
   * before this component mounted.
   */
  useEffect(() => {
    if (!supabase) return;
    let alive = true;

    const settle = (hasSession: boolean) => {
      if (!alive) return;
      setStage(hasSession ? "ready" : "no-token");
    };

    const subscription = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) settle(true);
    });

    /* A grace period, not an immediate verdict: asking the moment this mounts
       can beat the client's own parsing of the fragment, and telling someone
       their link is invalid while it is still being read would be the worst
       possible first impression of this page. */
    const timer = window.setTimeout(() => {
      supabase!.auth.getSession().then(({ data }) => settle(Boolean(data.session)));
    }, 1200);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      subscription.data.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    /* Typed twice because there is no way back: the link is spent, and a typo
       locks the account out until someone sends another one. */
    if (password !== confirm) {
      setError("Those two do not match.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await setNewPassword(password);
      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-svh place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center gap-3">
          <Image
            src="/brand/logo.png"
            alt="Buildon"
            width={120}
            height={40}
            className="h-9 w-auto"
          />
          <span className="font-display text-sm font-semibold tracking-wide text-ink-500 uppercase">
            Admin
          </span>
        </Link>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
          {!isSupabaseConfigured ? (
            <>
              <h1 className="font-display text-xl font-semibold sm:text-2xl">
                The database is not configured
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
                This page cannot do anything without it.
              </p>
            </>
          ) : stage === "checking" ? (
            <>
              <h1 className="font-display text-xl font-semibold sm:text-2xl">
                Checking your link…
              </h1>
              <p className="mt-3 text-[15px] text-ink-500">One moment.</p>
            </>
          ) : stage === "no-token" ? (
            <>
              <h1 className="font-display text-xl font-semibold sm:text-2xl">
                That link has expired
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
                Reset links last an hour and work once. Ask for a new one from the
                sign-in screen.
              </p>
              <Link
                href="/admin"
                className="mt-6 inline-flex cursor-pointer rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Back to sign in
              </Link>
            </>
          ) : stage === "done" ? (
            <>
              <h1 className="font-display text-xl font-semibold sm:text-2xl">
                Password changed
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
                You are signed in with it already. Keep it somewhere safe — nobody,
                including a super admin, can read it back to you.
              </p>
              <Link
                href="/admin"
                className="mt-6 inline-flex cursor-pointer rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Open the panel
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-display text-xl font-semibold sm:text-2xl">
                Set a new password
              </h1>

              <form onSubmit={submit} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-1.5 block text-sm font-semibold text-ink-900"
                  >
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={show ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-line bg-white py-3 pr-12 pl-4 text-[15px] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((shown) => !shown)}
                      aria-pressed={show}
                      aria-label={show ? "Hide password" : "Show password"}
                      className="absolute top-1/2 right-1.5 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-ink-500 transition hover:bg-surface hover:text-ink-900"
                    >
                      {show ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-sm text-ink-500">
                    At least {MIN_LENGTH} characters.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-1.5 block text-sm font-semibold text-ink-900"
                  >
                    Type it again
                  </label>
                  {/* No reveal on this one: its whole job is to be typed from
                      memory, and a visible copy to read off defeats it. */}
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {error && (
                  <p role="alert" className="text-sm font-medium text-signal-500">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full cursor-pointer rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? "Saving…" : "Save new password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
