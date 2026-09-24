/**
 * The nine product detail pages, transcribed from buildon.co.in/products/<slug>/.
 *
 * Same rule as content.ts: every string is the reference site's own, typos and
 * punctuation included. Fix them there first, then mirror the fix here.
 *
 * Sections differ from product to product — the two Bondit pages carry usage
 * blocks the plasters do not, and only four products document an application
 * process — so `sections` is an ordered list of typed blocks rather than a
 * fixed set of fields. `kind` decides how the page renders each one:
 *
 *   applied_on  photograph above a caption    Applied on
 *   features    icon and label, in a panel    Features
 *   icon_cards  icon above a short label      Advantages · Benefits
 *   icon_text   icon over a sentence, carded  Application of Gypsum · Advantages · Benefits
 *   icon_grid   icon over a sentence, ruled   Direction For Use · the Bondit step blocks
 *   tools       icon above a tool name        Tools for Application
 *   steps       photograph above a caption    Application Process
 *   rich_text   heading over paragraphs       Precautions · Health & Safety · usage notes
 *
 * This shape is deliberately close to the `products` table and its `blocks`
 * jsonb column in supabase/migrations, so Phase 3 can move it into the CMS
 * without reshaping it.
 */

export type ProductCatalogue = {
  readonly label: string;
  readonly href: string;
};

export type ProductSectionKind =
  | "applied_on"
  | "features"
  | "icon_cards"
  | "icon_text"
  | "icon_grid"
  | "tools"
  | "steps"
  | "rich_text";

export type ProductSectionItem = {
  /** Public path of the icon or photograph; null for text-only items. */
  readonly icon: string | null;
  readonly text: string;
};

export type ProductSection = {
  readonly heading: string;
  readonly kind: ProductSectionKind;
  readonly items: readonly ProductSectionItem[];
  /** A sentence introducing the block, shown under its heading. */
  readonly intro: string | null;
  /**
   * The photograph the reference lays this block over, tinted by a colour wash.
   * Only the tools and features blocks have one.
   */
  readonly background: string | null;
};

export type ProductSpec = {
  readonly label: string;
  readonly value: string;
};

export type ProductDetail = {
  readonly slug: string;
  /** The name productCatalogue and the cards use. */
  readonly name: string;
  /** The small line above the title on the reference's banner. */
  readonly eyebrow: string;
  /** The banner heading, set in caps by the reference. */
  readonly title: string;
  /** The titlebar artwork: a colour panel for the heading, photograph beside it. */
  readonly banner: string;
  /**
   * How hard the banner has to be washed for white type to stay legible.
   * Measured per artwork: the panels run from luminance 69 (near black) to
   * 211 (almost white), so a single wash would either fail the light ones or
   * needlessly mute the dark ones.
   */
  readonly bannerScrim: "none" | "light" | "strong";
  readonly hero: string | null;
  readonly intro: string;
  /** Certification marks — IGBC, ISO, MHADA. */
  readonly approvals: readonly string[];
  readonly sections: readonly ProductSection[];
  readonly specs: readonly ProductSpec[];
  /** The packaging shot beside the specification table. */
  readonly pack: string | null;
  /** The product's PDF catalogue — six of the nine publish one. */
  readonly catalogue: ProductCatalogue | null;
  /**
   * Whether the reference carries the enquiry form on this page. Three do not
   * (Master, Vermiculite, Bondit-151); the site-wide quote tab still offers it.
   */
  readonly hasEnquiry: boolean;
  /** Slugs the reference lists under "More Products" on this page. */
  readonly related: readonly string[];
  /**
   * The picture this product wears when another page lists it under "More
   * Products" — the reference uses a separate 720x544 crop there, not the
   * listing shot. Null for the two products it never lists.
   */
  readonly cardImage: string | null;
};

export const productDetails: readonly ProductDetail[] = [
  {
    slug: "gypsum-plaster-one-coat",
    name: "Gypsum Plaster One Coat",
    eyebrow: "A coat of beauty to your dream.",
    title: "GYPSUM PLASTER 1 COAT.",
    banner: "/products/gypsum-plaster-one-coat/banner.webp",
    bannerScrim: "none",
    hero: "/products/gypsum-plaster-one-coat/hero.webp",
    intro: "BUILDON Gypsum Plaster 1 Coat is produced from the light powder-density rock sourced from the purest mines. The advantage of our Gypsum is that it is the highest grade, pure white in colour, and 40% harder than any other Gypsum Plaster available in the Indian market. This Gypsum plaster can be applied easily and directly on all surfaces without the need for sand/cement/ plaster on the walls. The coverage in a 25Kg bag is 20 Sq. Ft. with a thickness of 12mm. The Fineness of 200 Mesh and purity over 90% ensure the best atomic bond and an absolute mirror finish.",
    approvals: ["/products/approvals/2019-02-indian-green-building-council-vector-logo-xs.webp", "/products/approvals/2019-03-isolation_mode-1.webp", "/products/approvals/2019-03-isolation_mode-2.webp"],
    sections: [
      {
        heading: "Applied on",
        kind: "applied_on",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-brick-wall-1.webp", text: "Brick Wall" },
          { icon: "/products/detail/2019-03-block-wall-1.webp", text: "Block Wall" },
          { icon: "/products/detail/2019-03-rcc-1.webp", text: "RCC Structure" },
        ],
      },
      {
        heading: "Application of Gypsum",
        kind: "icon_text",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-application-1-1.webp", text: "The surface must be clean, dry, firm & free of dust." },
          { icon: "/products/detail/2019-02-application-3-1.webp", text: "Important properties like soluble salt content, thermal characteristics, shrinkage, strength, suction bonding properties etc of the background which is to plastered, should be evaluated before application." },
          { icon: "/products/detail/2019-02-isolation_mode.webp", text: "Gypsum plaster one coat can be applied directly on most surfaces like Brick walls/Fly ash brick/Siporex blocks/Concrete surfaces/Sand cement plaster walls etc." },
          { icon: "/products/detail/2019-02-application-4-1-1.webp", text: "A suitable fixture can be fixed after the plaster has been set. You can put up fixtures of varying weights. Smaller ones can be supported by using steel hooks and pins, while heavier frames and objects can be accommodated with plugs and screws or suitable fixtures, adequately penetrated into the background to ensure a firm hold." },
        ],
      },
      {
        heading: "Tools for Application",
        kind: "tools",
        background: "/products/backgrounds/mask-group-26.webp",
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-vector-4.webp", text: "Mixing Bucket" },
          { icon: "/products/detail/2019-02-layer_1-2.webp", text: "Plumb BOB" },
          { icon: "/products/detail/2019-02-layer_1-3.webp", text: "Steel Trowel" },
          { icon: "/products/detail/2019-02-layer_1-4.webp", text: "Right Angled Scale" },
          { icon: "/products/detail/2019-02-layer_1-5.webp", text: "Line Dori" },
          { icon: "/products/detail/2019-02-layer_1-6.webp", text: "Aluminium Channel" },
          { icon: "/products/detail/2019-02-layer_1-7.webp", text: "Measuring Tape" },
        ],
      },
      {
        heading: "Direction For Use",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-application-5-1.webp", text: "The right way to mix is to add the powder to water, not water to the powder. The ratio of the powder should be 1:1.30." },
          { icon: "/products/detail/2019-02-application-6-2.webp", text: "Avoid mixing more powder that can be used within 12 minutes - 15 minutes." },
          { icon: "/products/detail/2019-02-application-7-2.webp", text: "Do not temper or mix fresh material once a mix has started to set." },
          { icon: "/products/detail/2019-02-application-8-1.webp", text: "After taking the required amount of plaster, always fold the open end, to protect the plaster from moisture." },
          { icon: "/products/detail/2019-02-group-1000004064.webp", text: "The setting time cannot be altered by diluting the mixture. For a longer setting time, the BUILDON retarder should be added." },
        ],
      },
      {
        heading: "Features",
        kind: "features",
        background: "/products/backgrounds/mask-group-27.webp",
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-layer_1-1.webp", text: "Single coat application" },
          { icon: "/products/detail/2019-02-smooth-finish-1.webp", text: "Very smooth finish" },
          { icon: "/products/detail/2019-02-layer_1-8.webp", text: "Can be applied directly on all walls/surfaces" },
          { icon: "/products/detail/2019-02-shrinkage-1.webp", text: "Free of shrinkage cracks" },
          { icon: "/products/detail/2019-02-maintance-1.webp", text: "Zero maintenance" },
          { icon: "/products/detail/2019-02-compatable-1.webp", text: "Compatible with all types of paints" },
          { icon: "/products/detail/2019-02-group-1000004069.webp", text: "Pure white in colour" },
        ],
      },
      {
        heading: "Application Process",
        kind: "steps",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2019-02-group-1000004190.webp", text: "Apply a thick layer on brick wall" },
          { icon: "/products/detail/2019-02-group-1000004174.webp", text: "Apply a thin layer on board" },
          { icon: "/products/detail/2019-02-group-1000004192.webp", text: "Apply directly on surface" },
          { icon: "/products/detail/2019-02-group-1000004193.webp", text: "Level it out with an aluminium channel or straight edge. Leave until partially set." },
          { icon: "/products/detail/2019-02-group-1000004194.webp", text: "Steel Trowel is used to scrape dead plaster off the wall" },
          { icon: "/products/detail/2019-02-frame-4.webp", text: "Clean all tools" },
        ],
      },
    ],
    specs: [
      { label: "Purity", value: "90% and above" },
      { label: "Whiteness", value: "92%" },
      { label: "Fineness Mesh", value: "Mesh 200, Residue 2%" },
      { label: "Setting Time", value: "Intial 12 - 15 min. Final 24 - 30 min." },
      { label: "Compressive Strength (Dry)", value: "20 N/mm2" },
      { label: "Coverage at 12mm thickness", value: "20 Sq. ft." },
      { label: "Dry Bulk Density", value: "750 Kg / m3" },
      { label: "Standard Compliance", value: "IS 2547-1 Part 1 & Part 2" },
      { label: "Shelf Life", value: "8 months" },
    ],
    pack: "/products/gypsum-plaster-one-coat/pack.webp",
    catalogue: { label: "Download One coat Catalogue", href: "/products/gypsum-plaster-one-coat/catalogue.pdf" },
    hasEnquiry: true,
    related: ["bondit-plaster-bond-plus", "bondit-151", "buildon-p-20-ready-mix-plaster"],
    cardImage: null,
  },
  {
    slug: "imported-gypsum-plaster",
    name: "Imported Gypsum Plaster",
    eyebrow: "FINEST PLASTER TO THE WALLS.",
    title: "IMPORTED GYPSUM PLASTER.",
    banner: "/products/imported-gypsum-plaster/banner.webp",
    bannerScrim: "none",
    hero: "/products/imported-gypsum-plaster/hero.webp",
    intro: "BUILDON Gypsum Plaster is produced from the light powder-density rock sourced from the purest mines. The advantage of our Gypsum is that it is the highest grade, pure white in colour, and 40% harder than any other Gypsum Plaster available in the Indian market. This Gypsum plaster can be applied easily and directly on all surfaces without the need for sand/cement/ plaster on the walls. The coverage in a 25Kg bag is 20 Sq. Ft. with a thickness of 12mm. The Fineness of 200 Mesh and purity over 85% ensure the best atomic bond and an absolute mirror finish.",
    approvals: ["/products/approvals/2019-02-group-1000004099-1.webp"],
    sections: [
      {
        heading: "Applied on",
        kind: "applied_on",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-brick-wall-1.webp", text: "Brick Wall" },
          { icon: "/products/detail/2019-03-block-wall-1.webp", text: "Block Wall" },
          { icon: "/products/detail/2019-03-rcc-1.webp", text: "RCC Structure" },
        ],
      },
      {
        heading: "Application of Gypsum",
        kind: "icon_text",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-application-1-1.webp", text: "The surface must be clean, dry, firm & free of dust." },
          { icon: "/products/detail/2019-02-application-3-1.webp", text: "Important properties like soluble salt content, thermal characteristics, shrinkage, strength, suction bonding properties etc of the background which is to plastered, should be evaluated before application." },
          { icon: "/products/detail/2019-02-isolation_mode.webp", text: "Imported Gypsum Plaster can be applied directly on most of the surfaces like Brick Wall / Fly Ash Brick / Siporex Blocks / Concrete Surface / Sand Cement Plaster wall etc." },
          { icon: "/products/detail/2019-02-application-4-1-1.webp", text: "Once the plaster sets, install fixtures - utilize hooks and pins for lighter items, and employ plugs & screws for heavier objects, ensuring a secure grip." },
        ],
      },
      {
        heading: "Tools for Application",
        kind: "tools",
        background: "/products/backgrounds/imported-gypsum-catlogue-1-1.webp",
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-vector-4.webp", text: "Mixing Bucket" },
          { icon: "/products/detail/2019-02-layer_1-2.webp", text: "Plumb BOB" },
          { icon: "/products/detail/2019-02-layer_1-3.webp", text: "Steel Trowel" },
          { icon: "/products/detail/2019-02-layer_1-4.webp", text: "Right Angled Scale" },
          { icon: "/products/detail/2019-02-layer_1-5.webp", text: "Line Dori" },
          { icon: "/products/detail/2019-02-layer_1-6.webp", text: "Aluminium Channel" },
          { icon: "/products/detail/2019-02-layer_1-7.webp", text: "Measuring Tape" },
        ],
      },
      {
        heading: "Direction For Use",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-application-5-1.webp", text: "The right way to mix is to add the powder to water, not water to the powder. The ratio of the powder should be 1:1.30." },
          { icon: "/products/detail/2019-02-application-6-2.webp", text: "Avoid mixing more powder that can be used within 15 minutes." },
          { icon: "/products/detail/2019-02-application-7-2.webp", text: "Do not temper or mix fresh material once a mix has started to set." },
          { icon: "/products/detail/2019-02-application-8-1.webp", text: "After taking the required amount of plaster, always fold the open end, to protect the plaster from moisture." },
          { icon: "/products/detail/2019-02-group-1000004064.webp", text: "Setting time cannot be altered by diluting the mixture with water. For a longer setting time,the BUILDON retarder should be added." },
        ],
      },
      {
        heading: "Features",
        kind: "features",
        background: "/products/backgrounds/mask-group-14.webp",
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-layer_1-1.webp", text: "Single coat application" },
          { icon: "/products/detail/2019-02-smooth-finish-1.webp", text: "Very smooth finish" },
          { icon: "/products/detail/2019-02-layer_1-8.webp", text: "Can be applied directly on all walls/surfaces" },
          { icon: "/products/detail/2019-02-shrinkage-1.webp", text: "Free of shrinkage cracks" },
          { icon: "/products/detail/2019-02-maintance-1.webp", text: "Zero maintenance" },
          { icon: "/products/detail/2019-02-compatable-1.webp", text: "Compatible with all types of paints" },
        ],
      },
      {
        heading: "Application Process",
        kind: "steps",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2019-02-group-1000004190.webp", text: "Apply a thick layer on brick wall" },
          { icon: "/products/detail/2019-02-group-1000004174.webp", text: "Apply a thin layer on board" },
          { icon: "/products/detail/2019-02-group-1000004192.webp", text: "Apply directly on surface" },
          { icon: "/products/detail/2019-02-group-1000004193.webp", text: "Level it out with an aluminium channel or straight edge. Leave until partially set." },
          { icon: "/products/detail/2019-02-group-1000004194.webp", text: "Steel Trowel is used to scrape dead plaster off the wall" },
          { icon: "/products/detail/2019-02-frame-4.webp", text: "Clean all tools" },
        ],
      },
    ],
    specs: [
      { label: "Purity", value: "85% and above" },
      { label: "Whiteness", value: "85% Mily white" },
      { label: "Fineness Mesh", value: "Mesh 200, Residue 2%" },
      { label: "Setting Time", value: "Intial 12 - 15 min. Final 24 - 30 min." },
      { label: "Compressive Strength (Dry)", value: "15 N/mm2" },
      { label: "Coverage at 12mm thickness", value: "20 Sq. ft." },
      { label: "Dry Bulk Density", value: "690 Kg / m3" },
      { label: "Standard Compliance", value: "IS 2547-1 Part 1 & Part 2" },
      { label: "Shelf Life", value: "8 months" },
    ],
    pack: "/products/imported-gypsum-plaster/pack.webp",
    catalogue: { label: "Download Imported gypsum Catalogue", href: "/products/imported-gypsum-plaster/catalogue.pdf" },
    hasEnquiry: true,
    related: ["classic-gypsum-plaster", "gypsum-plaster-perlite-one-coat-super-200", "gypsum-plaster-verimiculite"],
    cardImage: "/products/imported-gypsum-plaster/card.webp",
  },
  {
    slug: "gypsum-master-plaster",
    name: "Gypsum Master Plaster",
    eyebrow: "for a masterclass finish.",
    title: "GYPSUM MASTER PLASTER",
    banner: "/products/gypsum-master-plaster/banner.webp",
    bannerScrim: "none",
    hero: "/products/gypsum-master-plaster/hero.webp",
    intro: "BUILDON Gypsum Master Plaster is produced from the light powder-density rock sourced from the purest mines. The advantage of our Gypsum is that it is the highest grade, pure white in colour, and 40% harder than any other Gypsum Plaster available in the Indian market. This Gypsum plaster can be applied easily and directly on all surfaces without the need for sand/cement/ plaster on the walls. The coverage in a 20Kg bag is 16 Sq. Ft. with a thickness of 12mm. The Fineness of 150 Mesh and purity over 85% ensure the best atomic bond and an absolute mirror finish.",
    approvals: ["/products/approvals/2024-03-211x300.webp"],
    sections: [
      {
        heading: "Applied on",
        kind: "applied_on",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-brick-wall-1.webp", text: "Brick Wall" },
          { icon: "/products/detail/2019-03-block-wall-1.webp", text: "Block Wall" },
          { icon: "/products/detail/2019-03-rcc-1.webp", text: "RCC Structure" },
        ],
      },
      {
        heading: "Application of Gypsum",
        kind: "icon_text",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-application-1-1.webp", text: "The surface must be clean, dry, firm & free of dust." },
          { icon: "/products/detail/2019-02-application-3-1.webp", text: "Important properties like soluble salt content, thermal characteristics, shrinkage, strength, suction bonding properties etc of the background which is to plastered, should be evaluated before application." },
          { icon: "/products/detail/2019-02-isolation_mode.webp", text: "Gypsum plaster one coat can be applied directly on most surfaces like Brick walls/Fly ash brick/Siporex blocks/Concrete surfaces/Sand cement plaster walls etc." },
          { icon: "/products/detail/2019-02-application-4-1-1.webp", text: "Once the plaster sets, install fixtures - utilize hooks and pins for lighter items, and employ plugs & screws for heavier objects, ensuring a secure grip." },
        ],
      },
      {
        heading: "Tools for Application",
        kind: "tools",
        background: "/products/backgrounds/beautiful-interior-living-room-with-white-walls-1.webp",
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-vector-4.webp", text: "Mixing Bucket" },
          { icon: "/products/detail/2019-02-layer_1-2.webp", text: "Plumb BOB" },
          { icon: "/products/detail/2019-02-layer_1-3.webp", text: "Steel Trowel" },
          { icon: "/products/detail/2019-02-layer_1-4.webp", text: "Right Angled Scale" },
          { icon: "/products/detail/2019-02-layer_1-5.webp", text: "Line Dori" },
          { icon: "/products/detail/2019-02-layer_1-6.webp", text: "Aluminium Channel" },
          { icon: "/products/detail/2019-02-layer_1-7.webp", text: "Measuring Tape" },
        ],
      },
      {
        heading: "Direction For Use",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-application-5-1.webp", text: "The right way to mix is to add the powder to water, not water to the powder. The ratio of the powder should be 1:1.30." },
          { icon: "/products/detail/2019-02-application-6-2.webp", text: "Avoid mixing more powder that can be used within 15 minutes." },
          { icon: "/products/detail/2019-02-application-7-2.webp", text: "Do not temper or mix fresh material once a mix has started to set." },
          { icon: "/products/detail/2019-02-application-8-1.webp", text: "After taking the required amount of plaster, always fold the open end, to protect the plaster from moisture." },
          { icon: "/products/detail/2019-02-group-1000004064.webp", text: "Setting time cannot be altered by diluting the mixture with water. For a longer setting time,the BUILDON retarder should be added." },
        ],
      },
      {
        heading: "Features",
        kind: "features",
        background: "/products/backgrounds/3d-rendering-high-tech-white-kitchen-modern-kitchen-design-1-1.webp",
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-layer_1-1.webp", text: "Single coat application" },
          { icon: "/products/detail/2019-02-smooth-finish-1.webp", text: "Very smooth finish" },
          { icon: "/products/detail/2019-02-layer_1-8.webp", text: "Can be applied directly on all walls/surfaces" },
          { icon: "/products/detail/2019-02-shrinkage-1.webp", text: "Free of shrinkage cracks" },
          { icon: "/products/detail/2019-02-maintance-1.webp", text: "Zero maintenance" },
          { icon: "/products/detail/2019-02-compatable-1.webp", text: "Compatible with all types of paints" },
        ],
      },
      {
        heading: "Application Process",
        kind: "steps",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2019-02-group-1000004190.webp", text: "Apply a thick layer on brick wall" },
          { icon: "/products/detail/2019-02-group-1000004174.webp", text: "Apply a thin layer on board" },
          { icon: "/products/detail/2019-02-group-1000004192.webp", text: "Apply directly on surface" },
          { icon: "/products/detail/2019-02-group-1000004193.webp", text: "Level it out with an aluminium channel or straight edge. Leave until partially set." },
          { icon: "/products/detail/2019-02-group-1000004194.webp", text: "Steel Trowel is used to scrape dead plaster off the wall" },
          { icon: "/products/detail/2019-02-frame-4.webp", text: "Clean all tools" },
        ],
      },
    ],
    specs: [
      { label: "Purity", value: "85% and above" },
      { label: "Whiteness", value: "85%" },
      { label: "Fineness Mesh", value: "Mesh 150, Residue 2%" },
      { label: "Setting Time", value: "Intial 12 - 15 min. Final 24 - 30 min." },
      { label: "Compressive Strength (Dry)", value: "15 N/mm2" },
      { label: "Coverage at 12mm thickness", value: "16 Sq. ft." },
      { label: "Dry Bulk Density", value: "690 Kg / m3" },
      { label: "Standard Compliance", value: "IS 2547-1 Part 1 & Part 2" },
      { label: "Shelf Life", value: "8 months" },
    ],
    pack: "/products/gypsum-master-plaster/pack.webp",
    catalogue: { label: "Download master plaster Catalogue", href: "/products/gypsum-master-plaster/catalogue.pdf" },
    hasEnquiry: false,
    related: ["bondit-plaster-bond-plus", "bondit-151", "buildon-p-20-ready-mix-plaster"],
    cardImage: null,
  },
  {
    slug: "gypsum-plaster-perlite-one-coat-super-200",
    name: "Gypsum Plaster Perlite One-Coat Super 200",
    eyebrow: "superior quality building deserves",
    title: "Gypsum Plaster Perlite One Coat Super 200.",
    banner: "/products/gypsum-plaster-perlite-one-coat-super-200/banner.webp",
    bannerScrim: "none",
    hero: "/products/gypsum-plaster-perlite-one-coat-super-200/hero.webp",
    intro: "Buildon Gypsum Plaster Perlite One Coat Super 200 is produced from the light powder-density rock sourced from the purest mines. The advantage of our Gypsum is that it is the highest grade, pure white in colour, and 40% harder than any other Gypsum Plaster available in the Indian market. This Gypsum plaster can be applied easily and directly on all surfaces without the need for sand/ cement/plaster on the walls. The coverage in a 25 kg bag is 24 sq. ft. with a thickness of 12mm. The Fineness of 200 Mesh and purity over 92% ensure the best atomic bond and an absolute mirror finish.",
    approvals: ["/products/approvals/2019-02-indian-green-building-council-vector-logo-xs.webp", "/products/approvals/2019-03-isolation_mode-1.webp", "/products/approvals/2019-03-isolation_mode-2.webp"],
    sections: [
      {
        heading: "Application of Gypsum",
        kind: "icon_text",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-application-1-1.webp", text: "The surface must be clean, dry, firm & free of dust." },
          { icon: "/products/detail/2019-02-application-3-1.webp", text: "Important properties like soluble salt content, thermal characteristics, shrinkage, strength, suction bonding properties etc of the background which is to plastered, should be evaluated before application." },
          { icon: "/products/detail/2019-02-isolation_mode.webp", text: "Buildon perlite plaster can be applied directly on most of the surfaces like Brick walls/Fly ash brick/Siporex blocks/Concrete surfaces/Sand cement plaster walls etc." },
          { icon: "/products/detail/2019-02-application-4-1-1.webp", text: "Suitable fixture can be fixed after the plaster reaches it’s initial setting time. once the plasters has the set, you can put fixtures of varying weights. Smaller one can be supported by using steel hooks and pins, while heavies frames and objects can be accommodated with plugs and screws, or suitable fixture, adequately penetrated into the background to ensure a film hold." },
        ],
      },
      {
        heading: "Direction For Use",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-application-5-1.webp", text: "The right way to mix is to add the powder to water, not water to the powder." },
          { icon: "/products/detail/2024-03-application-6-2.webp", text: "Avoid mixing more powder that can be used within 15 minutes." },
          { icon: "/products/detail/2024-03-application-7-2.webp", text: "Do not temper or mix fresh material once a mix has started to set." },
          { icon: "/products/detail/2024-03-application-8-1.webp", text: "After taking the required amount of plaster, always fold the open end, to protect the plaster from moisture." },
          { icon: "/products/detail/2024-03-group-1000004064-1.webp", text: "Setting time cannot be altered by diluting the mixture with water." },
        ],
      },
    ],
    specs: [
      { label: "Purity", value: "90% and above" },
      { label: "Whiteness", value: "92%" },
      { label: "Fineness Mesh", value: "Mesh 200, Residue 2%" },
      { label: "Setting Time", value: "Initial 12 - 15 min. Final 24 - 30 min" },
      { label: "Compressive strength", value: "20 N/mm2" },
      { label: "Coverage at 12mm thickness", value: "24 sq. ft" },
      { label: "Dry Bulk density", value: "750 kg/m3" },
      { label: "Standard compliance", value: "IS 2547-1 Part 1 & Part 2" },
      { label: "Shelf Life", value: "8 months" },
    ],
    pack: "/products/gypsum-plaster-perlite-one-coat-super-200/pack.webp",
    catalogue: null,
    hasEnquiry: true,
    related: ["bondit-plaster-bond-plus", "bondit-151", "buildon-p-20-ready-mix-plaster"],
    cardImage: "/products/gypsum-plaster-perlite-one-coat-super-200/card.webp",
  },
  {
    slug: "gypsum-plaster-verimiculite",
    name: "Gypsum Plaster Vermiculite",
    eyebrow: "Build your dream with",
    title: "GYPSUM PLASTER verimiculite",
    banner: "/products/gypsum-plaster-verimiculite/banner.webp",
    bannerScrim: "none",
    hero: "/products/gypsum-plaster-verimiculite/hero.webp",
    intro: "BUILDON Gypsum Plaster Verimiculite is produced from the light powder-density rock sourced from the purest mines. The advantage of our Gypsum is that it is the highest grade, brownish white in colour, and 40% harder than any other Gypsum Plaster available in the Indian market. This Gypsum plaster can be applied easily and directly on all surfaces without the need for sand/cement/ plaster on the walls. The coverage in a 25Kg bag is 24 Sq. Ft. with a thickness of 12mm. The Fineness of 200 Mesh and purity over 90% ensure the best atomic bond and an absolute mirror finish.",
    approvals: ["/products/approvals/2019-02-indian-green-building-council-vector-logo-xs.webp", "/products/approvals/2019-03-isolation_mode-1.webp", "/products/approvals/2019-03-isolation_mode-2.webp"],
    sections: [
      {
        heading: "Application of Gypsum",
        kind: "icon_text",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-layer_1-37.webp", text: "Surface must be clean, dry, firm & free of dust." },
          { icon: "/products/detail/2024-03-application-3-1.webp", text: "Important properties like soluble salt content, thermal characteristics, shrinkage, strength, suction bonding properties etc of the background to be plastered, should be evaluated before application." },
          { icon: "/products/detail/2024-03-group-1000004075.webp", text: "Buildon perlite plaster can be applied directly on most of the surfaces like Brick walls/Fly ash brick/Siporex blocks/Concrete surfaces/Sand cement plaster walls etc." },
          { icon: "/products/detail/2024-03-application-4-1.webp", text: "Suitable fixture can be fixed after the plaster reaches it’s initial setting time. once the plasters has the set, you can put fixtures of varying weights. Smaller one can be supported by using steel hooks and pins, while heavies frames and objects can be accommodated with plugs and screws, or suitable fixture, adequately penetrated into the background to ensure a film hold." },
        ],
      },
      {
        heading: "Direction For Use",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-application-5-1.webp", text: "The right way to mix is to add the powder to water, not water to the powder." },
          { icon: "/products/detail/2024-03-application-6-2.webp", text: "Avoid mixing more powder that can be used within 15 minutes." },
          { icon: "/products/detail/2024-03-application-7-2.webp", text: "Do not temper or mix fresh material once a mix has started to set." },
          { icon: "/products/detail/2024-03-application-8-1.webp", text: "After taking the required amount of plaster, always fold the open end, to protect the plaster from moisture." },
          { icon: "/products/detail/2024-03-group-1000004064-1.webp", text: "Setting time cannot be altered by diluting the mixture with water." },
        ],
      },
    ],
    specs: [
      { label: "Purity Whiteness", value: "Off white , 78.84 purity" },
      { label: "Fineness", value: "Mesh 200, Residue 4%" },
      { label: "Setting Time", value: "Intial 20 - 25 min. Final 25 - 30 min." },
      { label: "Compressive Strength (Dry)", value: "14 N/mm2" },
      { label: "Coverage at 12mm thickness (25 Kgs bag)", value: "23-24 Sq. ft." },
    ],
    pack: "/products/gypsum-plaster-verimiculite/pack.webp",
    catalogue: null,
    hasEnquiry: false,
    related: ["bondit-plaster-bond-plus", "gypsum-plaster-perlite-one-coat-super-200", "gypsum-master-plaster"],
    cardImage: "/products/gypsum-plaster-verimiculite/card.webp",
  },
  {
    slug: "classic-gypsum-plaster",
    name: "Classic Gypsum Plaster",
    eyebrow: "",
    title: "Classic Gypsum Plaster.",
    banner: "/products/classic-gypsum-plaster/banner.webp",
    bannerScrim: "none",
    hero: "/products/classic-gypsum-plaster/hero.webp",
    intro: "Buildon Classic Gypsum Plaster is produced from the light powder-density rock sourced from the purest mines. The advantage of our Gypsum is that it is the highest grade, white in colour, and 40% harder than any other Gypsum Plaster available in the Indian market. This Gypsum plaster can be applied easily and directly on all surfaces without the need for sand/cement/ plaster on the walls.",
    approvals: ["/products/approvals/2019-02-indian-green-building-council-vector-logo-xs.webp", "/products/approvals/2019-03-isolation_mode-1.webp", "/products/approvals/2019-03-isolation_mode-2.webp"],
    sections: [
      {
        heading: "Application of Gypsum",
        kind: "icon_text",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-application-1-1.webp", text: "Surface must be clean, dry, firm & free of dust." },
          { icon: "/products/detail/2019-02-application-3-1.webp", text: "Important properties like soluble salt content, thermal characteristics, shrinkage, strength, suction bonding properties etc of the background which is to plastered, should be evaluated before application." },
          { icon: "/products/detail/2019-02-isolation_mode.webp", text: "Buildon perlite plaster can be applied directly on most of the surfaces like Brick walls/Fly ash brick/Siporex blocks/Concrete surfaces/Sand cement plaster walls etc." },
          { icon: "/products/detail/2019-02-application-4-1-1.webp", text: "Suitable fixture can be fixed after the plaster reaches it’s initial setting time. once the plasters has the set, you can put fixtures of varying weights. Smaller one can be supported by using steel hooks and pins, while heavies frames and objects can be accommodated with plugs and screws, or suitable fixture, adequately penetrated into the background to ensure a film hold." },
        ],
      },
      {
        heading: "Direction For Use",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-application-5-1.webp", text: "The right way to mix is to add the powder to water, not water to the powder." },
          { icon: "/products/detail/2024-03-application-6-2.webp", text: "Avoid mixing more powder that can be used within 15 minutes." },
          { icon: "/products/detail/2024-03-application-7-2.webp", text: "Do not temper or mix fresh material once a mix has started to set." },
          { icon: "/products/detail/2024-03-application-8-1.webp", text: "After taking the required amount of plaster, always fold the open end, to protect the plaster from moisture." },
          { icon: "/products/detail/2024-03-group-1000004064-1.webp", text: "Setting time cannot be altered by diluting the mixture with water." },
        ],
      },
    ],
    specs: [
      { label: "Purity Whiteness", value: "70-80% & above" },
      { label: "Whiteness", value: "70-80% off White" },
      { label: "Fineness Mesh", value: "Mesh 150 Residue 5 %" },
      { label: "Setting Time", value: "Initial 11-15min, Final 23-25 min" },
      { label: "Compressive strength", value: "19.13 N/mm2" },
      { label: "Coverage at 12mm thickness", value: "20 sqft" },
      { label: "Dry Bulk density", value: "724kg/m3" },
      { label: "Standard compliance", value: "IS 2547-1 Part 1 & Part 2" },
      { label: "Shelf Life", value: "8 months" },
      { label: "Packing", value: "25 kgs" },
    ],
    pack: "/products/classic-gypsum-plaster/pack.webp",
    catalogue: null,
    hasEnquiry: true,
    related: ["bondit-plaster-bond-plus", "bondit-151", "buildon-p-20-ready-mix-plaster"],
    cardImage: "/products/classic-gypsum-plaster/card.webp",
  },
  {
    slug: "buildon-p-20-ready-mix-plaster",
    name: "Buildon P-20 Ready Mix Plaster",
    eyebrow: "don’t settle for less.",
    title: "P-20 CEMENTITIOUS DRY READY MIX PLASTER.",
    banner: "/products/buildon-p-20-ready-mix-plaster/banner.webp",
    bannerScrim: "none",
    hero: "/products/buildon-p-20-ready-mix-plaster/hero.webp",
    intro: "Buildon P-20 is crafted for both exterior and interior plastering, this specialized formula offers a robust, smooth base coat with superior shrinkage control. Its rich additives and precisely graded fillers ensure a seamless, strongly adherent, and highly workable mixture when combined with water. Easily applicable, Buildon P-20 Cementitious Dry Ready Mix Plaster can be administered by hand or spray machines.",
    approvals: ["/products/approvals/2019-02-group-1000004099-1.webp"],
    sections: [
      {
        heading: "Applied on",
        kind: "applied_on",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2019-03-brick-wall-1.webp", text: "Brick Wall" },
          { icon: "/products/detail/2019-03-block-wall-1.webp", text: "Block Wall" },
          { icon: "/products/detail/2019-03-rcc-1.webp", text: "RCC Structure" },
        ],
      },
      {
        heading: "Benefits",
        kind: "icon_text",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-layer_1.webp", text: "Quality plaster due to best in class particle size distribution." },
          { icon: "/products/detail/2024-03-layer_1-1.webp", text: "Very less rebound loss." },
          { icon: "/products/detail/2024-03-layer_1-2.webp", text: "No hassle of maintaining mortar ratio." },
          { icon: "/products/detail/2024-03-layer_1-3.webp", text: "Easy to count the number of bags which is very much useful for reconciliation. Excellent workability." },
          { icon: "/products/detail/2024-03-layer_1-4.webp", text: "Surface obtained is highly impermeable due to the best grading hence becomes water-tight." },
          { icon: "/products/detail/2024-03-layer_1-5.webp", text: "High durability cuts repair and maintenance costs." },
          { icon: "/products/detail/2024-03-layer_1-6.webp", text: "Available round the year." },
          { icon: "/products/detail/2024-03-layer_1-7.webp", text: "Completely legal." },
          { icon: "/products/detail/2024-03-layer_1-8.webp", text: "Saves Time and labour." },
        ],
      },
      {
        heading: "Health & Safety",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-isolation_mode-1.webp", text: "Buildon P-20 Cementitious Dry Ready Mix Plaster is a cement based product. Avoid contact with eyes or skin. Provide adequate ventilation in working place to avoid inhalation of dust." },
        ],
      },
      {
        heading: "Storage",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-isolation_mode-2.webp", text: "Keep the product in its original bag and store in dry, covered place. In these conditions it can be stored for 3 months." },
        ],
      },
    ],
    specs: [
      { label: "Appearance", value: "Grey coloured Powder (Granular)" },
      { label: "Water Curing", value: "5 Days" },
      { label: "Aggregate", value: "Well graded river-sand" },
      { label: "Basic Binder", value: "Ordinary Portland Cement and Fly Ash" },
      { label: "Additives", value: "Hydrated Lime with 85% Purity, Processed Flyash & Recron PP Fibre for Better Bonding & Strength" },
      { label: "Pot Life", value: "1 – 2 Hours" },
      { label: "Water Ratio", value: "690 Kg / m3" },
      { label: "Bulk Density", value: "1.4 – 1.7 Kg / ltr" },
      { label: "Dry Density", value: "2064 Kg / m 3" },
      { label: "Grain Size", value: "0 – 2.5 mm" },
      { label: "Compressive Strength", value: "22.1 Mpa (at 28 days)" },
      { label: "Coverage (40 Kg Bag)", value: "For 10 to 12mm on block masonry coverage is approximately 17 to 18 sq.ft." },
      { label: "Packaging", value: "40 Kg Bag" },
      { label: "Cement Sand Ratio", value: "1 : 4" },
    ],
    pack: "/products/buildon-p-20-ready-mix-plaster/pack.webp",
    catalogue: { label: "Download P-20 Cementitious Catalogue", href: "/products/buildon-p-20-ready-mix-plaster/catalogue.pdf" },
    hasEnquiry: true,
    related: ["imported-gypsum-plaster", "gypsum-plaster-verimiculite", "gypsum-plaster-perlite-one-coat-super-200"],
    cardImage: "/products/buildon-p-20-ready-mix-plaster/card.webp",
  },
  {
    slug: "bondit-151",
    name: "Bondit-151",
    eyebrow: "strong walls. stronger bonds.",
    title: "BONDIT-151",
    banner: "/products/bondit-151/banner.webp",
    bannerScrim: "none",
    hero: "/products/bondit-151/hero.webp",
    intro: "BONDIT is a high-performance bonding agent for Gypsum on concrete blocks/RCC surfaces. Further, it has waterproofing properties, and hence it prevents leakages from the cracks in the plaster.",
    approvals: ["/products/approvals/2019-02-group-1000004099-1.webp"],
    sections: [
      {
        heading: "Advantages",
        kind: "icon_text",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-layer_1-9.webp", text: "Ready to apply single coat application" },
          { icon: "/products/detail/2024-03-layer_1-10.webp", text: "A very strong chemical bond is created" },
          { icon: "/products/detail/2024-03-layer_1-11.webp", text: "Coverage is about 100 sqft/kg." },
          { icon: "/products/detail/2024-03-layer_1-16.webp", text: "PH value is 7-9" },
          { icon: "/products/detail/2024-03-layer_1-13.webp", text: "No hacking is required on concrete surfaces. Hence prevention of microcracking in concrete & saving of labour" },
          { icon: "/products/detail/2024-03-layer_1-14.webp", text: "The bonding strength is more than 2kgs/sqft." },
          { icon: "/products/detail/2024-03-layer_1-15.webp", text: "It is an elastomeric material & hence can withstand movements in the structure without cracking." },
        ],
      },
      {
        heading: "BONDIT-151 is a mixture of Polymer-Cement composite and can be used for multiple purposes.",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-layer_1-28.webp", text: "Waterproof Coating" },
          { icon: "/products/detail/2024-03-layer_1-27.webp", text: "Crack Sealing" },
          { icon: "/products/detail/2024-03-layer_1-29.webp", text: "Bonding of Gypsum/Cement" },
          { icon: "/products/detail/2024-03-layer_1-30.webp", text: "Plaster to Concrete" },
          { icon: "/products/detail/2024-03-layer_1-31.webp", text: "Concrete Repairs" },
          { icon: "/products/detail/2024-03-layer_1-32.webp", text: "Tile Fixing on Walls" },
          { icon: "/products/detail/2024-03-layer_1-33.webp", text: "Fixing Tile on Tile" },
        ],
      },
      {
        heading: "Waterproof Coating",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-layer_1-37.webp", text: "Clean the concrete surface with brush." },
          { icon: "/products/detail/2024-03-layer_1-38.webp", text: "Fill any depression with mixture of cement, silica sand & Bondit-151 in the ratio of 1:1:50:0:50." },
          { icon: "/products/detail/2024-03-layer_1-39.webp", text: "Apply first coat of mixture on moist concrete." },
          { icon: "/products/detail/2024-03-layer_1-40.webp", text: "Third coat also can be applied if required." },
          { icon: "/products/detail/2024-03-layer_1-41.webp", text: "After air drying for 4 to 6 hours, cure the coated surface by spraying water for 24 to 48 hours." },
          { icon: "/products/detail/2024-03-layer_1-42.webp", text: "On terrace for top coat white cement can be used." },
          { icon: "/products/detail/2024-03-layer_1-43.webp", text: "Wash the concrete surface with water one hour before application of Bondit-151." },
          { icon: "/products/detail/2024-03-layer_1-44.webp", text: "Mix Bondit-151 & cement in the ratio of 1:2." },
          { icon: "/products/detail/2024-03-layer_1-45.webp", text: "After 4 to 6 hrs apply 2nd coat of mixture." },
          { icon: "/products/detail/2024-03-layer_1-46.webp", text: "Fresh coated surface should not be submerged in water for 48 hours." },
          { icon: "/products/detail/2024-03-layer_1-47.webp", text: "Surface is usable after 24 hours of treatment." },
        ],
      },
      {
        heading: "Crack Sealing",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-layer_1-48.webp", text: "Make V-groove on the face of the cracks." },
          { icon: "/products/detail/2024-03-layer_1-49.webp", text: "Make the crack wet." },
          { icon: "/products/detail/2024-03-layer_1-50.webp", text: "Mix Bondit-151 & cement in the ratio of 1:2 & apply on the crack." },
          { icon: "/products/detail/2024-03-layer_1-51.webp", text: "Add more cement to the Bondit-151 cement mixture to make suitable paste & fill the crack." },
          { icon: "/products/detail/2024-03-layer_1-52.webp", text: "Grey or white cement can be used." },
        ],
      },
      {
        heading: "Bonding of Gypsum/ Plaster",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-layer_1-20.webp", text: "Clean the concrete surface" },
          { icon: "/products/detail/2024-03-layer_1-21.webp", text: "Apply Bondit-151 with brush or spray machine." },
          { icon: "/products/detail/2024-03-layer_1-22.webp", text: "After 30 to 40 minutes when Bondit-151 is tacky apply gypsum plaster." },
        ],
      },
      {
        heading: "Concrete Repairs",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-layer_1-20.webp", text: "Clean the pocket & wet with water." },
          { icon: "/products/detail/2024-03-layer_1-53.webp", text: "Apply in the pocket cement Bondit-151 slurry (2:1 ratio)." },
          { icon: "/products/detail/2024-03-layer_1-54.webp", text: "Mix Bondit-151, cement & silica sand in 1:2:4 to 6 ratio and fill the pocket or large cracks etc." },
        ],
      },
      {
        heading: "Fixing Tile on Tile",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-layer_1-20.webp", text: "Clean and wash old flooring." },
          { icon: "/products/detail/2024-03-layer_1-50.webp", text: "Mix Bondit-151 & cement in the ratio of 1:3 to 1:5 to make paste depending on desired viscosity." },
          { icon: "/products/detail/2024-03-layer_1-56.webp", text: "Apply cement-Bondit-151 paste on the back of new tile." },
          { icon: "/products/detail/2024-03-layer_1-57.webp", text: "Press the new tile on old flooring." },
          { icon: "/products/detail/2024-03-layer_1-58.webp", text: "Use the new flooring after 48 to 72 hours." },
        ],
      },
      {
        heading: "Precautions",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-layer_1-25.webp", text: "If the material goes in the eyes wash with water till the burning stops or immediately visit doctor." },
        ],
      },
    ],
    specs: [
      { label: "Chemical Composition", value: "Modified Hybrid System" },
      { label: "Physical Appearance", value: "Milky White Emulsion" },
      { label: "Solid Contents", value: "More than 40%" },
      { label: "Viscosity", value: "1500 cps Max" },
      { label: "PH Value", value: "7-9" },
      { label: "Butt joint strength", value: "2000 gsm/scm" },
      { label: "Film Characteristics", value: "Clear, forms flexible system with cement" },
      { label: "Handling & Storage", value: "Protect from frost. Containers once opened should be shut tightly to prevent contamination. Stocks should be used on a first in, first out basis." },
      { label: "Packing", value: "20kgs HDPE Jerry cans" },
      { label: "Shelf Life", value: "6 months" },
    ],
    pack: "/products/bondit-151/pack.webp",
    catalogue: { label: "Download Bondit 151 Catalogue", href: "/products/bondit-151/catalogue.pdf" },
    hasEnquiry: false,
    related: ["bondit-plaster-bond-plus", "bondit-151", "buildon-p-20-ready-mix-plaster"],
    cardImage: "/products/bondit-151/card.webp",
  },
  {
    slug: "bondit-plaster-bond-plus",
    name: "Bondit Plaster Bond+",
    eyebrow: "build a strong bond.",
    title: "BONDIT PLASTER BOND+",
    banner: "/products/bondit-plaster-bond-plus/banner.webp",
    bannerScrim: "none",
    hero: "/products/bondit-plaster-bond-plus/hero.webp",
    intro: "Buildon Bondit Plaster Bond+, is a high-performance bonding agent for gypsum on concrete blocks/RCC surfaces. Further, it has waterproofing properties, and hence it prevents leakages from the cracks in the plaster.",
    approvals: ["/products/approvals/2024-03-211x300.webp"],
    sections: [
      {
        heading: "Advantages",
        kind: "icon_text",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-layer_1-9.webp", text: "Ready to apply single coat paint" },
          { icon: "/products/detail/2024-03-layer_1-10.webp", text: "A very strong mechanical cum chemical bond is created" },
          { icon: "/products/detail/2024-03-layer_1-11.webp", text: "Coverage is about 45 sqft/kg" },
          { icon: "/products/detail/2024-03-layer_1-12.webp", text: "The green colour of BONDIT gives it good visibility" },
          { icon: "/products/detail/2024-03-layer_1-13.webp", text: "No hacking is required on concrete surfaces. Hence prevention of microcracking in concrete & saving of labour" },
          { icon: "/products/detail/2024-03-layer_1-14.webp", text: "The bonding strength is more than 4.5kgs/sqft" },
          { icon: "/products/detail/2024-03-layer_1-15.webp", text: "It is an elastomeric material & hence can withstand movements in the structure without cracking" },
          { icon: "/products/detail/2024-03-layer_1-16.webp", text: "PH value is 8.5" },
        ],
      },
      {
        heading: "Buildon Bondit Plaster Bond+",
        kind: "icon_grid",
        background: null,
        intro: "Buildon Bondit Plaster Bond+ is a mixture of Polymer-Cement composite and can be used for multiple purposes",
        items: [
          { icon: "/products/detail/2024-03-layer_1-17.webp", text: "Waterproof Coating" },
          { icon: "/products/detail/2024-03-layer_1-18.webp", text: "Bonding of Gypsum/Cement" },
          { icon: "/products/detail/2024-03-layer_1-19.webp", text: "Concrete Repairs" },
        ],
      },
      {
        heading: "Waterproof Coating",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-isolation_mode-3.webp", text: "Clean the concrete surface with brush." },
          { icon: "/products/detail/2024-03-isolation_mode-4.webp", text: "Wash the concrete surface with water one hour before application of Bondit Plaster Bond+." },
          { icon: "/products/detail/2024-03-isolation_mode-5.webp", text: "Fill any depression with mixture of cement, silica sand & Bondit Plaster Bond+ in the ratio of 1:1:50:0:50." },
          { icon: "/products/detail/2024-03-isolation_mode-6.webp", text: "Mix Bondit Plaster Bond+ & cement in the ratio of 1:4." },
          { icon: "/products/detail/2024-03-isolation_mode-7.webp", text: "Apply first coat of mixture on moist concrete." },
          { icon: "/products/detail/2024-03-isolation_mode-8.webp", text: "After 4 to 6 hrs apply 2nd coat of mixture." },
          { icon: "/products/detail/2024-03-isolation_mode-9.webp", text: "Third coat also can be applied if required." },
          { icon: "/products/detail/2024-03-isolation_mode-10.webp", text: "Fresh coated surface should not be submerged in water for 48 hours." },
          { icon: "/products/detail/2024-03-isolation_mode-11.webp", text: "After air drying for 4 to 6 hours, cure the coated surface by spraying water for 24 to 48 hours." },
          { icon: "/products/detail/2024-03-isolation_mode-12.webp", text: "Surface is usable after 24 hours of treatment." },
          { icon: "/products/detail/2024-03-isolation_mode-13.webp", text: "On terrace for top coat white cement can be used." },
        ],
      },
      {
        heading: "Bonding of Gypsum/ Plaster",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-layer_1-20.webp", text: "Clean the concrete surface" },
          { icon: "/products/detail/2024-03-layer_1-21.webp", text: "Apply Bondit Plaster Bond+ with brush or spray machine." },
          { icon: "/products/detail/2024-03-layer_1-22.webp", text: "After 30 to 40 minutes when Bondit Plaster Bond+ is tacky apply gypsum plaster." },
        ],
      },
      {
        heading: "Application Procedures",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-isolation_mode-6.webp", text: "Mix the contents before use" },
          { icon: "/products/detail/2024-03-layer_1-23.webp", text: "BUILDON Bondit-Plaster Bond+ is used for high strength bonding of Gypsum Plaster to concrete blocks RCC. No hacking is required" },
          { icon: "/products/detail/2024-03-layer_1-24.webp", text: "Apply gypsum plaster after 24 hours or after the material has dried based on environmental conditions" },
        ],
      },
      {
        heading: "Precautions",
        kind: "icon_grid",
        background: null,
        intro: null,
        items: [
          { icon: "/products/detail/2024-03-layer_1-25.webp", text: "If the material goes in the eyes wash with water till the burning stops or immediately visit doctor." },
        ],
      },
    ],
    specs: [
      { label: "Chemical Composition", value: "Modified Hybrid System" },
      { label: "Physical Appearance", value: "Green Viscous Paint" },
      { label: "Solid Contents", value: "More than 52.50 %" },
      { label: "Viscosity", value: "2500 cps max" },
      { label: "PH Value", value: "8.5" },
      { label: "Butt joint strength", value: "More than 4500gm/scm" },
      { label: "Film Characteristics", value: "Green granular flexible" },
      { label: "Handling & Storage", value: "Protect from frost. Containers once opened should be shut tightly to prevent contamination. Stocks should be used on a first in, first out basis." },
      { label: "Packing", value: "20kgs Plastic Buckets" },
      { label: "Shelf Life", value: "6 months" },
    ],
    pack: "/products/bondit-plaster-bond-plus/pack.webp",
    catalogue: { label: "Download Plaster Bond Catalogue", href: "/products/bondit-plaster-bond-plus/catalogue.pdf" },
    hasEnquiry: true,
    related: ["bondit-plaster-bond-plus", "bondit-151", "buildon-p-20-ready-mix-plaster"],
    cardImage: "/products/bondit-plaster-bond-plus/card.webp",
  },
] as const;

/** Lookup used by the detail route's generateStaticParams and page. */
export function getProductDetail(slug: string): ProductDetail | undefined {
  return productDetails.find((product) => product.slug === slug);
}
