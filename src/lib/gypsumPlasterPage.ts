/**
 * /gypsum-plaster — the reference's standalone overview of the material.
 *
 * Transcribed from https://buildon.co.in/gypsum-plaster/, copy verbatim.
 *
 * Six of its blog posts link here, so it is not an orphan: leaving it unbuilt
 * left those phrases as dead bold text mid-sentence.
 *
 * The reference's own page repeats the product catalogue and a row of recent
 * posts at the bottom, both of which this site already holds — so the page
 * renders those from productCatalogue rather than carrying a second copy of
 * the same names and images.
 */

export type GypsumSection =
  | { readonly kind: "prose"; readonly heading: string; readonly paragraphs: readonly string[] }
  | {
      readonly kind: "list";
      readonly heading: string;
      readonly intro?: string;
      readonly items: readonly string[];
    }
  | {
      readonly kind: "cards";
      readonly heading: string;
      readonly items: readonly { readonly title: string; readonly body: string }[];
    }
  | {
      readonly kind: "steps";
      readonly heading: string;
      readonly items: readonly { readonly title: string; readonly points: readonly string[] }[];
    };

export const gypsumPlasterPage = {
  /* The reference leaves "| Buildon" inside its own <h1>; dropped here, since
     the site name is already in the document title. */
  title: "Gypsum Plaster – The Ultimate Wall Finishing Solution",
  description:
    "Gypsum plaster for walls and ceilings: what it is, how it compares with cement-sand plaster, where it is used, how to apply it, and Buildon's full range.",

  sections: [
    {
      kind: "prose",
      heading: "What is Gypsum Plaster?",
      paragraphs: [
        "Gypsum plaster which is also known as plaster of Paris (POP) functions as a superior finishing material for walls and ceilings and consists of calcium sulfate dihydrate. The construction industry frequently uses this material due to its smooth surface quality and rapid application process as well as its strong durability. Gypsum plaster offers a lighter weight structure than traditional sand-cement plaster while providing enhanced crack resistance and environmental benefits.",
        "Buildon offers top-grade gypsum plaster which improves wall strength and appearance while providing a flawless finish with lasting durability. Our gypsum plaster solutions deliver top-notch quality while providing efficient and sustainable solutions for builders, contractors, and homeowners.",
      ],
    },
    {
      kind: "list",
      heading: "Why Choose Buildon Gypsum Plaster?",
      intro:
        "Buildon gypsum plaster selection guarantees optimal quality paired with outstanding performance and sustainable benefits. The manufacturing process delivers gypsum plaster that is finely milled and pure without chemicals to extend the life of your walls. Buildon gypsum plaster stands out as the premier choice because it offers unmatched strength and durability along with a flawless finish and eco-friendly properties.",
      items: [
        "It exhibits superior strength and durability by resisting cracks and shrinkage while remaining durable against wear.",
        "Buildon gypsum plaster delivers an exquisite smooth finish that makes painting effortless.",
        "The rapid drying time and simple application process of Buildon gypsum plaster significantly cut down on construction project durations.",
        "Eco-Friendly & Non-Toxic – 100% natural, VOC-free, and sustainable.",
        "This construction material provides fire resistance while maintaining a light weight to ensure structural safety.",
        "The product excels at insulating against noise and maintaining thermal stability.",
      ],
    },
    {
      kind: "cards",
      heading: "Applications of Gypsum Plaster",
      items: [
        {
          title: "Residential Spaces",
          body: "Gypsum plaster creates an elegant finish for interior walls and ceilings in homes, apartments, and villas.",
        },
        {
          title: "Commercial Buildings",
          body: "Gypsum plaster improves visual appeal and structural longevity across offices, hotels, malls, and hospitals while helping lower maintenance expenses.",
        },
        {
          title: "Industrial & Institutional Projects",
          body: "This product produces durable surfaces that resist fire damage which makes it suitable for use in warehouses, factories, and educational institutions.",
        },
        {
          title: "Renovation & Restoration",
          body: "Gypsum plaster serves as an excellent restoration material for old walls and ceilings by delivering fast and efficient repair solutions.",
        },
      ],
    },
  ] as const satisfies readonly GypsumSection[],

  /**
   * "Advantages of Gypsum Plaster Over Traditional Plaster".
   *
   * The reference makes this whole heading a link to the article of the same
   * subject — an authored <h2><a>, not a generated one — so it carries an href
   * here too.
   */
  comparison: {
    heading: "Advantages of Gypsum Plaster Over Traditional Plaster",
    href: "/blog/how-is-gypsum-plaster-one-coat-better-compared-to-traditional-plaster-methods",
    columns: ["Feature", "Gypsum Plaster", "Cement-Sand Plaster"],
    rows: [
      ["Drying Time", "24-48 Hours", "21-28 Days"],
      ["Surface Finish", "Smooth & Crack-Free", "Requires Putty for Finish"],
      ["Shrinkage Cracks", "No Cracks", "Prone to Cracking"],
      ["Lightweight", "Yes", "No (Heavy Load)"],
      ["Thermal Insulation", "Excellent", "Poor"],
      ["Soundproofing", "High", "Low"],
      ["Fire Resistance", "Yes (Non-Combustible)", "No"],
      ["Eco-Friendly", "Yes (Low Carbon Footprint)", "No"],
    ],
  },

  variants: {
    heading: "Buildon Gypsum Plaster – Product Variants",
    intro: "Nine products, each made for a different surface and a different job.",
  },

  steps: {
    kind: "steps",
    heading: "How to Apply Gypsum Plaster? (Step-by-Step Guide)",
    items: [
      {
        title: "Step 1: Surface Preparation",
        points: [
          "Ensure the wall or ceiling is clean and dust-free.",
          "Remove any loose particles or debris.",
        ],
      },
      {
        title: "Step 2: Mixing the Gypsum Plaster",
        points: [
          "Mix the gypsum plaster with clean water in the recommended ratio.",
          "Stir well to achieve a smooth, lump-free consistency.",
        ],
      },
      {
        title: "Step 3: Application on Walls or Ceilings",
        points: [
          "Apply the plaster using a trowel or mechanized spray system.",
          "Ensure a uniform thickness of 8-12mm for walls and 10-15mm for ceilings.",
        ],
      },
      {
        title: "Step 4: Leveling & Finishing",
        points: [
          "Use a straight edge to level the plaster.",
          "Smoothen the surface with a trowel or sponge.",
        ],
      },
      {
        title: "Step 5: Drying & Painting",
        points: [
          "Allow 24-48 hours for the plaster to dry completely.",
          "Once dry, apply primer and paint for a perfect finish.",
        ],
      },
    ],
  },

  why: {
    heading: "Why Buildon is the Best Gypsum Plaster Brand?",
    intro:
      "Buildon maintains a firm commitment to excellence in construction materials delivery. Here’s why professionals choose Buildon Gypsum Plaster:",
    items: [
      { title: "High-Purity & Chemical-Free", body: "Our gypsum plaster is sourced from the purest natural deposits." },
      { title: "Eco-Friendly & Sustainable", body: "Made with minimal carbon footprint." },
      { title: "Fast & Efficient Application", body: "Reduces labor time and costs." },
      { title: "Available Across India", body: "Widely distributed through an extensive dealer network." },
    ],
    outro:
      "Buildon delivers top-notch quality plastering materials that provide strength and exceptional performance.",
  },

  /** The closing call to action, between the FAQs and the latest posts. */
  cta: {
    heading: "Get the Best Gypsum Plastering Services from Buildon Today!",
    body: "Upgrade your walls with Buildon Gypsum Plaster – the ultimate choice for durability, smoothness, and efficiency. Contact us today for bulk orders, inquiries, or expert advice.",
    label: "Contact us",
    href: "/contact-us",
  },

  /** "Our Latest Updates" — the three posts the reference closes with. */
  latest: {
    heading: "Our Latest Updates",
    slugs: [
      "why-use-gypsum-for-repairing-interior-plaster-walls",
      "how-to-create-wall-with-plaster-and-materials",
      "what-is-decorative-plaster-how-it-works",
    ],
  },

  faqs: {
    heading: "FAQs About Gypsum Plaster",
    items: [
      {
        question: "What is gypsum plaster used for?",
        answer:
          "Gypsum plaster is used for wall and ceiling finishing, providing a smooth, durable, and crack-free surface.",
      },
      {
        question: "Is gypsum plaster better than cement plaster?",
        answer:
          "Yes, gypsum plaster is superior due to its fast drying time, smooth finish, and resistance to cracks.",
      },
      {
        question: "Can gypsum plaster be used for exterior walls?",
        answer: "No, gypsum plaster is recommended only for interior walls and ceilings.",
      },
      {
        question: "How long does gypsum plaster take to dry?",
        answer: "It typically dries within 24-48 hours, much faster than cement plaster.",
      },
      {
        question: "Is gypsum plaster waterproof?",
        answer:
          "Gypsum plaster is moisture-resistant but not waterproof, making it suitable for dry indoor spaces.",
      },
      {
        question: "Does gypsum plaster require curing?",
        answer: "No, unlike cement plaster, gypsum plaster does not require water curing.",
      },
      {
        question: "Can gypsum plaster be painted?",
        answer: "Yes, gypsum plaster provides a smooth surface that is perfect for painting.",
      },
      {
        question: "Is gypsum plaster eco-friendly?",
        answer:
          "Yes, it is VOC-free, non-toxic, and has a lower carbon footprint than traditional plasters.",
      },
      {
        question: "Does gypsum plaster prevent cracks?",
        answer:
          "Yes, due to its flexibility and strength, gypsum plaster is resistant to shrinkage cracks.",
      },
      {
        question: "Is gypsum plaster expensive?",
        answer:
          "While the initial cost may be slightly higher, gypsum plaster reduces labor and maintenance costs, making it cost-effective in the long run.",
      },
    ],
  },
} as const;
