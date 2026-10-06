/**
 * Manage who may edit the site.
 *
 *   npm run db:admin -- list
 *   npm run db:admin -- invite someone@example.com
 *   npm run db:admin -- invite someone@example.com --super
 *   npm run db:admin -- grant someone@example.com --super
 *   npm run db:admin -- revoke someone@example.com
 *
 * Mostly this exists for one job: creating the FIRST super admin. After that
 * the panel does it, because a super admin can invite from the Team screen.
 *
 * It needs the secret key. Everything here either reads auth.users or writes a
 * profile, and both are closed to the publishable key by design.
 *
 *   invite  adds an email to the allowlist. The person signs up at /admin and
 *           the trigger in 0002_admins.sql grants them the role.
 *   grant   for an account that already exists: writes the profile directly,
 *           rather than waiting for a sign-up that has already happened.
 */

import { readFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const [command, email] = process.argv.slice(2);
const role = process.argv.includes("--super") ? "super_admin" : "admin";

const USAGE = `
  npm run db:admin -- list
  npm run db:admin -- create <email> [--super]   account + role, in one step
  npm run db:admin -- invite <email> [--super]   they sign up themselves
  npm run db:admin -- grant  <email> [--super]   account already exists
  npm run db:admin -- revoke <email>
  npm run db:admin -- password <email>           new password, shown once
`;

/* ------------------------------------------------------------ environment */

if (!existsSync(".env.local")) {
  console.error("x  .env.local not found.");
  process.exit(1);
}

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (match) env[match[1]] = match[2].trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const looksMock = (value) => !value || /mock|replace-me/i.test(value);

if (looksMock(url) || looksMock(secret)) {
  console.error("x  NEXT_PUBLIC_SUPABASE_URL and the secret key must both be set in .env.local.");
  process.exit(1);
}

const supabase = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * A password strong enough to be the only thing guarding the panel, and
 * typeable once before it is changed.
 *
 * Generated rather than taken as an argument: an argument lands in shell
 * history and in the terminal scrollback, and the password people pick for
 * "just a dev account" is the one they reuse.
 *
 * i/l/1/O/0 are left out — this gets read off a screen and retyped.
 */
function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(24);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

/** The auth user for an address, or null. Email is matched case-insensitively. */
async function findUser(address) {
  const wanted = address.toLowerCase();
  /* listUsers is paged; an admin team is small, but looping is still correct
     where assuming one page is merely usually correct. */
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const hit = data.users.find((user) => user.email?.toLowerCase() === wanted);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

/* Throws rather than exiting: process.exit() with the Supabase client's
   handles still open aborts libuv on Windows, which prints a crash after
   otherwise correct output. */
function requireEmail() {
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("A valid email address is required.\n" + USAGE);
  }
  return email.toLowerCase();
}

async function main() {
/* ----------------------------------------------------------------- list */

if (command === "list") {
  const { data: people, error } = await supabase
    .from("profiles")
    .select("email, role, created_at")
    .order("role", { ascending: false })
    .order("email");

  if (error) {
    if (/find the table/i.test(error.message)) {
      console.error("x  The `profiles` table does not exist. Apply");
      console.error("   supabase/migrations/0002_admins.sql first.");
      { process.exitCode = 1; return; }
    }
    console.error(`x  ${error.message}`);
    { process.exitCode = 1; return; }
  }

  console.log(`\nAdmins (${people.length})\n`);
  if (people.length === 0) {
    console.log("  Nobody yet. Nobody can edit the site until there is a super admin:");
    console.log("    npm run db:admin -- grant you@example.com --super\n");
  } else {
    for (const person of people) {
      console.log(`  ${person.role.padEnd(12)} ${person.email}`);
    }
  }

  const { data: invites } = await supabase
    .from("admin_invites")
    .select("email, role, accepted_at")
    .is("accepted_at", null);

  if (invites?.length) {
    console.log(`\nInvited, not yet signed up (${invites.length})\n`);
    for (const invite of invites) console.log(`  ${invite.role.padEnd(12)} ${invite.email}`);
  }
  console.log();
  return;
}

/* --------------------------------------------------------------- invite */

if (command === "invite") {
  const address = requireEmail();

  const { error } = await supabase
    .from("admin_invites")
    .upsert({ email: address, role, accepted_at: null }, { onConflict: "email" });

  if (error) {
    console.error(`x  ${error.message}`);
    { process.exitCode = 1; return; }
  }

  console.log(`\nInvited ${address} as ${role}.\n`);
  console.log("  They sign up at /admin with this exact address and choose a");
  console.log("  password. The role is granted the moment the account is made.");
  console.log("  Nothing is emailed — tell them yourself.\n");
  return;
}

/* --------------------------------------------------------------- create */

if (command === "create") {
  const address = requireEmail();

  if (await findUser(address)) {
    throw new Error(
      `An account already exists for ${address}.\n` +
        `   Give it the role instead:  npm run db:admin -- grant ${address}` +
        (role === "super_admin" ? " --super" : ""),
    );
  }

  const password = generatePassword();

  /* email_confirm skips the confirmation mail. A new project often has no SMTP
     configured, and an unconfirmed account cannot sign in — which looks like a
     broken password rather than a missing email. */
  const { data, error } = await supabase.auth.admin.createUser({
    email: address,
    password,
    email_confirm: true,
  });

  if (error) throw new Error(error.message);

  /* Written directly rather than left to the sign-up trigger: the trigger only
     fires for an invited address, and this account was made, not invited. */
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: data.user.id, email: address, role }, { onConflict: "id" });

  if (profileError) throw new Error(profileError.message);

  console.log(`\n  ${address} created as ${role}.\n`);
  console.log("  Password (shown once, nowhere else):\n");
  console.log(`      ${password}\n`);
  console.log("  Put it in a password manager now. Change it after the first");
  console.log("  sign-in. If it is lost, make a new one:");
  console.log(`      npm run db:admin -- password ${address}\n`);
  return;
}

/* ---------------------------------------------------------------- grant */

if (command === "grant") {
  const address = requireEmail();
  const user = await findUser(address);

  if (!user) {
    console.error(`x  No account exists for ${address}.\n`);
    console.error("   Use `invite` instead — the role is granted when they sign up:");
    console.error(`     npm run db:admin -- invite ${address}${role === "super_admin" ? " --super" : ""}\n`);
    { process.exitCode = 1; return; }
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, email: user.email, role }, { onConflict: "id" });

  if (error) {
    console.error(`x  ${error.message}`);
    { process.exitCode = 1; return; }
  }

  console.log(`\n${address} is now ${role}.\n`);
  return;
}

/* ------------------------------------------------------------- password */

if (command === "password") {
  const address = requireEmail();
  const user = await findUser(address);
  if (!user) throw new Error(`No account exists for ${address}.`);

  const password = generatePassword();
  const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
  if (error) throw new Error(error.message);

  console.log(`\n  New password for ${address}, shown once:\n`);
  console.log(`      ${password}\n`);
  return;
}

/* --------------------------------------------------------------- revoke */

if (command === "revoke") {
  const address = requireEmail();

  const { error } = await supabase.from("profiles").delete().eq("email", address);

  if (error) {
    /* The guard trigger raises rather than silently emptying the team. */
    console.error(`x  ${error.message}`);
    { process.exitCode = 1; return; }
  }

  await supabase.from("admin_invites").delete().eq("email", address);

  console.log(`\n${address} can no longer edit the site.`);
  console.log("  Their login still exists — delete it in Authentication → Users");
  console.log("  if it should not.\n");
  return;
}

console.error("x  Unknown command.\n" + USAGE);
{ process.exitCode = 1; return; }
}

try {
  await main();
} catch (error) {
  console.error(`x  ${error.message}`);
  process.exitCode = 1;
}
