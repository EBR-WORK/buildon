/**
 * The words the site frame is built from — navigation, buttons, labels.
 *
 * Separate from the page content in `content.ts`, which is long-form copy that
 * belongs in the CMS and goes through the translation cache. These are short,
 * fixed, and change about once a year, so they live in the repository where
 * they can be reviewed in a diff.
 *
 * English is the source of truth and the shape every other language is checked
 * against: `mr` and `hi` are typed as a deep partial of it, so a missing key
 * falls back to English and a key that no longer exists is a type error.
 *
 * On the Marathi and Hindi below: product names and trade terms stay in
 * English, because that is how the industry speaks. A dealer reading
 * "जिप्सम प्लास्टर वन कोट" does not recognise the product they were sold.
 * They are written here rather than machine-translated so somebody at Buildon
 * can correct them in a pull request.
 */

export const en = {
  nav: {
    home: "Home",
    about: "About Us",
    products: "Products",
    clientele: "Clientele",
    projects: "Projects",
    careers: "Careers",
    blog: "Blog",
    contact: "Contact Us",
    faqs: "FAQs",
  },
  actions: {
    readMore: "Read More",
    viewMore: "View More",
    knowMore: "Know More",
    download: "Download",
    getQuote: "Get a Quote",
    submit: "Submit",
    send: "Send",
    callUs: "Call Us",
    menu: "Menu",
    close: "Close",
  },
  form: {
    name: "Full Name",
    email: "Your Mail Id",
    phone: "Your Phone Number",
    message: "Your Message",
    company: "Company Name",
    enquiryType: "Enquiry Type",
    product: "Which Product",
    required: "required",
  },
  misc: {
    language: "Language",
    searchPlaceholder: "Search",
    backToTop: "Back to top",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  /* The chat widget's own controls.
     
     Only the chrome lives here — the greeting, the menu options and the
     scripted answers come from `chat` in content.ts and are English for now.
     These are the strings the HTML translation pass can never reach, because
     the panel is closed when the page is built, so they appear in no built
     file. A screen reader on a Marathi page would otherwise announce the
     controls in English. */
  chat: {
    closeChat: "Close chat",
    showMenu: "Show the menu",
    cancelEnquiry: "Cancel this enquiry",
  },
} as const;

export type Dictionary = typeof en;

/**
 * Every level optional, so a language may translate as much as it has.
 *
 * Leaves widen to `string`: English is declared `as const`, which makes each
 * value its own literal type, and a Marathi string is not assignable to the
 * type `"Home"`. The shape is what has to match, not the words.
 */
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : string;
};

export const mr: DeepPartial<Dictionary> = {
  nav: {
    home: "मुख्यपृष्ठ",
    about: "आमच्याविषयी",
    products: "उत्पादने",
    clientele: "ग्राहक",
    projects: "प्रकल्प",
    careers: "करिअर",
    blog: "ब्लॉग",
    contact: "संपर्क",
    faqs: "प्रश्न",
  },
  actions: {
    readMore: "अधिक वाचा",
    viewMore: "अधिक पहा",
    knowMore: "अधिक जाणून घ्या",
    download: "डाउनलोड",
    getQuote: "दर विचारा",
    submit: "पाठवा",
    send: "पाठवा",
    callUs: "फोन करा",
    menu: "मेनू",
    close: "बंद करा",
  },
  form: {
    name: "पूर्ण नाव",
    email: "तुमचा ईमेल",
    phone: "तुमचा फोन नंबर",
    message: "तुमचा संदेश",
    company: "कंपनीचे नाव",
    enquiryType: "चौकशीचा प्रकार",
    product: "कोणते उत्पादन",
    required: "आवश्यक",
  },
  misc: {
    language: "भाषा",
    searchPlaceholder: "शोधा",
    backToTop: "वर जा",
    openMenu: "मेनू उघडा",
    closeMenu: "मेनू बंद करा",
  },
  chat: {
    closeChat: "चॅट बंद करा",
    showMenu: "मेनू दाखवा",
    cancelEnquiry: "ही चौकशी रद्द करा",
  },
};

export const hi: DeepPartial<Dictionary> = {
  nav: {
    home: "होम",
    about: "हमारे बारे में",
    products: "उत्पाद",
    clientele: "ग्राहक",
    projects: "परियोजनाएँ",
    careers: "करियर",
    blog: "ब्लॉग",
    contact: "संपर्क",
    faqs: "सवाल",
  },
  actions: {
    readMore: "और पढ़ें",
    viewMore: "और देखें",
    knowMore: "और जानें",
    download: "डाउनलोड",
    getQuote: "कोटेशन लें",
    submit: "भेजें",
    send: "भेजें",
    callUs: "कॉल करें",
    menu: "मेन्यू",
    close: "बंद करें",
  },
  form: {
    name: "पूरा नाम",
    email: "आपका ईमेल",
    phone: "आपका फोन नंबर",
    message: "आपका संदेश",
    company: "कंपनी का नाम",
    enquiryType: "पूछताछ का प्रकार",
    product: "कौन सा उत्पाद",
    required: "आवश्यक",
  },
  misc: {
    language: "भाषा",
    searchPlaceholder: "खोजें",
    backToTop: "ऊपर जाएँ",
    openMenu: "मेनू खोलें",
    closeMenu: "मेनू बंद करें",
  },
  chat: {
    closeChat: "चैट बंद करें",
    showMenu: "मेनू दिखाएँ",
    cancelEnquiry: "यह पूछताछ रद्द करें",
  },
};
