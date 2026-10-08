"use client";

import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  loadProfile,
  signIn,
  signOut,
  type AdminProfile,
} from "@/lib/cms/auth";
import { isSupabaseConfigured, supabase } from "@/lib/cms/supabase";

/**
 * The door to the admin panel.
 *
 * Three states, not two. "Signed in" and "signed out" miss the one that
 * actually happens: sign-up is open on the project — it has to be, or an
 * invited teammate could never create their account — so somebody can hold a
 * valid session and no profile. They need an explanation, not a login form
 * they have already filled in correctly.
 *
 * None of this is security. The screens behind it are a static bundle anyone
 * can read, and the gate can be stepped around by deleting a DOM node. What
 * stops an outsider is row level security, verified in 0002_admins.sql: no
 * profile, no write. This only keeps the panel from looking usable to someone
 * it will refuse.
 */

type AuthState = {
  profile: AdminProfile | null;
  email: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/** The signed-in admin. Null while loading or for a user with no profile. */
export function useAdmin() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAdmin must be used inside <AuthGate>.");
  return context;
}

type Status = "loading" | "out" | "no-access" | "in";

export default function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  /* Split in two so the effect never calls a state setter synchronously: the
     fetch is awaited and only the callback writes state. That is also what
     makes the `alive` guard possible — a sign-out that unmounts this while the
     profile query is still in flight would otherwise set state on a gone
     component. */
  const apply = useCallback((result: Awaited<ReturnType<typeof loadProfile>>) => {
    setProfile(result.profile);
    setEmail(result.email);
    setStatus(!result.signedIn ? "out" : result.profile ? "in" : "no-access");
  }, []);

  const refresh = useCallback(() => loadProfile().then(apply), [apply]);

  useEffect(() => {
    let alive = true;
    loadProfile().then((result) => {
      if (alive) apply(result);
    });

    /* The session can change without this tab doing anything: a token refresh,
       a sign-out in another tab, an expiry. Without this the panel would keep
       rendering a form whose every save had started failing. */
    const subscription = supabase?.auth.onAuthStateChange(() => {
      loadProfile().then((result) => {
        if (alive) apply(result);
      });
    });

    return () => {
      alive = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, [apply]);

  const value: AuthState = {
    profile,
    email,
    refresh,
    signOut: async () => {
      await signOut();
      await refresh();
    },
  };

  if (!isSupabaseConfigured) {
    return (
      <Shell title="The database is not configured">
        <p className="text-[15px] leading-relaxed text-ink-500">
          Set <code className="text-ink-900">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-ink-900">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in{" "}
          <code className="text-ink-900">.env.local</code>, then restart the dev server.
        </p>
      </Shell>
    );
  }

  if (status === "loading") {
    return (
      <Shell title="Buildon Admin">
        <p className="text-[15px] text-ink-500">Checking your session…</p>
      </Shell>
    );
  }

  if (status === "out") return <LoginScreen onSignedIn={refresh} />;

  if (status === "no-access") {
    return (
      <Shell title="This account cannot edit the site">
        <p className="text-[15px] leading-relaxed text-ink-500">
          You are signed in as{" "}
          <strong className="font-semibold text-ink-900">{email}</strong>, but that address
          has not been given access.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
          Ask a super admin to invite it. Nothing you do here will save until they do.
        </p>
        <button
          type="button"
          onClick={() => void value.signOut()}
          className="mt-6 cursor-pointer rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
        >
          Sign out
        </button>
      </Shell>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function LoginScreen({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  /* Prefilled in development only, and only ever the address: the branch is
     compiled out of a production build, and a password would not belong here
     even if it were not. */
  const [email, setEmail] = useState(
    process.env.NODE_ENV === "development"
      ? (process.env.NEXT_PUBLIC_ADMIN_DEV_EMAIL ?? "")
      : "",
  );
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /*
   * Signing in is the only thing this screen does.
   *
   * It offered "Been invited? Create your account" as well, and that could not
   * work: the project has email confirmation switched on with no SMTP
   * configured, so a sign-up succeeded, sent a confirmation link nobody
   * received, and left the person holding an account they could not use. A
   * route that cannot complete is worse than no route, because the person
   * following it believes they are nearly there.
   *
   * Accounts are made by a super admin instead — the Team screen, or
   * `npm run db:admin -- create <email>`. If email confirmation is ever turned
   * off, this is one revert away in git.
   */
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await signIn(email, password);
      await onSignedIn();
      /* Left busy: onSignedIn unmounts this, and clearing it first flashes the
         form back for a frame. */
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <Shell title="Buildon Admin">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-900">Email</span>
          <input
            type="email"
            required
            autoComplete="username"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-900">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </label>

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
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 border-t border-line pt-4 text-sm leading-relaxed text-ink-500">
        Accounts are created by a super admin. If you need one, or have lost your
        password, ask them to issue it.
      </p>
    </Shell>
  );
}

/** The centred card every signed-out state shares. */
function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid min-h-svh place-items-center bg-surface px-5 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-7 flex items-center gap-3">
          <Image
            src="/brand/logo.png"
            alt=""
            width={120}
            height={36}
            className="h-9 w-auto object-contain"
          />
          <span className="font-display text-sm font-semibold tracking-wide text-ink-500 uppercase">
            Admin
          </span>
        </Link>

        <div className="rounded-2xl border border-line bg-white p-6 sm:p-7">
          <h1 className="mb-5 font-display text-xl leading-snug font-semibold text-ink-900">
            {title}
          </h1>
          {children}
        </div>
      </div>
    </div>
  );
}
