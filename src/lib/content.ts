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
 * Labels are the reference site's. Items point at this page's own sections;
 * where there is no matching section yet the href is null, and the header
 * renders the label without a link rather than sending people to the old site.
 * Give these a real href once the pages exist.
 */
export const nav = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Products", href: "/products" },
  { label: "Clientele", href: "#clients" },
  { label: "Projects", href: "#projects" },
  { label: "Careers", href: null },
  { label: "Blog", href: null },
  { label: "Contact Us", href: "/contact-us" },
  { label: "FAQs", href: null },
] as const;

export const hero = {
  eyebrow: "WE GIVE YOU THE BEST!",
  titleLines: ["FINEST GYPSUM PRODUCTS.", "IT'S HERE OR NOWHERE."],
  intro: "We are India's leading importer and manufacturer of Gypsum Plaster.",
  primaryCta: { label: "KNOW MORE", href: "" },
  videoCta: {
    label: "PLAY VIDEO",
    href: "https://youtu.be/ffdFtDPtqBs?si=6p0oz656hwd9G_hx",
  },
  /** The looping banner behind the hero copy. */
  video: "/brand/banner-vid.mp4",
} as const;

export const banner = {
  image: "/brand/hero-banner.png",
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
    href: "https://buildon.co.in/products/gypsum-plaster-one-coat/",
    body: "The distinguished advantage of the Buildon Gypsum Plaster-one coat is that it is made out of the highest grade of……",
    image: "/products/one-coat.png",
  },
  {
    name: "Imported Gypsum Plaster",
    href: "https://buildon.co.in/products/imported-gypsum-plaster/",
    body: "Our BUILDON Gypsum Plaster is produced from the light powder-density rock sourced from the purest mines.",
    image: "/products/imported.png",
  },
  {
    name: "Gypsum Master Plaster",
    href: "https://buildon.co.in/products/gypsum-master-plaster/",
    body: "BUILDON Gypsum Master Plaster is produced from the light powder-density rock sourced from the purest mines.",
    image: "/products/master.png",
  },
  {
    name: "Gypsum Plaster Perlite One coat super 200",
    href: "https://buildon.co.in/products/gypsum-plaster-perlite-one-coat-super-200/",
    body: "Buildon perlite plaster a gypsum plaster with special additives and light weight aggregates. The aggregates contein …",
    image: "/products/perlite.png",
  },
  {
    name: "Gypsum Plaster Vermiculite",
    href: "https://buildon.co.in/products/gypsum-plaster-verimiculite/",
    body: "Buildon Vermiculite Plaster a gypsum hemihydrates plaster with special additives and light weight aggregates.",
    image: "/products/vermiculite.png",
  },
  {
    name: "Classic Gypsum Plaster",
    href: "https://buildon.co.in/products/classic-gypsum-plaster/",
    body: "Buildon Classic Gypsum Plaster is produced from the light powder-density rock sourced from the purest mines…",
    image: "/products/classic.jpg",
  },
  {
    name: "Buildon P-20 Ready Mix Plaster",
    href: "https://buildon.co.in/products/buildon-p-20-ready-mix-plaster/",
    body: "Buildon P-20 is a Premixed sand cement plaster. It is specially formulated for exterior and interior plastering work to …",
    image: "/products/p-20-ready-mix.jpg",
  },
  {
    name: "Bondit-151",
    href: "https://buildon.co.in/products/bondit-151/",
    body: "BONDIT-151 is high performance bonding agent for Gypsum on concrete blocks/RCC surfaces.",
    image: "/products/bondit-151.png",
  },
  {
    name: "Bondit Plaster Bond+",
    href: "https://buildon.co.in/products/bondit-plaster-bond-plus/",
    body: "Buildon Bondit Plaster BOND+ is high-performance bonding agent for gypsum and sand cement….",
    image: "/products/bondit-plaster-bond-plus.png",
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
  image: "/projects/project-2.png",
} as const;

export const clients = {
  title: "Meet Our Clients",
  intro:
    "As a leader of Gypsum products in India, we cater to most of the leading builders across the nation.",
  logos: [
    "/clients/mahindra.jpg",
    "/clients/client-1.png",
    "/clients/client-2.png",
    "/clients/client-3.png",
    "/clients/client-4.png",
    "/clients/client-5.png",
    "/clients/client-6.png",
    "/clients/client-7.png",
    "/clients/client-8.png",
    "/clients/client-9.png",
    "/clients/client-10.png",
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
  cta: { label: "Read More >", href: "https://buildon.co.in/testimonials/" },
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
    { label: "Who We Are?", href: "" },
    { label: "Our Branches", href: "" },
    { label: "Privacy Policy", href: "" },
    { label: "User Agreement", href: "" },
    { label: "Download Catalogue", href: "" },
  ],
  quick: [
    { label: "Home", href: "/" },
    { label: "Our Projects", href: "" },
    { label: "Our Products", href: "" },
    { label: "Careers", href: "" },
    { label: "Customer Reviews", href: "" },
  ],
  support: [
    { label: "Contact Us", href: "#contact" },
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
    image: "/about/banner-handshake.jpg",
    alt: "Buildon representatives shaking hands with a client",
    /* The heading actually printed on the banner, over three lines. */
    headingLines: ["Building", "Excellence.", "Building India."],
  },
  overview: {
    title: "Company Overview",
    body: "Buildon stands as a pioneering force in India, emerging as a leading manufacturer and importer of finest quality Gypsum plaster and other products. Our Mumbai-based enterprise has ventured into unexplored territories, producing the world’s finest Gypsum plaster at our state-of-the-art factory. Renowned for its pure white colour and a hardness surpassing market standards by over 40%, our Gypsum is a testament to excellence, setting the gold standard in the construction realm.",
    image: "/about/team.png",
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
    image: "/about/plastering-wall.png",
    imageAlt: "A plasterer floating Buildon gypsum plaster onto a wall",
  },
  manufacturing: {
    title: "Our Manufacturing Excellence",
    body: "Our manufacturing facility is equipped with cutting-edge, fully automated Gypsum processing machines. Overseen by highly qualified engineers and a skilled workforce from around the world, we ensure the highest standards of production. With a vast network of marketing offices strategically positioned nationwide, and additional offices near major seaports, we guarantee swift and uninterrupted delivery of our quality Gypsum plaster. Our dynamic team of young and enthusiastic professionals provides unwavering technical support to meet the diverse needs of our customers.",
    image: "/about/interior-plants.png",
    imageAlt: "A finished interior wall plastered with Buildon gypsum",
  },
  serve: {
    title: "Who We Serve",
    body: "Buildon proudly supplies its superior Gypsum to esteemed builders, architects, project consultants, and contractors, enhancing the value of their prestigious projects. As industry leaders, we are committed to building a legacy of excellence, one that shapes the future of construction in India.",
  },
  midBanner: {
    image: "/about/banner-about.png",
    alt: "Buildon gypsum plaster in use on site",
  },
  missionVision: [
    {
      title: "Our Mission",
      icon: "/about/icon-mission.png",
      body: "We are committed to being the leading provider of finest gypsum solutions, building a legacy of trust, innovation, and sustainability. Through cutting-edge technology and a dynamic workforce, we consistently deliver the highest quality products, contributing to the success of nation-building.",
    },
    {
      title: "Our Vision",
      icon: "/about/icon-vision.png",
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
    image: "/contact/banner.jpg",
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
