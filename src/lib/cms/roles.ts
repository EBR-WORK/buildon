/**
 * The six roles, and what each one is for.
 *
 * One table rather than a predicate scattered per screen: the rail, the
 * dashboard and every guard read from here, so adding a role is an entry in
 * this file and a line in the migration rather than a hunt through components.
 *
 * None of it is enforcement. Everything below decides what is worth *showing*;
 * what is *allowed* is decided by the policies in 0009_roles_and_leads.sql,
 * which Postgres applies whatever the browser believes. A salesperson who
 * types /admin/team reaches the screen and it comes back empty — which is the
 * right shape: the lock is on the data, not on the menu.
 */

export type AdminRole =
  | "super_admin"
  | "content_editor"
  | "hr"
  | "marketing"
  | "sales"
  | "presales"
  /** The original role, before there were six. Behaves as content_editor. */
  | "admin";

/** Everything a panel might be allowed to do. */
export type Capability =
  /** The CMS: home, products, projects, blog, FAQ, media. */
  | "content"
  /** Job postings: draft, open, closed. */
  | "jobs"
  /** Who has applied, and their CVs. */
  | "applications"
  /** Every lead, whoever it belongs to. */
  | "leads:all"
  /** Only the leads assigned to me. */
  | "leads:mine"
  /** Hand a lead to a salesperson. */
  | "leads:assign"
  /** Add notes and move a lead's status. */
  | "leads:work"
  /** Branches. */
  | "places"
  /** People, roles, and what the Publish button points at. */
  | "team";

type RoleSpec = {
  readonly label: string;
  readonly summary: string;
  readonly can: readonly Capability[];
};

export const ROLES: Record<AdminRole, RoleSpec> = {
  super_admin: {
    label: "Super admin",
    summary: "Full control — people, roles, places, every panel, settings and the CMS.",
    can: [
      "content",
      "jobs",
      "applications",
      "leads:all",
      "leads:mine",
      "leads:assign",
      "leads:work",
      "places",
      "team",
    ],
  },
  hr: {
    label: "HR",
    summary: "Creates and manages job postings, and reads the applications they bring in.",
    can: ["jobs", "applications"],
  },
  marketing: {
    label: "Marketing",
    summary: "Sees every lead from every place, and assigns each to a salesperson there.",
    can: ["leads:all", "leads:assign", "leads:work"],
  },
  sales: {
    label: "Sales",
    summary: "Sees only their own assigned leads; updates status and notes.",
    can: ["leads:mine", "leads:work"],
  },
  presales: {
    /* Read-only on the lead itself, by design: presales qualifies and advises,
       and the person who owns the lead is the one who moves it. Notes are
       where that advice goes, which is why they can write those. */
    label: "Presales",
    summary: "Tracks who is assigned where and the live status; qualifies and supports leads.",
    can: ["leads:all", "leads:work"],
  },
  content_editor: {
    label: "Content editor",
    summary: "The website only — blogs, pages and media.",
    can: ["content"],
  },
  admin: {
    label: "Content editor",
    summary: "The website only — blogs, pages and media.",
    can: ["content"],
  },
};

/** Every role a super admin may hand out. `admin` is legacy and not offered. */
export const ASSIGNABLE_ROLES: readonly AdminRole[] = [
  "super_admin",
  "content_editor",
  "hr",
  "marketing",
  "sales",
  "presales",
];

export function can(role: AdminRole | null | undefined, capability: Capability) {
  if (!role) return false;
  return ROLES[role]?.can.includes(capability) ?? false;
}

export function describeRole(role: AdminRole | null | undefined) {
  return role ? (ROLES[role]?.label ?? role) : "No access";
}

/**
 * Which roles belong to a place.
 *
 * Only the ones that work a territory. A content editor has no branch, and
 * asking for one on the Team screen would be a required answer nobody has.
 */
export const PLACED_ROLES: readonly AdminRole[] = ["sales", "marketing", "presales"];

export const needsPlace = (role: AdminRole | null | undefined) =>
  Boolean(role && PLACED_ROLES.includes(role));

/* ----------------------------------------------------------------- panels */

export type PanelLink = {
  readonly href: string;
  readonly label: string;
  readonly note: string;
  readonly needs: Capability;
};

/**
 * Every screen in the panel, with what it takes to see it.
 *
 * Order matters: it is the order of the rail, and the first one a role may
 * open is where that role lands after signing in.
 */
export const PANELS: readonly PanelLink[] = [
  { href: "/admin/leads", label: "Leads", note: "Enquiries to work", needs: "leads:mine" },
  { href: "/admin/applications", label: "Applications", note: "Who has applied", needs: "applications" },
  { href: "/admin/career", label: "Careers", note: "Job postings", needs: "jobs" },
  { href: "/admin/home", label: "Home", note: "Hero · Testimonials", needs: "content" },
  { href: "/admin/products", label: "Products", note: "Grid · 9 products", needs: "content" },
  { href: "/admin/projects", label: "Projects", note: "24 developments", needs: "content" },
  { href: "/admin/blog", label: "Blog", note: "33 articles", needs: "content" },
  { href: "/admin/faq", label: "FAQs", note: "3 sections · 18 questions", needs: "content" },
  /* Places is not in the rail yet — the screen does not exist, and a link to
     a 404 is worse than no link. Restore this line with the page. */
  { href: "/admin/team", label: "Team", note: "Who may do what", needs: "team" },
];

/**
 * What a path requires, or null when it requires nothing in particular.
 *
 * Used by the gate to turn somebody away from a screen their role does not
 * include. The rail already leaves those links out, but a link is not a lock:
 * /admin/career typed into the address bar rendered the careers editor for a
 * marketing account until this existed. Its saves were refused by the
 * database, which is the real protection — but a screen that looks usable and
 * cannot save is a worse answer than a plain "this is not yours".
 */
export function capabilityForPath(pathname: string | null): Capability | null {
  if (!pathname) return null;
  /* Longest first: /admin/products and /admin/products/x both belong to the
     same panel, and a shorter prefix must not claim a longer path. */
  const match = [...PANELS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((panel) => pathname === panel.href || pathname.startsWith(`${panel.href}/`));
  return match?.needs ?? null;
}

/** The panels this role may open, in rail order. */
export function panelsFor(role: AdminRole | null | undefined) {
  if (!role) return [];
  return PANELS.filter(
    (panel) =>
      can(role, panel.needs) ||
      /* Leads is one screen with two shapes: everything, or only mine. */
      (panel.needs === "leads:mine" && can(role, "leads:all")),
  );
}

/** Where this role lands after signing in. */
export function homeFor(role: AdminRole | null | undefined) {
  return panelsFor(role)[0]?.href ?? "/admin";
}
