/**
 * `npm run preview` — serve out/ the way Netlify will.
 *
 * Why this exists: `npm run dev` renders from the React source, and the
 * translations are not in the source. They are written into the built HTML by
 * i18n-pages.mjs, after `next build`. So /mr and /hi on the dev server read in
 * English no matter how much is translated, and the same goes for the hreflang
 * links. Checking the languages means serving the built folder, and
 * `next start` refuses to with output: "export".
 *
 * The URL resolution below is the part that matters. A static export writes
 * "/mr" as out/mr.html, not out/mr/index.html, so a plain file server returns
 * 404 for every clean URL on the site. Netlify tries the .html sibling; so
 * does this. Getting that wrong locally would mean "the Marathi pages are
 * broken" when they are fine.
 *
 * No dependency, for the same reason dev.mjs spawns Next itself rather than
 * pulling in `concurrently`: this is seventy lines and only ever runs on a
 * developer's machine.
 */

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const OUT = resolve("out");
const PORT = Number(process.env.PORT ?? 3001);

if (!existsSync(OUT)) {
  console.error("\n  There is no out/ — run npm run build first.\n");
  process.exit(1);
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};

/** The file a URL means, trying the same order Netlify does. */
function resolveFile(pathname) {
  /* A trailing slash is dropped first, because Netlify normalises "/mr/" to
     "/mr" and then serves mr.html. Without this the server 404s on a URL the
     real host answers — and since out/mr IS a directory with no index.html,
     every clean URL on the site fails in its slashed form. Leaving it would
     mean this script reporting the Marathi pages as broken when they are the
     one thing it exists to check. */
  const requested = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  /* decodeURIComponent throws URIError on a malformed escape, and this runs
     inside the request handler — so an unhandled throw took the whole server
     down. `GET /%` was enough, and so is one truncated %E0%A4 in a href, which
     is not far-fetched on a site with Devanagari URLs. A bad escape is a bad
     request, not a crash. */
  let decoded;
  try {
    decoded = decodeURIComponent(requested);
  } catch {
    return null;
  }

  /* normalize() resolves the ".." segments, which is what actually prevents
     escaping out/: on an absolute path it clamps them at the root, so
     "/../.env.local" becomes "\.env.local" and lands inside out/. The
     containment check below is belt-and-braces for anyone who later changes
     this line — it is not what is holding the door shut today. */
  const base = join(OUT, normalize(decoded));
  if (!base.startsWith(OUT)) return null;

  const candidates = [
    base,
    base + ".html",
    join(base, "index.html"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

createServer((request, response) => {
  const { pathname } = new URL(request.url, "http://localhost");

  /* No caching anywhere below: the whole point of this server is to see a
     change you just rebuilt, and a cached page hides it. */
  const headers = (file) => ({
    "Content-Type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });

  const file = resolveFile(pathname);
  if (file) {
    response.writeHead(200, headers(file));
    createReadStream(file).pipe(response);
    return;
  }

  /* Missing: serve the site's own 404 page so the styling is the real thing,
     but with a 404 status, because a preview that answers 200 for a page that
     does not exist is how a broken link survives to production. */
  const notFound = join(OUT, "404.html");
  if (existsSync(notFound)) {
    response.writeHead(404, headers(notFound));
    createReadStream(notFound).pipe(response);
    return;
  }

  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
}).listen(PORT, () => {
  console.log(`
  Serving out/ exactly as Netlify will.

    English   http://localhost:${PORT}/
    Marathi   http://localhost:${PORT}/mr
    Hindi     http://localhost:${PORT}/hi

  This is the built site. After changing code, run npm run build again.
`);
});
