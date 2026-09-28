/**
 * The project detail pages, transcribed from the reference site.
 *
 * Same rule as content.ts and productDetails.ts: every string is the reference
 * site's own, punctuation and typos included. Fix them there first, then
 * mirror the fix here.
 *
 * The reference publishes these at the site root — buildon.co.in/aparna-one-
 * hyderabad/ — rather than under /projects/. They live at /projects/<slug>
 * here so the listing and its pages read as one section, matching how
 * /products/<slug> already works.
 *
 * Each page is the same shape: a heading, one photograph and a few paragraphs
 * of body copy, so unlike the products there is no typed section list — only
 * `paragraphs`, in order. Entries are added one project at a time as each page
 * is transcribed; `projectsPage.items` in content.ts carries the listing, and
 * a card links out only once its detail page exists here.
 */

import { cityPageHref } from "./cityPages";

export type ProjectDetail = {
  readonly slug: string;
  /** The name the listing card and the projects grid use. */
  readonly name: string;
  /** The page's own heading, which the reference writes differently to the card. */
  readonly title: string;
  /** The photograph under the heading — usually the reference's card crop. */
  readonly image: string;
  /**
   * The file's natural width, given only when it is narrower than the page's
   * 34rem box. Several of the reference's pictures are 300px originals with no
   * larger version upstream, and the box fills its width whatever the source,
   * so without this they are stretched to 544px and go soft.
   */
  readonly imageWidth?: number;
  /**
   * The file's natural height, given with `imageWidth` when the picture is not
   * the usual landscape crop. The box is otherwise a fixed 750/569, which
   * object-cover would use to slice the top and bottom off a portrait tower
   * shot; with both figures the box takes the picture's own shape instead.
   */
  readonly imageHeight?: number;
  /** Body copy, one string per paragraph, in the reference's order. */
  readonly paragraphs: readonly string[];
};

export const projectDetails: readonly ProjectDetail[] = [
  {
    slug: "aparna-one-hyderabad",
    name: "Aparna One, Hyderabad",
    title: "Aparna One - Hyderabad",
    image: "/projects/mask-group-29.webp",
    paragraphs: [
      "Aparna One is a project of ultra-luxurious residential gated community flats for sale in Shaikpet, Hyderabad. These magnificent smart apartments are the perfect combination of class and convenience, that’ll redefine the experience of luxury living.",
      "Located at a central location in close proximity to Hyderabad’s poshest localities like Banjara Hills, Jubilee Hills, Hi-tech City, and Gachibowli, Aparna One flats for sale in Shaikpet, are poised to be one of the most sought-after luxury homes of Hyderabad.",
      "Aparna One has spacious 3 and 4-BHK, flats for sale in Shaikpet, with exclusive personal lobbies for each. The community is spread across 9.7 acres of land with 6 residential blocks and one entire block dedicated to the clubhouse along with a wide range of amenities.",
    ],
  },
  {
    slug: "aparna-zenon-hyderabad",
    /* The listing writes the name with an en dash, the page's own heading with
       a hyphen. Both kept as they are — `name` is what projectHref matches on. */
    name: "Aparna Zenon – Hyderabad",
    title: "Aparna Zenon - Hyderabad",
    image: "/projects/mask-group-3.webp",
    paragraphs: [
      /* One paragraph on the reference, broken by a stray <br> before "your
         work" — a layout artifact, not a sentence break, so it is closed up. */
      "Flats for sale in Nanakramguda, Hyderabad. The project offers luxurious 2 & 3 BHK apartments for sale in Nanakramguda, Puppalaguda. Nanakramguda Financial District is an IT, real estate, and architectural suburb in Serlingampally Mandal, in Hyderabad, India. The first phase of the financial district is home to TSI Business parks making it a sought-after place, for people to reside close to. Located at a considerable distance from the city yet surrounded by prime commercial facilities, apartments for sale in Nanakramguda offer you the balance between your work and family life.",
    ],
  },
  {
    slug: "brigade-meadows-plumeria-bangalore",
    name: "Brigade Meadows Plumeria – Bangalore",
    title: "Brigade Meadows Plumeria - Bangalore",
    image: "/projects/mask-group-9-1.webp",
    paragraphs: [
      "Brigade Meadows Plumeria is the new project developed by Brigade Group launched in Kanakapura Road, Bangalore. The Brigade Group was founded in 1986 and has now become one of India’s leading asset developers in the Real Estate market.",
      "Brigade Meadows Plumeria is a contemporary planned apartment, covering 3.92 acres of land. It is offering 1BHK, 2BHK, and 3BHK apartments. It has 7 remarkable towers with nice planned units. It provides around 45+ amenities with luxurious features.",
    ],
  },
  {
    slug: "godrej-the-trees-vikhroli-east-mumbai",
    name: "Godrej The Trees – Vikhroli East, Mumbai",
    title: "Godrej The Trees - Vikhroli East, Mumbai",
    image: "/projects/mask-group-8-1.webp",
    paragraphs: [
      "Godrej The Trees in Vikhroli East, Mumbai is a popular society in the city, it is well made and has all the amenities you need. There is ample space for parking of cars and bikes in this society, your vehicle will be fully protected and safe here. There is ample truth in this society, your vehicle will be fully protected and safe here.",
      "Moving into a home with wifi connectivity is extremely convenient, that is exactly what this society offers you. If you like doing some cardio, or just like to focus on weights, this society has a gym that you should check out. You won’t have to only look for houses on the ground floor, there are elevators that you can use to get you to any floor. Nothing beats jumping into a pool on a hot summer day.",
      "Here,  the swimming pool is a huge hit with all the residents. Have you seen the children’s play zone here? If you have kids, they will love it. The intercom facility here helps you communicate easily with the gate when you have deliveries and visitors. Being sustainable as a society is very important, We have started by having rainwater harvesting in our society. Working from home is convenient, as this society has a reliable generator backup.",
      "Being near Shreeji Homes – Vishal makes shopping fun and convenient. Looking for some fun and entertainment? INOX Neelyog is worth checking out. Being situated near Dr Jiten Chowdhry, Laparoscopy, Gastrosurgeon, & Piles Surgeon, Dental Profile – Dental Clinic in Ghatkopar, and Orthosut – Saachi Medic, emergency care is very easily available at any time. Peacock Events, My Home Physio, and DTC Packers and Movers Mumbai are well known educational institutes in town & are very close to this home.",
    ],
  },
  {
    slug: "goel-ganga-dham-pune",
    name: "Goel Ganga Dham – Pune",
    title: "Goel Ganga Dham - Pune",
    image: "/projects/mask-group-1-1.webp",
    paragraphs: [
      /* "in Pune.The builder" — the reference's own missing space. */
      "Goel Ganga Group is one of the known real estate brands in Pune.The builder has delivered 74 projects so far. Around 7 projects are upcoming. There are 13 projects of this builder, which are currently under-construction. Goel Ganga Dham Towers Bibwewadi housing society has 3 towers with 32 floors.",
    ],
  },
  {
    slug: "godrej-infinity-pune",
    name: "Godrej Infinity – Pune",
    title: "Godrej Infinity - Pune",
    /* The only project whose picture is not a Mask-group crop. The reference
       publishes it at 300x228 and has no larger original. */
    image: "/projects/godrej-infinity-keshav-nagar-pune-1.webp",
    imageWidth: 300,
    paragraphs: [
      "Godrej Infinity is a 43-acre residential development located on the banks of the Mula-Mutha River at Keshavnagar, Pune. The township will offer a holistic lifestyle to its residents and will come with a fully equipped clubhouse, swimming pool, state-of-the-art gym, jogging, and cycling tracks. This residential complex will also have convenient shopping areas in the town square of the development.",
    ],
  },
  {
    slug: "kolte-patil-atria-pune",
    name: "Kolte Patil Atria – Pune",
    title: "Kolte Patil Atria - Pune",
    image: "/projects/mask-group-4.webp",
    paragraphs: [
      "Beautifully crafted to complement your chic and aristocratic personality, our exclusively designed residences at 24K Atria by Kolte-Patil Developers let you explore the true joy of grandeur. These ultra-lavish flats in Pune, with just two apartments on each floor, ensure complete privacy at all times.",
      "The ongoing project in Pune offers you the perks of smart living with cutting-edge home automation and electronic systems. Relax, rejuvenate, entertain or simply sip champagne with the crème-de-la-crème of society. Come, live exclusive. Only at 24K Atria.",
    ],
  },
  {
    slug: "kalpataru-hills-thane",
    name: "Kalpataru Hills – Thane",
    title: "Kalpataru Hills - Thane",
    image: "/projects/mask-group-7-1.webp",
    paragraphs: [
      /* WRONG PROJECT ON THE REFERENCE. Every paragraph below is about Tata
         Housing's Tata Serein on Pokhran Road 2, not Kalpataru Hills — the
         listing excerpt is taken from the same copy. Transcribed as published;
         when the reference is corrected, mirror it here. */
      "Tata Housing has developed into one of India’s real estate development enterprises with the most excellent growth rate since 2006. The company’s operations include land acquisition, project planning, project designing, project execution, property services, and estate management, with the development of properties in the residential and commercial sectors serving as its significant business.",
      "The architecture of Tata Serein Pokhran Road 2 is centred on the well-being of its residents. On Pokhran Rd 2 in Thane West’s most affluent area.",
      "Tata Serein offers a larger-than-life living experience for its residents, as it is highlighted by views of the Yeoor Hills and is bordered by the rich nature of Sanjay Gandhi National Park. These flats are enveloped by stunning scenery, greenery, and sunlight.",
    ],
  },
  {
    slug: "lodha-palava",
    /* The one project the reference names without a city. */
    name: "Lodha Palava",
    title: "Lodha Palava",
    /* Another 300x228 original, like Godrej Infinity. */
    image: "/projects/lodha-palava-1.webp",
    imageWidth: 300,
    paragraphs: [
      /* Lower-case "city" here; the listing excerpt capitalises it. Both the
         reference's own. */
      "Lodha Palava city is a dream project by Lodha. The township is well equipped with all the facilities and modern amenities. It’s like a smart city experience. The rates of Palava by Lodha have increased due to so many infra projects around the city. With more such projects coming up, the demand for flats will surely see a surge with time. Lodha Palava city is being developed in three phases. So, people who invest in Palava will benefit in the long run. Lodha Palava is surely a great place to invest in.",
    ],
  },
  {
    slug: "lt-realty-presents-raintree-boulevard-bangalore",
    name: "L&T Realty presents Raintree Boulevard – Bangalore",
    title: "L&T Realty presents Raintree Boulevard - Bangalore",
    /* The one project whose detail page does not reuse its card crop: the
       reference puts a different render here, at 300x228. The card's own
       photograph stays the 2560x1440 evening shot. */
    image: "/projects/raintree-boulevard-detail.webp",
    imageWidth: 300,
    paragraphs: [
      "A premium lifestyle township located in the serene locales of Hebbal, Bengaluru. It is an endeavour to preserve the environment while developing a residential oasis offering its residents the luxuries of fine-living while being cradled in the pristine lap of nature. L&T Raintree Boulevard is a large gated community township located in Hebbal, North Bengaluru. The property offers 3 and 4 Bedroom apartments for sale. The saleable area of the 3 Bedroom apartments ranges from 1655 Sq.ft to 1935 Sq.ft, while the 4 BHK flat sizes are between 2500 to 2765 Sq.ft. Phase-1 of the development has been completed and is already sold out, with 1019 residential units handed over to the residents. Phase-2 and Phase-3 of the project are currently under construction and are expected to be completed by September 2024 and March 2026, respectively.",
    ],
  },
  {
    /* The reference's slug carries a -3 suffix: WordPress found the name taken
       twice over. Kept, because it is the URL that exists. */
    slug: "prestige-city-bangalore-3",
    name: "Prestige City – Bangalore",
    title: "Prestige City - Bangalore",
    image: "/projects/prestige-city-bangalore.webp",
    paragraphs: [
      "Prestige City – Bangalore is a new premium Township project launched right on Sarjapur Road, Bangalore. The massive residential enclave, Prestige City is a township that spans over 180-acres of prime location which houses premium Apartments and plots as well as luxury apartments in Meridian Park.",
      "Prestige City features the very best in Prestige Constructions’ luxury township segment.",
      "Beautiful landscapes, green covers, and expansive open spaces all around the pristine locales surrounding the project make it more special & Elite.",
    ],
  },
  {
    /* -3 suffix, as on the reference. See prestige-city-bangalore-3. */
    slug: "mahindra-eden-bangalore-3",
    name: "Mahindra Eden – Bangalore",
    title: "Mahindra Eden - Bangalore",
    image: "/projects/mahindra-eden-bangalore.webp",
    paragraphs: [
      "Mahindra Eden – Bangalore is a hi-tech residential project ahead of its time grown by Mahindra Lifespaces located in a key corner of Kanakapura Road, Bengaluru. The eco-friendly homes in Mahindra Eden offer the ideal homes for your needs. As India’s first Net-Zero Energy home development project, Mahindra Eden not only focuses on sustainability as a key objective but also on enriching the biodiversity that encircles the homes.",
    ],
  },
  {
    /* The reference's slug says "green", its heading and the listing say
       "Greenland". The slug is the URL that exists, so it stands. */
    slug: "dlf-green-indore",
    name: "DLF Greenland – Indore",
    title: "DLF Greenland - Indore",
    /* The reference serves this page a WhatsApp upload and the card a separate
       file, but they are the same photograph at the same 400x266 — so the card
       crop already in the repo does for both. */
    image: "/projects/dlf-garden-city-indore.webp",
    imageWidth: 400,
    paragraphs: [
      /* "Central India largest mall" and the missing full stop are theirs; the
         listing excerpt writes "Central India's". */
      "One of the most upcoming townships with a lot of amenities nearby such as a very good CBSE School nearby and colleges. There is Central India largest mall which is easily accessible. There are lot of facilities which are within a very short distance like a bank, hospital and others as well",
    ],
  },
  {
    slug: "l-t-crescent-bay-parel-mumbai",
    name: "L & T Crescent Bay – Parel, Mumbai",
    title: "L & T Crescent Bay - Parel, Mumbai",
    image: "/projects/crescent-bay-parel-mumbai.webp",
    paragraphs: [
      "Mumbai South by L & T Realty and Omkar Realtors is a residential project. The project offers Apartments with a perfect combination of contemporary architecture & features to provide comfortable living. The apartments are of the following configurations: 2BHK,3BHK & 4BHK. The project is spread over a total area of 5.48 acres of land. It has 70% of open space. L & T Crescent Bay has a total of 6 towers. The construction is 59 floors. An accommodation of 1282 units has been provided. Offering 52 amenities for better living experience.",
    ],
  },
  {
    slug: "runwal-greens-mulund-west-mumbai",
    /* The listing stops at "Mulund", the page names the suburb in full. */
    name: "Runwal Greens – Mulund",
    title: "Runwal Greens - Mulund West, Mumbai",
    /* A second render, not the card's: the reference puts its own 1024x778
       artwork on this page, a different view from the listing photograph. */
    image: "/projects/runwal-greens-detail.webp",
    paragraphs: [
      /* The card says the project spans 22 acres, this page says 13, and the
         reference publishes both. Left as found — it is a content error to
         settle there, not here. */
      "Runwal Greens, located in the Industrial Area of Mulund West, Mumbai, offers an exceptional living experience for those seeking a luxurious and comfortable lifestyle. Spread across 13 acres, this residential development boasts a total of 1,500 units, featuring 2, 3, and 4-bedroom configurations. With meticulous planning and attention to detail, Runwal Greens offers a range of spacious homes designed to meet the diverse needs of modern families.",
      "The carpet areas of the units vary, ensuring ample space for residents to create their ideal living environment. From well-appointed 2-bedroom apartments to expansive 4-bedroom residences, each unit at Runwal Greens is thoughtfully crafted to provide maximum comfort and functionality. The apartments are priced competitively, with a range starting from 1.8 Crores up to 4 Crores. Homebuyers also have the flexibility to opt for convenient monthly EMIs starting from 1.34 Lakh.",
      "One of the notable advantages of living at Runwal Greens is its strategic location. Situated next to Fortis Hospital in the bustling Industrial Area of Mulund West, residents have access to a wide array of amenities and facilities in close proximity. The presence of renowned healthcare institutions ensures that residents can avail themselves of quality medical care within minutes from their homes. The surrounding area also offers convenient transportation options, including nearby bus stops and train stations, enabling easy connectivity to other parts of Mumbai.",
      "Apart from its advantageous location, Runwal Greens provides an enriching lifestyle for its residents. The meticulously planned development features a host of amenities and recreational facilities, catering to the diverse interests and preferences of the residents. From well-manicured gardens and walking paths to state-of-the-art fitness centres and swimming pools, there is something for everyone to enjoy. The development also prioritizes the safety and security of its residents, with round-the-clock security measures implemented.",
    ],
  },
  {
    /* -2 suffix, as on the reference. See prestige-city-bangalore-3. */
    slug: "prestige-bella-vista-chennai-2",
    name: "Prestige Bella Vista – Chennai",
    title: "Prestige Bella Vista - Chennai",
    /* The page's own render, not the card's — and at 1024x778 it is far larger
       than the 300px card crop, so it is worth carrying separately. */
    image: "/projects/prestige-bella-vista-detail.webp",
    paragraphs: [
      /* The second paragraph stops mid-sentence on a comma: "a joint venture
         between Prestige and Rattha,". Published that way. */
      "The Prestige Group was established in 1986 and is one of the most well-known names in Indian real estate. Cities like Bangalore, Chennai, Kochi, Hyderabad, Goa, and Mangalore are major hubs for Prestige Builders. The portfolio of Prestige properties includes parts for rental and resale, business, retail, and hotel. Irfan Razack, who serves as the Group’s CMD, as well as his brothers Noaman and Rezwan Razack lead the organisation.",
      "Bella Vista provides its residents with an urban living experience that combines classic architecture with modern design. Additionally, Prestige Bella Vista includes all the standard facilities seen in today’s Prestige Developments. A fully furnished clubhouse, two swimming pools, a health club, and a kids’ play area are just a few examples of what is offered. So, come explore a brand-new, excellent aspect of urban life today! Bella Vista is a joint venture between Prestige and Rattha,",
    ],
  },
  {
    slug: "alcove-new-kolkata",
    /* No city in the name, as with Lodha Palava. */
    name: "Alcove New Kolkata",
    title: "Alcove New Kolkata",
    /* Same photograph as the card, and the repo's copy is the larger of the
       two: 1200x905 against the reference's 1024x772. */
    image: "/projects/new-kolkata-sangam.webp",
    paragraphs: [
      /* The last two sentences are Buildon's own product copy, spliced onto the
         end of the project description — keyword filler rather than anything
         about the development. Published that way. */
      "Alcove New Kolkata is a project spread over a total area of 28.5 acres. Total of 15, 27 storied towers. Residents of the New Kolkata Riverside Project will have the luxury of waking up to a scenic riverside view from their homes. New Kolkata’s record number of Ganga-facing flats in North Kolkata gives their residents an unparalleled view of the mighty river. The New Kolkata Riverside Project gives their owners all modern amenities while nestled in the lap of nature. Buildon offers a wide range of gypsum plaster, including ready-mix plaster, Bondit plaster, and gypsum Bondit. Known for quality, Buildon provides the best gypsum plaster and imported gypsum plaster, making it the go-to choice for the best imported gypsum plaster in India.",
    ],
  },
  {
    slug: "godrej-seven",
    name: "Godrej Seven",
    title: "Godrej Seven",
    image: "/projects/elevate-at-godrej-seven-joka.webp",
    paragraphs: [
      /* Ends with the same Buildon product filler as Alcove New Kolkata; the
         card excerpt stops before it. */
      "The apartments are beautifully planned in the total area of 20.23 acres of land. The apartments range starts from avail of 2BHK, 2.5BHK, and 3BHK. These apartments are planned in 7 towers in grand elevation of G+12 and G+14 floors. Strategically planned and designed for the fitness of residents. Focuses on ultra-modern lifestyle. Buildon offers a wide range of gypsum plaster, including ready-mix plaster, Bondit plaster, and gypsum Bondit. Known for quality, Buildon provides the best gypsum plaster and imported gypsum plaster, making it the go-to choice for the best imported gypsum plaster in India.",
    ],
  },
  {
    slug: "primarc-southwinds-project-llp",
    /* Lower-case "project", as the reference writes it in both places. */
    name: "Primarc Southwinds project LLP",
    title: "Primarc Southwinds project LLP",
    image: "/projects/primarc-kolkata.webp",
    paragraphs: [
      /* Same Buildon product filler again — third page running. */
      "Southwinds on Southern Bypass introduces new blocks with bigger 3BHK pond-facing apartments. Southwinds on Southern Bypass is a residential project that spans across 972 kattha of land. An extra 15,000 sqft fully equipped clubhouse is now added to the residential complex along with an operational 30,000 sqft plush club and an in-house shopping complex. Buildon offers a wide range of gypsum plaster, including ready-mix plaster, Bondit plaster, and gypsum Bondit. Known for quality, Buildon provides the best gypsum plaster and imported gypsum plaster, making it the go-to choice for the best imported gypsum plaster in India.",
    ],
  },
  {
    slug: "siddha-sky",
    name: "Siddha Sky",
    title: "Siddha Sky",
    /* The one portrait picture: a 368x500 tower shot, the same file the
       reference serves. It keeps its own shape rather than being cropped to
       the landscape box. */
    image: "/projects/siddha-sky-kolkata.webp",
    imageWidth: 368,
    imageHeight: 500,
    paragraphs: [
      /* "2560. 0 Sq. Ft." — the reference's own broken decimal, twice over.
         Buildon product filler closes it, as on the other 2025 pages. */
      "This incredible project, which is currently under construction, is being built on a total area of 8.51 acres. There are 2BHK, 3BHK, and 4BHK apartments. This mesmerizing property is also available in sizes from 4 BHK Flat (2560. 0 Sq. Ft. – 2560. 0 Sq. Ft.). Buildon offers a wide range of gypsum plaster, including ready-mix plaster, Bondit plaster, and gypsum Bondit. Known for quality, Buildon provides the best gypsum plaster and imported gypsum plaster, making it the go-to choice for the best imported gypsum plaster in India.",
    ],
  },
  {
    slug: "acc-india-pvt-ltd-88-east",
    name: "ACC INDIA PVT LTD – 88 East",
    title: "ACC INDIA PVT LTD - 88 East",
    image: "/projects/88-east-kolkata.webp",
    paragraphs: [
      /* Named for ACC India, but the copy describes Tata Housing's 88 East —
         see kalpataru-hills-thane for the same mix-up. "A total of 176 are
         present" is missing its noun, and the Buildon product filler closes it
         as on the other 2025 pages. */
      "The Tata Housing Development Company, Tata Housing 88 East, is a world-class, luxurious residential development planned right in the middle of one of the most prized residential locations inside the ‘City of Joy’ – namely, Alipore, Kolkata. 88 East is strategically located at Alipore with seamless connectivity to the prominent areas of Kolkata. Spread over a vast area of 3 acres, the project is a well-established one. A total of 176 are present in the project. Buildon offers a wide range of gypsum plaster, including ready-mix plaster, Bondit plaster, and gypsum Bondit. Known for quality, Buildon provides the best gypsum plaster and imported gypsum plaster, making it the go-to choice for the best imported gypsum plaster in India.",
    ],
  },
  {
    /* -2 suffix, as on the reference. See prestige-city-bangalore-3. */
    slug: "natural-city-birati-2",
    name: "Natural City Birati",
    title: "Natural City Birati",
    /* 343x147 is all the reference has — small, and much wider than the
       landscape box, so it keeps its own shape rather than being cropped to
       one third of its height. */
    image: "/projects/natural-city-birati.webp",
    imageWidth: 343,
    imageHeight: 147,
    paragraphs: [
      /* Buildon product filler closes it, as on the other 2025 pages. */
      "The magnificent Natural City Birati that is smartly located in Birati, Kolkata, is a well-planned project. This project has its expanse over an area of 124 Kottah. The project features a total of 110 units that are well-ventilated. A Multi-storey with over 110 Apartments residential complex with 3 Towers having 2 & 3 BHK from 866 sq.ft. onwards, with a beautiful pond to have extra freshness & greenery. Buildon offers a wide range of gypsum plaster, including ready-mix plaster, Bondit plaster, and gypsum Bondit. Known for quality, Buildon provides the best gypsum plaster and imported gypsum plaster, making it the go-to choice for the best imported gypsum plaster in India.",
    ],
  },
  {
    slug: "raga-sarvalom",
    /* "Sarvalom" in the name, "Sarvolam" in the filename — the reference's own
       inconsistency, kept on both sides. */
    name: "Raga Sarvalom",
    title: "Raga Sarvalom",
    /* 379x300 is the full-size file upstream; nothing larger exists. */
    image: "/projects/raga-sarvolam-kolkata.webp",
    imageWidth: 379,
    imageHeight: 300,
    paragraphs: [
      /* Buildon product filler closes it, as on the other 2025 pages. */
      "It is a well-designed and comfortable home that offers an excellent quality of life. It is a 230-unit project spread over 2.5 acres in Howrah, Kolkata. Each apartment is designed to have excellent lighting and ventilation, close to Howrah Maidan Metro Station, easy access to Howrah Railway Station, and well-connected to Grand Trunk Road. Buildon offers a wide range of gypsum plaster, including ready-mix plaster, Bondit plaster, and gypsum Bondit. Known for quality, Buildon provides the best gypsum plaster and imported gypsum plaster, making it the go-to choice for the best imported gypsum plaster in India.",
    ],
  },
  {
    slug: "kshetrum-aspire",
    name: "Kshetrum Aspire",
    title: "Kshetrum Aspire",
    /* 413x310 is the full-size file upstream; nothing larger exists. */
    image: "/projects/kshetrum-aspire-kolkata.webp",
    imageWidth: 413,
    imageHeight: 310,
    paragraphs: [
      /* "1336. 0 Sq. Ft." twice over, the same broken decimal as Siddha Sky,
         and the Buildon product filler closes it. */
      "The magnificent Kshetrum Aspire that is smartly located in Behala Chowrasta, Kolkata, is a well-planned project. Spread over a vast area of 1 acre, the project is a well-established one. The entire project consists of over 100 residential units. This mesmerizing property is available in sizes from 3 BHK Flat (1336. 0 Sq. Ft. – 1336. 0 Sq. Ft.) to provide a spacious and comfortable living. The residential project features 2 remarkable towers with well-planned units. Buildon offers a wide range of gypsum plaster, including ready-mix plaster, Bondit plaster, and gypsum Bondit. Known for quality, Buildon provides the best gypsum plaster and imported gypsum plaster, making it the go-to choice for the best imported gypsum plaster in India.",
    ],
  },
];

/**
 * The "Posts" widget the reference hangs down the left of every project page:
 * its eight city landing pages, which it publishes but never lists on /blog.
 * Titles and order are the reference's; each row's href is resolved from
 * cityPages.ts, so a row links through the moment its page is built and stays
 * inert until then. "View More" goes where the reference sends it: /projects.
 */
export const projectPostsWidget = {
  title: "Posts",
  viewMore: { label: "View More >", href: "/projects" },
  items: [
    "gypsum-plaster-in-bhubaneswar",
    "gypsum-plaster-in-jharkhand",
    "gypsum-plaster-in-jamshedpur",
    "gypsum-plaster-in-ranchi",
    "gypsum-plaster-in-cuttack",
    "gypsum-plaster-in-orissa",
    "gypsum-plaster-in-siliguri",
    "gypsum-plaster-in-durgapur",
  ].map((slug) => ({
    slug,
    /* "gypsum-plaster-in-bhubaneswar" → "Gypsum Plaster in Bhubaneswar", the
       reference's own capitalisation. */
    title: slug
      .split("-")
      .map((word, i) => (i === 2 ? word : word[0].toUpperCase() + word.slice(1)))
      .join(" "),
    href: cityPageHref(slug),
  })),
} as const;

export function getProjectDetail(slug: string) {
  return projectDetails.find((project) => project.slug === slug);
}

/** Whether the listing should link a card through to a detail page. */
export function projectHref(name: string) {
  const project = projectDetails.find((detail) => detail.name === name);
  return project ? `/projects/${project.slug}` : "";
}
