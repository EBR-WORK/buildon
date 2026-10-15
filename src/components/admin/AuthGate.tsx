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
  requestPasswordReset,
  RESET_PATH,
  signIn,
  signOut,
  type AdminProfile,
} from "@/lib/cms/auth";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { requestAccess } from "@/lib/cms/access";
import AdminRail from "./AdminRail";
import {
  ASSIGNABLE_ROLES,
  can,
  capabilityForPath,
  describeRole,
  homeFor,
  ROLES,
  type AdminRole,
} from "@/lib/cms/roles";
import { isSupabaseConfigured, supabase } from "@/lib/cms/supabase";
import { usePathname } from "next/navigation";

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

/**
 * The same, but null instead of a throw when there is no provider.
 *
 * One screen under /admin renders outside the gate — the reset page, which is
 * for someone who cannot sign in. The chrome around it still mounts, because a
 * child route cannot escape its parent layout, so anything in that chrome has
 * to cope with there being no signed-in admin to describe.
 */
export function useAdminMaybe() {
  return useContext(AuthContext);
}

type Status = "loading" | "out" | "no-access" | "in";

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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

  /* The reset page is the one screen under /admin that has to work for someone
     the gate would otherwise turn away: they are here precisely because they
     cannot sign in. It establishes its own session from the emailed link and
     renders its own states, so it goes straight through.

     Placed after the hooks above, never before them — an early return among
     them would change the hook order between renders. */
  if (pathname === RESET_PATH) return <>{children}</>;

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

  /* The screen exists but is not this role's.
     Checked here rather than in each page: one place covers every route, and a
     route added later is covered the day it is added rather than the day
     somebody remembers. The database refuses the writes regardless — this only
     stops a panel looking usable to someone it will not serve. */
  const needs = capabilityForPath(pathname);
  if (needs && !can(profile?.role, needs) && !(needs === "leads:mine" && can(profile?.role, "leads:all"))) {
    return (
      <AuthContext.Provider value={value}>
        <div className="min-h-svh bg-surface text-ink-900">
          <div className="mx-auto flex min-h-svh w-full max-w-[90rem] flex-col lg:flex-row">
            <AdminRail />
            <main className="grid min-w-0 flex-1 place-items-center p-6">
              <div className="max-w-md text-center">
                <h1 className="font-display text-2xl font-semibold">This is not your panel</h1>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
                  You are signed in as a {describeRole(profile?.role).toLowerCase()}, and this
                  screen belongs to another role. Nothing is missing — the menu shows
                  everything you can open.
                </p>
                <Link
                  href={homeFor(profile?.role)}
                  className="mt-6 inline-flex cursor-pointer rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
                >
                  Back to what you can edit
                </Link>
              </div>
            </main>
          </div>
        </div>
      </AuthContext.Provider>
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
  /* Off on every render of this screen. A password left showing is a password
     on screen for whoever walks past next. */
  const [showPassword, setShowPassword] = useState(false);
  /* The forgotten-password step, shown in place of the form rather than on a
     page of its own: the address is usually already typed in above, and a
     navigation would throw it away. */
  const [forgot, setForgot] = useState<"no" | "asking" | "sent">("no");
  /* Asking for an account, which replaces a super admin guessing an address
     and pre-authorising it. See 0011_access_requests.sql. */
  const [joining, setJoining] = useState<"no" | "asking" | "sent">("no");
  const [joinName, setJoinName] = useState("");
  const [joinRole, setJoinRole] = useState<AdminRole>("content_editor");
  const [joinNote, setJoinNote] = useState("");
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

  async function sendReset(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await requestPasswordReset(email);
      setForgot("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function sendRequest(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await requestAccess({ email, name: joinName, role: joinRole, note: joinNote });
      setJoining("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (joining === "sent") {
    return (
      <Shell title="Request sent">
        <p className="text-[15px] leading-relaxed text-ink-500">
          A super admin will see it and set up your account. You will be sent a password
          once they do.
        </p>
        <button
          type="button"
          onClick={() => {
            setJoining("no");
            setError("");
          }}
          className="mt-6 cursor-pointer rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
        >
          Back to sign in
        </button>
      </Shell>
    );
  }

  if (joining === "asking") {
    return (
      <Shell title="Request access">
        <form onSubmit={sendRequest} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink-900">Your name</span>
            <input
              type="text"
              required
              autoFocus
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink-900">Work email</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </label>

          <div>
            <label
              htmlFor="join-role"
              className="mb-1.5 block text-sm font-semibold text-ink-900"
            >
              Joining as
            </label>
            {/* What they do, not what they may do. The super admin sets the
                real role on approval — this only says which team to ask. */}
            <select
              id="join-role"
              value={joinRole}
              onChange={(e) => setJoinRole(e.target.value as AdminRole)}
              className="w-full cursor-pointer rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-500"
            >
              {ASSIGNABLE_ROLES.filter((role) => role !== "super_admin").map((role) => (
                <option key={role} value={role}>
                  {ROLES[role].label}
                </option>
              ))}
            </select>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink-900">
              Anything they should know{" "}
              <span className="font-normal text-ink-500">(optional)</span>
            </span>
            <textarea
              rows={2}
              value={joinNote}
              onChange={(e) => setJoinNote(e.target.value)}
              className="w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
            {busy ? "Sending…" : "Send request"}
          </button>

          <button
            type="button"
            onClick={() => {
              setJoining("no");
              setError("");
            }}
            className="w-full cursor-pointer text-sm font-semibold text-ink-500 transition hover:text-brand-500"
          >
            Back to sign in
          </button>
        </form>
      </Shell>
    );
  }

  /* Sent. Deliberately not "we have emailed you": the message is the same for
     an address with an account and one without, because the alternative is a
     form that tells a stranger which addresses are real. */
  if (forgot === "sent") {
    return (
      <Shell title="Check your email">
        <p className="text-[15px] leading-relaxed text-ink-500">
          If <strong className="font-semibold text-ink-900">{email}</strong> has an
          account, a link to set a new password is on its way. It is good for one hour.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
          Nothing after a few minutes? Check the spam folder, then try again.
        </p>
        <button
          type="button"
          onClick={() => {
            setForgot("no");
            setError("");
          }}
          className="mt-6 cursor-pointer rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
        >
          Back to sign in
        </button>
      </Shell>
    );
  }

  if (forgot === "asking") {
    return (
      <Shell title="Reset your password">
        <form onSubmit={sendReset} className="space-y-4">
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
            {busy ? "Sending…" : "Email me a link"}
          </button>

          <button
            type="button"
            onClick={() => {
              setForgot("no");
              setError("");
            }}
            className="w-full cursor-pointer text-sm font-semibold text-ink-500 transition hover:text-brand-500"
          >
            Back to sign in
          </button>
        </form>
      </Shell>
    );
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

        {/* A div with an explicit label, not a <label> wrapping both: a label
            containing the toggle would make pressing it an activation of the
            input as well, and the field has its own reasons to be touched. */}
        <div>
          <label
            htmlFor="admin-password"
            className="mb-1.5 block text-sm font-semibold text-ink-900"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              /* Room on the right for the toggle, so a long password does not
                 run underneath it. */
              className="w-full rounded-xl border border-line bg-white py-3 pr-12 pl-4 text-[15px] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              /* The state, not the action: a screen reader user needs to know
                 whether their password is on display, which "Show password"
                 alone does not say. */
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-1.5 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-ink-500 transition hover:bg-surface hover:text-ink-900"
            >
              {showPassword ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
            </button>
          </div>
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
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <button
          type="button"
          onClick={() => {
            setForgot("asking");
            setError("");
          }}
          className="w-full cursor-pointer text-sm font-semibold text-ink-500 transition hover:text-brand-500"
        >
          Forgot your password?
        </button>
      </form>

      <div className="mt-6 border-t border-line pt-4">
        <p className="text-sm leading-relaxed text-ink-500">
          Accounts are created by a super admin.
        </p>
        <button
          type="button"
          onClick={() => {
            setJoining("asking");
            setError("");
          }}
          className="mt-1 cursor-pointer text-sm font-semibold text-brand-500 transition hover:text-brand-600"
        >
          Need one? Request access
        </button>
      </div>
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
