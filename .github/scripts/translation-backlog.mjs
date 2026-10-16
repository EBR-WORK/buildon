/**
 * How many strings are still waiting to be translated.
 *
 * Prints `pending=<n>` for the workflow to read as a step output. Nothing else
 * goes to stdout, because every stdout line becomes a GitHub output line —
 * explanations belong on stderr.
 *
 * The number is written by scripts/i18n-pages.mjs at the end of every build,
 * which is the only thing that can count it accurately: it has the built site
 * in front of it. This just reads the note.
 *
 * On any doubt it answers 1, not 0. A build that was not needed costs a few
 * minutes of Netlify's monthly allowance; a wrong 0 leaves the site
 * half-translated with nothing scheduled to finish it and nobody looking.
 */

const say = (message) => process.stderr.write(message + "\n");

async function pendingCount() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    say("Supabase is not configured for this workflow — add NEXT_PUBLIC_SUPABASE_URL");
    say("and SUPABASE_SECRET_KEY under Settings → Secrets and variables → Actions.");
    return 1;
  }

  let response;
  try {
    response = await fetch(
      `${url}/rest/v1/settings?key=eq.translation_backlog&select=value`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
  } catch (error) {
    say(`Could not reach Supabase: ${error.message}`);
    return 1;
  }

  if (!response.ok) {
    say(`Supabase answered ${response.status}`);
    return 1;
  }

  const rows = await response.json().catch(() => null);
  const raw = Array.isArray(rows) && rows[0] ? rows[0].value : null;

  if (raw === null || raw === undefined) {
    /* No note yet: nothing has built since this was added, so there is no way
       to know. Build once, and that build writes the note for next time. */
    say("No backlog recorded yet.");
    return 1;
  }

  const pending = Number.parseInt(raw, 10);
  if (!Number.isFinite(pending) || pending < 0) {
    say(`Backlog reads ${JSON.stringify(raw)}, which is not a count.`);
    return 1;
  }

  say(pending === 0 ? "Everything is translated." : `${pending} strings pending.`);
  return pending;
}

/* No process.exit(): it tears the process down with work still queued, which
   on some platforms aborts instead of exiting and would fail the step after
   the answer was already correct. Letting it end naturally is enough. */
process.stdout.write(`pending=${await pendingCount()}\n`);
