"use client";

import Link from "next/link";

import { useCallback, useEffect, useState } from "react";
import {
  canManageTeam,
  createAdmin,
  describeRole,
  FunctionNotDeployed,
  type AdminRole,
} from "@/lib/cms/auth";
import { supabase } from "@/lib/cms/supabase";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { useAdmin } from "./AuthGate";
import { useToast } from "./Toast";

/**
 * Who may edit the site.
 *
 * Only a super admin can reach anything here, and that is enforced in Postgres
 * — the policies in 0002_admins.sql gate every table this screen touches. The
 * check below decides what to render, not what is permitted.
 *
 * Adding somebody is an invitation, not an account. Creating a user needs the
 * secret key, which cannot be in a browser, so the super admin adds an address
 * to the allowlist, and the trigger grants the role the moment an account
 * with that address is created — in the panel, or by hand in the Supabase
 * dashboard. The login screen offers no sign-up: this project has email
 * confirmation on with no SMTP, so a self-service sign-up could never
 * complete.
 * The panel says so plainly, because an invite that looks like it sent an email
 * would leave the new admin waiting for one.
 */

type Person = { id: string; email: string; role: AdminRole; created_at: string };
type Invite = { email: string; role: AdminRole; created_at: string };

export default function TeamEditor() {
  const { profile } = useAdmin();
  const { confirm, notify } = useToast();

  const [people, setPeople] = useState<Person[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("admin");
  const [busy, setBusy] = useState(false);
  /* Shown once, in the panel, and never stored: the Edge Function returns it
     and nothing else ever can. Dismissing it is deliberate, so it cannot be
     scrolled past by accident. */
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  /* Set when the Edge Function is missing, so the screen can explain rather
     than repeat a failure the super admin cannot act on. */
  const [needsFunction, setNeedsFunction] = useState(false);

  /* Fetching and applying are separate so the effect below never calls a state
     setter synchronously, and so an unmount mid-flight cannot write to a gone
     component. */
  const fetchTeam = useCallback(async () => {
    if (!supabase) return null;

    const [peopleResult, inviteResult] = await Promise.all([
      supabase.from("profiles").select("id, email, role, created_at").order("email"),
      supabase
        .from("admin_invites")
        .select("email, role, created_at")
        .is("accepted_at", null)
        .order("email"),
    ]);

    return {
      people: (peopleResult.data ?? []) as Person[],
      invites: (inviteResult.data ?? []) as Invite[],
      error: peopleResult.error?.message ?? "",
    };
  }, []);

  const apply = useCallback((result: Awaited<ReturnType<typeof fetchTeam>>) => {
    if (!result) return;
    setPeople(result.people);
    setInvites(result.invites);
    setError(result.error);
    setLoading(false);
  }, []);

  const load = useCallback(() => fetchTeam().then(apply), [fetchTeam, apply]);

  useEffect(() => {
    let alive = true;
    fetchTeam().then((result) => {
      if (alive) apply(result);
    });
    return () => {
      alive = false;
    };
  }, [fetchTeam, apply]);

  /* An ordinary admin reaching this URL is not doing anything wrong — the rail
     does not offer the link, so they typed it, followed a bookmark, or were
     sent one. Saying no without a way onward leaves them on a blank screen, so
     the pages they can edit are listed right here. */
  if (!canManageTeam(profile)) {
    return (
      <div className="p-6 sm:p-10">
        <div className="max-w-xl rounded-2xl border border-line bg-white p-6 sm:p-8">
          <h1 className="font-display text-xl leading-snug font-semibold text-ink-900">
            Only a super admin can manage the team
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
            You can edit every page on the site &mdash; words, images, videos and
            links. Deciding who else may is kept to super admins.
          </p>

          <p className="mt-6 mb-3 text-sm font-semibold text-ink-900">
            Carry on where you were going:
          </p>
          <ul className="flex flex-wrap gap-2">
            {[
              ["/admin/home", "Home"],
              ["/admin/products", "Products"],
              ["/admin/projects", "Projects"],
              ["/admin/blog", "Blog"],
              ["/admin/faq", "FAQs"],
              ["/admin/career", "Careers"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-block rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-6 border-t border-line pt-4 text-sm leading-relaxed text-ink-500">
            Need someone added or removed? Ask a super admin.
          </p>
        </div>
      </div>
    );
  }

  /**
   * Make the account outright.
   *
   * The password comes back once, from the Edge Function, and is shown until
   * dismissed. Nothing stores it — not this component, not the database, not
   * Supabase in readable form — so a super admin who navigates away has to
   * issue a new one.
   */
  async function create(event: React.FormEvent) {
    event.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email) return;

    setBusy(true);
    try {
      const result = await createAdmin(email, newRole);
      setCreated({ email: result.email, password: result.password });
      setNewEmail("");
      setNewRole("admin");
      setNeedsFunction(false);
      await load();
    } catch (error) {
      if (error instanceof FunctionNotDeployed) {
        setNeedsFunction(true);
        notify(
          "Cannot create accounts yet",
          "The create-admin function is not deployed. Invite instead, or deploy it.",
          "danger",
        );
      } else {
        notify("Could not create the account", (error as Error).message, "danger");
      }
    } finally {
      setBusy(false);
    }
  }

  /**
   * Pre-authorise an address.
   *
   * It does not make an account — nothing here can, without the secret key.
   * It records which role the address should get, so whoever creates the
   * account next does not have to remember.
   */
  async function invite() {
    if (!supabase) return;
    const email = newEmail.trim().toLowerCase();
    if (!email) return;

    setBusy(true);
    const { error: inviteError } = await supabase
      .from("admin_invites")
      .upsert({ email, role: newRole, accepted_at: null }, { onConflict: "email" });
    setBusy(false);

    if (inviteError) {
      notify("Could not invite", inviteError.message, "danger");
      return;
    }

    setNewEmail("");
    setNewRole("admin");
    await load();
    notify(
      "Invited",
      `${email} is pre-authorised as a ${describeRole(newRole).toLowerCase()}. ` +
        "Create the account for them and the role is applied automatically.",
    );
  }

  async function changeRole(person: Person, role: AdminRole) {
    if (!supabase) return;

    const { error: roleError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", person.id);

    if (roleError) {
      /* The guard trigger refuses to demote the last super admin, and says so
         in the message — worth surfacing verbatim rather than flattening. */
      notify("Could not change the role", roleError.message, "danger");
      return;
    }

    await load();
    notify("Role changed", `${person.email} is now a ${describeRole(role).toLowerCase()}.`);
  }

  async function remove(person: Person) {
    if (!supabase) return;

    const self = person.id === profile?.id;
    const ok = await confirm({
      title: `Remove ${person.email}?`,
      body: self
        ? "This is your own account. You will lose access to this panel immediately."
        : "They lose access to the panel at once. Their login still exists — delete it in Supabase if it should not.",
      confirmLabel: "Remove",
    });
    if (!ok) return;

    const { error: removeError } = await supabase.from("profiles").delete().eq("id", person.id);
    if (removeError) {
      notify("Could not remove", removeError.message, "danger");
      return;
    }

    await load();
    notify("Removed", `${person.email} can no longer edit the site.`);
  }

  async function cancelInvite(email: string) {
    if (!supabase) return;
    const ok = await confirm({
      title: `Cancel the invite for ${email}?`,
      body: "An account created for that address later would have no access.",
      confirmLabel: "Cancel invite",
    });
    if (!ok) return;

    await supabase.from("admin_invites").delete().eq("email", email);
    await load();
    notify("Invite cancelled", `${email} is no longer on the allowlist.`);
  }

  const superAdmins = people.filter((person) => person.role === "super_admin").length;

  return (
    <div className="pb-16">
      <header className="border-b border-line bg-white px-6 py-6 sm:px-10 sm:py-8">
        <h1 className="font-display text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold">
          Team
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          Who may edit the site, and who may decide that.
        </p>
      </header>

      <div className="space-y-8 p-6 sm:p-10">
        {error && (
          <p className="rounded-xl border border-signal-200 bg-signal-50 px-4 py-3 text-sm text-signal-500">
            {error}
          </p>
        )}

        {/* ------------------------------------------------------ add someone */}
        <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <h2 className="font-display text-xl leading-snug font-semibold sm:text-2xl">
            Add someone
          </h2>
          <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-ink-500">
            <strong className="font-semibold text-ink-900">Create account</strong> makes
            the login and gives you a password to hand over.{" "}
            <strong className="font-semibold text-ink-900">Invite</strong> only
            pre-authorises the address &mdash; the role is applied whenever the account
            is made. Either way{" "}
            <strong className="font-semibold text-ink-900">no email is sent</strong>, so
            tell them yourself.
          </p>

          <form onSubmit={create} className="mt-5 flex flex-wrap items-end gap-3">
            <label className="min-w-0 flex-1">
              <span className="mb-1.5 block text-sm font-semibold text-ink-900">Email</span>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="name@buildon.in"
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-semibold text-ink-900">Role</span>
              <select
                value={newRole}
                onChange={(event) => setNewRole(event.target.value as AdminRole)}
                className="cursor-pointer rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-500"
              >
                <option value="admin">Admin &mdash; edits content</option>
                <option value="super_admin">Super admin &mdash; also manages the team</option>
              </select>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlusIcon className="size-4" />
              {busy ? "Working…" : "Create account"}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => void invite()}
              className="cursor-pointer rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink-900 transition hover:border-brand-200 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Pre-authorise only
            </button>
          </form>

          {/* The password, shown once. Dismissed deliberately rather than on a
              timer or the next render: this is the only time it exists. */}
          {created && (
            <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-5">
              <p className="text-[15px] font-semibold text-ink-900">
                {created.email} can now sign in.
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">
                This password is shown once and is stored nowhere. Copy it now &mdash; if it
                is lost, create a new one from this screen.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <code className="rounded-lg border border-line bg-white px-4 py-2.5 font-mono text-[15px] tracking-wide text-ink-900 select-all">
                  {created.password}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard
                      ?.writeText(created.password)
                      .then(() => notify("Copied", "The password is on your clipboard."))
                      .catch(() => notify("Could not copy", "Select it and copy by hand.", "danger"));
                  }}
                  className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-brand-500 hover:text-brand-500"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => setCreated(null)}
                  className="cursor-pointer px-2 text-sm font-semibold text-ink-500 transition hover:text-ink-900"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {needsFunction && (
            <div className="mt-5 rounded-2xl border border-signal-200 bg-signal-50 p-5">
              <p className="text-[15px] font-semibold text-ink-900">
                Accounts cannot be created yet
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">
                Making a login needs the service role key, which cannot live in a
                browser, so it happens in a Supabase Edge Function that has not been
                deployed. Until it is, use{" "}
                <strong className="font-semibold text-ink-900">Invite instead</strong>.
              </p>
              <p className="mt-3 text-sm text-ink-500">
                To deploy it:{" "}
                <code className="text-ink-900">
                  npx supabase functions deploy create-admin
                </code>
              </p>
            </div>
          )}
        </section>

        {/* -------------------------------------------------------- people */}
        <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <header className="mb-5 border-b border-line pb-4">
            <h2 className="font-display text-xl leading-snug font-semibold sm:text-2xl">
              Admins
            </h2>
            <p className="mt-1.5 text-[15px] text-ink-500">
              {people.length} {people.length === 1 ? "person" : "people"}
              {superAdmins === 1 && ", one super admin — the last one cannot be removed"}
            </p>
          </header>

          {loading ? (
            <p className="text-[15px] text-ink-500">Loading…</p>
          ) : (
            <ul className="divide-y divide-line">
              {people.map((person) => (
                <li
                  key={person.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-[15px] font-semibold text-ink-900">
                      {person.email}
                      {person.id === profile?.id && (
                        <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-ink-500">
                          you
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-ink-500">
                      Since {person.created_at.slice(0, 10)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={person.role}
                      onChange={(event) =>
                        void changeRole(person, event.target.value as AdminRole)
                      }
                      aria-label={`Role for ${person.email}`}
                      className="cursor-pointer rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500"
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super admin</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => void remove(person)}
                      aria-label={`Remove ${person.email}`}
                      title={`Remove ${person.email}`}
                      className="grid size-9 cursor-pointer place-items-center rounded-lg text-ink-400 transition hover:bg-signal-50 hover:text-signal-500"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ------------------------------------------------------ invites */}
        {invites.length > 0 && (
          <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
            <header className="mb-5 border-b border-line pb-4">
              <h2 className="font-display text-xl leading-snug font-semibold sm:text-2xl">
                Invited, not yet signed up
              </h2>
              <p className="mt-1.5 text-[15px] text-ink-500">
                {invites.length} waiting. They have no access until they create the account.
              </p>
            </header>

            <ul className="divide-y divide-line">
              {invites.map((invite) => (
                <li
                  key={invite.email}
                  className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-ink-900">
                      {invite.email}
                    </p>
                    <p className="text-sm text-ink-500">{describeRole(invite.role)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void cancelInvite(invite.email)}
                    className="cursor-pointer text-sm font-semibold text-ink-500 transition hover:text-signal-500"
                  >
                    Cancel
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
