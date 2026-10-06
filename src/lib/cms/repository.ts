"use client";

/**
 * Where edited content is read from and written to.
 *
 * The admin screens only ever talk to `ContentRepository`:
 *
 *   Admin UI ──► ContentRepository ──┬─► SupabaseRepository  (when configured)
 *                                    └─► BrowserRepository   (fallback)
 *
 * The browser implementation is kept, not deleted. It is what runs when the
 * environment has no Supabase in it — a fresh clone, a contributor without
 * keys — and an admin panel that renders a form it can never save is worse
 * than one that saves somewhere local and says so.
 */

import { cloneDefaults, type SiteContent } from "./schema";
import { supabase, isSupabaseConfigured } from "./supabase";

export interface ContentRepository {
  /** The current content, falling back to the site's own defaults. */
  load(): Promise<SiteContent>;
  /** Persist the whole document. */
  save(content: SiteContent): Promise<void>;
  /** Discard edits and return to what the repo ships. */
  reset(): Promise<void>;
  /** Where a save ends up, for the editor to say so. */
  readonly destination: string;
}

/** One row per section, which is also how the admin edits. */
const SECTIONS = ["home", "products", "projects", "blog", "faq", "career"] as const;
type Section = (typeof SECTIONS)[number];

/** Raised when somebody else saved the same section first. */
export class ConflictError extends Error {}

const KEY = "buildon.cms.draft.v1";

/**
 * A draft held in the browser. The fallback.
 *
 * Every read and write is wrapped: localStorage throws in private windows and
 * returns nothing when site data has been cleared, and an admin that explodes
 * on a storage error is worse than one that falls back to the defaults.
 */
class BrowserRepository implements ContentRepository {
  readonly destination = "this browser";

  async load(): Promise<SiteContent> {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return cloneDefaults();
      /* Merged over the defaults rather than used as-is: a draft saved before a
         new field existed would otherwise come back missing it. */
      return { ...cloneDefaults(), ...(JSON.parse(raw) as SiteContent) };
    } catch {
      return cloneDefaults();
    }
  }

  async save(content: SiteContent): Promise<void> {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(content));
    } catch {
      throw new Error("Could not save — your browser is blocking local storage.");
    }
  }

  async reset(): Promise<void> {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* Nothing stored means nothing to clear. */
    }
  }
}

/**
 * The real one: content in Postgres, one row per section.
 *
 * Two things it does that a naive write-everything version would not:
 *
 * It saves only the sections that changed. The blog is 491 KB and the career
 * page is 1.4 KB; sending both because somebody edited a job title wastes the
 * editor's time on every save and fills content_versions with identical rows.
 *
 * It refuses to overwrite a section somebody else saved in the meantime. Two
 * admins is enough for last-write-wins to quietly destroy an afternoon's work,
 * and the symptom — edits that simply are not there any more — gives no hint
 * about what happened. The stamp taken at load is compared before writing.
 */
class SupabaseRepository implements ContentRepository {
  readonly destination = "the database";

  /** updated_at per section as it was when loaded. Null for a missing row. */
  private stamps = new Map<Section, string | null>();
  /** What load() returned, to diff against on save. */
  private loaded: SiteContent | null = null;

  async load(): Promise<SiteContent> {
    const client = this.client();
    const { data, error } = await client.from("content").select("key, data, updated_at");

    if (error) throw new Error(describe(error.message));

    const content = cloneDefaults();
    this.stamps.clear();

    for (const section of SECTIONS) {
      const row = data?.find((entry) => entry.key === section);
      this.stamps.set(section, row?.updated_at ?? null);

      /* Merged over the defaults, per section, for the same reason the browser
         one does it: a row written before a field existed must not come back
         missing it. Shallow is enough — the shapes below a section are replaced
         wholesale by the editors. */
      if (row?.data) {
        Object.assign(content[section], row.data as object);
      }
    }

    this.loaded = structuredClone(content);
    return content;
  }

  async save(content: SiteContent): Promise<void> {
    const client = this.client();

    const changed = SECTIONS.filter(
      (section) =>
        !this.loaded ||
        JSON.stringify(content[section]) !== JSON.stringify(this.loaded[section]),
    );

    if (changed.length === 0) return;

    /* Checked before any write, so a conflict on the second section does not
       leave the first one already saved. */
    const { data: current, error: readError } = await client
      .from("content")
      .select("key, updated_at")
      .in("key", changed);

    if (readError) throw new Error(describe(readError.message));

    for (const section of changed) {
      const theirs = current?.find((row) => row.key === section)?.updated_at ?? null;
      if (theirs !== this.stamps.get(section)) {
        throw new ConflictError(
          `Somebody else saved ${sectionName(section)} while you were editing. ` +
            "Reload to see their version — saving now would overwrite it.",
        );
      }
    }

    const { data: written, error } = await client
      .from("content")
      .upsert(
        changed.map((section) => ({ key: section, data: content[section] })),
        { onConflict: "key" },
      )
      .select("key, updated_at");

    if (error) throw new Error(describe(error.message));

    /* An upsert refused by row level security returns no error and no rows —
       the policy filters them out rather than failing. Without this check a
       save by somebody with no profile would look like it worked. */
    if (!written || written.length < changed.length) {
      throw new Error(
        "Nothing was saved. Your account may no longer have permission to edit.",
      );
    }

    for (const row of written) this.stamps.set(row.key as Section, row.updated_at);
    this.loaded = structuredClone(content);
  }

  async reset(): Promise<void> {
    /* Writes the shipped content back rather than deleting the rows: the site
       reads these at build time, and a missing row would fall back to the same
       defaults anyway while leaving the table looking half-populated. The
       previous version is kept by the trigger either way. */
    await this.save(cloneDefaults());
  }

  private client() {
    if (!supabase) throw new Error("The database is not configured.");
    return supabase;
  }
}

/** Postgres speaks in codes; the editor should not have to. */
function describe(message: string) {
  if (/row-level security|insufficient_privilege|42501/i.test(message)) {
    return "You do not have permission to save. Ask a super admin to check your access.";
  }
  if (/jwt|token|expired/i.test(message)) {
    return "Your session has expired. Sign in again and your changes will still be here.";
  }
  if (/fetch|network/i.test(message)) {
    return "Could not reach the database. Check your connection and try again.";
  }
  return message;
}

function sectionName(section: Section) {
  return section === "faq" ? "the FAQs" : `the ${section} page`;
}

/**
 * Supabase when it is configured, the browser otherwise.
 *
 * Decided once, at module load, from the presence of the environment — not
 * from whether a session exists. A signed-out admin should see a permission
 * error from the database, which is the truth, rather than silently writing to
 * a local draft nobody will ever publish.
 */
export const repository: ContentRepository = isSupabaseConfigured
  ? new SupabaseRepository()
  : new BrowserRepository();
