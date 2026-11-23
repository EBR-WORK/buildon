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
  /**
   * The enquiry form, in full.
   *
   * It lives in a client component, so the build-time translation pass cannot
   * reach it: that pass rewrites the HTML of each locale, and a form's labels
   * are also in the shared JavaScript bundle — one copy for all three
   * languages. React put the English back a heartbeat after a Marathi page
   * loaded. These are the words themselves, chosen per locale at render.
   *
   * Product NAMES are deliberately not here. "Gypsum Plaster One Coat" is what
   * the bag says and what a dealer asks for; translating it would describe a
   * product nobody sells.
   */
  enquiry: {
    labels: {
      name: "Name",
      phone: "Phone Number",
      email: "Email",
      company: "Company Name (if applicable)",
      enquiryType: "Enquiry Type",
      product: "Which Product",
      branch: "Your Branch",
      quantity: "How Many Tons Do You Need",
      message: "Type Your Enquiry",
    },
    placeholders: {
      name: "Your full name",
      phone: "9876543210",
      email: "you@company.com",
      company: "Company name",
      enquiryType: "Select…",
      product: "Select a product…",
      branch: "Select a branch…",
      quantity: "30",
      message: "Message",
    },
    /* Who is asking. Translated, unlike the product names: a homeowner and a
       contractor are roles, not things on a price list. */
    types: [
      "Architect",
      "Contractor",
      "Dealer / Distributor",
      "Builder / Developer",
      "Interior Designer",
      "Homeowner",
      "Consultant",
      "Other",
    ],
    /* {branch} and {tons} are filled in at render. One sentence rather than
       pieces joined in code, because word order is exactly what differs
       between the three languages here. */
    minimumOrder: "Minimum order in {branch}: {tons} tons",
    submit: "Submit",
    sending: "Sending…",
    errors: {
      name: "Please enter your name.",
      nameLong: "That is too long for a name.",
      email: "Please enter a valid email address.",
      emailLong: "That address is too long.",
      phone: "Please enter a reachable phone number.",
      phoneLong: "That is too long for a phone number.",
      message: "Tell us a little about your requirement.",
      messageLong: "That is longer than we can accept — please shorten it a little.",
    },
    sentTitle: "Thank you — we have your enquiry.",
    sentBody: "Someone from the team will be in touch.",
    sentAgain: "Send another",
    failed:
      "We could not send that just now. An email is opening with your message — send it, or call us.",
  },
  /* The catalogue gate.
   *
   * Here, and not in the component, for the same reason the enquiry form's
   * labels are: the dialog is closed when the page is built, so the HTML
   * translation pass never sees these words and a Marathi page would read
   * them in English. */
  catalogue: {
    intro: "Tell us who you are and the download will begin.",
    ready: "Your download has started.",
    manual: "Not started? Download it here.",
  },
  chat: {
    closeChat: "Close chat",
    /* The panel's own words. The scripted ANSWERS — what a product is, which
       projects we supplied — stay in content.ts and stay English: they are
       long marketing copy, and a page of it hand-written three times is a page
       that goes out of step three times. The frame is what a visitor meets
       first, and the frame is here. */
    subtitle: "Virtual Customer Care",
    launcher: "Chat with us",
    greeting: "Hi. How can I help you today?",
    menuPrompt: "Would you like to see",
    menuAgain: "Anything else?",
    placeholder: "Type your message …",
    fallback:
      "I did not quite catch that. Pick one of the options below, or choose “Leave an enquiry” and a person will reply.",
    options: {
      products: "Our Products",
      projects: "Projects We Have Supplied",
      enquiry: "Leave an Enquiry",
      contact: "Call or Email Us",
    },
    ask: {
      name: "Happy to help. What is your name?",
      phone: "Thanks, {name}. What number can we reach you on?",
      email: "And an email address, so we can send the quotation in writing?",
      product: "Which product is this about? Pick one, or tell me what the job is and I will pass it on.",
      quantity: "Roughly how many tons do you need? A number is fine.",
      place: "Where is the site? The city is enough.",
      timeline: "And when do you need it?",
    },
    invalid: {
      name: "Please type your name.",
      phone: "That does not look like a reachable number — please include the full number.",
      email: "That does not look like an email address.",
      product: "Pick one above, or describe the job in a few words.",
      quantity: "Just the number of tons — or press Skip.",
      place: "Which city is the site in?",
    },
    notSure: "Not sure yet",
    timeline: ["Immediately", "This month", "In 1 – 3 months", "Just comparing for now"],
    skip: "Skip",
    sending: "Thank you — sending that across now …",
    done: "That is with our team, {name}. Someone will call you on {phone}, usually within one working day.",
    failed:
      "I could not send that from here. I have opened an email with everything you told me — send it and we will pick it up.",
    cancelled: "No problem — I have dropped that. What else can I help with?",
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
  enquiry: {
    labels: {
      name: "नाव",
      phone: "फोन नंबर",
      email: "ईमेल",
      company: "कंपनीचे नाव (असल्यास)",
      enquiryType: "चौकशीचा प्रकार",
      product: "कोणते उत्पादन",
      branch: "तुमची शाखा",
      quantity: "किती टन हवे आहेत",
      message: "तुमची चौकशी लिहा",
    },
    placeholders: {
      name: "तुमचे पूर्ण नाव",
      phone: "9876543210",
      email: "you@company.com",
      company: "कंपनीचे नाव",
      enquiryType: "निवडा…",
      product: "उत्पादन निवडा…",
      branch: "शाखा निवडा…",
      quantity: "30",
      message: "संदेश",
    },
    types: [
      "आर्किटेक्ट",
      "कॉन्ट्रॅक्टर",
      "डीलर / वितरक",
      "बिल्डर / डेव्हलपर",
      "इंटिरियर डिझायनर",
      "घरमालक",
      "सल्लागार",
      "इतर",
    ],
    minimumOrder: "{branch} मध्ये किमान ऑर्डर: {tons} टन",
    submit: "पाठवा",
    sending: "पाठवत आहे…",
    errors: {
      name: "कृपया तुमचे नाव लिहा.",
      nameLong: "हे नाव खूप लांब आहे.",
      email: "कृपया योग्य ईमेल पत्ता लिहा.",
      emailLong: "हा पत्ता खूप लांब आहे.",
      phone: "कृपया संपर्क होईल असा फोन नंबर लिहा.",
      phoneLong: "हा फोन नंबर खूप लांब आहे.",
      message: "तुम्हाला काय हवे आहे ते थोडक्यात सांगा.",
      messageLong: "हा संदेश आम्ही घेऊ शकतो त्यापेक्षा मोठा आहे — थोडा लहान करा.",
    },
    sentTitle: "धन्यवाद — तुमची चौकशी आम्हाला मिळाली.",
    sentBody: "आमच्या टीममधून कोणीतरी तुमच्याशी संपर्क करेल.",
    sentAgain: "आणखी एक पाठवा",
    failed:
      "हे आत्ता पाठवता आले नाही. तुमच्या संदेशासह ईमेल उघडत आहे — तो पाठवा, किंवा आम्हाला फोन करा.",
  },
  catalogue: {
    intro: "तुम्ही कोण आहात ते सांगा, डाउनलोड सुरू होईल.",
    ready: "तुमचे डाउनलोड सुरू झाले आहे.",
    manual: "सुरू झाले नाही? इथून डाउनलोड करा.",
  },
  chat: {
    closeChat: "चॅट बंद करा",
    subtitle: "व्हर्च्युअल ग्राहक सेवा",
    launcher: "आमच्याशी चॅट करा",
    greeting: "नमस्कार. मी तुम्हाला कशी मदत करू?",
    menuPrompt: "तुम्हाला काय पाहायचे आहे",
    menuAgain: "आणखी काही?",
    placeholder: "तुमचा संदेश लिहा …",
    fallback:
      "मला ते नीट समजले नाही. खालील पर्यायांपैकी एक निवडा, किंवा “चौकशी नोंदवा” निवडा — आमच्यातील कोणीतरी उत्तर देईल.",
    options: {
      products: "आमची उत्पादने",
      projects: "आम्ही पुरवठा केलेले प्रकल्प",
      enquiry: "चौकशी नोंदवा",
      contact: "फोन किंवा ईमेल करा",
    },
    ask: {
      name: "नक्कीच मदत करतो. तुमचे नाव काय?",
      phone: "धन्यवाद, {name}. कोणत्या नंबरवर संपर्क करू?",
      email: "आणि ईमेल पत्ता, जेणेकरून कोटेशन लेखी पाठवता येईल?",
      product: "हे कोणत्या उत्पादनाबद्दल आहे? एक निवडा, किंवा काम काय आहे ते सांगा — मी पुढे कळवतो.",
      quantity: "साधारण किती टन लागतील? फक्त आकडा चालेल.",
      place: "साइट कुठे आहे? शहराचे नाव पुरे.",
      timeline: "आणि तुम्हाला कधी लागेल?",
    },
    invalid: {
      name: "कृपया तुमचे नाव लिहा.",
      phone: "हा संपर्क होईल असा नंबर वाटत नाही — कृपया पूर्ण नंबर लिहा.",
      email: "हा ईमेल पत्ता वाटत नाही.",
      product: "वरील पैकी एक निवडा, किंवा काम दोन शब्दांत सांगा.",
      quantity: "फक्त टनचा आकडा — किंवा वगळा दाबा.",
      place: "साइट कोणत्या शहरात आहे?",
    },
    notSure: "अजून ठरले नाही",
    timeline: ["लगेच", "या महिन्यात", "१ – ३ महिन्यांत", "सध्या फक्त तुलना करतोय"],
    skip: "वगळा",
    sending: "धन्यवाद — आत्ता पाठवत आहे …",
    done: "ते आमच्या टीमकडे पोहोचले, {name}. कोणीतरी तुम्हाला {phone} वर फोन करेल, साधारण एका कामकाजाच्या दिवसात.",
    failed:
      "हे इथून पाठवता आले नाही. तुम्ही सांगितलेले सगळे घेऊन ईमेल उघडला आहे — तो पाठवा, आम्ही पुढे पाहू.",
    cancelled: "हरकत नाही — ते रद्द केले. आणखी कशात मदत करू?",
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
  enquiry: {
    labels: {
      name: "नाम",
      phone: "फोन नंबर",
      email: "ईमेल",
      company: "कंपनी का नाम (यदि हो)",
      enquiryType: "पूछताछ का प्रकार",
      product: "कौन सा उत्पाद",
      branch: "आपकी शाखा",
      quantity: "कितने टन चाहिए",
      message: "अपनी पूछताछ लिखें",
    },
    placeholders: {
      name: "आपका पूरा नाम",
      phone: "9876543210",
      email: "you@company.com",
      company: "कंपनी का नाम",
      enquiryType: "चुनें…",
      product: "उत्पाद चुनें…",
      branch: "शाखा चुनें…",
      quantity: "30",
      message: "संदेश",
    },
    types: [
      "आर्किटेक्ट",
      "ठेकेदार",
      "डीलर / वितरक",
      "बिल्डर / डेवलपर",
      "इंटीरियर डिज़ाइनर",
      "गृहस्वामी",
      "सलाहकार",
      "अन्य",
    ],
    minimumOrder: "{branch} में न्यूनतम ऑर्डर: {tons} टन",
    submit: "भेजें",
    sending: "भेजा जा रहा है…",
    errors: {
      name: "कृपया अपना नाम लिखें.",
      nameLong: "यह नाम बहुत लंबा है.",
      email: "कृपया सही ईमेल पता लिखें.",
      emailLong: "यह पता बहुत लंबा है.",
      phone: "कृपया ऐसा फोन नंबर लिखें जिस पर संपर्क हो सके.",
      phoneLong: "यह फोन नंबर बहुत लंबा है.",
      message: "आपको क्या चाहिए, थोड़ा बताइए.",
      messageLong: "यह संदेश हमारी सीमा से बड़ा है — इसे थोड़ा छोटा करें.",
    },
    sentTitle: "धन्यवाद — आपकी पूछताछ हमें मिल गई.",
    sentBody: "हमारी टीम से कोई आपसे संपर्क करेगा.",
    sentAgain: "एक और भेजें",
    failed:
      "यह अभी भेजा नहीं जा सका. आपके संदेश के साथ ईमेल खुल रहा है — उसे भेजें, या हमें कॉल करें.",
  },
  catalogue: {
    intro: "बताइए आप कौन हैं, डाउनलोड शुरू हो जाएगा.",
    ready: "आपका डाउनलोड शुरू हो गया है.",
    manual: "शुरू नहीं हुआ? यहाँ से डाउनलोड करें.",
  },
  chat: {
    closeChat: "चैट बंद करें",
    subtitle: "वर्चुअल ग्राहक सेवा",
    launcher: "हमसे चैट करें",
    greeting: "नमस्ते. मैं आपकी क्या मदद करूँ?",
    menuPrompt: "आप क्या देखना चाहेंगे",
    menuAgain: "और कुछ?",
    placeholder: "अपना संदेश लिखें …",
    fallback:
      "मैं ठीक से समझ नहीं पाया. नीचे दिए विकल्पों में से एक चुनें, या “पूछताछ दर्ज करें” चुनें — हमारी टीम से कोई जवाब देगा.",
    options: {
      products: "हमारे उत्पाद",
      projects: "हमने जिन परियोजनाओं में सप्लाई की",
      enquiry: "पूछताछ दर्ज करें",
      contact: "कॉल या ईमेल करें",
    },
    ask: {
      name: "ज़रूर मदद करूँगा. आपका नाम क्या है?",
      phone: "धन्यवाद, {name}. किस नंबर पर संपर्क करें?",
      email: "और एक ईमेल पता, ताकि कोटेशन लिखित में भेज सकें?",
      product: "यह किस उत्पाद के बारे में है? एक चुनें, या काम क्या है बताइए — मैं आगे पहुँचा दूँगा.",
      quantity: "लगभग कितने टन चाहिए? सिर्फ संख्या काफी है.",
      place: "साइट कहाँ है? शहर का नाम काफी है.",
      timeline: "और आपको कब चाहिए?",
    },
    invalid: {
      name: "कृपया अपना नाम लिखें.",
      phone: "यह ऐसा नंबर नहीं लगता जिस पर संपर्क हो सके — कृपया पूरा नंबर लिखें.",
      email: "यह ईमेल पता नहीं लगता.",
      product: "ऊपर से एक चुनें, या काम को दो शब्दों में बताएँ.",
      quantity: "सिर्फ टन की संख्या — या छोड़ें दबाएँ.",
      place: "साइट किस शहर में है?",
    },
    notSure: "अभी तय नहीं",
    timeline: ["तुरंत", "इसी महीने", "१ – ३ महीनों में", "अभी सिर्फ तुलना कर रहे हैं"],
    skip: "छोड़ें",
    sending: "धन्यवाद — अभी भेज रहा हूँ …",
    done: "यह हमारी टीम तक पहुँच गया, {name}. कोई आपको {phone} पर कॉल करेगा, आमतौर पर एक कार्यदिवस में.",
    failed:
      "यह यहाँ से भेजा नहीं जा सका. आपने जो बताया वह सब लेकर ईमेल खुल गया है — उसे भेजें, हम आगे देख लेंगे.",
    cancelled: "कोई बात नहीं — वह रद्द कर दिया. और किसमें मदद करूँ?",
    showMenu: "मेनू दिखाएँ",
    cancelEnquiry: "यह पूछताछ रद्द करें",
  },
};

/**
 * Telugu.
 *
 * Generated from the English above by the same translator that does the pages,
 * so the words a visitor meets in the chrome and the words in the copy were
 * chosen by the same thing. Edit by hand where the trade says it differently —
 * a hand edit here is permanent, unlike a page string, because nothing
 * regenerates this file.
 */
export const te: DeepPartial<Dictionary> = {
  nav: {
    home: "హోమ్",
    about: "మా గురించి",
    products: "ఉత్పత్తులు",
    clientele: "క్లయింట్లు",
    projects: "ప్రాజెక్టులు",
    careers: "కెరీర్లు",
    blog: "బ్లాగ్",
    contact: "మమ్మల్ని సంప్రదించండి",
    faqs: "తరచుగా అడిగే ప్రశ్నలు",
  },
  actions: {
    readMore: "మరింత చదవండి",
    viewMore: "మరిన్ని చూడండి",
    knowMore: "మరింత తెలుసుకోండి",
    download: "డౌన్‌లోడ్ చేయండి",
    getQuote: "కోట్ పొందండి",
    submit: "సమర్పించు",
    send: "పంపు",
    callUs: "మాకు కాల్ చేయండి",
    menu: "మెనూ",
    close: "మూసివేయి",
  },
  form: {
    name: "పూర్తి పేరు",
    email: "మీ మెయిల్ ఐడి",
    phone: "మీ ఫోన్ నంబర్",
    message: "మీ సందేశం",
    company: "కంపెనీ పేరు",
    enquiryType: "విచారణ రకం",
    product: "ఏ ఉత్పత్తి",
    required: "అవసరం",
  },
  misc: {
    language: "భాష",
    searchPlaceholder: "శోధించు",
    backToTop: "పైకి తిరిగి",
    openMenu: "మెనూ తెరవండి",
    closeMenu: "మెనూ మూసివేయండి",
  },
  enquiry: {
    labels: {
      name: "పేరు",
      phone: "ఫోన్ నంబర్",
      email: "ఇమెయిల్",
      company: "కంపెనీ పేరు (వర్తిస్తే)",
      enquiryType: "విచారణ రకం",
      product: "ఏ ఉత్పత్తి",
      branch: "మీ బ్రాంచ్",
      quantity: "మీకు ఎన్ని టన్నులు కావాలి",
      message: "మీ విచారణను టైప్ చేయండి",
    },
    placeholders: {
      name: "మీ పూర్తి పేరు",
      phone: "9876543210",
      email: "you@company.com",
      company: "కంపెనీ పేరు",
      enquiryType: "ఎంచుకోండి…",
      product: "ఒక ఉత్పత్తిని ఎంచుకోండి…",
      branch: "ఒక బ్రాంచ్‌ను ఎంచుకోండి…",
      quantity: "30",
      message: "సందేశం",
    },
    types: [
      "ఆర్కిటెక్ట్",
      "కాంట్రాక్టర్",
      "డీలర్ / డిస్ట్రిబ్యూటర్",
      "బిల్డర్ / డెవలపర్",
      "ఇంటీరియర్ డిజైనర్",
      "ఇంటి యజమాని",
      "కన్సల్టెంట్",
      "ఇతర",
    ],
    minimumOrder: "{branch}లో కనీస ఆర్డర్: {tons} టన్నులు",
    submit: "సమర్పించు",
    sending: "పంపుతోంది…",
    errors: {
      name: "దయచేసి మీ పేరును నమోదు చేయండి.",
      nameLong: "ఆ పేరుకు అది చాలా పొడవుగా ఉంది.",
      email: "దయచేసి చెల్లుబాటు అయ్యే ఇమెయిల్ చిరునామాను నమోదు చేయండి.",
      emailLong: "ఆ చిరునామా చాలా పొడవుగా ఉంది.",
      phone: "దయచేసి చేరుకోగల ఫోన్ నంబర్‌ను నమోదు చేయండి.",
      phoneLong: "ఆ ఫోన్ నంబర్‌కు అది చాలా పొడవుగా ఉంది.",
      message: "మీ అవసరం గురించి కొద్దిగా చెప్పండి.",
      messageLong: "అది మేము అంగీకరించే దానికంటే పొడవుగా ఉంది — దయచేసి దానిని కొద్దిగా తగ్గించండి.",
    },
    sentTitle: "ధన్యవాదాలు — మీ విచారణ మాకు అందింది.",
    sentBody: "బృందం నుండి ఒకరు సంప్రదిస్తారు.",
    sentAgain: "మరొకటి పంపండి",
    failed: "మేము ఇప్పుడే పంపలేకపోయాము. మీ సందేశంతో ఒక ఇమెయిల్ తెరవబడుతోంది — దానిని పంపండి లేదా మాకు కాల్ చేయండి.",
  },
  catalogue: {
    intro: "మీరు ఎవరో మాకు చెప్పండి మరియు డౌన్‌లోడ్ ప్రారంభమవుతుంది.",
    ready: "మీ డౌన్‌లోడ్ ప్రారంభమైంది.",
    manual: "ప్రారంభం కాలేదా? ఇక్కడ డౌన్‌లోడ్ చేయండి.",
  },
  chat: {
    closeChat: "చాట్ మూసివేయి",
    subtitle: "వర్చువల్ కస్టమర్ కేర్",
    launcher: "మాతో చాట్ చేయండి",
    greeting: "హాయ్. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?",
    menuPrompt: "మీరు చూడాలనుకుంటున్నారా",
    menuAgain: "మరేదైనా ఉందా?",
    placeholder: "మీ సందేశాన్ని టైప్ చేయండి …",
    fallback: "నేను సరిగ్గా అర్థం చేసుకోలేకపోయాను. క్రింది ఎంపికలలో ఒకదాన్ని ఎంచుకోండి, లేదా “విచారణను వదిలివేయండి” అని ఎంచుకోండి మరియు ఒక వ్యక్తి ప్రత్యుత్తరం ఇస్తారు.",
    options: {
      products: "మా ఉత్పత్తులు",
      projects: "మేము సరఫరా చేసిన ప్రాజెక్టులు",
      enquiry: "విచారణను వదిలివేయండి",
      contact: "కాల్ చేయండి లేదా ఇమెయిల్ చేయండి",
    },
    ask: {
      name: "సహాయం చేయడానికి సంతోషంగా ఉంది. మీ పేరు ఏమిటి?",
      phone: "ధన్యవాదాలు, {name}. మేము మిమ్మల్ని ఏ నంబర్‌లో సంప్రదించగలం?",
      email: "మరియు ఒక ఇమెయిల్ చిరునామా, తద్వారా మేము కోటేషన్‌ను వ్రాతపూర్వకంగా పంపగలము?",
      product: "ఇది ఏ ఉత్పత్తి గురించి? ఒకదాన్ని ఎంచుకోండి, లేదా పని ఏమిటో నాకు చెప్పండి మరియు నేను దానిని పంపిస్తాను.",
      quantity: "సుమారుగా మీకు ఎన్ని టన్నులు కావాలి? ఒక సంఖ్య సరిపోతుంది.",
      place: "సైట్ ఎక్కడ ఉంది? నగరం సరిపోతుంది.",
      timeline: "మరియు మీకు ఎప్పుడు కావాలి?",
    },
    invalid: {
      name: "దయచేసి మీ పేరును టైప్ చేయండి.",
      phone: "అది చేరుకోగల నంబర్ లాగా లేదు — దయచేసి పూర్తి నంబర్‌ను చేర్చండి.",
      email: "అది ఇమెయిల్ చిరునామా లాగా లేదు.",
      product: "పైన ఒకదాన్ని ఎంచుకోండి, లేదా పనిని కొన్ని పదాలలో వివరించండి.",
      quantity: "టన్నుల సంఖ్య మాత్రమే — లేదా స్కిప్ నొక్కండి.",
      place: "సైట్ ఏ నగరంలో ఉంది?",
    },
    notSure: "ఇంకా ఖచ్చితంగా తెలియదు",
    timeline: [
      "వెంటనే",
      "ఈ నెల",
      "1 – 3 నెలల్లో",
      "ప్రస్తుతానికి పోల్చి చూస్తున్నాను",
    ],
    skip: "దాటవేయి",
    sending: "ధన్యవాదాలు — ఇప్పుడు పంపుతోంది …",
    done: "అది మా బృందంతో ఉంది, {name}. ఒకరు మీకు {phone}లో కాల్ చేస్తారు, సాధారణంగా ఒక పని దినంలో.",
    failed: "నేను ఇక్కడ నుండి పంపలేకపోయాను. మీరు నాకు చెప్పిన ప్రతిదానితో ఒక ఇమెయిల్‌ను తెరిచాను — దానిని పంపండి మరియు మేము దానిని తీసుకుంటాము.",
    cancelled: "సమస్య లేదు — నేను దానిని వదిలివేశాను. నేను ఇంకేమి సహాయం చేయగలను?",
    showMenu: "మెనూ చూపించు",
    cancelEnquiry: "ఈ విచారణను రద్దు చేయండి",
  },
};

/**
 * Kannada.
 *
 * Generated from the English above by the same translator that does the pages,
 * so the words a visitor meets in the chrome and the words in the copy were
 * chosen by the same thing. Edit by hand where the trade says it differently —
 * a hand edit here is permanent, unlike a page string, because nothing
 * regenerates this file.
 */
export const kn: DeepPartial<Dictionary> = {
  nav: {
    home: "ಮುಖಪುಟ",
    about: "ನಮ್ಮ ಬಗ್ಗೆ",
    products: "ಉತ್ಪನ್ನಗಳು",
    clientele: "ಗ್ರಾಹಕರು",
    projects: "ಯೋಜನೆಗಳು",
    careers: "ವೃತ್ತಿಜೀವನ",
    blog: "ಬ್ಲಾಗ್",
    contact: "ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ",
    faqs: "FAQ ಗಳು",
  },
  actions: {
    readMore: "ಇನ್ನಷ್ಟು ಓದಿ",
    viewMore: "ಇನ್ನಷ್ಟು ವೀಕ್ಷಿಸಿ",
    knowMore: "ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ",
    download: "ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    getQuote: "ಉದ್ಧರಣ ಪಡೆಯಿರಿ",
    submit: "ಸಲ್ಲಿಸಿ",
    send: "ಕಳುಹಿಸಿ",
    callUs: "ನಮಗೆ ಕರೆ ಮಾಡಿ",
    menu: "ಮೆನು",
    close: "ಮುಚ್ಚಿ",
  },
  form: {
    name: "ಪೂರ್ಣ ಹೆಸರು",
    email: "ನಿಮ್ಮ ಇಮೇಲ್ ಐಡಿ",
    phone: "ನಿಮ್ಮ ದೂರವಾಣಿ ಸಂಖ್ಯೆ",
    message: "ನಿಮ್ಮ ಸಂದೇಶ",
    company: "ಕಂಪನಿ ಹೆಸರು",
    enquiryType: "ವಿಚಾರಣೆಯ ಪ್ರಕಾರ",
    product: "ಯಾವ ಉತ್ಪನ್ನ",
    required: "ಅಗತ್ಯವಿದೆ",
  },
  misc: {
    language: "ಭಾಷೆ",
    searchPlaceholder: "ಹುಡುಕಿ",
    backToTop: "ಮೇಲಕ್ಕೆ ಹಿಂತಿರುಗಿ",
    openMenu: "ಮೆನು ತೆರೆಯಿರಿ",
    closeMenu: "ಮೆನು ಮುಚ್ಚಿ",
  },
  enquiry: {
    labels: {
      name: "ಹೆಸರು",
      phone: "ದೂರವಾಣಿ ಸಂಖ್ಯೆ",
      email: "ಇಮೇಲ್",
      company: "ಕಂಪನಿ ಹೆಸರು (ಅನ್ವಯಿಸಿದರೆ)",
      enquiryType: "ವಿಚಾರಣೆಯ ಪ್ರಕಾರ",
      product: "ಯಾವ ಉತ್ಪನ್ನ",
      branch: "ನಿಮ್ಮ ಶಾಖೆ",
      quantity: "ನಿಮಗೆ ಎಷ್ಟು ಟನ್ ಬೇಕು",
      message: "ನಿಮ್ಮ ವಿಚಾರಣೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ",
    },
    placeholders: {
      name: "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು",
      phone: "9876543210",
      email: "you@company.com",
      company: "ಕಂಪನಿ ಹೆಸರು",
      enquiryType: "ಆಯ್ಕೆಮಾಡಿ…",
      product: "ಉತ್ಪನ್ನವನ್ನು ಆಯ್ಕೆಮಾಡಿ…",
      branch: "ಶಾಖೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ…",
      quantity: "30",
      message: "ಸಂದೇಶ",
    },
    types: [
      "ವಾಸ್ತುಶಿಲ್ಪಿ",
      "ಗುತ್ತಿಗೆದಾರ",
      "ಡೀಲರ್ / ವಿತರಕರು",
      "ಬಿಲ್ಡರ್ / ಡೆವಲಪರ್",
      "ಒಳಾಂಗಣ ವಿನ್ಯಾಸಕರು",
      "ಮನೆ ಮಾಲೀಕರು",
      "ಸಲಹೆಗಾರರು",
      "ಇತರೆ",
    ],
    minimumOrder: "{branch} ನಲ್ಲಿ ಕನಿಷ್ಠ ಆರ್ಡರ್: {tons} ಟನ್",
    submit: "ಸಲ್ಲಿಸಿ",
    sending: "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…",
    errors: {
      name: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.",
      nameLong: "ಆ ಹೆಸರು ತುಂಬಾ ಉದ್ದವಾಗಿದೆ.",
      email: "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.",
      emailLong: "ಆ ವಿಳಾಸ ತುಂಬಾ ಉದ್ದವಾಗಿದೆ.",
      phone: "ದಯವಿಟ್ಟು ತಲುಪಬಹುದಾದ ದೂರವಾಣಿ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.",
      phoneLong: "ಆ ದೂರವಾಣಿ ಸಂಖ್ಯೆ ತುಂಬಾ ಉದ್ದವಾಗಿದೆ.",
      message: "ನಿಮ್ಮ ಅಗತ್ಯದ ಬಗ್ಗೆ ಸ್ವಲ್ಪ ನಮಗೆ ತಿಳಿಸಿ.",
      messageLong: "ಅದು ನಾವು ಸ್ವೀಕರಿಸುವುದಕ್ಕಿಂತ ಉದ್ದವಾಗಿದೆ — ದಯವಿಟ್ಟು ಅದನ್ನು ಸ್ವಲ್ಪ ಕಡಿಮೆ ಮಾಡಿ.",
    },
    sentTitle: "ಧನ್ಯವಾದಗಳು — ನಿಮ್ಮ ವಿಚಾರಣೆ ನಮಗೆ ಸಿಕ್ಕಿದೆ.",
    sentBody: "ತಂಡದಿಂದ ಯಾರಾದರೂ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತಾರೆ.",
    sentAgain: "ಮತ್ತೊಂದು ಕಳುಹಿಸಿ",
    failed: "ನಾವು ಅದನ್ನು ಈಗ ಕಳುಹಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ನಿಮ್ಮ ಸಂದೇಶದೊಂದಿಗೆ ಇಮೇಲ್ ತೆರೆಯುತ್ತಿದೆ — ಅದನ್ನು ಕಳುಹಿಸಿ, ಅಥವಾ ನಮಗೆ ಕರೆ ಮಾಡಿ.",
  },
  catalogue: {
    intro: "ನೀವು ಯಾರೆಂದು ನಮಗೆ ತಿಳಿಸಿ ಮತ್ತು ಡೌನ್‌ಲೋಡ್ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ.",
    ready: "ನಿಮ್ಮ ಡೌನ್‌ಲೋಡ್ ಪ್ರಾರಂಭವಾಗಿದೆ.",
    manual: "ಪ್ರಾರಂಭವಾಗಿಲ್ಲವೇ? ಇಲ್ಲಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.",
  },
  chat: {
    closeChat: "ಚಾಟ್ ಮುಚ್ಚಿ",
    subtitle: "ವರ್ಚುವಲ್ ಗ್ರಾಹಕ ಸೇವೆ",
    launcher: "ನಮ್ಮೊಂದಿಗೆ ಚಾಟ್ ಮಾಡಿ",
    greeting: "ಹಾಯ್. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    menuPrompt: "ನೀವು ನೋಡಲು ಬಯಸುವಿರಾ",
    menuAgain: "ಬೇರೇನಾದರೂ ಇದೆಯೇ?",
    placeholder: "ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ …",
    fallback: "ನನಗೆ ಅದು ಸರಿಯಾಗಿ ಅರ್ಥವಾಗಲಿಲ್ಲ. ಕೆಳಗಿನ ಆಯ್ಕೆಗಳಲ್ಲಿ ಒಂದನ್ನು ಆರಿಸಿ, ಅಥವಾ “ವಿಚಾರಣೆ ಬಿಡಿ” ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ಒಬ್ಬ ವ್ಯಕ್ತಿ ಪ್ರತ್ಯುತ್ತರಿಸುತ್ತಾರೆ.",
    options: {
      products: "ನಮ್ಮ ಉತ್ಪನ್ನಗಳು",
      projects: "ನಾವು ಸರಬರಾಜು ಮಾಡಿದ ಯೋಜನೆಗಳು",
      enquiry: "ವಿಚಾರಣೆ ಬಿಡಿ",
      contact: "ಕರೆ ಮಾಡಿ ಅಥವಾ ಇಮೇಲ್ ಮಾಡಿ",
    },
    ask: {
      name: "ಸಹಾಯ ಮಾಡಲು ಸಂತೋಷವಾಗಿದೆ. ನಿಮ್ಮ ಹೆಸರೇನು?",
      phone: "ಧನ್ಯವಾದಗಳು, {name}. ನಾವು ನಿಮ್ಮನ್ನು ಯಾವ ಸಂಖ್ಯೆಯಲ್ಲಿ ಸಂಪರ್ಕಿಸಬಹುದು?",
      email: "ಮತ್ತು ಇಮೇಲ್ ವಿಳಾಸ, ಇದರಿಂದ ನಾವು ಉದ್ಧರಣವನ್ನು ಲಿಖಿತವಾಗಿ ಕಳುಹಿಸಬಹುದು?",
      product: "ಇದು ಯಾವ ಉತ್ಪನ್ನದ ಬಗ್ಗೆ? ಒಂದನ್ನು ಆರಿಸಿ, ಅಥವಾ ಕೆಲಸ ಏನೆಂದು ನನಗೆ ತಿಳಿಸಿ ಮತ್ತು ನಾನು ಅದನ್ನು ರವಾನಿಸುತ್ತೇನೆ.",
      quantity: "ಅಂದಾಜು ಎಷ್ಟು ಟನ್ ನಿಮಗೆ ಬೇಕು? ಒಂದು ಸಂಖ್ಯೆ ಸಾಕು.",
      place: "ಸೈಟ್ ಎಲ್ಲಿದೆ? ನಗರ ಸಾಕು.",
      timeline: "ಮತ್ತು ನಿಮಗೆ ಅದು ಯಾವಾಗ ಬೇಕು?",
    },
    invalid: {
      name: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರನ್ನು ಟೈಪ್ ಮಾಡಿ.",
      phone: "ಅದು ತಲುಪಬಹುದಾದ ಸಂಖ್ಯೆಯಂತೆ ಕಾಣುತ್ತಿಲ್ಲ — ದಯವಿಟ್ಟು ಪೂರ್ಣ ಸಂಖ್ಯೆಯನ್ನು ಸೇರಿಸಿ.",
      email: "ಅದು ಇಮೇಲ್ ವಿಳಾಸದಂತೆ ಕಾಣುತ್ತಿಲ್ಲ.",
      product: "ಮೇಲಿನ ಒಂದನ್ನು ಆರಿಸಿ, ಅಥವಾ ಕೆಲಸವನ್ನು ಕೆಲವು ಪದಗಳಲ್ಲಿ ವಿವರಿಸಿ.",
      quantity: "ಕೇವಲ ಟನ್‌ಗಳ ಸಂಖ್ಯೆ — ಅಥವಾ ಸ್ಕಿಪ್ ಒತ್ತಿರಿ.",
      place: "ಸೈಟ್ ಯಾವ ನಗರದಲ್ಲಿದೆ?",
    },
    notSure: "ಇನ್ನೂ ಖಚಿತವಾಗಿಲ್ಲ",
    timeline: [
      "ತಕ್ಷಣ",
      "ಈ ತಿಂಗಳು",
      "1 – 3 ತಿಂಗಳಲ್ಲಿ",
      "ಸದ್ಯಕ್ಕೆ ಹೋಲಿಸುತ್ತಿದ್ದೇನೆ",
    ],
    skip: "ಸ್ಕಿಪ್",
    sending: "ಧನ್ಯವಾದಗಳು — ಅದನ್ನು ಈಗ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ …",
    done: "ಅದು ನಮ್ಮ ತಂಡದೊಂದಿಗೆ ಇದೆ, {name}. ಯಾರಾದರೂ ನಿಮಗೆ {phone} ಗೆ ಕರೆ ಮಾಡುತ್ತಾರೆ, ಸಾಮಾನ್ಯವಾಗಿ ಒಂದು ಕೆಲಸದ ದಿನದೊಳಗೆ.",
    failed: "ನಾನು ಅದನ್ನು ಇಲ್ಲಿಂದ ಕಳುಹಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ನೀವು ನನಗೆ ಹೇಳಿದ ಎಲ್ಲದರೊಂದಿಗೆ ನಾನು ಇಮೇಲ್ ಅನ್ನು ತೆರೆದಿದ್ದೇನೆ — ಅದನ್ನು ಕಳುಹಿಸಿ ಮತ್ತು ನಾವು ಅದನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತೇವೆ.",
    cancelled: "ಸಮಸ್ಯೆ ಇಲ್ಲ — ನಾನು ಅದನ್ನು ಕೈಬಿಟ್ಟಿದ್ದೇನೆ. ನಾನು ಬೇರೆ ಯಾವುದಕ್ಕೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    showMenu: "ಮೆನು ತೋರಿಸಿ",
    cancelEnquiry: "ಈ ವಿಚಾರಣೆಯನ್ನು ರದ್ದುಗೊಳಿಸಿ",
  },
};
