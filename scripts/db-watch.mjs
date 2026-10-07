/**
 * Keep content/*.json in step with the database while you work.
 *
 *   npm run db:watch
 *
 * Started automatically by `npm run dev`, so saving in the admin panel shows up
 * on localhost a few seconds later with nothing to run by hand. The files are
 * imported by src/lib/cms/published.ts, so rewriting one is a change in the
 * module graph and the dev server hot-reloads the page itself.
 *
 * Polling, not a subscription: Supabase Realtime would be instant, but it needs
 * replication switched on for the table and a socket held open, which is a lot
 * of moving parts for a few seconds' difference on a tool one person uses at a
 * time. Five seconds is below the threshold where anyone reaches for refresh.
 */

import { pull } from "./lib/pull.mjs";

const EVERY_MS = Number(process.env.DB_WATCH_INTERVAL ?? 5000);

const stamp = () =>
  new Date().toLocaleTimeString("en-GB", { hour12: false });

console.log(`Watching Supabase for content changes — every ${EVERY_MS / 1000}s. Ctrl-C to stop.\n`);

/* Remembered so the same outage is not reported on every tick: a dev server
   left running overnight should not produce a thousand identical lines. */
let lastProblem = null;

async function tick() {
  try {
    const { ok, reason, written } = await pull();

    if (!ok) {
      if (reason !== lastProblem) {
        console.warn(`${stamp()}  ${reason}`);
        lastProblem = reason;
      }
      return;
    }

    if (lastProblem) {
      console.log(`${stamp()}  reading the database again`);
      lastProblem = null;
    }

    if (written.length > 0) {
      console.log(`${stamp()}  updated ${written.join(", ")} — the page should reload`);
    }
  } catch (error) {
    /* A thrown error here is usually the network going away mid-request. Worth
       one line, never worth stopping the watcher an editor is relying on. */
    const message = error instanceof Error ? error.message : String(error);
    if (message !== lastProblem) {
      console.warn(`${stamp()}  ${message}`);
      lastProblem = message;
    }
  }
}

await tick();
setInterval(() => void tick(), EVERY_MS);
