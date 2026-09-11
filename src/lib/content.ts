/**
 * Single source of truth for the homepage.
 *
 * Every string below is copied verbatim from https://buildon.co.in/ — including
 * its punctuation and its typos ("get out latest product news", "What Client's
 * say ?"). Fix them on the source site first, then mirror the fix here.
 */

export const site = {
  name: "Buildon Plasters",
  legalName: "Buildon Plasters Pvt Ltd",
  tagline: "Leading Manufacturers and Importers of Gypsum Plaster",
  title: "Gypsum Plaster Manufacturer, Supplier & Importer in Mumbai",
  description:
    "Buildon leading as Gypsum plaster manufacturer, supplier and importer in Mumbai. Explore our innovative gypsum plaster products for sustainable & safe construction.",
  url: "https://buildon.co.in",
  phones: ["+91 90040 83336", "022 29200565", "022 29200569"],
  phoneLine: "+91 90040 83336 / 022 29200565 / 569",
  primaryPhone: "+91 90040 83336",
  primaryPhoneHref: "tel:+919004083336",
  callUs: "Call Us : +91 90040 83336",
  email: "info@buildon.co.in",
  copyright: { lead: "Copyright © 2024 ", brand: "Buildon", tail: ". All rights reserved." },
  address: {
    full: "3-B, Mapkhan Compound, Mapkhan Nagar, Marol Maroshi Road, Andheri (E), Mumbai - 400059, Maharashtra, India",
    line: "3-B, Mapkhan Compound, Mapkhan Nagar, Marol Maroshi Road",
    locality: "Andheri (E), Mumbai",
    postalCode: "400059",
    region: "Maharashtra",
    country: "India",
  },
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=3-B+Mapkhan+Compound+Marol+Maroshi+Road+Andheri+East+Mumbai+400059",
  /** The exact embed the reference site's contact section uses. */
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3769.9288645006773!2d72.87599407520626!3d19.110776382100997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c817136d1ff5%3A0xf7dd92d269803b8f!2sMarol%20Maroshi%20Rd%2C%20Mapkhan%20Nagar%2C%20Marol%2C%20Andheri%20East%2C%20Mumbai%2C%20Maharashtra%20400047!5e0!3m2!1sen!2sin!4v1709994903459!5m2!1sen!2sin",
} as const;

/**
 * Labels are the reference site's. A null href renders the label greyed out and
 * inert rather than sending people to the old site — kept for menu entries
 * whose page does not exist here yet. Give one a real href once its page lands.
 */
type NavItem = { readonly label: string; readonly href: string | null };

export const nav: readonly NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Products", href: "/products" },
  { label: "Clientele", href: "" },
  { label: "Projects", href: "" },
  { label: "Careers", href: "" },
  { label: "Blog", href: "" },
  { label: "Contact Us", href: "/contact-us" },
  { label: "FAQs", href: "" },
];

export const hero = {
  eyebrow: "WE GIVE YOU THE BEST!",
  titleLines: ["FINEST GYPSUM PRODUCTS.", "IT'S HERE OR NOWHERE."],
  intro: "We are India's leading importer and manufacturer of Gypsum Plaster.",
  primaryCta: { label: "KNOW MORE", href: "" },
  videoCta: {
    label: "PLAY VIDEO",
    href: "",
  },
  /** The looping banner behind the hero copy. */
  video: "/brand/banner-vid.mp4",
} as const;

export const banner = {
  image: "/brand/hero-banner.webp",
  /** The message set into the artwork, carried over as the alternative text. */
  alt: "The perfect plaster for the dream you are building.",
} as const;

export const whyUs = {
  // One heading over two lines on the reference, not an eyebrow plus a title
  titleLines: ["Why Us? Because we are", "The leader of Quality Gypsum In India"],
  intro:
    "If you are a builder, architect or an engineer who is passionate about what you build, Buildon Gypsum Products should be your choice. Because you wouldn’t settle for anything less.",
  items: [
    {
      title: "Guaranteed Quality",
      body: "It is 40% harder and has a pure white colour than any other gypsum available in the Indian market.",
      icon: "shield",
    },
    {
      title: "International Standards Gypsum",
      body: "Our gypsum products are of the highest grade in the construction arena.",
      icon: "globe",
    },
    {
      title: "Well-established Network",
      body: "Our offices and storage facilities are strategically located in multiple places, ensuring nationwide accessibility and reach.",
      icon: "network",
    },
    {
      title: "World-class Manufacturing Facility",
      body: "Our advanced manufacturing facility boasts state-of-the-art, fully automated Gypsum processing machines.",
      icon: "factory",
    },
  ],
} as const;

/**
 * Every product Buildon lists. The home page carousel shows the first six; the
 * /products page shows all nine, so the copy lives here once.
 */
export const productCatalogue = [
  {
    name: "Gypsum Plaster One Coat",
    href: "",
    body: "The distinguished advantage of the Buildon Gypsum Plaster-one coat is that it is made out of the highest grade of……",
    image: "/products/one-coat.webp",
  },
  {
    name: "Imported Gypsum Plaster",
    href: "",
    body: "Our BUILDON Gypsum Plaster is produced from the light powder-density rock sourced from the purest mines.",
    image: "/products/imported.webp",
  },
  {
    name: "Gypsum Master Plaster",
    href: "",
    body: "BUILDON Gypsum Master Plaster is produced from the light powder-density rock sourced from the purest mines.",
    image: "/products/master.webp",
  },
  {
    name: "Gypsum Plaster Perlite One coat super 200",
    href: "",
    body: "Buildon perlite plaster a gypsum plaster with special additives and light weight aggregates. The aggregates contein …",
    image: "/products/perlite.webp",
  },
  {
    name: "Gypsum Plaster Vermiculite",
    href: "",
    body: "Buildon Vermiculite Plaster a gypsum hemihydrates plaster with special additives and light weight aggregates.",
    image: "/products/vermiculite.webp",
  },
  {
    name: "Classic Gypsum Plaster",
    href: "",
    body: "Buildon Classic Gypsum Plaster is produced from the light powder-density rock sourced from the purest mines…",
    image: "/products/classic.webp",
  },
  {
    name: "Buildon P-20 Ready Mix Plaster",
    href: "",
    body: "Buildon P-20 is a Premixed sand cement plaster. It is specially formulated for exterior and interior plastering work to …",
    image: "/products/p-20-ready-mix.webp",
  },
  {
    name: "Bondit-151",
    href: "",
    body: "BONDIT-151 is high performance bonding agent for Gypsum on concrete blocks/RCC surfaces.",
    image: "/products/bondit-151.webp",
  },
  {
    name: "Bondit Plaster Bond+",
    href: "",
    body: "Buildon Bondit Plaster BOND+ is high-performance bonding agent for gypsum and sand cement….",
    image: "/products/bondit-plaster-bond-plus.webp",
  },
] as const;

/** The home-page section. */
export const products = {
  title: "Get Introduced To The Best Gypsum Producer",
  intro:
    "Explore our range of products.",
  readMore: "Read More >",
  items: productCatalogue.slice(0, 6),
} as const;

/** /products. The reference has no title bar on this one. */
export const productsPage = {
  title: "Products",
  heading: "Finest quality Gypsum products in India.",
} as const;

export const about = {
  titleLines: ["Here’s Who We Are:", "About Us"],
  body: "Buildon stands as a prominent manufacturer and importer of pioneering this endeavour in India. Our factory produces the world’s finest Gypsum plaster, renowned for its pristine white colour and hardness surpassing other Indian market options by over 40%. This positions it as a global standard and the premier choice for construction-grade Gypsum.",
  image: "/projects/project-2.webp",
} as const;

export const clients = {
  title: "Meet Our Clients",
  intro:
    "As a leader of Gypsum products in India, we cater to most of the leading builders across the nation.",
  /**
   * In the reference's display order: six across, then five centred beneath.
   * The files were saved as client-N, so names are from the artwork itself.
   * width/height are each file's own pixels, so every logo reserves its exact
   * shape before it loads.
   */
  logos: [
    { src: "/clients/client-1.webp", name: "Adani", width: 198, height: 81 },
    { src: "/clients/client-2.webp", name: "Godrej & Boyce", width: 191, height: 78 },
    { src: "/clients/client-3.webp", name: "Larsen & Toubro", width: 185, height: 75 },
    { src: "/clients/client-4.webp", name: "Lodha", width: 190, height: 78 },
    { src: "/clients/client-5.webp", name: "Lokhandwala Infrastructure", width: 163, height: 66 },
    { src: "/clients/mahindra.webp", name: "Mahindra Lifespaces", width: 300, height: 130 },
    { src: "/clients/client-6.webp", name: "Peninsula Land", width: 186, height: 62 },
    { src: "/clients/client-7.webp", name: "Runwal", width: 122, height: 67 },
    { src: "/clients/client-10.webp", name: "Tata Housing", width: 182, height: 78 },
    { src: "/clients/client-9.webp", name: "Sheth", width: 180, height: 97 },
    { src: "/clients/client-8.webp", name: "Shapoorji Pallonji", width: 173, height: 78 },
  ],
} as const;

export const projects = {
  title: "Projects Where Our Products Are Used",
  intro:
    "Here are the finest projects in which our gypsum products are being used to ensure the best quality in construction.",
  cta: { label: "VIEW MORE", href: "" },
} as const;

export const testimonials = {
  title: "What Client's say ?",
  cta: { label: "Read More >", href: "" },
  /**
   * The clip the reference plays beside these quotes. Hot-linked from
   * buildon.co.in (16 MB) rather than committed — drop the files in /public and
   * swap these for local paths if the assets ever move.
   */
  video: {
    src: "https://buildon.co.in/wp-content/uploads/2025/01/WhatsApp-Video-2025-01-06-at-14.05.10_2399e02d.mp4",
    poster:
      "https://buildon.co.in/wp-content/uploads/2025/01/Screenshot-2025-01-07-162753.png",
  },
  items: [
    {
      quote:
        "\"Namaste, we have used Buildon company Gypsum in 2013 at our house in Kagal, Maharashtra and response till date is superb, and no cracks have appeared on the wall till now, been 10 years we are using this material & flakes have not been seen till now, used on traditional red bricks and we have done sand cement plaster from outer side of walls properly and have experienced no leakages till date. No cracks have been seen\"",
      author: "Kagal, Kolhapur client of Buildon since 2013",
    },
    {
      quote:
        "This is to certify that \"Buildon Plasters Pvt Ltd'' is our approved vendor for supply of Gypsum Plaster 1 coat in our projects . We have tested their material and have got satisfactory results. We are also satisfied with their performance, supplied material quality and after sales services.",
      author: "MS Group (Pune)",
    },
    {
      quote:
        "This is to certify that \"Buildon Plasters Pvt Ltd'' is our approved vendor for supply of Gypsum Plaster 1 coat in our projects . We have tested their material and have got satisfactory results. We are also satisfied with their performance, supplied material quality and after sales services.",
      author: "D R Gavhane | Landmarks LLP (Moshi, Pune)",
    },
    {
      quote:
        "This is to certify that \"Buildon Plasters Pvt Ltd'' is our approved vendor for supply of Gypsum Plaster 1 coat in our projects . We have tested their material and have got satisfactory results. We are also satisfied with their performance, supplied material quality and after sales services",
      author: "Contractor Shamim Khan (Bangalore)",
    },
    {
      quote:
        "This is to certify that 'Buildon Plasters pvt ltd is our approved vendor for supply of Buildon P-20 Ready Mix Plaster in our projects. We have tested their material & have got satisfactory results. We are also satisfied with their performance, supplied material quality and after sales services",
      author: "Jayvin Vora Construction company (Chembur, Mumbai)",
    },
    {
      quote:
        "This is to certify that \"Buildon Plasters Pvt Ltd is our approved vendor for supply of Buildon P-20 Ready Mix Plaster in our projects. We have tested their material and got satisfactory results. We are also satisfied with their performance, supplied material quality and after sales services",
      author: "Sudhanshu Infrastructures Pvt Ltd (Bhandup, Mumbai)",
    },
    {
      quote:
        "This is to certify that \"Buildon Plasters Pvt Ltd is our approved vendor for supply of Buildon P-20 Ready Mix Plaster in our projects. We have tested their material and got satisfactory results. We are also satisfied with their performance, supplied material quality and after sales services",
      author: "Rachcon Infraprojects Pvt Ltd (Malad, Mumbai)",
    },
  ],
} as const;

export const contact = {
  title: "Contact Us",
  formTitle: "Send Us Message",
  submit: "Contact Us",
  labels: {
    address: "Address",
    email: "Email",
    phone: "Phone",
  },
  fields: {
    name: "Full Name",
    email: "Your mail",
    phone: "Your Phone Number",
    message: "Your Message",
  },
} as const;

export const newsletter = {
  titleLead: "Subscribe to Our ",
  titleAccent: "Newsletter",
  intro: "Sign up for our monthly promotion and get out latest product news!",
  placeholder: "Your Email Address...",
  submit: "SUBMIT",
} as const;

export const social = [
  {
    label: "YouTube",
    href: "https://www.youtube.com/@lifewaygypsum_buildcon6030",
    icon: "youtube",
  },
  // The reference links its X icon to "#" — no account wired up yet
  { label: "X", href: "#", icon: "x" },
  { label: "Facebook", href: "https://www.facebook.com/BuildonIndia/", icon: "facebook" },
  { label: "Instagram", href: "https://www.instagram.com/buildon_india/", icon: "instagram" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/buildon-india/", icon: "linkedin" },
] as const;

export const footerHeadings = {
  about: "About Us",
  quick: "Quick Links",
  support: "Support",
  connect: "Let's Connect",
} as const;

export const footerLinks = {
  about: [
    { label: "Who We Are?", href: "/contact-us" },
    { label: "Our Branches", href: "/contact-us" },
    { label: "Privacy Policy", href: "" },
    { label: "User Agreement", href: "" },
    { label: "Download Catalogue", href: "" },
  ],
  quick: [
    { label: "Home", href: "/" },
    { label: "Our Projects", href: "/projects" },
    { label: "Our Products", href: "/products" },
    { label: "Careers", href: "" },
    { label: "Customer Reviews", href: "" },
  ],
  support: [
    { label: "Contact Us", href: "/contact-us" },
    { label: "FAQs", href: "" },
    { label: "Partner With Us", href: "" },
  ],
} as const;

/**
 * /about-us. Copied verbatim from https://buildon.co.in/about-us/, same rule as
 * the home-page copy above.
 */
export const aboutPage = {
  /** Used for <title> and the nav label; the reference keeps it in a tm-hide block. */
  title: "About Us",
  banner: {
    image: "/about/banner-handshake.webp",
    alt: "Buildon representatives shaking hands with a client",
    /* The heading actually printed on the banner, over three lines. */
    headingLines: ["Building", "Excellence.", "Building India."],
  },
  overview: {
    title: "Company Overview",
    body: "Buildon stands as a pioneering force in India, emerging as a leading manufacturer and importer of finest quality Gypsum plaster and other products. Our Mumbai-based enterprise has ventured into unexplored territories, producing the world’s finest Gypsum plaster at our state-of-the-art factory. Renowned for its pure white colour and a hardness surpassing market standards by over 40%, our Gypsum is a testament to excellence, setting the gold standard in the construction realm.",
    image: "/about/team.webp",
    imageAlt: "The Buildon team reviewing a project together",
  },
  whyChoose: {
    title: "Why choose us?",
    items: [
      "India’s finest quality Gypsum",
      "Pure white colour Gypsum",
      "Over 40% compared to market standards",
      "International Standards Manufacturing Facility",
      "Vast network across India",
      "Advanced Technology & Professional Workforce",
    ],
  },
  birdsEye: {
    titleLines: ["Gypsumizing India:", "A Bird’s Eye View"],
    body: "Buildon has transformed the landscape by introducing world-class Gypsum products across major Indian cities, bridging the gap between demand and supply for superior quality Gypsum plaster. Our commitment to excellence is evident in the manufacturing process, where advanced technology meets stringent quality control systems. We adhere to international quality management standards, ensuring that every batch meets the pinnacle of perfection.",
    image: "/about/plastering-wall.webp",
    imageAlt: "A plasterer floating Buildon gypsum plaster onto a wall",
  },
  manufacturing: {
    title: "Our Manufacturing Excellence",
    body: "Our manufacturing facility is equipped with cutting-edge, fully automated Gypsum processing machines. Overseen by highly qualified engineers and a skilled workforce from around the world, we ensure the highest standards of production. With a vast network of marketing offices strategically positioned nationwide, and additional offices near major seaports, we guarantee swift and uninterrupted delivery of our quality Gypsum plaster. Our dynamic team of young and enthusiastic professionals provides unwavering technical support to meet the diverse needs of our customers.",
    image: "/about/interior-plants.webp",
    imageAlt: "A finished interior wall plastered with Buildon gypsum",
  },
  serve: {
    title: "Who We Serve",
    body: "Buildon proudly supplies its superior Gypsum to esteemed builders, architects, project consultants, and contractors, enhancing the value of their prestigious projects. As industry leaders, we are committed to building a legacy of excellence, one that shapes the future of construction in India.",
  },
  midBanner: {
    image: "/about/banner-about.webp",
    alt: "Buildon gypsum plaster in use on site",
  },
  missionVision: [
    {
      title: "Our Mission",
      icon: "/about/icon-mission.webp",
      body: "We are committed to being the leading provider of finest gypsum solutions, building a legacy of trust, innovation, and sustainability. Through cutting-edge technology and a dynamic workforce, we consistently deliver the highest quality products, contributing to the success of nation-building.",
    },
    {
      title: "Our Vision",
      icon: "/about/icon-vision.webp",
      body: "Buildon envisions revolutionizing the construction industry by being India’s leader in gypsum solutions. Our goal is to shape sustainable, aesthetic, and resilient structures, setting new benchmarks for excellence and redefining possibilities.",
    },
  ],
  branches: {
    title: "Our Branches",
    addressLabel: "Address- Head Office",
    address:
      "3-B, Mapkhan Compound, Mapkhan Nagar, Marol Maroshi Road, Andheri (E), Mumbai-400059,Maharashtra",
    emailLabel: "Email",
    phoneLabel: "Phone",
    phone: "022 29200565 / 569",
    branchesLabel: "Branches",
    branches: "Nashik | Bangalore | Chennai | Hyderabad | Indore | Pune | Kolkata | Kochi | Nagpur",
  },
} as const;

/**
 * /contact-us. Copied verbatim from https://buildon.co.in/contact-us/ — the
 * reference renders the branch-details block twice (a desktop and a mobile
 * copy); it is kept once here.
 */
export const contactPage = {
  title: "Contact Us",
  banner: {
    image: "/contact/banner.webp",
    headingLines: ["Have questions?", "Contact us"],
  },
  branchDetails: {
    title: "Buildon Plasters PVT. LTD. Branch Details",
    headOfficeLabel: "Head Office",
    headOffice: "Mumbai",
    addressLabel: "Address",
    address:
      "3-B, Mapkhan Compound, Mapkhan Nagar, Marol Maroshi Road, Andheri (E), Mumbai-400059,Maharashtra",
    gstLabel: "GST No.",
    gst: "27AAHCB7775P1ZR",
    branchesLabel: "Branches",
    branches: "Nashik | Bangalore | Chennai | Hyderabad | Indore | Pune | Kolkata | Kochi| Nagpur",
  },
  factories: {
    title: "Buildon Plasters PVT. LTD. Factories",
    addressLabel: "Address",
    items: [
      {
        zone: "West Zone",
        location: "Gujarat (Palej)",
        address:
          "225, Vasudev Industries, Vil. Palej Industries Estate, Bharuch, Palej Bharuch, Gujarat, 392012",
      },
      {
        zone: "West Zone",
        location: "Maharashtra (Khopoli)",
        address:
          "Shed No 1, Gut No 64,Takai -Adoshi Road ,Atkargaoan Village ,Tal-Khalapur Dist -Raigad 410203",
      },
      {
        zone: "East Zone",
        location: "West Bengal (Kolkata) : (operational Shortly)",
        address:
          "Amta industrial park 2 .mouza - Ismalpur,p.s. - j.b .pur,p.o - islampur,pin - 711401",
      },
    ],
  },
  form: {
    title: "Send Us Message",
    intro:
      "Please fill out the send us message form below for your any query and our expert team will get back to you shortly.",
  },
} as const;

/**
 * /faq. Copied verbatim from https://buildon.co.in/faq/, grouped exactly as
 * the reference groups its accordion.
 */
export const faqPage = {
  title: "FAQs",
  banner: {
    image: "/faq/banner.webp",
    heading: "FAQs",
    subheadingLines: ["Have questions?", "Find your answers here."],
  },
  label: "FAQ",
  groups: [
    {
      title: "Gypsum plaster",
      items: [
        {
          question: "What is the use of gypsum Plaster on wall?",
          answer:
            "Gypsum plaster has good insulation properties, fire resistant and impact resistant. Also, gypsum saves a lot of time during construction and has superior finish. These properties have clearly drawn attention of real estate builders and contractors towards choosing gypsum plaster over traditional cement plaster.",
        },
        {
          question: "Is gypsum plaster eco friendly?",
          answer:
            "Gypsum is an inherently sustainable material as it can be completely recycled an infinite number of times. Removing water from gypsum rocks through dehydration produces a plaster powder scientifically known as calcium sulphate.",
        },
        {
          question: "Advantages and disadvantages of gypsum plaster?",
          answer:
            "It doesn’t perform well against water We cannot use gypsum plaster for outer walls. These retain dampness and are not the most suitable for areas with walls that come in regular contact with water, such as bathrooms and toilets.",
        },
        {
          question: "What is the minimum thickness of gypsum plaster?",
          answer:
            "Gypsum Plaster is usually applied in a thickness range of (6 -20)mm. The thickness of the undercoat gypsum plaster is normally 11mm for walls, it’s 8mm for the ceiling area and for that of the finished coat.",
        },
        {
          question: "What is the ratio of gypsum plaster to water?",
          answer:
            "Water to plaster ratio (1 part of water: 1.25 part of plaster by weight) should be maintained to have a good cohesive workable mix.",
        },
        {
          question: "What is the tolerance for gypsum walls?",
          answer:
            "The plane and alignment of the panels depend on the plane and alignment of the framing members, backing or devices to which it is attached, and/or conceals. The tolerance of 1/8” in 10′-0” is commonly used in jobsite specifications and referred to as the “industry standard” for flatness in gypsum board finishing.",
        },
        {
          question: "What is the coverage of gypsum plaster per bag?",
          answer:
            "20 – 25 Sq. ft. Initial Setting Time: 15 – 20 minutes. Coverage @ thickness of 10 mm. : 20 – 25 Sq. ft./Bag of 25 Kg.",
        },
        {
          question: "Why is gypsum plaster used?",
          answer:
            "Gypsum plastering is an environmental friendly alternative to traditional sand-cement application for internal plastering surfaces. Gypsum plastering is also a faster application method for internal surfaces, since it does not require a time consuming water curing process.",
        },
        {
          question: "Which Standard Compliance to refer for Gypsum?",
          answer:
            "Purity of gypsum – 90% an above Color of gypsum – Pure white color Availability & lead time of material – lead time within 72hours ,throughout the year Indian Green Building council bearing membership – IGBCMP131535 ISO certification – ISO 9001:2015 MHADA approval letter",
        },
        {
          question: "Why should we do a false ceiling with Buildon Gypsum?",
          answer:
            "Buildon Gypsum is a brand trusted by millions of customers in India for the past 13 years. Our commitment to quality products and service helped us to establish ourselves as market leaders in ceiling space. All our ceiling projects are executed by a highly qualified & trained workforce",
        },
        {
          question: "What are the benefits of doing a false ceiling at home?",
          answer:
            "What are the benefits of doing a false ceiling at home? A false ceiling is also known as a dropped ceiling, plays a very important role in Home Interiors. It is one of the easiest, cost-effective & quickest ways to transform your interior space. There is no limitation to ideas which can come alive as ceilings. many other functional benefits come along with the aesthetic value of ceilings. Uniform light distribution to the entire room through ceiling lights. Mess-free home with all wirings, pipes covered under the ceiling. Cooler homes with dropped ceilings Express your style through ceiling designs. Ceiling designs can be customized as per room size and lighting requirements.",
        },
        {
          question: "How does a ceiling system reduce air conditioning needs & need of more lighting which helps lower electricity bills?",
          answer:
            "False ceilings provide thermal insulation by creating an air gap between the soffit and the false ceiling. They reduce the air volume of a room and, as a result, the air-conditioning load. Thus, the air-conditioning requirement is reduced, resulting in lower electricity bills. Ceilings reflect and diffuse light. A ceiling that reflects and diffuses light well reduces the need for artificial lighting. This results in improved energy efficiency and a better working environment.",
        },
      ],
    },
    {
      title: "Bonding Agents (Bondit 151 & Plaster Bond+)",
      items: [
        {
          question: "How to use Buildon Bonding agents in Gypsum wall plastering ?",
          answer:
            "Step 1 – Ensure all the surface are clean from any containments that may hinder adhesion, including any loose or flaking material. Step 2 – Ensure that the wall is dry Step 3 – Thoroughly stir bonding agents before use. Step 4 – Do not dilute, Simply apply a single coat using a brush roller and leave to dry (Bondit 151 for 40 mins & Plaster Bond + for 24 hrs before wall plastering)",
        },
        {
          question: "Are Buildon bonding agents alternative to hacking ?",
          answer:
            "Bonding agents are always a better alternative over hacking. Hacking is not only very crude method of creating bond between Gypsum and Concrete surface but also, it weakens the RCC structure. Hacking is not uniformly distributed since it’s done in a random way. Depth of hacking and pitch of hacking variance over a given surface remains high due to fatigue factor.",
        },
        {
          question: "How Buildon Bonding agents are different as compared to other bonding agents in the market?",
          answer:
            "Our bonding agents are safer and have a high coverage than other products available in the market. Also available in small quantities (along with gypsum plaster)",
        },
      ],
    },
    {
      title: "Sand-Cement Ready Mix plaster - P20",
      items: [
        {
          question: "What is the difference between traditional Sand cement mortar & Buildon Ready Mix plaster ?",
          answer:
            "Ready Mix plaster saves time & labour, No hassle of maintaining Mortar ratio. Factory manufactured material gives standardization in entire projects.",
        },
        {
          question: "How Buildon Ready mix plaster is better than the rest of products?",
          answer:
            "We use Narmada river well graded sand & Ultratech cement along with Reliance PP fibers. Very less rebound loss. Numbers on the bags are easy for reconciliation.",
        },
        {
          question: "How long does it take for cement sand plaster to cure?",
          answer:
            "Curing of cement plaster should be done 24 hours after the plastering work. The plastered surface should be kept wet for a period of 7 days.",
        },
      ],
    },
  ],
} as const;

/**
 * /clientele. The reference outputs each city twice — a desktop block and a
 * near-identical responsive one that re-uploads the same brands under other
 * filenames (Godrej.png for Godrej-properties.jpg, Brigade-banglore-1-1.png
 * for Brigade-banglore-1.png). Only the first block is kept here, otherwise
 * those brands appear twice in the grid.
 *
 * Each block is stored column-first, so it is transposed into the order the
 * logos are actually read: left to right, row by row.
 */
export const clientelePage = {
  title: "Clientele",
  banner: {
    image: "/clientele/banner.webp",
    headingLines: ["The testimony of", "our excellence.", "OUr Clients."],
  },
  cities: [
    {
      name: "MUMBAI",
      logos: [
        { src: "/clientele/adani.webp", name: "Adani" },
        { src: "/clientele/godrej-properties.webp", name: "Godrej Properties" },
        { src: "/clientele/l-t-realty-jpg.webp", name: "L T Realty" },
        { src: "/clientele/lodha.webp", name: "Lodha" },
        { src: "/clientele/lokanandwala.webp", name: "Lokanandwala" },
        { src: "/clientele/mahindra.webp", name: "Mahindra" },
        { src: "/clientele/marathon.webp", name: "Marathon" },
        { src: "/clientele/penninsula.webp", name: "Penninsula" },
        { src: "/clientele/runwal.webp", name: "Runwal" },
        { src: "/clientele/shapoorji.webp", name: "Shapoorji" },
        { src: "/clientele/sheth.webp", name: "Sheth" },
        { src: "/clientele/tata-housing.webp", name: "Tata Housing" },
      ],
    },
    {
      name: "PUNE",
      logos: [
        { src: "/clientele/kolte-pati.webp", name: "Kolte Pati" },
        { src: "/clientele/mahindra.webp", name: "Mahindra" },
        { src: "/clientele/clover-builders-pune-1-3.webp", name: "Clover Builders Pune 1" },
        { src: "/clientele/geol-ganga-group.webp", name: "Geol Ganga Group" },
        { src: "/clientele/godrej-properties.webp", name: "Godrej Properties" },
        { src: "/clientele/dnv.webp", name: "" },
        { src: "/clientele/dreams.webp", name: "Dreams" },
        { src: "/clientele/legacy-1.webp", name: "Legacy" },
        { src: "/clientele/anshul.webp", name: "Anshul" },
        { src: "/clientele/paranjape.webp", name: "Paranjape" },
        { src: "/clientele/gd-sqaure.webp", name: "GD Sqaure" },
        { src: "/clientele/silver-group-pune-1.webp", name: "Silver Group Pune" },
        { src: "/clientele/gera.webp", name: "Gera" },
        { src: "/clientele/madhuban.webp", name: "Madhuban" },
        { src: "/clientele/shapoorji.webp", name: "Shapoorji" },
        { src: "/clientele/kalpataru.webp", name: "Kalpataru" },
      ],
    },
    {
      name: "NASIK",
      logos: [
        { src: "/clientele/ashokha.webp", name: "Ashokha" },
        { src: "/clientele/bhagad.webp", name: "Bhagad" },
        { src: "/clientele/dhatrak.webp", name: "Dhatrak" },
        { src: "/clientele/garja.webp", name: "Garja" },
        { src: "/clientele/ml-developers.webp", name: "ML Developers" },
        { src: "/clientele/nirmal-group.webp", name: "Nirmal Group" },
        { src: "/clientele/patil-group.webp", name: "Patil Group" },
        { src: "/clientele/rachit-builders.webp", name: "Rachit Builders" },
      ],
    },
    {
      name: "GOA",
      logos: [
        { src: "/clientele/clara-mount.webp", name: "Clara Mount" },
        { src: "/clientele/oiuine.webp", name: "" },
        { src: "/clientele/em-ghee.webp", name: "EM Ghee" },
        { src: "/clientele/naifer.webp", name: "Naifer" },
      ],
    },
    {
      name: "BANGALORE",
      logos: [
        { src: "/clientele/alpine.webp", name: "Alpine" },
        { src: "/clientele/brigade-banglore-1.webp", name: "Brigade Banglore" },
        { src: "/clientele/embassy.webp", name: "Embassy" },
        { src: "/clientele/gannon.webp", name: "Gannon" },
        { src: "/clientele/g-corp.webp", name: "G Corp" },
        { src: "/clientele/habitat.webp", name: "Habitat" },
        { src: "/clientele/pashmina.webp", name: "Pashmina" },
        { src: "/clientele/prestige-group.webp", name: "Prestige Group" },
        { src: "/clientele/tgr.webp", name: "" },
        { src: "/clientele/zonasha.webp", name: "Zonasha" },
        { src: "/clientele/l-t-realty-jpg.webp", name: "L T Realty" },
        { src: "/clientele/tvs-emerald-banglore-chennai-1-1.webp", name: "TVS Emerald Banglore Chennai 1" },
      ],
    },
    {
      name: "CHENNAI",
      logos: [
        { src: "/clientele/appaswamy.webp", name: "Appaswamy" },
        { src: "/clientele/tvs-emerald-banglore-chennai-1-1-1.webp", name: "TVS Emerald Banglore Chennai 1 1" },
        { src: "/clientele/snp-foundation-chennai.webp", name: "SNP Foundation Chennai" },
        { src: "/clientele/download-10-2.webp", name: "" },
        { src: "/clientele/images-1.webp", name: "" },
        { src: "/clientele/casa.webp", name: "Casa" },
        { src: "/clientele/downl.webp", name: "" },
        { src: "/clientele/dacnew.webp", name: "" },
      ],
    },
    {
      name: "HYDERABAD",
      logos: [
        { src: "/clientele/sri-srinivasa.webp", name: "Sri Srinivasa" },
        { src: "/clientele/kalpataru.webp", name: "Kalpataru" },
        { src: "/clientele/vasavi-builders-logo-png-hyderabadnew-rrpcjy91vgcd4ec54z3cvquwj0i4uruck6hkeli86g.webp", name: "Vasavi Builders Logo Png Hyderabadnew Rrpcjy91vgcd4ec54z3cvquwj0i4uruck6hkeli86g" },
        { src: "/clientele/alekya-png-logo-hyderabad-rrpcjxb7omb2ssdiagoqb93fxmmrn2qm81u2xbjmco.webp", name: "Alekya Png Logo Hyderabad Rrpcjxb7omb2ssdiagoqb93fxmmrn2qm81u2xbjmco" },
        { src: "/clientele/aparna-logo.webp", name: "Aparna" },
        { src: "/clientele/myhome-logo.webp", name: "Myhome" },
        { src: "/clientele/sumadhura-infracon-3.webp", name: "Sumadhura Infracon" },
        { src: "/clientele/dsr-hyderabad-1.webp", name: "Dsr Hyderabad" },
      ],
    },
    {
      name: "DELHI",
      logos: [
        { src: "/clientele/dlf-capital-green.webp", name: "DLF Capital Green" },
        { src: "/clientele/lemon-tree-hotels.webp", name: "Lemon Tree Hotels" },
        { src: "/clientele/m3m.webp", name: "" },
        { src: "/clientele/tata-housing-1.webp", name: "Tata Housing" },
      ],
    },
    {
      name: "NAGPUR",
      logos: [
        { src: "/clientele/images-2-1.webp", name: "" },
        { src: "/clientele/download-5-1.webp", name: "" },
        { src: "/clientele/image-119.webp", name: "" },
        { src: "/clientele/image-117.webp", name: "" },
        { src: "/clientele/1654503679145-rrpcjuhnac1f3u9fmo6s8baj68dix6kma78matqfe0.webp", name: "1654503679145 Rrpcjuhnac1f3u9fmo6s8baj68dix6kma78matqfe0" },
        { src: "/clientele/sachidanand-realties-nagpur-png-logo-1.webp", name: "Sachidanand Realties Nagpur Png Logo" },
        { src: "/clientele/sdpl-nagpur-logo-1.webp", name: "Sdpl Nagpur Logo" },
        { src: "/clientele/pyramid-group-nagpur-logo.webp", name: "Pyramid Group Nagpur" },
      ],
    },
    {
      name: "KOLKATA",
      logos: [
        { src: "/clientele/sugam-kolkata-logo-1.webp", name: "Sugam Kolkata Logo" },
        { src: "/clientele/godrej-properties.webp", name: "Godrej Properties" },
        { src: "/clientele/alcove-realty-kolkata.webp", name: "Alcove Realty Kolkata" },
        { src: "/clientele/siddha-group-kolkata.webp", name: "Siddha Group Kolkata" },
        { src: "/clientele/primarc-kolkata.webp", name: "Primarc Kolkata" },
        { src: "/clientele/rajat-group-kolkata-logo.webp", name: "Rajat Group Kolkata" },
        { src: "/clientele/merlin-group-kolkata-logo.webp", name: "Merlin Group Kolkata" },
        { src: "/clientele/purti-realty-kolkata-logo.webp", name: "Purti Realty Kolkata" },
      ],
    },
  ],
} as const;

/**
 * /projects. Names, links and images come from https://buildon.co.in/projects/.
 * The listing there truncates most descriptions mid-sentence and leaves eight
 * of them empty, so each description is the listing excerpt where that reads
 * as a complete sentence, and the project page's own opening paragraph
 * otherwise — trimmed to a sentence boundary so the cards stay even.
 */
export const projectsPage = {
  title: "Projects",
  banner: {
    image: "/projects/banner.webp",
    headingLines: ["Projects:", "Built with", "buildon"],
  },
  readMore: "Read More >",
  items: [
    {
      name: "Aparna One, Hyderabad",
      href: "",
      image: "/projects/mask-group-29.webp",
      body:
        "Aparna One is a project of ultra luxurious residential gated community flats for sale in Shaikpet, Hyderabad. These magnificent smart apartments are the perfect combination of class",
    },
    {
      name: "Aparna Zenon – Hyderabad",
      href: "",
      image: "/projects/mask-group-3.webp",
      body:
        "Flats for sale in Nanakramguda, Hyderabad. The project offers luxurious 2 & 3 BHK apartments for sale in Nanakramguda, Puppalaguda. Nanakramguda Financial District is an IT",
    },
    {
      name: "Brigade Meadows Plumeria – Bangalore",
      href: "",
      image: "/projects/mask-group-9-1.webp",
      body:
        "Brigade Meadows Plumeria is the new project developed by Brigade Group launched in Kanakapura Road, Bangalore. The Brigade Group was founded in 1986",
    },
    {
      name: "Godrej The Trees – Vikhroli East, Mumbai",
      href: "",
      image: "/projects/mask-group-8-1.webp",
      body:
        "Godrej The Trees in Vikhroli East, Mumbai is a popular society in the city, it is well made and has all the amenities you need. There is ample space for parking of cars and bikes",
    },
    {
      name: "Goel Ganga Dham – Pune",
      href: "",
      image: "/projects/mask-group-1-1.webp",
      body:
        "Goel Ganga Group is one of the known real estate brands in Pune.The builder has delivered 74 projects so far. Around 7 projects are upcoming.",
    },
    {
      name: "Godrej Infinity – Pune",
      href: "",
      image: "/projects/godrej-infinity-keshav-nagar-pune-1.webp",
      body:
        "Godrej Infinity is a 43-acre residential development located on the banks of the Mula-Mutha River at Keshavnagar, Pune. The township will offer a holistic lifestyle",
    },
    {
      name: "Kolte Patil Atria – Pune",
      href: "",
      image: "/projects/mask-group-4.webp",
      body:
        "Beautifully crafted to complement your chic and aristocratic personality, our exclusively designed residences at 24K Atria by Kolte-Patil Developers let you explore the true joy",
    },
    {
      name: "Kalpataru Hills – Thane",
      href: "",
      image: "/projects/mask-group-7-1.webp",
      body:
        "The architecture of Tata Serein Pokhran Road 2 is centred on the well-being of its residents. On Pokhran Rd 2 in Thane West’s most affluent area.",
    },
    {
      name: "Lodha Palava",
      href: "",
      image: "/projects/lodha-palava-1.webp",
      body:
        "Lodha Palava city is a dream project by Lodha. The township is well equipped with all the facilities and modern amenities. It’s like a smart city experience.",
    },
    {
      name: "L&T Realty presents Raintree Boulevard – Bangalore",
      href: "",
      image: "/projects/l-t-raintree-boulevard-banglore.webp",
      body:
        "A premium lifestyle township located in the serene locales of Hebbal, Bengaluru. It is an endeavour to preserve the environment while developing a residential oasis offering its residents the luxuries of fine-living while being cradled in the pristine lap of nature.",
    },
    {
      name: "Prestige City – Bangalore",
      href: "",
      image: "/projects/prestige-city-bangalore.webp",
      body:
        "Prestige City – Bangalore is a new premium Township project launched right on Sarjapur Road, Bangalore. The massive residential enclave, Prestige City is a township that spans over 180-acres of prime location…",
    },
    {
      name: "Mahindra Eden – Bangalore",
      href: "",
      image: "/projects/mahindra-eden-bangalore.webp",
      body:
        "Mahindra Eden – Bangalore is a hi-tech residential project ahead of its time grown by Mahindra Lifespaces located in a key corner of Kanakapura Road, Bengaluru. The eco-friendly homes in Mahindra Eden offer the ideal homes for your needs.",
    },
    {
      name: "DLF Greenland – Indore",
      href: "",
      image: "/projects/dlf-garden-city-indore.webp",
      body:
        "One of the most upcoming townships with a lot of amenities nearby such as a very good CBSE School nearby and colleges. There is Central India largest mall which is easily accessible.",
    },
    {
      name: "L & T Crescent Bay – Parel, Mumbai",
      href: "",
      image: "/projects/crescent-bay-parel-mumbai.webp",
      body:
        "Mumbai South by L & T Realty and Omkar Realtors is a residential project. The project offers Apartments with a perfect combination of contemporary architecture",
    },
    {
      name: "Runwal Greens – Mulund",
      href: "",
      image: "/projects/runwal-greens-mulund-mumbai.webp",
      body:
        "Known to be one of the best residential projects in Mumbai, and voted the same, Runwal Greens stands true to its name. The project is spread across 22 acres and has ample green spaces amidst luxurious towers.",
    },
    {
      name: "Prestige Bella Vista – Chennai",
      href: "",
      image: "/projects/prestige-bella-vista-chennai.webp",
      body:
        "Located on Mount Poonamallee Road, Porur – Bella Vista is touted to be one of Chennai’s most lavish and serene Residential Developments.",
    },
    {
      name: "Alcove New Kolkata",
      href: "",
      image: "/projects/new-kolkata-sangam.webp",
      body:
        "Alcove New Kolkata is a project spread over a total area of 28.5 acres. Total of 15, 27 storied towers. Residents of the New Kolkata Riverside Project will have the luxury of waking up to a scenic riverside view from their homes.",
    },
    {
      name: "Godrej Seven",
      href: "",
      image: "/projects/elevate-at-godrej-seven-joka.webp",
      body:
        "The apartments are beautifully planned in the total area of 20.23 acres of land. The apartments range starts from avail of 2BHK, 2.5BHK, and 3BHK. These apartments are planned in 7 towers in grand elevation of G+12 and G+14 floors.",
    },
    {
      name: "Primarc Southwinds project LLP",
      href: "",
      image: "/projects/primarc-kolkata.webp",
      body:
        "Southwinds on Southern Bypass introduces new blocks with bigger 3BHK pond-facing apartments. Southwinds on Southern Bypass is a residential project that spans across 972 kattha of land.",
    },
    {
      name: "Siddha Sky",
      href: "",
      image: "/projects/siddha-sky-kolkata.webp",
      body:
        "This incredible project, which is currently under construction, is being built on a total area of 8.51 acres. There are 2BHK, 3BHK, and 4BHK apartments. This mesmerizing property is also available in sizes from 4 BHK Flat (2560. 0 Sq. Ft. – 2560. 0 Sq. Ft.).",
    },
    {
      name: "ACC INDIA PVT LTD – 88 East",
      href: "",
      image: "/projects/88-east-kolkata.webp",
      body:
        "The Tata Housing Development Company, Tata Housing 88 East, is a world-class, luxurious residential development planned right in the middle of one of the most prized residential locations inside the ‘City of Joy’ – namely, Alipore, Kolkata.",
    },
    {
      name: "Natural City Birati",
      href: "",
      image: "/projects/natural-city-birati.webp",
      body:
        "The magnificent Natural City Birati that is smartly located in Birati, Kolkata, is a well-planned project. This project has its expanse over an area of 124 Kottah. The project features a total of 110 units that are well-ventilated.",
    },
    {
      name: "Raga Sarvalom",
      href: "",
      image: "/projects/raga-sarvolam-kolkata.webp",
      body:
        "It is a well-designed and comfortable home that offers an excellent quality of life. It is a 230-unit project spread over 2.5 acres in Howrah, Kolkata.",
    },
    {
      name: "Kshetrum Aspire",
      href: "",
      image: "/projects/kshetrum-aspire-kolkata.webp",
      body:
        "The magnificent Kshetrum Aspire that is smartly located in Behala Chowrasta, Kolkata, is a well-planned project. Spread over a vast area of 1 acre, the project is a well-established one. The entire project consists of over 100 residential units.",
    },
  ],
} as const;

/**
 * /career. Copied verbatim from https://buildon.co.in/career/ — three openings
 * from its job board, then the "Life at Buildon" photo galleries.
 */
export const careerPage = {
  title: "Career",
  banner: {
    image: "/career/banner.webp",
    headingLines: ["Find a job that", "will help build", "a better nation."],
  },
  openings: {
    title: "Careers Openings",
    more: "More Details",
    items: [
      {
        title: "Business Development Manager",
        href: "",
        experience: "5 years Experience",
        location: "Hyderabad",
      },
      {
        title: "Sales Associate",
        href: "",
        experience: "2 years Experience",
        location: "Bangalore",
      },
      {
        title: "Sales Associate",
        href: "",
        experience: "2 years Experience",
        location: "Kolkata",
      },
    ],
  },
  life: {
    title: "Life at Buildon",
    galleries: [
      {
        title: "Annual conference 2024",
        images: [
          "/career/rectangle-5576.webp",
          "/career/rectangle-5577.webp",
          "/career/rectangle-5578.webp",
          "/career/rectangle-5580.webp",
          "/career/rectangle-5582.webp",
          "/career/rectangle-5579.webp",
        ],
      },
      {
        title: "Diwali Celebrations in Head Office",
        images: [
          "/career/life-2-1.webp",
          "/career/life-2-2.webp",
          "/career/life-2-3.webp",
          "/career/life-2-4.webp",
          "/career/life-2-5.webp",
          "/career/life-2-6.webp",
        ],
      },
      {
        title: "Christmas Celebration in Head Office",
        images: [
          "/career/life-3-1.webp",
          "/career/life-3-2.webp",
          "/career/life-3-3.webp",
          "/career/life-3-4.webp",
          "/career/life-3-5.webp",
          "/career/life-3-6.webp",
        ],
      },
      {
        title: "Buildon Picnic 2025",
        images: [
          "/career/life-4-1.webp",
          "/career/life-4-2.webp",
          "/career/img-20250301-wa0031.webp",
          "/career/img-20250301-wa0032.webp",
          "/career/img-20250301-wa0033.webp",
          "/career/img-20250301-wa0034.webp",
        ],
      },
    ],
  },
} as const;

/**
 * /blog. The reference lists thirty posts in a three-up grid of square cards:
 * photograph, title, then the excerpt WordPress truncates at roughly fifty
 * words — which is why every one of them trails off mid-sentence into an
 * ellipsis. Copied as-is.
 *
 * No post pages exist here yet, so the cards deliberately carry no link.
 */
export const blogPage = {
  title: "Blog",
  banner: {
    image: "/blog/banner.webp",
    headingLines: ["Blogs"],
  },
  /** The reference's own button reads "Read more"; matched to the product and
      project cards here so every card in the site carries the same label. */
  readMore: "Read More >",
  items: [
    {
      title: "Why Use Gypsum for Repairing Interior Plaster Walls",
      excerpt:
        "When it comes to interior wall repairs in India, choosing the right material can make all the difference between a long-lasting solution and a temporary fix. With increasing urbanisation and the need for durable, cost-effective construction materials, gypsum plaster has emerged as the preferred choice for homeowners and builders alike. If you’re considering wall repairs …",
      image: "/blog/why-use-gypsum-for-repairing-interior-plaster-walls.webp",
    },
    {
      title: "How to Create Wall with Plaster and Materials",
      excerpt:
        "Building the perfect wall requires more than just bricks and mortar it demands the right plastering technique and quality materials. In India’s diverse climate conditions, from Mumbai’s monsoons to Delhi’s harsh winters, choosing the correct plaster and application method can make the difference between a wall that lasts decades and one that develops cracks within …",
      image: "/blog/how-to-create-wall-with-plaster-and-materials.webp",
    },
    {
      title: "What Is Decorative Plaster? How It Works",
      excerpt:
        "Gypsum plaster is not only used for finishing of internal walls, it is also used for ceilings, pillars, walls, corners, lobby areas & more. Have you ever walked into a beautifully designed home or office and wondered what gave those walls their stunning, flawless finish? The answer often lies in the skilled application of decorative …",
      image: "/blog/buildon-blog-1080-x-1080-px.webp",
    },
    {
      title: "What Type of Plastering Is Used for Interior Walls?",
      excerpt:
        "When building or renovating your home, choosing the right type of plastering for your interior walls is crucial for both aesthetics and functionality. From the traditional lime plaster used in heritage buildings to modern gypsum solutions, the plastering landscape in India has evolved significantly. Whether you’re constructing a new home in Mumbai or renovating an …",
      image: "/blog/chatgpt-image-jul-18-2025-12-39-24-pm.webp",
    },
    {
      title: "Various Types of Wall Plaster Material and Its Purpose",
      excerpt:
        "When you walk into a beautifully finished home, have you ever wondered what creates those perfectly smooth, crack-free walls? The secret lies in choosing the right wall plaster material. In India’s diverse climate and construction landscape, selecting appropriate plastering materials can make the difference between walls that last decades and those that require constant maintenance. …",
      image: "/blog/various-types-of-wall-plaster-material-and-its-purpose.webp",
    },
    {
      title: "Which One is Harder, Plastering or Bricklaying? Why?",
      excerpt:
        "When stepping into the construction industry, contractors, builders, and interior designers often debate which trade requires more skill and presents greater challenges. The age-old question of whether plastering or bricklaying is harder has practical implications for project planning, workforce development, and cost estimation. Understanding the complexities of each trade helps make informed decisions about career …",
      image: "/blog/chatgpt-image-jun-19-2025-03-48-58-pm.webp",
    },
    {
      title: "How do you prevent clumps when mixing plaster?",
      excerpt:
        "Nothing frustrates Masons, interior designers, contractors, and builders more than discovering lumps and clumps in their plaster mix just when they’re ready to apply it. These unwanted formations can ruin an entire project, leading to uneven surfaces, poor adhesion, and ultimately, costly rework. Whether you’re working with gypsum plaster for residential projects or commercial spaces, …",
      image: "/blog/chatgpt-image-jun-19-2025-03-09-11-pm.webp",
    },
    {
      title: "Gypsum Plaster or Lime Plaster: Which Is More Durable?",
      excerpt:
        "When it comes to interior wall plastering, contractors, builders, and interior designers face a crucial decision: choosing between gypsum plaster and lime plaster. This choice significantly impacts not only the immediate project outcome but also the long-term durability and maintenance requirements of the structure. Understanding the durability characteristics of each wall plastering material can save …",
      image: "/blog/buildon-blog-1080-x-1080-px-1-1-1.webp",
    },
    {
      title: "Is the Plaster of Paris and Gypsum Plaster the Same?",
      excerpt:
        "When walking through construction sites or planning interior wall plastering projects, you’ve likely encountered both terms: gypsum plaster and Plaster of Paris. But are they the same material? This question confuses many builders, contractors, and interior designers, leading to incorrect material selection and potentially compromised project outcomes. The short answer is no – while both …",
      image: "/blog/buildon-blog-1080-x-1080-px-1.webp",
    },
    {
      title: "How to Fix Cracks in Gypsum Plaster?",
      excerpt:
        "Builders and homeowners have relied on gypsum plaster for years because it delivers tough walls with smooth finishes that improve interior design. Gypsum plaster shares the common characteristic of all building materials since it develops cracks over time because of multiple contributing factors. While cracks in walls and ceilings diminish their appearance, they also signal …",
      image: "/blog/buildon-blog-1080-x-1080-px-1-2.webp",
    },
    {
      title: "Gypsum Plaster for False Ceilings – Advantages & Installation",
      excerpt:
        "Introduction to Gypsum Plaster for False Ceilings False ceilings now serve as fundamental components in contemporary interior design, offering both functional benefits and visual appeal. Gypsum plaster emerges as the top material selection among architects and interior designers for false ceiling construction due to its widespread acceptance by homeowners. The versatile nature of this material …",
      image: "/blog/buildon-blog-1080-x-1080-px-2.webp",
    },
    {
      title: "Best Practices for Gypsum Plaster Application – Do’s and Don’ts",
      excerpt:
        "Introduction to Gypsum Plaster Gypsum plaster stands out as the preferred material among professionals and homeowners in today’s construction and interior finishing projects. This flexible material delivers better finishing quality along with enhanced durability and visual appeal when contrasted with Traditional plastering methods. The construction solutions leader BuildOn endorses gypsum plaster because of its many …",
      image: "/blog/untitled-1080-x-1080-px.webp",
    },
    {
      title: "10 Key Benefits of Using Gypsum Plaster in Construction 2025",
      excerpt:
        "Introduction In the ever-evolving world of construction, materials that offer speed, sustainability, and superior quality are becoming the top choice among builders, architects, and interior designers. One such revolutionary material making waves in 2025 is Gypsum Plaster. Known for its exceptional performance, smooth finish, and time-saving properties in interior wall plastering. Gypsum, a naturally occurring …",
      image: "/blog/buildon-blog-2.webp",
    },
    {
      title: "Types of Gypsum Plaster and Their Uses",
      excerpt:
        "Introduction Modern construction finishing and surface coating methods have been transformed using gypsum plaster. Gypsum plaster stands out from traditional cement plaster because it is lightweight while delivering a smooth finish, which simplifies the painting process. In residential projects as well as commercial and industrial spaces, gypsum plaster is becoming more popular because it combines …",
      image: "/blog/buildon-blog.webp",
    },
    {
      title: "Gypsum Plaster Vs Wall Putty: Which is Better?",
      excerpt:
        "The selection of surface preparation materials that will give the finish the desired aesthetics and durability is paramount to every interior wall finishing work. In the context of construction, gypsum plaster and wall putty are widely accepted applications. Gypsum plaster and wall putty differ very significantly as to the area of application, some advantages, and …",
      image: "/blog/buildon-blog-1.webp",
    },
    {
      title: "Bonding Agent for Forming Chemical & Mechanical Bond",
      excerpt:
        "In this case, they are essential to make strong and durable bonds of numerous materials from both the construction and industrial sectors. No matter if you are in the process of bonding concrete to concrete, or composites to composites, that starts with finding the right bonding agent. Plaster Bond+ and Bondit 151 are two top-tier …",
      image: "/blog/www-buildon-co-in.webp",
    },
    {
      title: "What is Gypsum Plaster? A Complete Guide",
      excerpt:
        "Gypsum plaster has gained immense popularity in modern construction due to its smooth finish, fast application, and eco-friendly properties. Unlike traditional cement plaster, gypsum wall plaster offers superior durability, fire resistance, and moisture resistance, making it an ideal choice for interior wall finishing. With the growing demand for gypsum-based construction materials, architects, builders, and homeowners …",
      image: "/blog/buildon-blog-2-2.webp",
    },
    {
      title: "Classic Gypsum Plaster: Why Does the Imported Version Offer Superior Quality?",
      excerpt:
        "For long, gypsum plaster has been preferred for construction on account of its suitable properties, easy application, and attractive aesthetic appearance. An ideal option for its outstanding quality and maximum durability available among different types, Classic Gypsum Plaster has earned a niche in the public mind. Yet, imported gypsum plaster is more favorable than locally …",
      image: "/blog/buildon-blog-3.webp",
    },
    {
      title: "Why Gypsum Plaster with Perlite is a Better Solution for Higher Coverage?",
      excerpt:
        "High-performance plastering solutions have been making quite a buzz in the construction sector nowadays. Everyone, from builders to architects, wants something good in everything they need, like coverage, durability, and workability. One solution worth its weight in gold nowadays is perlite gypsum plaster. In fact, the blog examines why gypsum plaster with perlite is the …",
      image: "/blog/whatsapp-image-2025-02-13-at-14-08-46-29222d4b.webp",
    },
    {
      title: "Difference Between Gypsum in Fertilizer and Wall Plastering",
      excerpt:
        "Gypsum is a mineral that can be used in very different ways. It is indispensable in agriculture and construction. Gypsum can be used in the field to improve the structure of the soil, increase nutrient availability, and meet sustainable farming. It is also good for creating smooth, durable wall finishings and improving building efficiency. Understanding …",
      image: "/blog/whatsapp-image-2025-01-18-at-11-36-32-5d95f0d1.webp",
    },
    {
      title: "Top 5 Areas in India Where Imported Gypsum Plaster Is Revolutionizing Construction",
      excerpt:
        "The adoption of modern materials and techniques has helped construct the fast-growing Indian construction industry. Out of these, India has become very popular for its imported gypsum plaster in India, which has carved out a successful niche for itself for being efficient and sustainable at the same time. Gypsum plaster is quickly becoming the material …",
      image: "/blog/whatsapp-image-2025-01-17-at-20-14-04-cc735091.webp",
    },
    {
      title: "Why Top Builders in India Prefer Imported Gypsum Plaster Over Cement Plaster",
      excerpt:
        "With builders wanting more from the construction industry in India, the industry is not one to remain static. Of all that is available, imported gypsum plaster has become superior to cement plaster. Gypsum plaster is known for its setting time, lightweight nature, and eco-friendly properties, and it is reshaping the way modern buildings are being …",
      image: "/blog/whatsapp-image-2025-01-15-at-16-23-57-b9abf497.webp",
    },
    {
      title: "Difference Between Gypsum Plaster & Gypsum Powder",
      excerpt:
        "Gypsum is a naturally formed mineral of calcium sulfate dihydrate, CaSO4·2H2O, which has turned into a fundamental wellspring of contemporary construction and different undertakings. Gypsum plaster and gypsum powder are two forms of gypsum products that are the one rather extensively used. Although they share a common origin, they have very different properties and applications …",
      image: "/blog/whatsapp-image-2025-01-15-at-16-20-49-ca9da7bb.webp",
    },
    {
      title: "Buildon Ready-mix P20 – Enhancing Plastering Efficiency",
      excerpt:
        "In a rapidly changing construction industry, there’s a constant need for efficient and reliable plastering solutions that can deliver a high-quality finish. An emerging game-changer for use in interior and exterior plastering, Buildon Ready-mix P20 is a cementitious dry ready-mix plaster. Due to its innovative formulation, it has superior application efficiency with enhanced durability and …",
      image: "/blog/whatsapp-image-2024-12-27-at-11-30-35-963adb1f.webp",
    },
    {
      title: "Role of Bonding Agents in Gypsum Plastering Work",
      excerpt:
        "Gypsum plaster has absolutely revolutionised the world of construction by becoming the most optimal choice among builders. Its durability, accessibility, convenience and extraordinary features give it a very sophisticated look. Since traditional plastering is lacking in many ways, the advantages of gypsum plaster has emerged as the best option for people by combating flaws of …",
      image: "/blog/whatsapp-image-2024-12-27-at-11-30-40-da954b3d.webp",
    },
    {
      title: "Is Gypsum Plaster Used by Big Builders Only or Even Small Builders Use Gypsum Plaster?",
      excerpt:
        "When it comes to construction, many builders consider gypsum plaster as their top choice. The reason is simple: it comes with innumerable benefits. Gypsum plaster is an exceptional material that has a quick setting time and provides a smooth texture making it ideal for interior use. Many builders, homeowners and architects are making it a …",
      image: "/blog/buildon-blog-1-2.webp",
    },
    {
      title: "Why the Usage of Gypsum Plaster is Rising in Construction Across India: Key Advantages and Trends",
      excerpt:
        "Gypsum plaster has become a preferred material in modern building projects as the Indian construction industry is transforming massively. Gypsum plaster is valued for its setting time speed, smoothness of finish, and eco-friendly character, which is replacing the traditional methods to meet the fast pace of urbanization and sustainable development. Moreover, the Government further pushes …",
      image: "/blog/buildon-blog-4.webp",
    },
    {
      title: "What Are the Costs of Gypsum Plastering?",
      excerpt:
        "To date, gypsum plastering has become a high-quality alternative to traditional cement plastering in the construction world. Gypsum plastering is known for its smooth finish, quick application, and durability. It commands a large demand in residential as well as commercial projects, across India. If you decide to use this technique on your project, you will …",
      image: "/blog/2.webp",
    },
    {
      title: "What Are the Benefits of Using Sustainable Construction Materials?",
      excerpt:
        "It’s clear: sustainability is more than a buzzword! Builders, developers, homeowners and everyone down in the lane are turning practical with their choices. Yes, people are encouraging using green construction materials as they come with economic and social benefits. One such material is gypsum plaster, which is revolutionizing the construction industry. Wondering what are those …",
      image: "/blog/3.webp",
    },
    {
      title: "Advantages and Disadvantages of Gypsum Plaster",
      excerpt:
        "Gypsum plaster is becoming a well known material in today’s time. From homeowners to builders, gypsum plaster in India is gaining recognition because of its fantastic features making it a good investment. Gone were the days when people used to apply traditional plastering on the internal walls, like cement plaster. With time, it has been …",
      image: "/blog/1.webp",
    },
  ],
} as const;
