"use client";

/**
 * Where edited content is read from and written to.
 *
 * The admin screens only ever talk to `ContentRepository`. Today the only
 * implementation keeps a draft in the browser; Supabase will be a second
 * implementation of this same interface, and the screens will not change:
 *
 *   Admin UI ──► ContentRepository ──► BrowserRepository   (now)
 *                                  └─► SupabaseRepository  (later)
 *
 * Nothing here imports Supabase, and nothing in the admin imports this file's
 * internals — only the interface and the exported instance.
 */

import { cloneDefaults, type SiteContent } from "./schema";

export interface ContentRepository {
  /** The current content, falling back to the site's own defaults. */
  load(): Promise<SiteContent>;
  /** Persist the whole document. */
  save(content: SiteContent): Promise<void>;
  /** Discard edits and return to what the repo ships. */
  reset(): Promise<void>;
  /** Whether anything has been edited since the last reset. */
  isDirty(): Promise<boolean>;
}

const KEY = "buildon.cms.draft.v1";

/**
 * A draft held in the browser.
 *
 * This is the mock stage: the site is a static export with no server, so there
 * is nowhere to POST to yet. Edits live in localStorage and the editor exports
 * JSON to commit, which keeps the whole loop real — edit, export, rebuild, see
 * it — without pretending a backend exists.
 *
 * Every read and write is wrapped: localStorage throws in private windows and
 * returns nothing when site data has been cleared, and an admin that explodes
 * on a storage error is worse than one that falls back to the defaults.
 */
class BrowserRepository implements ContentRepository {
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
      /* Quota or a blocked store. The caller surfaces this as a failed save. */
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

  async isDirty(): Promise<boolean> {
    try {
      return window.localStorage.getItem(KEY) !== null;
    } catch {
      return false;
    }
  }
}

/** Swap this line for `new SupabaseRepository()` when the database exists. */
export const repository: ContentRepository = new BrowserRepository();
