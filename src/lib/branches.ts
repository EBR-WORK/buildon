/**
 * The branches, what each one carries, and the least it will deliver.
 *
 * Here rather than in the database, which is the opposite of how the rest of
 * this site stores things, and the reason is what the rows hold. `places` is
 * three names an admin typed so leads could be assigned to somebody; this is
 * which of nine products each depot stocks and what a lorry has to carry to be
 * worth sending. Modelling that in the admin panel means a products-per-branch
 * screen nobody has asked for, and the answers change about as often as the
 * product range does — which is to say, in a release.
 *
 * The coordinates are for one job only: guessing which branch to offer first
 * from where the visitor appears to be. They are city centres, because the
 * accuracy that matters is "nearer Pune than Delhi", not "nearer Kothrud".
 *
 * Product ids are the slugs in productCatalogue. They are the same strings, so
 * a product renamed in content.ts keeps working and a product REMOVED there
 * leaves a line here pointing at nothing — which is why branchesFor() matches
 * on the catalogue rather than trusting this list alone.
 */

export type Branch = {
  id: string;
  name: string;
  /** The smallest order this branch will deliver, in tons. */
  minTons: number;
  lat: number;
  lon: number;
  /** Slugs from productCatalogue. */
  products: readonly string[];
};

export const BRANCHES: readonly Branch[] = [
  {
    id: "mumbai",
    name: "Mumbai",
    minTons: 9,
    lat: 19.076,
    lon: 72.8777,
    products: [
      "gypsum-plaster-one-coat",
      "buildon-p-20-ready-mix-plaster",
      "bondit-plaster-bond-plus",
      "imported-gypsum-plaster",
      "classic-gypsum-plaster",
      "gypsum-master-plaster",
      "bondit-151",
    ],
  },
  {
    id: "pune",
    name: "Pune",
    minTons: 12,
    lat: 18.5204,
    lon: 73.8567,
    products: [
      "gypsum-plaster-one-coat",
      "buildon-p-20-ready-mix-plaster",
      "bondit-plaster-bond-plus",
      "imported-gypsum-plaster",
      "classic-gypsum-plaster",
      "gypsum-master-plaster",
      "bondit-151",
    ],
  },
  {
    id: "nashik",
    name: "Nashik",
    minTons: 12,
    lat: 19.9975,
    lon: 73.7898,
    products: [
      "gypsum-plaster-one-coat",
      "bondit-plaster-bond-plus",
      "imported-gypsum-plaster",
      "classic-gypsum-plaster",
      "gypsum-master-plaster",
      "bondit-151",
    ],
  },
  {
    id: "ahmedabad",
    name: "Ahmedabad",
    minTons: 30,
    lat: 23.0225,
    lon: 72.5714,
    products: [
      "gypsum-plaster-one-coat",
      "bondit-plaster-bond-plus",
      "imported-gypsum-plaster",
      "classic-gypsum-plaster",
      "gypsum-master-plaster",
      "bondit-151",
    ],
  },
  {
    id: "nagpur",
    name: "Nagpur",
    minTons: 30,
    lat: 21.1458,
    lon: 79.0882,
    products: [
      "gypsum-plaster-one-coat",
      "bondit-plaster-bond-plus",
      "imported-gypsum-plaster",
      "classic-gypsum-plaster",
      "gypsum-master-plaster",
      "bondit-151",
    ],
  },
  {
    id: "delhi",
    name: "Delhi",
    minTons: 30,
    lat: 28.6139,
    lon: 77.209,
    products: [
      "gypsum-plaster-one-coat",
      "bondit-plaster-bond-plus",
      "imported-gypsum-plaster",
      "classic-gypsum-plaster",
      "gypsum-master-plaster",
      "bondit-151",
      "gypsum-plaster-verimiculite",
      "gypsum-plaster-perlite-one-coat-super-200",
    ],
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    minTons: 30,
    lat: 17.385,
    lon: 78.4867,
    products: [
      "gypsum-plaster-one-coat",
      "bondit-plaster-bond-plus",
      "bondit-151",
    ],
  },
  {
    id: "bangalore",
    name: "Bangalore",
    minTons: 30,
    lat: 12.9716,
    lon: 77.5946,
    products: [
      "gypsum-plaster-one-coat",
      "bondit-plaster-bond-plus",
      "imported-gypsum-plaster",
      "classic-gypsum-plaster",
      "gypsum-master-plaster",
      "bondit-151",
    ],
  },
  {
    id: "chennai",
    name: "Chennai",
    minTons: 30,
    lat: 13.0827,
    lon: 80.2707,
    products: [
      "gypsum-plaster-one-coat",
      "bondit-plaster-bond-plus",
      "imported-gypsum-plaster",
      "classic-gypsum-plaster",
      "gypsum-master-plaster",
      "bondit-151",
    ],
  },
  {
    id: "kerala",
    name: "Kerala (Kochi)",
    minTons: 30,
    lat: 9.9312,
    lon: 76.2673,
    products: [
      "gypsum-plaster-one-coat",
      "bondit-plaster-bond-plus",
    ],
  },
  {
    id: "kolkata",
    name: "Kolkata",
    minTons: 30,
    lat: 22.5726,
    lon: 88.3639,
    products: [
      "gypsum-plaster-one-coat",
      "bondit-plaster-bond-plus",
      "imported-gypsum-plaster",
      "classic-gypsum-plaster",
      "gypsum-master-plaster",
      "bondit-151",
    ],
  },
];

/**
 * The option for somebody the list does not cover.
 *
 * Not a branch: it has no minimum, no coordinates and no id to store. It is
 * here so a visitor in a city with no depot can still finish the form, which
 * is worth more than a tidy dropdown — they are exactly the enquiry somebody
 * should see.
 */
export const OTHER_BRANCH = "Other / not listed";

/** The branches that carry a product, by its slug. Empty when none do. */
export function branchesFor(slug: string | undefined): readonly Branch[] {
  if (!slug) return [];
  return BRANCHES.filter((branch) => branch.products.includes(slug));
}

/** Kilometres between two points, near enough for "which of these is closer". */
function distance(aLat: number, aLon: number, b: Branch) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - aLat);
  const dLon = toRad(b.lon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/**
 * The nearest of a set of branches to a point, or null without one.
 *
 * A guess, offered as a preselection the visitor can change — never as an
 * answer. The point comes from an IP address, which on a mobile network can be
 * a different city and on a VPN a different country.
 */
export function nearestBranch(
  branches: readonly Branch[],
  at: { lat?: number; lon?: number } | null,
): Branch | null {
  if (!branches.length) return null;
  if (!at || typeof at.lat !== "number" || typeof at.lon !== "number") return null;

  let best = branches[0];
  let bestKm = distance(at.lat, at.lon, best);
  for (const branch of branches.slice(1)) {
    const km = distance(at.lat, at.lon, branch);
    if (km < bestKm) {
      best = branch;
      bestKm = km;
    }
  }
  return best;
}
