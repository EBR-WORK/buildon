/**
 * The job pages behind /career's openings, transcribed from the reference.
 *
 * Same rule as content.ts: the copy is the reference's own, typos included.
 *
 * Its job board is a WordPress plugin, so each opening is a post with three
 * specification terms — category, type, location — and a description that the
 * editor may or may not have filled in. Two of the three are empty upstream:
 * they publish the specifications and an application form and nothing else.
 * `responsibilities` is therefore allowed to be empty rather than invented.
 *
 * The reference lists the openings at /career/ but publishes each one under
 * /careers/<slug>/. They live at /career/<slug> here so the section reads as
 * one, as the products and projects do.
 */

export type JobOpening = {
  readonly slug: string;
  /** Matches careerPage.openings.items so a card can find its page. */
  readonly title: string;
  /** The plugin's three specification terms. */
  readonly category: string;
  readonly type: string;
  readonly location: string;
  /** "Key Responsibilities" — empty where the reference publishes none. */
  readonly responsibilities: readonly string[];
};

export const jobOpenings: readonly JobOpening[] = [
  {
    slug: "business-development-manager",
    title: "Business Development Manager",
    category: "Business Development Manager",
    type: "5 years Experience",
    location: "Hyderabad",
    responsibilities: [
      "Will be responsible for generating the Sales of the company product portfolio in an assigned territory",
      "Meeting HNI clients - Builders / developers/contractors (At corporate level &/or site specific)",
      "Key Product Portfolio that needs to be sold –Gypsum, Readymix Plaster other bonding agents and related products",
      "The candidate needs to plan the forecasting and strategies for increasing the sales",
      "Retain existing customers & generate repeat business or cross sell our product portfolio.",
      "Develop & build new customers on an ongoing basis.",
      "A good understanding of Sales processes in the building material industry - gypsum preferred",
      "Ability to reach out to customers & sell the Buildon Value proposition.",
    ],
  },
  {
    slug: "sales-associate-bangalore",
    title: "Sales Associate",
    category: "Sales Associate",
    type: "2 years Experience",
    /* Two openings share the title; the location is what tells them apart, so
       it is in the slug too — the reference distinguishes them with a bare -2. */
    location: "Bangalore",
    responsibilities: [],
  },
  {
    slug: "sales-associate-kolkata",
    title: "Sales Associate",
    category: "Sales Associate",
    type: "2 years Experience",
    location: "Kolkata",
    responsibilities: [],
  },
];

/**
 * The application form's option lists, as the reference sets them.
 *
 * Its own markup gives the work-experience and location-preference selects the
 * same `name="experience"`, so whichever posts last wins and the other answer
 * is lost. Named apart here.
 */
export const applicationFields = {
  qualification: {
    label: "Educational Qualification",
    options: ["SSLC", "PUC", "BCA", "BBA", "BE", "MCA", "MBA", "MTech", "Other"],
  },
  experience: {
    label: "Total Work Experience",
    options: ["Fresher", "1 year", "2 years", "3 years", "4 years", "5 years", "Other"],
  },
  ctc: {
    label: "Current CTC (Lakhs per Annum)",
    options: [
      "2.5 lacs",
      "5.0 lacs",
      "7.5 lacs",
      "10.0 lacs",
      "12.5 lacs",
      "15.0 lacs",
      "Above",
    ],
  },
  preference: {
    label: "Location Preference",
    options: ["Mumbai", "Nashik", "Bangalore", "Chennai", "Hyderabad", "Kolkata", "Kochi"],
  },
} as const;

export function getJobOpening(slug: string) {
  return jobOpenings.find((job) => job.slug === slug);
}

/**
 * The listing card's link. Two openings share a title, so the location has to
 * come into the match as well.
 */
export function jobHref(title: string, location: string) {
  const job = jobOpenings.find(
    (opening) => opening.title === title && opening.location === location,
  );
  return job ? `/career/${job.slug}` : "";
}
