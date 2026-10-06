/**
 * The shape of the content the admin panel edits.
 *
 * One type per editable section, and a `defaults` built from the site's own
 * content modules — so an empty CMS renders exactly what the site renders
 * today, and "reset" means "back to what is in the repo".
 *
 * These types are the contract between the admin UI and whatever stores the
 * content. They do not mention localStorage, JSON or Supabase on purpose: see
 * repository.ts.
 */

import {
  careerPage,
  faqPage,
  hero,
  productCatalogue,
  productsPage,
  projectsPage,
  testimonials,
} from "@/lib/content";
import { productDetails } from "@/lib/productDetails";
import { projectDetails } from "@/lib/projectDetails";
import { jobOpenings } from "@/lib/careerDetails";
import { blogAuthors, blogPosts } from "@/lib/blogDetails";

/**
 * A stretch of text with its own formatting — the same shape the blog's
 * paragraphs use, so the rich text editor built for products carries straight
 * over to posts later without a second model.
 */
export type RichRun = {
  text: string;
  bold?: boolean;
  href?: string;
};

export type CtaField = {
  readonly label: string;
  readonly href: string;
};

export type HeroContent = {
  /** The red pill above the headline. */
  eyebrow: string;
  /**
   * One string per rendered line. An array rather than one string with breaks:
   * the second line is coloured differently, so the split is the design.
   */
  titleLines: string[];
  intro: string;
  primaryCta: CtaField;
  /** Opens elsewhere — YouTube today. */
  videoCta: CtaField;
  /** Looping, muted clip behind the copy. */
  video: string;
};

export type TestimonialItem = {
  quote: string;
  author: string;
};

export type TestimonialsContent = {
  title: string;
  cta: CtaField;
  video: { src: string; poster: string };
  items: TestimonialItem[];
};

export type ProductEntry = {
  /** Stable row identity — see newId. Never shown, never changes. */
  readonly id: string;
  /**
   * The page's URL. Editable only until the product ships — `isShippedProduct`
   * decides, and the editor locks the field for anything already live, since
   * renaming it would break every link to that page.
   */
  slug: string;
  name: string;
  /** The card's one-line summary on the products grid. */
  cardBody: string;
  /** The thumbnail on the products grid and in More Products rows. */
  image: string;
  /** The opening paragraph of the product's own page — rich text. */
  intro: RichRun[];
};

export type ProductsContent = {
  heading: string;
  intro: string;
  items: ProductEntry[];
};

export type ProjectEntry = {
  /** Stable row identity — see newId. Never shown, never changes. */
  readonly id: string;
  /** The detail page's URL. Locked once the project is live. */
  slug: string;
  /** As the listing card writes it — en dashes and all. */
  name: string;
  /** The heading on the project's own page, which often differs from `name`. */
  title: string;
  /** The listing card's excerpt. */
  cardBody: string;
  image: string;
  /** Body copy, one entry per paragraph, each with its own formatting. */
  paragraphs: RichRun[][];
};

export type ProjectsContent = {
  /** The listing's "Read More >" label. */
  readMore: string;
  items: ProjectEntry[];
};

export type JobEntry = {
  /** Stable row identity — see newId. Never shown, never changes. */
  readonly id: string;
  /** The job page's URL. Locked once the opening is live. */
  slug: string;
  title: string;
  /** The plugin's three specification terms, as the reference labels them. */
  category: string;
  /** "5 years Experience" — shown on the card and the page. */
  type: string;
  location: string;
  /**
   * "Key Responsibilities". Plain strings: the reference sets no links inside
   * them, so a rich text field here would offer formatting nothing uses.
   */
  responsibilities: string[];
};

export type CareerContent = {
  /** The heading above the openings list. */
  openingsTitle: string;
  /** The card's link label — "More Details". */
  moreLabel: string;
  jobs: JobEntry[];
};

/**
 * One block of a post's body.
 *
 * The same five kinds the blog renderer already understands, each carrying an
 * `id` for the same reason list rows do: the editor keys on it, and a key
 * derived from the content unmounts the field being typed into.
 *
 * A heading's link is flattened to two fields rather than a nested object,
 * because a form with an optional object in it needs a branch at every level
 * and this one is only ever two text boxes.
 */
export type BlogBlockEntry =
  | {
      readonly id: string;
      kind: "h2" | "h3";
      text: string;
      /** Must appear in `text` verbatim; the renderer splits on it. */
      linkText?: string;
      linkHref?: string;
    }
  | { readonly id: string; kind: "p"; runs: RichRun[] }
  | { readonly id: string; kind: "ul"; items: RichRun[][] }
  | {
      readonly id: string;
      kind: "image";
      src: string;
      alt: string;
      width: number;
      height: number;
    };

export type BlogEntry = {
  /** Stable row identity — see newId. Never shown, never changes. */
  readonly id: string;
  /** The post's URL, at the site root. Locked once the post is live. */
  slug: string;
  title: string;
  /** The meta description, and the listing card's excerpt. */
  description: string;
  /** The featured image, used by the card and the page banner. */
  image: string;
  /** ISO dates. `modified` drives nothing visible but is in the JSON-LD. */
  published: string;
  modified: string;
  /** A key into blogAuthors — the site credits three people. */
  author: string;
  body: BlogBlockEntry[];
};

export type BlogContent = {
  items: BlogEntry[];
};

export type FaqItemEntry = {
  readonly id: string;
  question: string;
  /**
   * Plain text, not rich text. The reference sets no links inside an answer,
   * and the accordion renders a single paragraph.
   */
  answer: string;
};

export type FaqGroupEntry = {
  readonly id: string;
  /** The accordion's section heading — "Gypsum plaster". */
  title: string;
  items: FaqItemEntry[];
};

export type FaqContent = {
  /** The page heading. */
  title: string;
  groups: FaqGroupEntry[];
};

/* "Life at Buildon" is deliberately absent: its galleries are fixed event
   albums, edited in content.ts on the rare occasion they change. */

/** Every section the admin can edit, keyed by the page it belongs to. */
export type SiteContent = {
  home: {
    hero: HeroContent;
    testimonials: TestimonialsContent;
  };
  products: ProductsContent;
  projects: ProjectsContent;
  career: CareerContent;
  blog: BlogContent;
  faq: FaqContent;
};

/** What the site ships with — the content modules, unchanged. */
export const defaults: SiteContent = {
  home: {
    hero: {
      eyebrow: hero.eyebrow,
      titleLines: [...hero.titleLines],
      intro: hero.intro,
      primaryCta: { ...hero.primaryCta },
      videoCta: { ...hero.videoCta },
      video: hero.video,
    },
    testimonials: {
      title: testimonials.title,
      cta: { ...testimonials.cta },
      video: { ...testimonials.video },
      items: testimonials.items.map((item) => ({
        quote: item.quote,
        author: item.author,
      })),
    },
  },
  products: {
    heading: productsPage.heading,
    intro: productsPage.intro,
    /* The catalogue is the order the grid uses; the detail module carries the
       page copy. A product with no detail page yet still appears, with an empty
       intro, rather than being silently dropped. */
    items: productCatalogue.map((product) => ({
      id: product.slug,
      slug: product.slug,
      name: product.name,
      cardBody: product.body,
      image: product.image,
      intro: (() => {
        const detail = productDetails.find((entry) => entry.slug === product.slug);
        return detail ? [{ text: detail.intro }] : [];
      })(),
    })),
  },
  projects: {
    readMore: projectsPage.readMore,
    /* The listing is the order the grid uses; the detail module carries the
       page copy. Matched on name, which is what projectHref matches on too. */
    items: projectsPage.items.map((item) => {
      const detail = projectDetails.find((entry) => entry.name === item.name);
      return {
        id: detail?.slug ?? slugify(item.name),
        slug: detail?.slug ?? slugify(item.name),
        name: item.name,
        title: detail?.title ?? item.name,
        cardBody: item.body,
        image: item.image,
        paragraphs: detail ? detail.paragraphs.map((text) => [{ text }]) : [],
      };
    }),
  },
  blog: {
    /* The posts as transcribed, blocks and all. The body is mapped rather than
       spread because every block gains an id the source does not carry, and a
       heading's nested `link` is flattened into two fields. */
    items: blogPosts.map((post) => ({
      id: post.slug,
      slug: post.slug,
      title: post.title,
      description: post.description,
      image: post.image,
      published: post.published,
      modified: post.modified,
      author: post.author,
      body: post.body.map((block): BlogBlockEntry => {
        switch (block.kind) {
          case "h2":
          case "h3":
            return {
              id: newId(),
              kind: block.kind,
              text: block.text,
              linkText: block.link?.text,
              linkHref: block.link?.href,
            };
          case "ul":
            return {
              id: newId(),
              kind: "ul",
              items: block.items.map((item) => item.map((run) => ({ ...run }))),
            };
          case "image":
            return {
              id: newId(),
              kind: "image",
              src: block.src,
              alt: block.alt,
              width: block.width,
              height: block.height,
            };
          default:
            return { id: newId(), kind: "p", runs: block.runs.map((run) => ({ ...run })) };
        }
      }),
    })),
  },
  faq: {
    title: faqPage.title,
    groups: faqPage.groups.map((group) => ({
      id: slugify(group.title),
      title: group.title,
      items: group.items.map((item) => ({
        id: newId(),
        question: item.question,
        answer: item.answer,
      })),
    })),
  },
  career: {
    openingsTitle: careerPage.openings.title,
    moreLabel: careerPage.openings.more,
    /* The listing and the job pages are two modules; an opening is matched on
       title and location, which is what jobHref matches on too. */
    jobs: careerPage.openings.items.map((item) => {
      const detail = jobOpenings.find(
        (job) => job.title === item.title && job.location === item.location,
      );
      return {
        id: detail?.slug ?? slugify(item.title + "-" + item.location),
        slug: detail?.slug ?? slugify(item.title + "-" + item.location),
        title: item.title,
        category: detail?.category ?? item.title,
        type: detail?.type ?? item.experience,
        location: item.location,
        responsibilities: detail ? [...detail.responsibilities] : [],
      };
    }),
  },
};

/**
 * A stable identity for a list row.
 *
 * Not the slug: the slug follows the name while a row is new, and using it as a
 * React key unmounted the row on every keystroke — the field lost focus after
 * each letter. The id never changes, so the row survives a rename.
 */
export function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

/** A URL-safe slug from a name. */
export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Whether a product already ships with the site.
 *
 * An existing product's slug is its URL and is locked: renaming it would break
 * every link to that page. A product created in the admin has no page yet, so
 * its slug is still free to choose.
 */
export function isShippedProduct(slug: string) {
  return defaults.products.items.some((item) => item.slug === slug);
}

/** Whether a job opening already ships with the site. */
export function isShippedJob(slug: string) {
  return defaults.career.jobs.some((job) => job.slug === slug);
}

/** Whether a project already ships with the site. */
export function isShippedProject(slug: string) {
  return defaults.projects.items.some((item) => item.slug === slug);
}

/** Whether a post already ships with the site. */
export function isShippedPost(slug: string) {
  return defaults.blog.items.some((item) => item.slug === slug);
}

/** The author keys a post may be credited to. */
export const blogAuthorKeys = Object.keys(blogAuthors);

/** A deep copy, so editing a draft can never mutate the defaults. */
export function cloneDefaults(): SiteContent {
  return structuredClone(defaults);
}

/**
 * The routes a link field may point at.
 *
 * A picker rather than a free-text box: a CTA that 404s is the easiest mistake
 * to make and the hardest to notice.
 */
export const internalRoutes = [
  "/",
  "/about-us",
  "/products",
  "/projects",
  "/clientele",
  "/career",
  "/blog",
  "/contact-us",
  "/faq",
  "/testimonials",
  "/gypsum-plaster",
] as const;
