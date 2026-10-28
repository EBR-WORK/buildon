/**
 * The Google Apps Script web app that sends Buildon's mail.
 *
 * NOT deployed from this repository. It lives at script.google.com under a
 * buildon.co.in account, and this is a copy kept beside the code that calls
 * it, so the two halves of one contract sit together: change the payload in
 * index.ts and this has to change with it.
 *
 * THE SECRET IS NOT IN THIS COPY
 *
 * The deployed script holds the real value in SHARED_SECRET. It is left out
 * here because this file is in git and that one is not. Supabase holds the
 * same value as MAIL_WEBAPP_SECRET, and the two must match exactly or every
 * send is refused with {"ok":false,"error":"unauthorized"}.
 *
 * WHAT IT IS FOR
 *
 * It was written for Supabase's Auth Send Email Hook — the password reset
 * mails — and the enquiry-email function now sends through it too. One script,
 * one deployment, one secret, one daily quota, and every mail from the same
 * company address. Before this, assignment and application mail went out over
 * Gmail SMTP from a personal account that is nobody at Buildon.
 *
 * THE CONTRACT
 *
 *   POST  { secret, to, subject, text, html?, replyTo?, fromName? }
 *   200   { "ok": true, "remainingQuota": n }
 *   200   { "ok": false, "error": "…" }
 *
 * Note the second one: Apps Script answers 200 even when it has failed, so the
 * caller checks for "ok":true in the body rather than trusting the status.
 *
 * DEPLOYMENT SETTINGS THAT MATTER
 *
 *   Execute as:      Me
 *   Who has access:  Anyone
 *
 * "Anyone within buildon.co.in" does not work: Supabase posts as nobody, so a
 * domain-restricted deployment answers with a sign-in page and the mail
 * silently never sends.
 *
 * Editing the script needs Deploy -> Manage deployments -> edit -> New
 * version, or the URL keeps serving the old code.
 *
 * QUOTA
 *
 * A Workspace account sends 1,500 recipients a day. Both the auth mails and
 * the enquiry mails now come out of that one allowance, which is still far
 * more than this site produces.
 */

// Must match MAIL_WEBAPP_SECRET on Supabase, and APPS_SCRIPT_SECRET on the
// auth hook function. The real value is in the deployed script only.
const SHARED_SECRET = '<not in git — see the deployed script>';
const DEFAULT_FROM_NAME = 'Buildon';

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.secret !== SHARED_SECRET) {
      return json_({ ok: false, error: 'unauthorized' });
    }
    const to = body.to;
    const subject = body.subject;
    const html = body.html || '';
    const text = body.text || stripHtml_(html);
    if (!to || !subject || (!html && !text)) {
      return json_({ ok: false, error: 'missing to / subject / body' });
    }
    const options = { name: body.fromName || DEFAULT_FROM_NAME };
    if (html) options.htmlBody = html;
    if (body.replyTo) options.replyTo = body.replyTo;

    GmailApp.sendEmail(to, subject, text, options);
    return json_({ ok: true, remainingQuota: MailApp.getRemainingDailyQuota() });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'supabase-auth-mailer' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function stripHtml_(html) {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Run once from the editor to grant Gmail permission and test sending. */
function testSend() {
  const me = Session.getActiveUser().getEmail();
  GmailApp.sendEmail(me, 'Supabase mailer test', 'It works.', { name: DEFAULT_FROM_NAME });
  console.log('Sent test to ' + me + '. Remaining quota: ' + MailApp.getRemainingDailyQuota());
}
