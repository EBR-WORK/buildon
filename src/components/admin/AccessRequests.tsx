"use client";

import { useEffect, useState } from "react";
import {
  decideAccessRequest,
  listAccessRequests,
  type AccessRequest,
} from "@/lib/cms/access";
import {
  createAdmin,
  EmailRateLimited,
  FunctionNotDeployed,
  requestPasswordReset,
} from "@/lib/cms/auth";
import { ASSIGNABLE_ROLES, ROLES, type AdminRole } from "@/lib/cms/roles";
import { CheckIcon, CloseIcon } from "@/components/icons";
import { useToast } from "./Toast";

/**
 * People asking for a panel account.
 *
 * This replaces pre-authorising, which was the super admin guessing: writing
 * an address into a list and hoping that person turned up and signed
 * themselves up — through a sign-up route the login screen does not have, so
 * the list could never be consumed. One invite sat in it for days, for an
 * address with a typo in the domain.
 *
 * Approving is three things in order: make the account, record the decision,
 * then email them a link to set their own password. If the first fails the
 * request stays pending, which is honest — the reverse, marked approved with
 * no account behind it, is a person waiting for something nobody will send.
 *
 * The password the account is created with is never shown. It exists because
 * an account must have one and it is replaced before anyone uses it. A
 * password a super admin reads out is a password that lives in a chat thread
 * afterwards; a link someone follows to choose their own does not.
 */

export default function AccessRequests({ onApproved }: { onApproved: () => void }) {
  const { confirm, notify } = useToast();
  const [rows, setRows] = useState<AccessRequest[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [roles, setRoles] = useState<Record<number, AdminRole>>({});
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;

    listAccessRequests().then(
      (data) => {
        if (!alive) return;
        setRows(data);
        /* The role they asked for, as the starting point — the super admin
           changes it where the answer is different from the question. */
        setRoles(
          Object.fromEntries(
            data.map((row) => [
              row.id,
              (ASSIGNABLE_ROLES.includes(row.requested_role as AdminRole)
                ? row.requested_role
                : "content_editor") as AdminRole,
            ]),
          ),
        );
        setStatus("ready");
      },
      (e: unknown) => {
        if (!alive) return;
        const message = e instanceof Error ? e.message : "";
        setError(
          /schema cache|does not exist/i.test(message)
            ? "The access_requests table is not there yet. Run supabase/migrations/0011_access_requests.sql."
            : message || "Could not read the requests.",
        );
        setStatus("error");
      },
    );

    return () => {
      alive = false;
    };
  }, []);

  async function approve(row: AccessRequest) {
    const role = roles[row.id] ?? "content_editor";

    const ok = await confirm({
      title: `Give ${row.email} a ${ROLES[role].label.toLowerCase()} account?`,
      body: "This creates their account and emails them a link to set their own password. Nothing for you to pass on.",
      confirmLabel: "Approve",
    });
    if (!ok) return;

    setBusy(row.id);
    try {
      const made = await createAdmin(row.email, role);
      await decideAccessRequest(row.id, "approved");
      setRows((all) => all.map((r) => (r.id === row.id ? { ...r, status: "approved" } : r)));
      onApproved();

      /* create-admin invites a brand-new address itself, and that invite IS
         the set-password link. Sending a reset on top would deliver a second,
         contradictory email. Only an address that already had a login needs
         one from here, because an invite cannot be sent to an existing
         account. */
      let emailed = true;
      let limited = false;
      if (!made?.invited) {
        try {
          await requestPasswordReset(row.email);
        } catch (e) {
          emailed = false;
          limited = e instanceof EmailRateLimited;
        }
      }

      notify(
        emailed
          ? made.existing
            ? `${row.email} already had a login`
            : `${row.email} can set their password`
          : limited
            ? `${row.email} has access — the email is rate-limited`
            : `Account created for ${row.email}`,
        emailed
          ? made.existing
            ? "That address already had a login; it now has this role, and they have been emailed a link to set a password."
            : "They have been emailed a link to choose one. Nothing else to send them."
          : /* Only when the mail did not go. Shown once and never again, because
               this is the only moment it exists anywhere readable. */
            limited
              ? "Supabase sends 30 auth emails an hour by default and that is used up. They can press “Forgot your password?” on the sign-in screen themselves, or try again later."
              : made.existing
                ? "The email could not be sent. They can reset their password from the sign-in screen."
                : `The email could not be sent. Password: ${made.password} — pass it on now; it cannot be shown again.`,
        emailed ? "success" : limited ? "info" : "danger",
      );
    } catch (e) {
      notify(
        "Could not create the account",
        e instanceof FunctionNotDeployed
          ? "The create-admin function is not deployed."
          : e instanceof Error
            ? e.message
            : undefined,
        "danger",
      );
    } finally {
      setBusy(null);
    }
  }

  async function decline(row: AccessRequest) {
    const ok = await confirm({
      title: `Decline ${row.email}?`,
      body: "They are not told. The request stops showing here, and they may ask again.",
      confirmLabel: "Decline",
    });
    if (!ok) return;

    try {
      await decideAccessRequest(row.id, "declined");
      setRows((all) => all.map((r) => (r.id === row.id ? { ...r, status: "declined" } : r)));
    } catch (e) {
      notify("Could not decline it", e instanceof Error ? e.message : undefined, "danger");
    }
  }

  const pending = rows.filter((row) => row.status === "pending");

  /* Nothing at all when there is nothing waiting. An empty panel headed
     "Requests" on a screen somebody opened to do something else is furniture. */
  if (status === "ready" && pending.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl border border-brand-200 bg-brand-50/40 p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold sm:text-xl">
        Access requests
        {pending.length > 0 && (
          <span className="ml-2 rounded-full bg-brand-500 px-2 py-0.5 text-sm font-semibold text-white">
            {pending.length}
          </span>
        )}
      </h2>

      {status === "loading" && <p className="mt-3 text-[15px] text-ink-500">Loading…</p>}

      {status === "error" && (
        <p className="mt-3 rounded-xl border border-signal-200 bg-signal-50 p-4 text-[15px] text-ink-900">
          {error}
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {pending.map((row) => (
          <li key={row.id} className="rounded-xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{row.name}</p>
                <p className="text-sm text-ink-500">{row.email}</p>
                <p className="mt-1 text-sm text-ink-500">
                  Asked to join as{" "}
                  <strong className="font-semibold text-ink-900">
                    {ROLES[row.requested_role as AdminRole]?.label ?? row.requested_role}
                  </strong>
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <select
                  value={roles[row.id] ?? "content_editor"}
                  onChange={(event) =>
                    setRoles((all) => ({ ...all, [row.id]: event.target.value as AdminRole }))
                  }
                  aria-label={`Role for ${row.email}`}
                  className="cursor-pointer rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500"
                >
                  {ASSIGNABLE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLES[role].label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={busy === row.id}
                  onClick={() => void approve(row)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckIcon className="size-4" />
                  {busy === row.id ? "Creating…" : "Approve"}
                </button>

                <button
                  type="button"
                  onClick={() => void decline(row)}
                  aria-label={`Decline ${row.email}`}
                  title="Decline"
                  className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-ink-500 transition hover:bg-signal-50 hover:text-signal-500"
                >
                  <CloseIcon className="size-4" />
                </button>
              </div>
            </div>

            {row.note && (
              <p className="mt-3 border-t border-line pt-3 text-[15px] leading-relaxed whitespace-pre-line text-ink-900">
                {row.note}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
