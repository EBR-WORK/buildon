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
  { label: "Clientele", href: "/clientele" },
  { label: "Projects", href: "/projects" },
  { label: "Careers", href: null },
  { label: "Blog", href: null },
  { label: "Contact Us", href: "/contact-us" },
  { label: "FAQs", href: "/faq" },
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

/**
 * /faq. Copied verbatim from https://buildon.co.in/faq/, grouped exactly as
 * the reference groups its accordion.
 */
export const faqPage = {
  title: "FAQs",
  banner: {
    image: "/faq/banner.png",
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
    image: "/clientele/banner.png",
    headingLines: ["The testimony of", "our excellence.", "OUr Clients."],
  },
  cities: [
    {
      name: "MUMBAI",
      logos: [
        { src: "/clientele/adani.png", name: "Adani" },
        { src: "/clientele/godrej-properties.jpg", name: "Godrej Properties" },
        { src: "/clientele/l-t-realty-jpg.webp", name: "L T Realty" },
        { src: "/clientele/lodha.png", name: "Lodha" },
        { src: "/clientele/lokanandwala.png", name: "Lokanandwala" },
        { src: "/clientele/mahindra.png", name: "Mahindra" },
        { src: "/clientele/marathon.png", name: "Marathon" },
        { src: "/clientele/penninsula.png", name: "Penninsula" },
        { src: "/clientele/runwal.png", name: "Runwal" },
        { src: "/clientele/shapoorji.png", name: "Shapoorji" },
        { src: "/clientele/sheth.png", name: "Sheth" },
        { src: "/clientele/tata-housing.png", name: "Tata Housing" },
      ],
    },
    {
      name: "PUNE",
      logos: [
        { src: "/clientele/kolte-pati.png", name: "Kolte Pati" },
        { src: "/clientele/mahindra.png", name: "Mahindra" },
        { src: "/clientele/clover-builders-pune-1-3.png", name: "Clover Builders Pune 1" },
        { src: "/clientele/geol-ganga-group.png", name: "Geol Ganga Group" },
        { src: "/clientele/godrej-properties.jpg", name: "Godrej Properties" },
        { src: "/clientele/dnv.png", name: "" },
        { src: "/clientele/dreams.png", name: "Dreams" },
        { src: "/clientele/legacy-1.png", name: "Legacy" },
        { src: "/clientele/anshul.png", name: "Anshul" },
        { src: "/clientele/paranjape.png", name: "Paranjape" },
        { src: "/clientele/gd-sqaure.jpg", name: "GD Sqaure" },
        { src: "/clientele/silver-group-pune-1.jpg", name: "Silver Group Pune" },
        { src: "/clientele/gera.png", name: "Gera" },
        { src: "/clientele/madhuban.png", name: "Madhuban" },
        { src: "/clientele/shapoorji.png", name: "Shapoorji" },
        { src: "/clientele/kalpataru.png", name: "Kalpataru" },
      ],
    },
    {
      name: "NASIK",
      logos: [
        { src: "/clientele/ashokha.png", name: "Ashokha" },
        { src: "/clientele/bhagad.png", name: "Bhagad" },
        { src: "/clientele/dhatrak.png", name: "Dhatrak" },
        { src: "/clientele/garja.png", name: "Garja" },
        { src: "/clientele/ml-developers.png", name: "ML Developers" },
        { src: "/clientele/nirmal-group.png", name: "Nirmal Group" },
        { src: "/clientele/patil-group.jpg", name: "Patil Group" },
        { src: "/clientele/rachit-builders.png", name: "Rachit Builders" },
      ],
    },
    {
      name: "GOA",
      logos: [
        { src: "/clientele/clara-mount.png", name: "Clara Mount" },
        { src: "/clientele/oiuine.png", name: "" },
        { src: "/clientele/em-ghee.png", name: "EM Ghee" },
        { src: "/clientele/naifer.png", name: "Naifer" },
      ],
    },
    {
      name: "BANGALORE",
      logos: [
        { src: "/clientele/alpine.png", name: "Alpine" },
        { src: "/clientele/brigade-banglore-1.png", name: "Brigade Banglore" },
        { src: "/clientele/embassy.png", name: "Embassy" },
        { src: "/clientele/gannon.png", name: "Gannon" },
        { src: "/clientele/g-corp.png", name: "G Corp" },
        { src: "/clientele/habitat.png", name: "Habitat" },
        { src: "/clientele/pashmina.png", name: "Pashmina" },
        { src: "/clientele/prestige-group.png", name: "Prestige Group" },
        { src: "/clientele/tgr.png", name: "" },
        { src: "/clientele/zonasha.png", name: "Zonasha" },
        { src: "/clientele/l-t-realty-jpg.webp", name: "L T Realty" },
        { src: "/clientele/tvs-emerald-banglore-chennai-1-1.png", name: "TVS Emerald Banglore Chennai 1" },
      ],
    },
    {
      name: "CHENNAI",
      logos: [
        { src: "/clientele/appaswamy.png", name: "Appaswamy" },
        { src: "/clientele/tvs-emerald-banglore-chennai-1-1-1.png", name: "TVS Emerald Banglore Chennai 1 1" },
        { src: "/clientele/snp-foundation-chennai.png", name: "SNP Foundation Chennai" },
        { src: "/clientele/download-10-2.png", name: "" },
        { src: "/clientele/images-1.png", name: "" },
        { src: "/clientele/casa.png", name: "Casa" },
        { src: "/clientele/downl.png", name: "" },
        { src: "/clientele/dacnew.png", name: "" },
      ],
    },
    {
      name: "HYDERABAD",
      logos: [
        { src: "/clientele/sri-srinivasa.png", name: "Sri Srinivasa" },
        { src: "/clientele/kalpataru.png", name: "Kalpataru" },
        { src: "/clientele/vasavi-builders-logo-png-hyderabadnew-rrpcjy91vgcd4ec54z3cvquwj0i4uruck6hkeli86g.png", name: "Vasavi Builders Logo Png Hyderabadnew Rrpcjy91vgcd4ec54z3cvquwj0i4uruck6hkeli86g" },
        { src: "/clientele/alekya-png-logo-hyderabad-rrpcjxb7omb2ssdiagoqb93fxmmrn2qm81u2xbjmco.png", name: "Alekya Png Logo Hyderabad Rrpcjxb7omb2ssdiagoqb93fxmmrn2qm81u2xbjmco" },
        { src: "/clientele/aparna-logo.png", name: "Aparna" },
        { src: "/clientele/myhome-logo.png", name: "Myhome" },
        { src: "/clientele/sumadhura-infracon-3.jpg", name: "Sumadhura Infracon" },
        { src: "/clientele/dsr-hyderabad-1.png", name: "Dsr Hyderabad" },
      ],
    },
    {
      name: "DELHI",
      logos: [
        { src: "/clientele/dlf-capital-green.png", name: "DLF Capital Green" },
        { src: "/clientele/lemon-tree-hotels.png", name: "Lemon Tree Hotels" },
        { src: "/clientele/m3m.png", name: "" },
        { src: "/clientele/tata-housing-1.png", name: "Tata Housing" },
      ],
    },
    {
      name: "NAGPUR",
      logos: [
        { src: "/clientele/images-2-1.png", name: "" },
        { src: "/clientele/download-5-1.png", name: "" },
        { src: "/clientele/image-119.png", name: "" },
        { src: "/clientele/image-117.png", name: "" },
        { src: "/clientele/1654503679145-rrpcjuhnac1f3u9fmo6s8baj68dix6kma78matqfe0.jpeg", name: "1654503679145 Rrpcjuhnac1f3u9fmo6s8baj68dix6kma78matqfe0" },
        { src: "/clientele/sachidanand-realties-nagpur-png-logo-1.png", name: "Sachidanand Realties Nagpur Png Logo" },
        { src: "/clientele/sdpl-nagpur-logo-1.png", name: "Sdpl Nagpur Logo" },
        { src: "/clientele/pyramid-group-nagpur-logo.jpg", name: "Pyramid Group Nagpur" },
      ],
    },
    {
      name: "KOLKATA",
      logos: [
        { src: "/clientele/sugam-kolkata-logo-1.png", name: "Sugam Kolkata Logo" },
        { src: "/clientele/godrej-properties.jpg", name: "Godrej Properties" },
        { src: "/clientele/alcove-realty-kolkata.png", name: "Alcove Realty Kolkata" },
        { src: "/clientele/siddha-group-kolkata.png", name: "Siddha Group Kolkata" },
        { src: "/clientele/primarc-kolkata.png", name: "Primarc Kolkata" },
        { src: "/clientele/rajat-group-kolkata-logo.jpeg", name: "Rajat Group Kolkata" },
        { src: "/clientele/merlin-group-kolkata-logo.jpg", name: "Merlin Group Kolkata" },
        { src: "/clientele/purti-realty-kolkata-logo.png", name: "Purti Realty Kolkata" },
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
    image: "/projects/banner.png",
    headingLines: ["Projects:", "Built with", "buildon"],
  },
  readMore: "Read More >",
  items: [
    {
      name: "Aparna One, Hyderabad",
      href: "https://buildon.co.in/aparna-one-hyderabad/",
      image: "/projects/mask-group-29.png",
      body:
        "Aparna One is a project of ultra luxurious residential gated community flats for sale in Shaikpet, Hyderabad. These magnificent smart apartments are the perfect combination of class",
    },
    {
      name: "Aparna Zenon – Hyderabad",
      href: "https://buildon.co.in/aparna-zenon-hyderabad/",
      image: "/projects/mask-group-3.png",
      body:
        "Flats for sale in Nanakramguda, Hyderabad. The project offers luxurious 2 & 3 BHK apartments for sale in Nanakramguda, Puppalaguda. Nanakramguda Financial District is an IT",
    },
    {
      name: "Brigade Meadows Plumeria – Bangalore",
      href: "https://buildon.co.in/brigade-meadows-plumeria-bangalore/",
      image: "/projects/mask-group-9-1.png",
      body:
        "Brigade Meadows Plumeria is the new project developed by Brigade Group launched in Kanakapura Road, Bangalore. The Brigade Group was founded in 1986",
    },
    {
      name: "Godrej The Trees – Vikhroli East, Mumbai",
      href: "https://buildon.co.in/godrej-the-trees-vikhroli-east-mumbai/",
      image: "/projects/mask-group-8-1.png",
      body:
        "Godrej The Trees in Vikhroli East, Mumbai is a popular society in the city, it is well made and has all the amenities you need. There is ample space for parking of cars and bikes",
    },
    {
      name: "Goel Ganga Dham – Pune",
      href: "https://buildon.co.in/goel-ganga-dham-pune/",
      image: "/projects/mask-group-1-1.png",
      body:
        "Goel Ganga Group is one of the known real estate brands in Pune.The builder has delivered 74 projects so far. Around 7 projects are upcoming.",
    },
    {
      name: "Godrej Infinity – Pune",
      href: "https://buildon.co.in/godrej-infinity-pune/",
      image: "/projects/godrej-infinity-keshav-nagar-pune-1.jpg",
      body:
        "Godrej Infinity is a 43-acre residential development located on the banks of the Mula-Mutha River at Keshavnagar, Pune. The township will offer a holistic lifestyle",
    },
    {
      name: "Kolte Patil Atria – Pune",
      href: "https://buildon.co.in/kolte-patil-atria-pune/",
      image: "/projects/mask-group-4.png",
      body:
        "Beautifully crafted to complement your chic and aristocratic personality, our exclusively designed residences at 24K Atria by Kolte-Patil Developers let you explore the true joy",
    },
    {
      name: "Kalpataru Hills – Thane",
      href: "https://buildon.co.in/kalpataru-hills-thane/",
      image: "/projects/mask-group-7-1.png",
      body:
        "The architecture of Tata Serein Pokhran Road 2 is centred on the well-being of its residents. On Pokhran Rd 2 in Thane West’s most affluent area.",
    },
    {
      name: "Lodha Palava",
      href: "https://buildon.co.in/lodha-palava/",
      image: "/projects/lodha-palava-1.jpg",
      body:
        "Lodha Palava city is a dream project by Lodha. The township is well equipped with all the facilities and modern amenities. It’s like a smart city experience.",
    },
    {
      name: "L&T Realty presents Raintree Boulevard – Bangalore",
      href: "https://buildon.co.in/lt-realty-presents-raintree-boulevard-bangalore/",
      image: "/projects/l-t-raintree-boulevard-banglore.webp",
      body:
        "A premium lifestyle township located in the serene locales of Hebbal, Bengaluru. It is an endeavour to preserve the environment while developing a residential oasis offering its residents the luxuries of fine-living while being cradled in the pristine lap of nature.",
    },
    {
      name: "Prestige City – Bangalore",
      href: "https://buildon.co.in/prestige-city-bangalore-3/",
      image: "/projects/prestige-city-bangalore.webp",
      body:
        "Prestige City – Bangalore is a new premium Township project launched right on Sarjapur Road, Bangalore. The massive residential enclave, Prestige City is a township that spans over 180-acres of prime location…",
    },
    {
      name: "Mahindra Eden – Bangalore",
      href: "https://buildon.co.in/mahindra-eden-bangalore-3/",
      image: "/projects/mahindra-eden-bangalore.jpg",
      body:
        "Mahindra Eden – Bangalore is a hi-tech residential project ahead of its time grown by Mahindra Lifespaces located in a key corner of Kanakapura Road, Bengaluru. The eco-friendly homes in Mahindra Eden offer the ideal homes for your needs.",
    },
    {
      name: "DLF Greenland – Indore",
      href: "https://buildon.co.in/dlf-green-indore/",
      image: "/projects/dlf-garden-city-indore.webp",
      body:
        "One of the most upcoming townships with a lot of amenities nearby such as a very good CBSE School nearby and colleges. There is Central India largest mall which is easily accessible.",
    },
    {
      name: "L & T Crescent Bay – Parel, Mumbai",
      href: "https://buildon.co.in/l-t-crescent-bay-parel-mumbai/",
      image: "/projects/crescent-bay-parel-mumbai.webp",
      body:
        "Mumbai South by L & T Realty and Omkar Realtors is a residential project. The project offers Apartments with a perfect combination of contemporary architecture",
    },
    {
      name: "Runwal Greens – Mulund",
      href: "https://buildon.co.in/runwal-greens-mulund-west-mumbai/",
      image: "/projects/runwal-greens-mulund-mumbai.webp",
      body:
        "Known to be one of the best residential projects in Mumbai, and voted the same, Runwal Greens stands true to its name. The project is spread across 22 acres and has ample green spaces amidst luxurious towers.",
    },
    {
      name: "Prestige Bella Vista – Chennai",
      href: "https://buildon.co.in/prestige-bella-vista-chennai-2/",
      image: "/projects/prestige-bella-vista-chennai.jpg",
      body:
        "Located on Mount Poonamallee Road, Porur – Bella Vista is touted to be one of Chennai’s most lavish and serene Residential Developments.",
    },
    {
      name: "Alcove New Kolkata",
      href: "https://buildon.co.in/alcove-new-kolkata/",
      image: "/projects/new-kolkata-sangam.jpeg",
      body:
        "Alcove New Kolkata is a project spread over a total area of 28.5 acres. Total of 15, 27 storied towers. Residents of the New Kolkata Riverside Project will have the luxury of waking up to a scenic riverside view from their homes.",
    },
    {
      name: "Godrej Seven",
      href: "https://buildon.co.in/godrej-seven/",
      image: "/projects/elevate-at-godrej-seven-joka.jpeg",
      body:
        "The apartments are beautifully planned in the total area of 20.23 acres of land. The apartments range starts from avail of 2BHK, 2.5BHK, and 3BHK. These apartments are planned in 7 towers in grand elevation of G+12 and G+14 floors.",
    },
    {
      name: "Primarc Southwinds project LLP",
      href: "https://buildon.co.in/primarc-southwinds-project-llp/",
      image: "/projects/primarc-kolkata.jpg",
      body:
        "Southwinds on Southern Bypass introduces new blocks with bigger 3BHK pond-facing apartments. Southwinds on Southern Bypass is a residential project that spans across 972 kattha of land.",
    },
    {
      name: "Siddha Sky",
      href: "https://buildon.co.in/siddha-sky/",
      image: "/projects/siddha-sky-kolkata.jpg",
      body:
        "This incredible project, which is currently under construction, is being built on a total area of 8.51 acres. There are 2BHK, 3BHK, and 4BHK apartments. This mesmerizing property is also available in sizes from 4 BHK Flat (2560. 0 Sq. Ft. – 2560. 0 Sq. Ft.).",
    },
    {
      name: "ACC INDIA PVT LTD – 88 East",
      href: "https://buildon.co.in/acc-india-pvt-ltd-88-east/",
      image: "/projects/88-east-kolkata.jpg",
      body:
        "The Tata Housing Development Company, Tata Housing 88 East, is a world-class, luxurious residential development planned right in the middle of one of the most prized residential locations inside the ‘City of Joy’ – namely, Alipore, Kolkata.",
    },
    {
      name: "Natural City Birati",
      href: "https://buildon.co.in/natural-city-birati-2/",
      image: "/projects/natural-city-birati.jpg",
      body:
        "The magnificent Natural City Birati that is smartly located in Birati, Kolkata, is a well-planned project. This project has its expanse over an area of 124 Kottah. The project features a total of 110 units that are well-ventilated.",
    },
    {
      name: "Raga Sarvalom",
      href: "https://buildon.co.in/raga-sarvalom/",
      image: "/projects/raga-sarvolam-kolkata.jpg",
      body:
        "It is a well-designed and comfortable home that offers an excellent quality of life. It is a 230-unit project spread over 2.5 acres in Howrah, Kolkata.",
    },
    {
      name: "Kshetrum Aspire",
      href: "https://buildon.co.in/kshetrum-aspire/",
      image: "/projects/kshetrum-aspire-kolkata.jpg",
      body:
        "The magnificent Kshetrum Aspire that is smartly located in Behala Chowrasta, Kolkata, is a well-planned project. Spread over a vast area of 1 acre, the project is a well-established one. The entire project consists of over 100 residential units.",
    },
  ],
} as const;
