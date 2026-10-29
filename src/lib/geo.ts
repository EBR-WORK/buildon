"use client";

/**
 * The city the visitor appears to be in, from their IP address.
 *
 * WHY NOT THE BROWSER'S OWN GEOLOCATION
 *
 * navigator.geolocation is accurate to a street and asks permission to be. On
 * an enquiry form that prompt is a dialog nobody expected, most people refuse,
 * and refusing it is the last thing they do before deciding not to fill the
 * form in either. This asks nothing and nobody sees it.
 *
 * WHY A THIRD PARTY AT ALL
 *
 * The site is a static export with no server of its own, so there is no
 * request of ours that ever sees an IP address. Netlify and Cloudflare both
 * expose the visitor's location as a header, and neither reaches a page served
 * from a CDN as a file. A lookup from the browser is what is left.
 *
 * WHAT IT IS WORTH
 *
 * An IP resolves to wherever the connection terminates — on a mobile network
 * that can be the wrong city, on a corporate VPN the wrong country. It is a
 * hint for routing a lead, recorded beside the lead, and never the thing that
 * decides anything on its own.
 */

export type Place = { city: string; country: string };

const KEY = "buildon:geo";

/**
 * Two services, neither needing a key, tried in order.
 *
 * The second is not redundancy for an outage so much as for the visitor:
 * ad blockers and privacy extensions block these hosts by name, and they do
 * not block the same ones. When both fail the enquiry is simply stored without
 * a city, which is the ordinary case this column was designed for.
 */
const SOURCES = [
  {
    url: "https://get.geojs.io/v1/ip/geo.json",
    read: (data: Record<string, unknown>) => ({
      city: String(data.city ?? ""),
      country: String(data.country ?? ""),
    }),
  },
  {
    url: "https://ipwho.is/?fields=city,country",
    read: (data: Record<string, unknown>) => ({
      city: String(data.city ?? ""),
      country: String(data.country ?? ""),
    }),
  },
];

let inFlight: Promise<Place | null> | null = null;

/**
 * Looked up once per visit and remembered for the rest of it.
 *
 * sessionStorage rather than a module variable: the forms live on several
 * pages and a visitor who fills one in after reading three has already paid
 * for this lookup. It is per tab and goes when the tab does, which is the
 * right lifetime for something this incidental.
 */
function remembered(): Place | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Place) : null;
  } catch {
    /* Private windows and blocked site data both throw here. */
    return null;
  }
}

function remember(place: Place) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(place));
  } catch {
    /* Not worth a word to anyone. The lookup simply happens again. */
  }
}

export function lookupPlace(): Promise<Place | null> {
  if (typeof window === "undefined") return Promise.resolve(null);

  const cached = remembered();
  if (cached) return Promise.resolve(cached);

  /* One request however many forms are on the page. Two forms mounting
     together used to mean two lookups and two chances to be rate limited. */
  if (inFlight) return inFlight;

  inFlight = (async () => {
    for (const source of SOURCES) {
      try {
        const response = await fetch(source.url, {
          /* Three seconds. Nothing waits on this — it is started when a form
             appears and read when one is sent — but a request left open is a
             connection held for a page that has moved on. */
          signal: AbortSignal.timeout(3000),
        });
        if (!response.ok) continue;

        const place = source.read(await response.json());
        if (place.city) {
          remember(place);
          return place;
        }
      } catch {
        /* Blocked, offline, slow, or answering with something else. Try the
           next one; there is nothing here worth telling anybody about. */
      }
    }
    return null;
  })();

  return inFlight;
}

/**
 * Start the lookup without waiting for it.
 *
 * Called when a form appears, so the answer is already there when somebody
 * presses send. Doing it at submit instead would put a third-party request on
 * the path between pressing the button and the enquiry being stored, which is
 * the one moment on this site where nothing should be allowed to be slow.
 */
export function warmPlace() {
  void lookupPlace();
}
