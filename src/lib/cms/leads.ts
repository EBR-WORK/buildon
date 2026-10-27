"use client";

/**
 * Leads: the enquiries from the website, once somebody owns them.
 *
 * The same rows the public form writes — nothing is copied or converted. A
 * "lead" is an enquiry with a place, an owner and a status, and all three are
 * null until a person decides them.
 *
 * None of the role rules are here. Every query below is written as though it
 * could see everything, and the policies in 0009_roles_and_leads.sql decide
 * what comes back: marketing and presales get all of it, sales gets the rows
 * assigned to them, and the same select returns a different list for each. The
 * screen does not have to ask who is looking.
 */

import { supabase } from "./supabase";
import type { AdminRole } from "./roles";

export const LEAD_STATUSES = [
  "new",
  "assigned",
  "contacted",
  "qualified",
  "quoted",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Plain words for the panel. The database stores the key. */
export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  assigned: "Assigned",
  contacted: "Contacted",
  qualified: "Qualified",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
};

export type Lead = {
  id: number;
  created_at: string;
  /** When it last moved. Stamped by the trigger in 0014. */
  updated_at: string | null;
  name: string;
  email: string;
  phone: string;
  message: string;
  company: string | null;
  enquiry_type: string | null;
  product: string | null;
  source: string | null;
  page: string | null;
  place_id: number | null;
  assigned_to: string | null;
  /** Who handed it over. Stamped by the trigger, never by the browser. */
  assigned_by: string | null;
  assigned_at: string | null;
  status: LeadStatus;
  priority: Priority;
  archived: boolean;
  handled: boolean;
};

export const PRIORITIES = ["high", "normal", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export type Place = { id: number; name: string; active: boolean };

export type Staff = {
  id: string;
  email: string;
  role: AdminRole;
  place_id: number | null;
};

export type LeadNote = {
  id: number;
  enquiry_id: number;
  author_id: string | null;
  body: string;
  created_at: string;
};

export async function listLeads(): Promise<Lead[]> {
  if (!supabase) throw new Error("not-configured");

  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    /* Unassigned first, then newest. Opening this list is "what has nobody
       picked up", and sorting by date alone buries that under everything
       already in hand. For a salesperson, whose rows are all assigned, the
       first key is constant and the second does the work. */
    .order("assigned_to", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);
  return (data ?? []) as Lead[];
}

/**
 * The branches a lead can be put in.
 *
 * Only the open ones. The close dialog promises that a closed branch "stops
 * being offered on new leads", and this is the list that keeps or breaks that
 * promise — it used to return every branch, so closing one took it out of
 * nothing.
 *
 * The error is raised rather than swallowed. It used to be discarded, which
 * turned a failed read into an empty list, and an empty list renders as "No
 * places set up yet" — a message that says the table is empty when the truth
 * might be that the request was refused.
 */
export async function listPlaces(): Promise<Place[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("places")
    .select("id,name,active")
    .eq("active", true)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as Place[];
}

/**
 * Who a lead can be given to.
 *
 * Everyone who works leads, not only sales: marketing keeps some itself and
 * presales picks up the ones that need qualifying first. Filtering to one role
 * here would make the panel disagree with how the team actually works.
 */
export async function listStaff(): Promise<Staff[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id,email,role,place_id")
    .in("role", ["sales", "marketing", "presales", "super_admin"])
    .order("email");
  return (data ?? []) as Staff[];
}

/**
 * Change one field on a lead.
 *
 * Rows are counted, not just errors: an update the policies filter out is not
 * an error, it is a success that changed nothing — so a salesperson trying to
 * touch a lead that is not theirs would otherwise watch it appear to work and
 * find it unchanged on reload.
 */
async function patch(id: number, values: Partial<Lead>, refused: string) {
  if (!supabase) throw new Error("The database is not configured.");

  const { data, error } = await supabase
    .from("enquiries")
    .update(values)
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error(refused);
}

export const assignLead = (id: number, to: string | null, placeId: number | null) =>
  patch(
    id,
    { assigned_to: to, place_id: placeId },
    "That did not save. Only marketing and super admins can assign a lead.",
  );

export const setLeadStatus = (id: number, status: LeadStatus) =>
  patch(id, { status }, "That did not save. This lead is not assigned to you.");

/**
 * Who this lead may be given to.
 *
 * Filtered to the lead's own place, which is the rule that stops a Mumbai
 * enquiry landing with somebody in Surat. Roles without a branch — super
 * admins and marketing — are always offered: somebody has to be able to hold
 * a lead that has not been placed yet.
 *
 * The database enforces the same thing in check_lead_assignee(), so this is
 * the convenience and that is the rule. A list that merely looked filtered
 * would be the worst of both.
 */
export function assigneesFor(lead: Lead, staff: Staff[]) {
  return staff.filter((person) => {
    if (person.role === "super_admin" || person.role === "marketing") return true;
    if (lead.place_id === null) return true;
    return person.place_id === lead.place_id;
  });
}

/**
 * Assign, with the priority and the note, in one write.
 *
 * One statement rather than three, because the triggers log what changed: two
 * round trips would put two moments in the history for one decision. The
 * status is not sent at all — assigning is what makes a lead "assigned", and
 * the database decides that in lead_assignment_status().
 */
export async function assign(
  id: number,
  to: string | null,
  options: { priority?: Priority; placeId?: number | null } = {},
) {
  const values: Partial<Lead> = { assigned_to: to };
  if (options.priority) values.priority = options.priority;
  if (options.placeId !== undefined) values.place_id = options.placeId;

  await patch(
    id,
    values,
    "That did not save. Only marketing and super admins can assign a lead.",
  );
}

/**
 * Assign several at once.
 *
 * Sequential, not a single update: each row goes through the place check, and
 * one that fails must not take the others with it. The caller is told which
 * ones did not go rather than being left to guess from a count.
 */
export async function assignMany(
  ids: number[],
  to: string,
  priority?: Priority,
): Promise<{ done: number[]; failed: { id: number; reason: string }[] }> {
  const done: number[] = [];
  const failed: { id: number; reason: string }[] = [];

  for (const id of ids) {
    try {
      await assign(id, to, { priority });
      done.push(id);
    } catch (e) {
      failed.push({ id, reason: e instanceof Error ? e.message : "refused" });
    }
  }

  return { done, failed };
}

export const setPriority = (id: number, priority: Priority) =>
  patch(id, { priority }, "That did not save. This lead is not yours to change.");


/* ------------------------------------------------------------------ views */

/**
 * The tabs along the top.
 *
 * A view is a question somebody actually asks, not a column with a value. "In
 * progress" is three statuses because nobody opens a list wanting "quoted"
 * specifically — they want the ones being worked.
 */
export type ViewKey =
  | "all"
  | "unassigned"
  | "assigned"
  | "progress"
  | "won"
  | "lost"
  | "archived";

export const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "all", label: "All leads" },
  { key: "unassigned", label: "Unassigned" },
  { key: "assigned", label: "Assigned" },
  { key: "progress", label: "In progress" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
  { key: "archived", label: "Archived" },
];

export function inView(lead: Lead, view: ViewKey) {
  /* Archived is the exception that proves the rule: every other view hides
     them, which is the entire point of archiving. */
  if (view === "archived") return lead.archived;
  if (lead.archived) return false;

  switch (view) {
    case "unassigned":
      return !lead.assigned_to;
    case "assigned":
      return lead.status === "assigned";
    case "progress":
      return ["contacted", "qualified", "quoted"].includes(lead.status);
    case "won":
      return lead.status === "won";
    case "lost":
      return lead.status === "lost";
    default:
      return true;
  }
}

/** The badge counts, computed once for all tabs rather than per tab. */
export const countViews = (leads: Lead[]) =>
  Object.fromEntries(
    VIEWS.map((view) => [view.key, leads.filter((lead) => inView(lead, view.key)).length]),
  ) as Record<ViewKey, number>;

/* ---------------------------------------------------------------- archive */

/**
 * Correct the details of a lead — a misheard phone number, a misspelt name.
 *
 * Who may is decided by the policies and not here: marketing and super admins
 * may touch any lead, a salesperson only one assigned to them. Both routes end
 * in the same filtered UPDATE, and patch() turns "changed nothing" into an
 * error rather than letting it read as a save.
 */
export const updateLead = (
  id: number,
  values: Pick<
    Lead,
    "name" | "phone" | "email" | "company" | "message" | "enquiry_type" | "product"
  > & {
    place_id: number | null;
    source: string | null;
  },
) =>
  patch(
    id,
    values,
    "That did not save. You can only edit a lead assigned to you, unless you are marketing or a super admin.",
  );

export const archiveLead = (id: number, archived: boolean) =>
  patch(
    id,
    { archived },
    archived
      ? "That did not archive. Only marketing and super admins can."
      : "That did not restore.",
  );

/**
 * Remove a lead for good.
 *
 * Super admins only — the policy says so, and nothing here checks it a second
 * time. The row count is what tells us whether it happened: a DELETE filtered
 * away by a policy reports no error and removes nothing, the same shape that
 * made a refused update look like a save.
 *
 * Archiving is the reversible option and the one the menu offers first. This
 * is for a lead that should never have existed — a test row, a duplicate, a
 * bot — where archiving only moves the clutter somewhere else.
 */
export async function deleteLead(id: number) {
  if (!supabase) throw new Error("The database is not configured.");

  const { data, error } = await supabase
    .from("enquiries")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("That did not delete. Only a super admin can remove a lead.");
  }
}

/* ----------------------------------------------------------- manual intake */

/**
 * A lead that arrived by phone, or at the counter.
 *
 * Written to the same table as the website form, because it is the same thing:
 * somebody asking. `source` is what tells them apart afterwards, which is why
 * it is required here and not free text in a note.
 *
 * The insert policy wants a message of at least ten characters. Rather than
 * loosen a rule the public form depends on, a blank one is filled with what
 * actually happened.
 */
export async function addLead(entry: {
  name: string;
  phone: string;
  email: string;
  source: string;
  message?: string;
  company?: string;
  product?: string;
  enquiryType?: string;
  placeId?: number | null;
}) {
  if (!supabase) throw new Error("The database is not configured.");

  const message = entry.message?.trim();

  const { data, error } = await supabase
    .from("enquiries")
    .insert({
      name: entry.name.trim(),
      phone: entry.phone.trim(),
      /* The policy wants a plausible address and a manual lead may genuinely
         not have one. A placeholder nobody will mail is better than a column
         of empty strings, and it is obvious on sight. */
      email: entry.email.trim() || "no-email@buildon.co.in",
      message: message && message.length >= 10 ? message : `Taken by hand. ${entry.source}.`,
      company: entry.company?.trim() || null,
      product: entry.product?.trim() || null,
      enquiry_type: entry.enquiryType?.trim() || null,
      source: entry.source,
      place_id: entry.placeId ?? null,
    })
    .select("*");

  if (error) throw new Error(error.message);
  return data?.[0] as Lead;
}

/* ------------------------------------------------------------------ export */

/**
 * The chosen rows as CSV.
 *
 * Built here rather than fetched, because the rows are already in the browser
 * and already filtered to what the person is looking at. Exporting a different
 * set from the one on screen is the surprise worth avoiding.
 */
export function toCsv(leads: Lead[], names: Record<string, string>, places: Place[]) {
  const place = (id: number | null) => places.find((p) => p.id === id)?.name ?? "";

  const cell = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    /* Quoted whenever it could break a column, and inner quotes doubled —
       a name with a comma is common and silently shifts every field after it. */
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const header = [
    "Name", "Company", "Phone", "Email", "Product", "Source",
    "Place", "Status", "Priority", "Assigned to", "Created",
  ];

  const rows = leads.map((lead) => [
    lead.name, lead.company, lead.phone, lead.email, lead.product, lead.source,
    place(lead.place_id), lead.status, lead.priority,
    lead.assigned_to ? (names[lead.assigned_to] ?? "") : "",
    lead.created_at.slice(0, 10),
  ]);

  return [header, ...rows].map((row) => row.map(cell).join(",")).join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  /* A BOM, so Excel opens it as UTF-8 rather than mangling every name that is
     not plain ASCII. */
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/* ----------------------------------------------------------------- columns */

export const COLUMNS = [
  { key: "contact", label: "Contact" },
  { key: "place", label: "Place" },
  { key: "source", label: "Source" },
  { key: "status", label: "Status" },
  { key: "assigned", label: "Assigned" },
  { key: "priority", label: "Priority" },
  { key: "created", label: "Created" },
] as const;

export type ColumnKey = (typeof COLUMNS)[number]["key"];

/* Name is not in the list: a row without it is not a row. */
export const DEFAULT_COLUMNS: ColumnKey[] = COLUMNS.map((column) => column.key);

/* ----------------------------------------------------------- the filters */

export type LeadFilters = {
  search: string;
  placeId: number | "all";
  status: LeadStatus | "all";
  source: string | "all";
  assignedTo: string | "all" | "none";
  priority: Priority | "all";
};

export const NO_FILTERS: LeadFilters = {
  search: "",
  placeId: "all",
  status: "all",
  source: "all",
  assignedTo: "all",
  priority: "all",
};

/**
 * Applied here rather than in the query.
 *
 * The list is capped at 500 rows and already in memory; filtering in Postgres
 * would mean a round trip per keystroke for a set that fits in a browser
 * twice over. The cap is the thing to revisit when it stops being true, not
 * this.
 */
export function filterLeads(leads: Lead[], filters: LeadFilters) {
  const needle = filters.search.trim().toLowerCase();

  return leads.filter((lead) => {
    if (filters.placeId !== "all" && lead.place_id !== filters.placeId) return false;
    if (filters.status !== "all" && lead.status !== filters.status) return false;
    if (filters.source !== "all" && (lead.source ?? "") !== filters.source) return false;
    if (filters.priority !== "all" && lead.priority !== filters.priority) return false;
    if (filters.assignedTo === "none" && lead.assigned_to) return false;
    if (
      filters.assignedTo !== "all" &&
      filters.assignedTo !== "none" &&
      lead.assigned_to !== filters.assignedTo
    ) {
      return false;
    }
    if (!needle) return true;

    /* Name, company, phone and email — what somebody has in front of them when
       they search. Not the message: a word from a paragraph matching is a
       result nobody can explain. */
    return [lead.name, lead.company, lead.phone, lead.email, lead.product]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(needle));
  });
}

/** Every source actually present, for the filter. */
export const sourcesIn = (leads: Lead[]) =>
  [...new Set(leads.map((lead) => lead.source).filter(Boolean))].sort() as string[];

/* ----------------------------------------------------------------- events */

export type LeadEvent = {
  id: number;
  enquiry_id: number;
  actor_id: string | null;
  kind: "created" | "assigned" | "unassigned" | "status" | "priority" | "place";
  detail: Record<string, unknown>;
  created_at: string;
};

export async function listEvents(enquiryId: number): Promise<LeadEvent[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("lead_events")
    .select("*")
    .eq("enquiry_id", enquiryId)
    .order("created_at", { ascending: false });
  return (data ?? []) as LeadEvent[];
}

/* ------------------------------------------------------------------ notes */

export async function listNotes(enquiryId: number): Promise<LeadNote[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("enquiry_notes")
    .select("*")
    .eq("enquiry_id", enquiryId)
    .order("created_at", { ascending: false });
  return (data ?? []) as LeadNote[];
}

export async function addNote(enquiryId: number, body: string) {
  if (!supabase) throw new Error("The database is not configured.");

  const { data: session } = await supabase.auth.getSession();
  const authorId = session.session?.user.id;
  if (!authorId) throw new Error("Your session has expired. Sign in again.");

  const { data, error } = await supabase
    .from("enquiry_notes")
    .insert({ enquiry_id: enquiryId, author_id: authorId, body: body.trim() })
    .select("*");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("That did not save. You can only add notes to leads you can see.");
  }
  return data[0] as LeadNote;
}
