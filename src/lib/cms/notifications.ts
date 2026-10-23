"use client";

/**
 * What has arrived for this person since they last looked.
 *
 * One stream per kind of work, each tied to the capability that makes it
 * somebody's business — so the list a person sees follows from their role
 * rather than from a second table of who-gets-told-what. Give HR the jobs
 * capability and they start getting told about applications; there is nothing
 * else to configure.
 *
 * Nothing is stored about the work itself. A lead assigned to me is already
 * recorded as a lead assigned to me, with the time it happened; an
 * application already records when it arrived. The only thing kept here is
 * when each person last looked at each stream, in notification_reads.
 */

import { supabase } from "./supabase";
import { allows, type AdminProfile } from "./auth";
import type { Capability } from "./roles";

export type StreamKey = "leads" | "unassigned" | "applications";

export type NotificationItem = {
  /** Unique within its stream; used as a React key and nothing else. */
  readonly id: number;
  /** The headline — a person's name, usually. */
  readonly title: string;
  /** Everything else worth seeing at a glance, already joined. */
  readonly detail: string;
  /**
   * Who did this, when somebody did.
   *
   * "Super admin assigned you this" tells a salesperson something that "a lead
   * was assigned" does not: whether to ask about it, and whom. Empty for work
   * that simply arrived — nobody assigns an enquiry from the website.
   */
  readonly by: string;
  readonly at: string;
};

export type Stream = {
  readonly key: StreamKey;
  /** Shown when there is exactly one, and when there are several. */
  readonly one: string;
  readonly many: (n: number) => string;
  /** Where the person goes to deal with it. */
  readonly href: string;
  /**
   * The id prefix of the row on that screen, so a notification can point at
   * the one thing it is about rather than at a list to search.
   *
   * Two streams share a prefix where they share a screen: a lead assigned to
   * you and a lead waiting to be assigned are both rows in the same table.
   */
  readonly anchor: string;
  readonly items: readonly NotificationItem[];
};

/**
 * The capability that makes a stream somebody's business, or null for one
 * that needs none.
 *
 * `leads` needs none on purpose. It asks for leads assigned to THIS person,
 * so somebody with none assigned sees nothing whatever their role — the query
 * is the filter, and a capability check on top of it can only be wrong.
 *
 * It was wrong: the first version required `leads:mine`, which Presales does
 * not hold (they have leads:all and leads:work). So a lead assigned to a
 * presales account showed their name in the Assigned column and told them
 * nothing. Anyone who can be handed a lead is told about it.
 */
const NEEDS: Record<StreamKey, Capability | null> = {
  leads: null,
  unassigned: "leads:assign",
  applications: "applications",
};

const COPY: Record<
  StreamKey,
  { one: string; many: (n: number) => string; href: string; anchor: string }
> = {
  leads: {
    one: "A lead has been assigned to you",
    many: (n) => `${n} leads have been assigned to you`,
    href: "/admin/leads",
    anchor: "lead",
  },
  unassigned: {
    one: "A lead is waiting to be assigned",
    many: (n) => `${n} leads are waiting to be assigned`,
    href: "/admin/leads",
    anchor: "lead",
  },
  applications: {
    one: "Someone has applied for a job",
    many: (n) => `${n} people have applied for a job`,
    href: "/admin/applications",
    anchor: "application",
  },
};

/* Asking for more than this is asking for a list nobody reads. The count is
   honest regardless — only the rows shown are capped. */
const LIMIT = 20;


/**
 * Readable names for a set of staff ids.
 *
 * Reads the directory, which staff may do from 0019 — before that policy a
 * salesperson could read only their own profile, so this came back empty and
 * every "assigned by" was blank. It still falls back to blank rather than to
 * an id: a uuid in a sentence is worse than no name at all.
 */
async function labelsFor(ids: string[]): Promise<Record<string, string>> {
  if (!supabase || ids.length === 0) return {};

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role")
    .in("id", ids);

  if (error || !data) return {};

  return Object.fromEntries(
    data.map((row) => [row.id, ROLE_LABEL[row.role] ?? row.email ?? ""]),
  );
}

/* The role reads better than the address in "X assigned you this": a
   salesperson knows what a super admin is, and may not recognise the email of
   somebody in another office. */
const ROLE_LABEL: Record<string, string> = {
  super_admin: "A super admin",
  marketing: "Marketing",
  presales: "Presales",
  admin: "An admin",
  sales: "Sales",
  hr: "HR",
  content_editor: "A content editor",
};

/**
 * The items this person has dismissed one at a time.
 *
 * Keyed "stream:id", which is how the callers below ask about a single row.
 */
async function dismissedIds(userId: string): Promise<Set<string>> {
  if (!supabase) return new Set();

  const { data, error } = await supabase
    .from("notification_dismissed")
    .select("stream, item_id")
    .eq("user_id", userId);

  /* A missing table means nothing has been dismissed, which shows everything.
     The same direction of failure as seenAt, and for the same reason: one
     notification too many is dismissed, one too few is never seen. */
  if (error || !data) return new Set();
  return new Set(data.map((row) => `${row.stream}:${row.item_id}`));
}

/** When this person last looked at each stream. */
async function seenAt(userId: string): Promise<Record<string, string>> {
  const epoch = "1970-01-01T00:00:00Z";
  if (!supabase) return {};

  const { data, error } = await supabase
    .from("notification_reads")
    .select("stream, seen_at")
    .eq("user_id", userId);

  /* A missing table or a policy refusal both mean "nothing has been looked
     at", which shows everything. That is the safe direction to fail in: a
     notification too many is noticed and dismissed, one too few is not. */
  if (error || !data) return {};
  return Object.fromEntries(data.map((row) => [row.stream, row.seen_at ?? epoch]));
}

/**
 * Everything new, grouped by stream, for the streams this role can see.
 *
 * Empty streams are dropped rather than returned empty, so the dashboard can
 * render whatever comes back without deciding what counts as worth showing.
 */
export async function loadNotifications(profile: AdminProfile | null): Promise<Stream[]> {
  if (!supabase || !profile?.id) return [];

  const mine = (Object.keys(NEEDS) as StreamKey[]).filter((key) => {
    const needed = NEEDS[key];
    return needed === null || allows(profile, needed);
  });
  if (mine.length === 0) return [];

  const [seen, dismissed] = await Promise.all([
    seenAt(profile.id),
    dismissedIds(profile.id),
  ]);
  const epoch = "1970-01-01T00:00:00Z";
  const since = (key: StreamKey) => seen[key] ?? epoch;

  const streams: Stream[] = [];

  for (const key of mine) {
    let items: NotificationItem[] = [];

    if (key === "leads") {
      const { data } = await supabase
        .from("enquiries")
        .select("id, name, company, phone, product, assigned_at, assigned_by")
        .eq("assigned_to", profile.id)
        .eq("archived", false)
        .gt("assigned_at", since(key))
        .order("assigned_at", { ascending: false })
        .limit(LIMIT);

      const rows = data ?? [];

      /* Who did the assigning, looked up once for the whole batch rather than
         once per row — the same super admin usually assigned all of them. */
      const actorIds = [...new Set(rows.map((row) => row.assigned_by).filter(Boolean))];
      const actors = await labelsFor(actorIds as string[]);

      items = rows.map((row) => ({
        id: row.id,
        title: row.name,
        detail: [row.company, row.phone, row.product].filter(Boolean).join(" · "),
        by: row.assigned_by ? (actors[row.assigned_by] ?? "") : "",
        at: row.assigned_at,
      }));
    }

    if (key === "unassigned") {
      const { data } = await supabase
        .from("enquiries")
        .select("id, name, company, phone, product, created_at")
        .is("assigned_to", null)
        .eq("archived", false)
        .gt("created_at", since(key))
        .order("created_at", { ascending: false })
        .limit(LIMIT);

      items = (data ?? []).map((row) => ({
        id: row.id,
        title: row.name,
        detail: [row.company, row.phone, row.product].filter(Boolean).join(" · "),
        /* Nobody assigns an enquiry from the website; it simply arrived. */
        by: "",
        at: row.created_at,
      }));
    }

    if (key === "applications") {
      const { data } = await supabase
        .from("applications")
        .select("id, first_name, last_name, job, experience, created_at")
        .gt("created_at", since(key))
        .order("created_at", { ascending: false })
        .limit(LIMIT);

      items = (data ?? []).map((row) => ({
        id: row.id,
        title: [row.first_name, row.last_name].filter(Boolean).join(" "),
        detail: [row.job, row.experience && `${row.experience} experience`]
          .filter(Boolean)
          .join(" · "),
        by: "",
        at: row.created_at,
      }));
    }

    /* The timestamp has already excluded everything older than the last
       "mark all read"; this removes the few dismissed since. */
    items = items.filter((item) => !dismissed.has(`${key}:${item.id}`));

    if (items.length > 0) streams.push({ key, ...COPY[key], items });
  }

  return streams;
}

/**
 * Mark a stream as looked at.
 *
 * `now()` rather than the newest item's timestamp: something that arrived
 * while the person was reading the list would otherwise be marked read
 * without ever having been shown to anyone.
 */
export async function markSeen(userId: string, stream: StreamKey) {
  if (!supabase || !userId) return;

  const now = new Date().toISOString();
  await supabase
    .from("notification_reads")
    .upsert({ user_id: userId, stream, seen_at: now, updated_at: now }, { onConflict: "user_id,stream" });

  /* Every individual dismissal in this stream is now redundant: the timestamp
     is past all of them. Deleted here so the table stays the size of "what
     has been dismissed since the last clear-out" rather than growing for
     ever. */
  await supabase
    .from("notification_dismissed")
    .delete()
    .eq("user_id", userId)
    .eq("stream", stream);
}

/**
 * Dismiss one item.
 *
 * Used both by the × on a row and by opening it: going to look at a lead is
 * reading the notification about it, and having to dismiss it afterwards as
 * well is a second chore for the same decision.
 */
export async function dismissItem(userId: string, stream: StreamKey, itemId: number) {
  if (!supabase || !userId) return;

  await supabase
    .from("notification_dismissed")
    .upsert(
      { user_id: userId, stream, item_id: itemId, dismissed_at: new Date().toISOString() },
      { onConflict: "user_id,stream,item_id" },
    );
}
