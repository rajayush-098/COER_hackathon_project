/**
 * Vyapaar AI - Centralized Multilingual Translation & Dynamic Localization Engine
 * Provides complete, safe translations across all 7 supported languages:
 * English (en), Hindi (hi), Hinglish (hinglish), Marathi (mr), Bengali (bn), Telugu (te), Tamil (ta).
 */

import translations from "../translations";

export type SupportedLang = "en" | "hi" | "hinglish" | "mr" | "bn" | "te" | "ta";

export const LANGUAGE_DISPLAY_NAMES: Record<string, { english: string; native: string }> = {
  en: { english: "English", native: "English" },
  hi: { english: "Hindi", native: "हिंदी" },
  hinglish: { english: "Hinglish", native: "Hinglish (बोलचाल)" },
  mr: { english: "Marathi", native: "मराठी" },
  bn: { english: "Bengali", native: "বাংলা" },
  te: { english: "Telugu", native: "తెలుగు" },
  ta: { english: "Tamil", native: "தமிழ்" },
};

/**
 * Safe translation lookup: fetches key from locale dictionary with graceful fallback
 */
export function getT(lang: string = "hi"): Record<string, string> {
  const code = (lang || "hi").toLowerCase();
  const dict = (translations as any)[code] || (translations as any).hi || (translations as any).en || {};
  return dict;
}

export function tKey(key: string, lang: string = "hi", fallback: string = ""): string {
  const dict = getT(lang);
  if (dict && dict[key]) {
    return dict[key];
  }
  const enDict = (translations as any).en || {};
  if (enDict && enDict[key]) {
    return enDict[key];
  }
  return fallback || key;
}

// ================= DYNAMIC TRANSLATION: FEASIBILITY VERDICTS =================
const VERDICT_TRANSLATIONS: Record<string, Record<string, string>> = {
  "Exceptional & Highly Feasible": {
    en: "Exceptional & Highly Feasible",
    hi: "अत्यंत लाभदायक व सुरक्षित",
    hinglish: "Bohot Jyada Labhdayak aur Safe",
    mr: "अत्यंत फायदेशीर व सुरक्षित",
    bn: "অত্যন্ত লাভজনক ও নিরাপদ",
    te: "అత్యుత్తమమైనది మరియు చాలా సురక్షితమైనది",
    ta: "மிகவும் லாபகரமானது மற்றும் பாதுகாப்பானது",
  },
  "Feasible & Safe": {
    en: "Feasible & Safe",
    hi: "शुरू करने योग्य व सुरक्षित",
    hinglish: "Shuru Karne Layak aur Safe",
    mr: "सुरू करण्यास योग्य व सुरक्षित",
    bn: "শুরু করার উপযোগী ও নির্ভরযোগ্য",
    te: "ప్రారంభించడానికి తగినది మరియు సురక్షితం",
    ta: "தொடங்குவதற்கு ஏற்றது மற்றும் பாதுகாப்பானது",
  },
  "Moderately Feasible / Needs Caution": {
    en: "Moderately Feasible / Needs Caution",
    hi: "मध्यम व्यवहार्यता / सावधानी आवश्यक",
    hinglish: "Theek-thaak / Savdhani Zaroori",
    mr: "मध्यम व्यवहार्यता / सावधगिरी आवश्यक",
    bn: "মাঝারি সম্ভাব্যতা / সতর্কতা প্রয়োজন",
    te: "మధ్యస్థ సాధ్యత / జాగ్రత్త అవసరం",
    ta: "மிதமான சாத்தியக்கூறு / எச்சரிக்கை தேவை",
  },
  "High Risk / Tight Margins": {
    en: "High Risk / Tight Margins",
    hi: "उच्च जोखिम / कम मुनाफा",
    hinglish: "Jyada Risk / Kam Bachat",
    mr: "जास्त जोखीम / कमी नफा",
    bn: "উচ্চ ঝুঁকি / কম লাভ",
    te: "అధిక రిస్క్ / తక్కువ లాభం",
    ta: "அதிக ஆபத்து / குறைந்த லாபம்",
  },
  "Unfeasible / Not Recommended": {
    en: "Unfeasible / Not Recommended",
    hi: "हानिकारक / अनुशंसित नहीं",
    hinglish: "Nuksan-dayak / Na Karein",
    mr: "तोट्याचा / शिफारस केलेली नाही",
    bn: "অলাভজনক / সুপারিশ করা হয় না",
    te: "అసాధ్యం / సిఫార్సు చేయబడలేదు",
    ta: "சாத்தியமற்றது / பரிந்துரைக்கப்படவில்லை",
  },
  "Not Eligible / Exceeds Scheme Limit": {
    en: "Not Eligible / Exceeds Scheme Limit",
    hi: "पात्र नहीं / योजना सीमा से अधिक",
    hinglish: "Eligible Nahi / Limit Se Bahar",
    mr: "अपात्र / योजना मर्यादेबाहेर",
    bn: "অনুপযুক্ত / প্রকল্প সীমার বাইরে",
    te: "అర్హత లేదు / పథకం పరిమితి మించింది",
    ta: "தகுதியற்றது / திட்ட வரம்பிற்கு அப்பாற்பட்டது",
  },
  "Invalid Financial Input": {
    en: "Invalid Financial Input",
    hi: "अमान्य वित्तीय आँकड़े",
    hinglish: "Amaniya Sankhya",
    mr: "अवैध आर्थिक आकडेवारी",
    bn: "অবৈধ আর্থিক তথ্য",
    te: "చెల్లని ఆర్థిక వివరాలు",
    ta: "தவறான நிதி உள்ளீடு",
  },
  "Requires Verification": {
    en: "Requires Verification",
    hi: "सत्यापन आवश्यक",
    hinglish: "Verification Zaroori",
    mr: "पडताळणी आवश्यक",
    bn: "যাচাইকরণ প্রয়োজন",
    te: "ధృవీకరణ అవసరం",
    ta: "சரிபார்ப்பு தேவை",
  },
};

export function translateVerdict(verdict: string = "", lang: string = "hi"): string {
  if (!verdict) return tKey("feasible", lang, "Feasible & Safe");
  const clean = verdict.trim();
  for (const [key, mapping] of Object.entries(VERDICT_TRANSLATIONS)) {
    if (clean.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(clean.toLowerCase())) {
      return mapping[lang] || mapping.en || clean;
    }
  }
  // Keyword-based fallback
  const vLower = clean.toLowerCase();
  if (vLower.includes("exceptional") || vLower.includes("highly")) return VERDICT_TRANSLATIONS["Exceptional & Highly Feasible"][lang] || clean;
  if (vLower.includes("safe") || vLower.includes("feasible")) return VERDICT_TRANSLATIONS["Feasible & Safe"][lang] || clean;
  if (vLower.includes("caution") || vLower.includes("moderate")) return VERDICT_TRANSLATIONS["Moderately Feasible / Needs Caution"][lang] || clean;
  if (vLower.includes("risk") || vLower.includes("tight")) return VERDICT_TRANSLATIONS["High Risk / Tight Margins"][lang] || clean;
  if (vLower.includes("unfeasible") || vLower.includes("not recommended")) return VERDICT_TRANSLATIONS["Unfeasible / Not Recommended"][lang] || clean;
  if (vLower.includes("limit") || vLower.includes("not eligible")) return VERDICT_TRANSLATIONS["Not Eligible / Exceeds Scheme Limit"][lang] || clean;
  return clean;
}

// ================= DYNAMIC TRANSLATION: FEASIBILITY DESCRIPTIONS =================
const VERDICT_DESC_TRANSLATIONS: Record<string, Record<string, string>> = {
  exceptional: {
    en: "Strong profit margins. The business generates more than double the required loan payment, making it highly secure.",
    hi: "मजबूत मुनाफा। व्यवसाय किश्त की तुलना में दोगुने से अधिक की बचत करता है, जिससे यह अत्यंत सुरक्षित है।",
    hinglish: "Strong munafa buffer. Business EMI se do guna se jyada bachat generate karta hai, bohot safe hai.",
    mr: "मजबूत नफा प्रमाण. व्यवसाय कर्जाच्या हप्त्यापेक्षा दुप्पट नफा मिळवून देतो, ज्यामुळे हा अत्यंत सुरक्षित आहे.",
    bn: "শক্তিশালী লাভের মার্জিন। ব্যবসাটি প্রয়োজনীয় ঋণের কিস্তির দ্বিগুণেরও বেশি উদ্বৃত্ত তৈরি করে, যা এটিকে অত্যন্ত নির্ভরযোগ্য করে তোলে।",
    te: "బలమైన లాభాల మార్జిన్. వ్యాపారం అవసరమైన రుణ వాయిదా కంటే రెట్టింపు నికర మిగులును సృష్టిస్తుంది, ఇది చాలా సురక్షितం.",
    ta: "வலுவான லாப விகிதம். தொழில் தேவையான கடன் தவணையை விட இரு மடங்குக்கும் அதிகமான சேமிப்பை உருவாக்குகிறது, இது மிகவும் பாதுகாப்பானது.",
  },
  feasible: {
    en: "Healthy profit buffer. You can comfortably cover the EMI and unexpected expenses while taking a personal income.",
    hi: "संतोषजनक मुनाफा। आप निजी आमदनी निकालने के साथ-साथ बैंक EMI और आकस्मिक खर्चों को आसानी से पूरा कर सकते हैं।",
    hinglish: "Acha munafa buffer. Aap ghar ke kharche ke sath bank EMI aur aakasmik kharch aaram se nikaal sakte hain.",
    mr: "समाधानकारक नफा भांडवल. आपण स्वतःचे उत्पन्न काढूनही बँकेचा हप्ता आणि अनपेक्षित खर्च सहज भरू शकता.",
    bn: "সন্তোষজনক লাভের মার্জিন। আপনি ব্যক্তিগত উপার্জনের পাশাপাশি ব্যাংকের কিস্তি এবং অপ্রত্যাশিত খরচ স্বাচ্ছন্দ্যে মেটাতে পারবেন।",
    te: "సంతృప్తికరమైన లాభాల మిగులు. మీరు వ్యక్తిగత ఖర్చులు తీసుకుంటూనే బ్యాంకు వాయిదా మరియు అనుకోని ఖర్చులను సులభంగా నిర్వహించవచ్చు.",
    ta: "திருப்திகரமான லாப இருப்பு. உங்கள் தனிப்பட்ட வருமானத்தை எடுத்துக்கொண்டே வங்கி தவணை மற்றும் எதிர்பாராத செலவுகளை எளிதாக சமாளிக்கலாம்.",
  },
  caution: {
    en: "Profitable but lean. You can make loan payments, but must strictly control daily expenses to avoid cash flow issues.",
    hi: "लाभदायक लेकिन सीमित गुंजाइश। आप किश्त चुका सकते हैं, लेकिन नकदी की कमी से बचने के लिए दैनिक खर्चों पर कड़ा नियंत्रण जरूरी है।",
    hinglish: "Munafadaar lekin tight margin. EMI de sakte hain, par rojana kharche par pakki nigrani rakhni hogi.",
    mr: "फायदेशीर पण मर्यादित नफा. आपण हप्ता फेडू शकता, पण रोख पैशांची टंचाई टाळण्यासाठी दैनंदिन खर्चावर नियंत्रण ठेवावे लागेल.",
    bn: "লাভজনক কিন্তু সীমিত ব্যবধান। আপনি ঋণের কিস্তি পরিশোধ করতে পারেন, তবে নগদ ঘাটতি এড়াতে দৈনন্দিন খরচে কঠোর নিয়ন্ত্রণ রাখতে হবে।",
    te: "లాభదాయకమే కానీ పరిమిత మార్జిన్. మీరు వాయిదా చెల్లించగలరు, అయితే నగదు కొరత రాకుండా రోజువారీ ఖర్చులపై కఠిన నియంత్రణ అవసరం.",
    ta: "லாபகரமானது ஆனால் குறைந்த இருப்பு. நீங்கள் தவணை செலுத்தலாம், ஆனால் பணத்தட்டுப்பாட்டை தவிர்க்க தினசரி செலவுகளை கவனமாக கட்டுப்படுத்த வேண்டும்.",
  },
  tight: {
    en: "Barely breaking even. Almost all profit goes to the bank. High risk of loan default if sales drop even slightly.",
    hi: "सीमांत बचत। अधिकांश मुनाफा बैंक किश्त में चला जाता है। बिक्री में मामूली गिरावट आने पर भी किश्त में चूक का खतरा है।",
    hinglish: "Kharche ke barabar bikri. Lagbhag saara munafa bank EMI me chala jata hai. Bikri ghati to risk badh jayega.",
    mr: "काठावरचा नफा. बहुतांश नफा बँकेच्या हप्त्यात जातो. विक्री किंचितही कमी झाल्यास हप्ता थकण्याचा मोठा धोका संभवतो.",
    bn: "খরচ ওঠার কাছাকাছি। প্রায় পুরো লাভই ব্যাংকের কিস্তিতে চলে যায়। বিক্রি সামান্য কমলেও ঋণ পরিশোধে টানাপোড়েনের ঝুঁকি রয়েছে।",
    te: "అతి తక్కువ మిగులు. దాదాపు మొత్తం లాభం బ్యాంకు వాయిదాకే పోతుంది. అమ్మకాలు కొద్దిగా తగ్గినా వాయిదా చెల్లింపు కష్టమవుతుంది.",
    ta: "விளிம்புநிலை சேமிப்பு. பெரும்பாலான லாபம் வங்கி தவணைக்கே சென்றுவிடுகிறது. விற்பனை சற்று குறைந்தாலும் தவணை தவற வாய்ப்புள்ளது.",
  },
  unfeasible: {
    en: "Mathematical loss. The projected profit cannot cover the monthly loan payment. Reassess your costs or loan amount.",
    hi: "घाटे का अनुमान। अनुमानित मुनाफा मासिक लोन किश्त चुकाने में असमर्थ है। अपनी लागत या लोन राशि का पुनर्मूल्यांकन करें।",
    hinglish: "Ghate ka hisab. Munafa mahine ki EMI chukane me asamarth hai. Apni lagat ya loan amount dobara check karein.",
    mr: "नुकसानीचा अंदाज. अंदाजित नफ्यातून मासिक हप्ता भरणे अशक्य आहे. आपला खर्च किंवा कर्जाची रक्कम पुनर्विचार करा.",
    bn: "ক্ষতির পূর্বাভাস। আনুমানিক লাভ মাসিক ঋণের কিস্তি মেটাতে অক্ষম। আপনার খরচ বা ঋণের পরিমাণ পুনর্বিবেচনা করুন।",
    te: "నష్టాల అంచనా. అంచనా వేసిన లాభం నెలవారీ రుణ వాయిదాను తీర్చలేదు. మీ ఖర్చులు లేదా రుణ మొత్తాన్ని తిరిగి పరిశీలించండి.",
    ta: "நஷ்டக் கணக்கு. மதிப்பிடப்பட்ட லாபம் மாதாந்திர கடன் தவணையை ஈடுகட்ட இயலாது. உங்கள் செலவுகள் அல்லது கடன் தொகையை மறுபரிசீலனை செய்யவும்.",
  },
};

export function translateVerdictDescription(desc: string = "", lang: string = "hi"): string {
  if (!desc) return tKey("verdictDescDefault", lang, desc);
  const dLower = desc.toLowerCase();
  if (dLower.includes("double") || dLower.includes("exceptional") || dLower.includes("more than double")) {
    return VERDICT_DESC_TRANSLATIONS.exceptional[lang] || desc;
  }
  if (dLower.includes("healthy profit buffer") || dLower.includes("comfortably cover")) {
    return VERDICT_DESC_TRANSLATIONS.feasible[lang] || desc;
  }
  if (dLower.includes("profitable but lean") || dLower.includes("strictly control")) {
    return VERDICT_DESC_TRANSLATIONS.caution[lang] || desc;
  }
  if (dLower.includes("barely breaking even") || dLower.includes("almost all profit")) {
    return VERDICT_DESC_TRANSLATIONS.tight[lang] || desc;
  }
  if (dLower.includes("mathematical loss") || dLower.includes("cannot cover")) {
    return VERDICT_DESC_TRANSLATIONS.unfeasible[lang] || desc;
  }
  return desc;
}

// ================= DYNAMIC TRANSLATION: LOAN AFFORDABILITY STATUSES =================
const AFFORDABILITY_TRANSLATIONS: Record<string, Record<string, string>> = {
  "Comfortably Affordable": {
    en: "Comfortably Affordable",
    hi: "किश्त चुकाना आसान व सुरक्षित",
    hinglish: "EMI Dena Aasan aur Safe",
    mr: "हप्ता फेडणे सहज व सुरक्षित",
    bn: "কিস্তি পরিশোধ সহজ ও নিরাপদ",
    te: "వాయిదా చెల్లింపు సులభం మరియు సురక్షితం",
    ta: "தவணை செலுத்துவது எளிது மற்றும் பாதுகாப்பானது",
  },
  "Affordable": {
    en: "Affordable",
    hi: "किश्त चुकाने योग्य",
    hinglish: "EMI Bharne Layak",
    mr: "हप्ता फेडण्यास योग्य",
    bn: "কিস্তি পরিশোধযোগ্য",
    te: "వాయిదా చెల్లించదగినది",
    ta: "தவணை செலுத்தக்கூடியது",
  },
  "Moderately Affordable": {
    en: "Moderately Affordable",
    hi: "मध्यम वहन क्षमता (सावधानी जरूरी)",
    hinglish: "Theek-thaak EMI Buffer",
    mr: "मध्यम हप्ता क्षमता (दक्षता आवश्यक)",
    bn: "মাঝারি সামর্থ্য (সতর্কতা কাম্য)",
    te: "మధ్యస్థ వాయిదా సామర్థ్యం (జాగ్రత్త అవసరం)",
    ta: "மிதமான செலுத்தும் திறன் (கவனம் தேவை)",
  },
  "High Repayment Burden": {
    en: "High Repayment Burden",
    hi: "किश्त का भारी बोझ",
    hinglish: "EMI Ka Bhaari Bojh",
    mr: "हप्त्याचा मोठा ताण",
    bn: "কিস্তির উচ্চ চাপ",
    te: "వాయిదా చెల్లింపుపై అధిక భారం",
    ta: "கடன் தவணையின் அதிக சுமை",
  },
  "Not Affordable": {
    en: "Not Affordable",
    hi: "किश्त चुकाना कठिन / असमर्थ",
    hinglish: "EMI Dena Mushkil",
    mr: "हप्ता फेडणे अशक्य",
    bn: "কিস্তি পরিশোধের বাইরে",
    te: "వాయిదా చెల్లించడం అసాధ్యం",
    ta: "தவணை செலுத்த இயலாது",
  },
  "Not Eligible": {
    en: "Not Eligible",
    hi: "पात्र नहीं",
    hinglish: "Eligible Nahi",
    mr: "अपात्र",
    bn: "অনুপযুক্ত",
    te: "అర్హత లేదు",
    ta: "தகுதியற்றது",
  },
  "Standard": {
    en: "Standard",
    hi: "मानक",
    hinglish: "Standard",
    mr: "प्रमाणित",
    bn: "স্বাভাবিক",
    te: "ప్రామాణికం",
    ta: "வழக்கமானது",
  },
};

export function translateAffordability(status: string = "", lang: string = "hi"): string {
  if (!status) return tKey("affordStandard", lang, "Standard");
  const clean = status.trim();
  for (const [key, mapping] of Object.entries(AFFORDABILITY_TRANSLATIONS)) {
    if (clean.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(clean.toLowerCase())) {
      return mapping[lang] || mapping.en || clean;
    }
  }
  return clean;
}

// ================= DYNAMIC TRANSLATION: FINANCIAL STRENGTH & RISK =================
const STRENGTH_TRANSLATIONS: Record<string, Record<string, string>> = {
  Strong: {
    en: "Strong",
    hi: "मजबूत (सुरक्षित)",
    hinglish: "Mazboot",
    mr: "मजबूत",
    bn: "শক্তিশালী",
    te: "బలమైనది",
    ta: "வலுவானது",
  },
  Moderate: {
    en: "Moderate",
    hi: "मध्यम",
    hinglish: "Theek-thaak",
    mr: "मध्यम",
    bn: "মাঝারি",
    te: "మధ్యస్థం",
    ta: "மிதமானது",
  },
  Weak: {
    en: "Weak",
    hi: "कमज़ोर (संभल कर चलें)",
    hinglish: "Kamzor",
    mr: "कमकुवत",
    bn: "দুর্বল",
    te: "బలహీనమైనది",
    ta: "பலவீனமானது",
  },
};

export function translateStrength(val: string = "", lang: string = "hi"): string {
  if (!val) return val;
  const key = val.trim();
  return STRENGTH_TRANSLATIONS[key]?.[lang] || STRENGTH_TRANSLATIONS[key]?.en || val;
}

const RISK_TRANSLATIONS: Record<string, Record<string, string>> = {
  Low: {
    en: "Low Risk",
    hi: "कम जोखिम",
    hinglish: "Kam Risk",
    mr: "कमी जोखीम",
    bn: "কম ঝুঁকি",
    te: "తక్కువ రిస్క్",
    ta: "குறைந்த ஆபத்து",
  },
  Medium: {
    en: "Moderate Risk",
    hi: "मध्यम जोखिम",
    hinglish: "Moderate Risk",
    mr: "मध्यम जोखीम",
    bn: "মাঝারি ঝুঁকি",
    te: "మధ్యస్థ రిస్క్",
    ta: "மிதமான ஆபத்து",
  },
  High: {
    en: "High Risk",
    hi: "उच्च जोखिम",
    hinglish: "Bada Risk",
    mr: "जास्त जोखीम",
    bn: "উচ্চ ঝুঁকি",
    te: "అధిక రిస్క్",
    ta: "அதிக ஆபத்து",
  },
};

export function translateRisk(val: string = "", lang: string = "hi"): string {
  if (!val) return val;
  const key = val.trim();
  return RISK_TRANSLATIONS[key]?.[lang] || RISK_TRANSLATIONS[key]?.en || val;
}

// ================= DYNAMIC TRANSLATION: LOCAL DEMAND & MARKET =================
const DEMAND_TRANSLATIONS: Record<string, Record<string, string>> = {
  High: {
    en: "High Demand",
    hi: "भारी माँग (बहुत अच्छी)",
    hinglish: "Bohot Jyada Demand",
    mr: "मोठी मागणी",
    bn: "উচ্চ চাহিদা",
    te: "అధిక డిమాండ్",
    ta: "அதிக தேவை",
  },
  Good: {
    en: "Good Demand",
    hi: "अच्छी माँग",
    hinglish: "Achi Demand",
    mr: "चांगली मागणी",
    bn: "ভালো চাহিদা",
    te: "మంచి డిమాండ్",
    ta: "நல்ல தேவை",
  },
  Moderate: {
    en: "Moderate Demand",
    hi: "मध्यम माँग",
    hinglish: "Average Demand",
    mr: "मध्यम मागणी",
    bn: "মাঝারি চাহিদা",
    te: "మధ్యస్థ డిమాండ్",
    ta: "மிதமான தேவை",
  },
  Low: {
    en: "Low Demand",
    hi: "कम माँग",
    hinglish: "Kam Demand",
    mr: "कमी मागणी",
    bn: "স্বল্প চাহিদা",
    te: "తక్కువ డిమాండ్",
    ta: "குறைந்த தேவை",
  },
  Suitable: {
    en: "Suitable Location",
    hi: "अनुकूल इलाका",
    hinglish: "Sahi Jagah",
    mr: "योग्य ठिकाण",
    bn: "উপযুক্ত এলাকা",
    te: "అనుకూలమైన ప్రదేశం",
    ta: "ஏற்ற இடம்",
  },
};

export function translateDemand(val: string = "", lang: string = "hi"): string {
  if (!val) return val;
  const key = val.trim();
  return DEMAND_TRANSLATIONS[key]?.[lang] || DEMAND_TRANSLATIONS[key]?.en || val;
}

// ================= DYNAMIC TRANSLATION: BUSINESS CATEGORIES =================
export const CATEGORY_TRANSLATIONS: Record<string, Record<string, string>> = {
  "Dairy & Milk Products": {
    en: "Dairy & Milk Products",
    hi: "डेयरी व दुग्ध उत्पाद",
    hinglish: "Doodh Dairy aur Milk Products",
    mr: "डेअरी व दुग्ध व्यवसाय",
    bn: "দুগ্ধ ও দুগ্ধজাত পণ্য",
    te: "పాడి పరిశ్రమ & పాల ఉత్పత్తులు",
    ta: "பால் பண்ணை & பால் பொருட்கள்",
  },
  "Poultry & Bird Farming": {
    en: "Poultry & Bird Farming",
    hi: "पोल्ट्री फार्मिंग व मुर्गी पालन",
    hinglish: "Murgi Palan (Poultry Farm)",
    mr: "कुक्कुटपालन व्यवसाय",
    bn: "পোল্ট্রি ও হাঁস-মুরগি পালন",
    te: "పౌల్ట్రీ & కోళ్ళ పెంపకం",
    ta: "கோழி பண்ணை தொழில்",
  },
  "Agriculture, Seeds & Farming": {
    en: "Agriculture, Seeds & Farming",
    hi: "कृषि, बीज व खाद भंडार",
    hinglish: "Kheti, Beej aur Khaad",
    mr: "शेती, बियाणे व खत विक्री",
    bn: "কৃষি, বীজ ও সার বিক্রয়",
    te: "వ్యవసాయం, విత్తనాలు & ఎరువులు",
    ta: "விவசாயம், விதைகள் & உரம்",
  },
  "Fishery & Fish Farming": {
    en: "Fishery & Fish Farming",
    hi: "मत्स्य पालन (मछली पालन)",
    hinglish: "Machli Palan",
    mr: "मत्स्यपालन व्यवसाय",
    bn: "মৎস্য ও মাছ চাষ",
    te: "చేపల పెంపకం",
    ta: "மீன் வளர்ப்பு தொழில்",
  },
  "Retail, Kirana & General Store": {
    en: "Retail, Kirana & General Store",
    hi: "किराना दुकान व जनरल स्टोर",
    hinglish: "Kirana Dukaan aur General Store",
    mr: "किराणा व जनरल स्टोअर",
    bn: "মুদি দোকান ও জেনারেল স্টোর",
    te: "కిరాణా & జనరల్ స్టోర్",
    ta: "மளிகை கடை & பொது அங்காடி",
  },
  "Service, Repair & Mobile Shop": {
    en: "Service, Repair & Mobile Shop",
    hi: "मोबाइल रिपेयरिंग व सेवा केंद्र",
    hinglish: "Mobile Repair aur Service Shop",
    mr: "मोबाईल दुरुस्ती व सेवा केंद्र",
    bn: "মোবাইল মেরামত ও সেবা কেন্দ্র",
    te: "మొబైల్ మరమ్మతు & సర్వీస్ షాప్",
    ta: "மொபைல் பழுதுபார்ப்பு கடை",
  },
  "Small Manufacturing & Flour Mill": {
    en: "Small Manufacturing & Flour Mill",
    hi: "आटा चक्की व लघु विनिर्माण",
    hinglish: "Aata Chakki aur Laghu Udhyog",
    mr: "पिठाची गिरणी व लघु उद्योग",
    bn: "ময়দা কল ও ক্ষুদ্র উৎপাদন",
    te: "పిండి మిల్లు & చిన్న తయారీ",
    ta: "மாவு மில் & சிறு உற்பத்தி",
  },
  "Pickles, Papad, Bakery & Food Processing": {
    en: "Pickles, Papad, Bakery & Food Processing",
    hi: "अचार, पापड़, बेकरी व खाद्य प्रसंस्करण",
    hinglish: "Achaar, Papad, Bakery aur Food Work",
    mr: "लोणचे, पापड, बेकरी व अन्न प्रक्रिया",
    bn: "আচার, পাপড়, বেকারি ও খাদ্য প্রক্রিয়াকরণ",
    te: "ఊరగాయలు, అప్పడాలు, బేకరీ & ఆహార తయారీ",
    ta: "ஊறுகாய், அப்பளம், பேக்கரி & உணவு பதப்படுத்துதல்",
  },
  "Carpenter, Blacksmith, Potter & Artisan": {
    en: "Carpenter, Blacksmith, Potter & Artisan",
    hi: "बढ़ई, लोहार, कुम्हार व ग्रामीण कारीगर",
    hinglish: "Badhai, Lohar aur Karigar",
    mr: "सुतार, लोहार, कुंभार व कारागीर",
    bn: "ছুতার, কামার, কুমার ও গ্রামীণ কারিগর",
    te: "వడ్రంగి, కమ్మరి, కుమ్మరి & చేతివృత్తులు",
    ta: "தச்சர், கொல்லர், குயவர் & கைவினைஞர்",
  },
  "Tailoring, Garments & Handloom Weaving": {
    en: "Tailoring, Garments & Handloom Weaving",
    hi: "सिलाई, वस्त्र व हथकरघा बुनाई",
    hinglish: "Silai, Boutique aur Kapda Kaam",
    mr: "शिलाई, कपडे व हातमाग विणकाम",
    bn: "দর্জি, পোশাক ও তাঁত বয়ন",
    te: "టైలరింగ్, వస్త్రాలు & చేనేత",
    ta: "தையல், ஆடைகள் & கைத்தறி நெசவு",
  },
  "Street Vendor, Hawker & Food Cart": {
    en: "Street Vendor, Hawker & Food Cart",
    hi: "फेरीवाला, ठेला व खान-पान स्टॉल",
    hinglish: "Thela, Vendor aur Food Cart",
    mr: "फेरीवाला, हातगाडी व खाद्य स्टॉल",
    bn: "হকার, ভ্যান ও খাবারের স্টল",
    te: "వీధి వ్యాపారం & ఫుడ్ కార్ట్",
    ta: "சாலையோர வியாபாரம் & உணவு வண்டி",
  },
  "Cold Storage, Warehouse & Post-Harvest Setup": {
    en: "Cold Storage, Warehouse & Post-Harvest Setup",
    hi: "कोल्ड स्टोरेज, गोदाम व फसल भंडारण",
    hinglish: "Cold Storage aur Godaam",
    mr: "शीतगृह, गोदाम व धान्य साठवणूक",
    bn: "কোল্ড স্টোরেজ, গুদাম ও ফসল সংরক্ষণ",
    te: "కోల్డ్ స్టోరేజ్ & గిడ్డంగి",
    ta: "குளிர்பதன கிடங்கு & சேமிப்பு கிடங்கு",
  },
  "Agri-Clinic, Nursery & Farm Advisory Centre": {
    en: "Agri-Clinic, Nursery & Farm Advisory Centre",
    hi: "कृषि क्लीनिक, पौधशाला व किसान केंद्र",
    hinglish: "Agri-Clinic aur Nursery",
    mr: "कृषी दवाखाना, रोपवाटिका व सल्ला केंद्र",
    bn: "কৃষি ক্লিনিক, নার্সারি ও পরামর্শ কেন্দ্র",
    te: "అగ్రి క్లినిక్, నర్సరీ & రైతు కేంద్రం",
    ta: "வேளாண் மருத்துவமனை & நர்சரி",
  },
  "Solar Rooftop Installation & Green Energy Services": {
    en: "Solar Rooftop Installation & Green Energy Services",
    hi: "सोलर रूफटॉप व सौर ऊर्जा सेवाएँ",
    hinglish: "Solar Panel aur Green Energy",
    mr: "सौर ऊर्जा यंत्रणा व हरित ऊर्जा सेवा",
    bn: "সৌর প্যানেল স্থাপন ও সবুজ শক্তি সেবা",
    te: "సోలార్ రూఫ్‌టాప్ & సౌర విద్యుత్ సేవలు",
    ta: "சூரிய மின்சக்தி அமைத்தல் & பசுமை ஆற்றல்",
  },
  "Sanitation, Waste Recycling & Cleaning Services": {
    en: "Sanitation, Waste Recycling & Cleaning Services",
    hi: "सफाई, अपशिष्ट पुनर्चक्रण व स्वच्छता सेवाएँ",
    hinglish: "Safai aur Waste Recycling",
    mr: "स्वच्छता, कचरा पुनर्वापर व स्वच्छता सेवा",
    bn: "বর্জ্য পুনর্ব্যবহার ও পরিচ্ছন্নতা সেবা",
    te: "పారిశుధ్యం & వ్యర్థాల రీసైక్లింగ్",
    ta: "துப்புரவு & கழிவு மறுசுழற்சி சேவை",
  },
};

export function translateCategory(cat: string = "", lang: string = "hi"): string {
  if (!cat) return cat;
  const clean = cat.trim();
  for (const [key, mapping] of Object.entries(CATEGORY_TRANSLATIONS)) {
    if (clean.toLowerCase() === key.toLowerCase() || clean.includes(key) || key.includes(clean)) {
      return mapping[lang] || mapping.en || clean;
    }
  }
  return clean;
}

// ================= DYNAMIC TRANSLATION: REPAYMENT PERIOD PHRASES =================
export function translateRepaymentPeriod(period: string = "", lang: string = "hi"): string {
  if (!period) return period;
  if (lang === "en") return period;

  const numYears = period.match(/(\d+)\s*years?/i)?.[1];
  const numMonths = period.match(/(\d+)[-\s]*months?\s*moratorium/i)?.[1];

  if (numYears && numMonths) {
    if (lang === "hi") return `${numYears} वर्ष (${numMonths} महीने की मोराटोरियम छूट सहित)`;
    if (lang === "hinglish") return `${numYears} saal (${numMonths} mahine ki chhoot ke sath)`;
    if (lang === "mr") return `${numYears} वर्षे (${numMonths} महिन्यांच्या सवलतीसह)`;
    if (lang === "bn") return `${numYears} বছর (${numMonths} মাসের কিস্তি স্থগিতকালীন সুবিধাসহ)`;
    if (lang === "te") return `${numYears} సంవత్సరాలు (${numMonths} నెలల మారటోరియం సదుపాయంతో)`;
    if (lang === "ta") return `${numYears} ஆண்டுகள் (${numMonths} மாத சலுகை காலத்துடன்)`;
  }
  return period;
}

// ================= LOCALIZATION UTILITIES & BCP47 =================
export function getBcp47Locale(lang: string = "hi"): string {
  switch (lang) {
    case "en":
      return "en-IN";
    case "mr":
      return "mr-IN";
    case "bn":
      return "bn-IN";
    case "te":
      return "te-IN";
    case "ta":
      return "ta-IN";
    case "hi":
    case "hinglish":
    default:
      return "hi-IN";
  }
}

// ================= PAGE BADGE PILLS (ALL 11 STEPS) =================
export const PAGE_BADGES: Record<string, Record<string, string>> = {
  overview: {
    en: "Page 01 • Overview & Final Verdict",
    hi: "पेज 01 • मुख्य सारांश व फैसला",
    hinglish: "Page 01 • Overview aur Final Verdict",
    mr: "पान 01 • मुख्य आढावा आणि अंतिम निष्कर्ष",
    bn: "পৃষ্ঠা ০১ • প্রধান সারসংক্ষেপ ও চূড়ান্ত সিদ্ধান্ত",
    te: "పేజీ 01 • ప్రధాన సమీక్ష & తుది తీర్పు",
    ta: "பக்கம் 01 • முக்கிய கண்ணோட்டம் & இறுதி முடிவு",
  },
  profit: {
    en: "Page 02 • Profit & Money Math",
    hi: "पेज 02 • कमाई और खर्चा",
    hinglish: "Page 02 • Kamai aur Kharcha Math",
    mr: "पान 02 • नफा आणि हिशोब",
    bn: "পৃষ্ঠা ০২ • লাভ ও ব্যয়ের হিসাব",
    te: "పేజీ 02 • లాభం & ఖర్చుల లెక్కలు",
    ta: "பக்கம் 02 • லாபம் & பணக் கணக்கு",
  },
  projection: {
    en: "Page 03 • 12-Month Projection",
    hi: "पेज 03 • 12 महीने का हिसाब",
    hinglish: "Page 03 • 12 Mahine Ka Projection",
    mr: "पान 03 • 12 महिन्यांचा अंदाज",
    bn: "পৃষ্ঠা ০৩ • ১২ মাসের প্রাক্কলন",
    te: "పేజీ 03 • 12 నెలల అంచనా",
    ta: "பக்கம் 03 • 12 மாத கணிப்பு",
  },
  loan: {
    en: "Page 04 • Government Loan & Schemes",
    hi: "पेज 04 • सरकारी लोन व योजना",
    hinglish: "Page 04 • Sarkari Loan Scheme",
    mr: "पान 04 • सरकारी कर्ज योजना",
    bn: "পৃষ্ঠা ০৪ • সরকারি ঋণ প্রকল্প",
    te: "పేజీ 04 • ప్రభుత్వ రుణ పథకాలు",
    ta: "பக்கம் 04 • அரசு கடன் திட்டங்கள்",
  },
  emi: {
    en: "Page 05 • Monthly EMI & Loan Schedule",
    hi: "पेज 05 • महीने की किश्त (EMI)",
    hinglish: "Page 05 • Har Mahine Ki Kist (EMI)",
    mr: "पान 05 • मासिक हप्ता (EMI)",
    bn: "পৃষ্ঠা ০৫ • মাসিক কিস্তি (EMI)",
    te: "పేజీ 05 • నెలవారీ వాయిదా (EMI)",
    ta: "பக்கம் 05 • மாதாந்திர தவணை (EMI)",
  },
  market: {
    en: "Page 06 • Local Area & Market Demand",
    hi: "पेज 06 • गाँव का बाज़ार व माँग",
    hinglish: "Page 06 • Gaon Ka Bazaar aur Demand",
    mr: "पान 06 • स्थानिक बाजार व मागणी",
    bn: "পৃষ্ঠা ০৬ • স্থানীয় বাজার ও চাহিদা",
    te: "పేజీ 06 • స్థానిక మార్కెట్ & డిమాండ్",
    ta: "பக்கம் 06 • உள்ளூர் சந்தை & தேவை",
  },
  opportunities: {
    en: "Page 07 • New Business Opportunities",
    hi: "पेज 07 • नए व्यापारिक मौके",
    hinglish: "Page 07 • Naye Business Mauke",
    mr: "पान 07 • नवीन व्यावसायिक संधी",
    bn: "পৃষ্ঠা ০৭ • নতুন ব্যবসায়িক সুযোগ",
    te: "పేజీ 07 • కొత్త వ్యాపార అవకాశాలు",
    ta: "பக்கம் 07 • புதிய வணிக வாய்ப்புகள்",
  },
  swot: {
    en: "Page 08 • Strengths & Weaknesses (SWOT)",
    hi: "पेज 08 • ताकत और कमज़ोरी (SWOT)",
    hinglish: "Page 08 • Taqat aur Kamzori (SWOT)",
    mr: "पान 08 • सामर्थ्य आणि मर्यादा (SWOT)",
    bn: "পৃষ্ঠা ০৮ • শক্তি ও দুর্বলতা (SWOT)",
    te: "పేజీ 08 • బలాలు & బలహీనతలు (SWOT)",
    ta: "பக்கம் 08 • பலம் & பலவீனம் (SWOT)",
  },
  risk: {
    en: "Page 09 • Risk & Safety Guide",
    hi: "पेज 09 • खतरा व सुरक्षा गाइड",
    hinglish: "Page 09 • Khatra aur Suraksha Guide",
    mr: "पान 09 • जोखीम व सुरक्षितता मार्गदर्शक",
    bn: "পৃষ্ঠা ০৯ • ঝুঁকি ও সুরক্ষা নির্দেশিকা",
    te: "పేజీ 09 • రిస్క్ & భద్రతా గైడ్",
    ta: "பக்கம் 09 • ஆபத்து & பாதுகாப்பு வழிகாட்டி",
  },
  advisor: {
    en: "Page 10 • AI Rural Business Advisor",
    hi: "पेज 10 • AI व्यापार साथी",
    hinglish: "Page 10 • AI Vyapar Saathi",
    mr: "पान 10 • AI व्यवसाय सल्लागार",
    bn: "পৃষ্ঠা ১০ • AI ব্যবসা উপদেষ্টা",
    te: "పేజీ 10 • AI వ్యాపార సలహాదారు",
    ta: "பக்கம் 10 • AI வணிக ஆலோசகர்",
  },
  report: {
    en: "Page 11 • Print Business Parcha",
    hi: "पेज 11 • व्यापार पर्चा प्रिंट करें",
    hinglish: "Page 11 • Vyapar Parcha Print",
    mr: "पान 11 • व्यवसाय अहवाल प्रिंट करा",
    bn: "পৃষ্ঠা ১১ • ব্যবসা রিপোর্ট প্রিন্ট করুন",
    te: "పేజీ 11 • వ్యాపార నివేదిక ముద్రించండి",
    ta: "பக்கம் 11 • வணிக அறிக்கையை அச்சிடுக",
  },
};

export function getPageBadge(pageId: string = "overview", lang: string = "hi"): string {
  return PAGE_BADGES[pageId]?.[lang] || PAGE_BADGES[pageId]?.en || PAGE_BADGES.overview[lang] || "Page";
}

// ================= COMPREHENSIVE UI LOCALIZATION DICTIONARY =================
export const COMMON_UI: Record<string, Record<string, string>> = {
  // Navigation & Shared
  stepsMenuBtn: {
    en: "11 Steps Menu",
    hi: "11 चरण मेन्यू",
    hinglish: "11 Steps Menu",
    mr: "11 टप्पे मेन्यू",
    bn: "১১টি ধাপের মেনু",
    te: "11 దశల మెనూ",
    ta: "11 படிகள் மெனு",
  },
  stepsNavTitle: {
    en: "11 Steps Navigation",
    hi: "11 चरण नेविगेशन",
    hinglish: "11 Steps Navigation",
    mr: "11 टप्पे नेव्हिगेशन",
    bn: "১১টি ধাপের নেভিগেশন",
    te: "11 దశల నావిగేషన్",
    ta: "11 படிகள் வழிகாட்டி",
  },
  selectSidePage: {
    en: "Select Side Page",
    hi: "पेज चुनें",
    hinglish: "Page Chunein",
    mr: "पृष्ठ निवडा",
    bn: "পৃষ্ঠা নির্বাচন করুন",
    te: "పేజీని ఎంచుకోండి",
    ta: "பக்கத்தைத் தேர்ந்தெடுக்கவும்",
  },
  pagesCount: {
    en: "Pages",
    hi: "पेज",
    hinglish: "Pages",
    mr: "पृष्ठे",
    bn: "পৃষ্ঠা",
    te: "పేజీలు",
    ta: "பக்கங்கள்",
  },
  needHelp: {
    en: "Need Help?",
    hi: "मदद चाहिए?",
    hinglish: "Madad Chahiye?",
    mr: "मदत हवी आहे?",
    bn: "সাহায্য প্রয়োজন?",
    te: "సహాయం కావాలా?",
    ta: "உதவி தேவையா?",
  },
  voiceTipDesc: {
    en: "Click 'Listen in Voice' to hear explanations in simple speech.",
    hi: "ऊपर 'बोलकर सुनाएं' बटन दबाकर हर पेज की बात अपनी भाषा में सुनें।",
    hinglish: "Upar 'Listen in Voice' dabakar aawaz me samjhein.",
    mr: "वर 'आवाज ऐका' बटणावर क्लिक करून सोप्या भाषेत माहिती ऐका.",
    bn: "সহজ কথায় ব্যাখ্যা শুনতে উপরে 'ভয়েস শুনুন' বাটনে ক্লিক করুন।",
    te: "సులభమైన మాటల్లో వినడానికి పైన 'వాయిస్ వినండి' పై క్లిక్ చేయండి.",
    ta: "எளிய முறையில் விளக்கம் கேட்க மேலே உள்ள 'குரலில் கேளுங்கள்' என்பதை கிளிக் செய்யவும்.",
  },
  closeMenu: {
    en: "Close menu (Esc)",
    hi: "मेन्यू बंद करें (Esc)",
    hinglish: "Menu band karein (Esc)",
    mr: "मेन्यू बंद करा (Esc)",
    bn: "মেনু বন্ধ করুন (Esc)",
    te: "మెనూ మూసివేయి (Esc)",
    ta: "மெனுவை மூடு (Esc)",
  },

  // Overview Pie & KPIs
  capitalFinancingBreakdown: {
    en: "Capital Financing Breakdown",
    hi: "पूँजी संरचना पाई चार्ट",
    hinglish: "Capital Financing Breakdown",
    mr: "भांडवल रचना पाय चार्ट",
    bn: "মূলধন কাঠামোর পাই চার্ট",
    te: "మూలధన విభజన పై చార్ట్",
    ta: "மூலதன கட்டமைப்பு பை விளக்கப்படம்",
  },
  ownerMarginVsBankLoan: {
    en: "Owner Margin Money vs Bank Term Loan",
    hi: "उद्यमी अंशदान और बैंक ऋण सहायता",
    hinglish: "Apna Paisa vs Bank Loan",
    mr: "उद्योजक भांडवल व बँक कर्ज",
    bn: "উদ্যোক্তার নিজস্ব মূলধন বনাম ব্যাংক ঋণ",
    te: "స్వంత పెట్టుబడి వర్సెస్ బ్యాంక్ రుణం",
    ta: "சுய மூலதனம் மற்றும் வங்கி கடன்",
  },
  promoterMarginOwn: {
    en: "Promoter Margin (Own)",
    hi: "उद्यमी अंशदान (मार्जिन)",
    hinglish: "Apna Margin (Own)",
    mr: "उद्योजक भांडवल (मार्जिन)",
    bn: "উদ্যোক্তার নিজস্ব মূলধন (মার্জিন)",
    te: "స్వంత పెట్టుబడి (మార్జిన్)",
    ta: "தொழில்முனைவோர் முதலீடு (சுய பங்கு)",
  },
  selfFinancedEquity: {
    en: "Self-financed owner equity",
    hi: "आपकी जेब से लगाई जाने वाली राशि",
    hinglish: "Aapki jeb se lagaya gaya paisa",
    mr: "स्वतःच्या खिशातून गुंतवलेली रक्कम",
    bn: "নিজের পকেট থেকে দেওয়া অর্থ",
    te: "మీ జేబులో నుండి పెట్టుబడి పెట్టే మొత్తం",
    ta: "உங்கள் கையில் இருந்து முதலீடு செய்யும் தொகை",
  },
  bankLoanComponent: {
    en: "Bank Loan Component",
    hi: "बैंक लोन सहायता (ऋण)",
    hinglish: "Bank Loan Sahayata",
    mr: "बँक कर्ज सहाय्य",
    bn: "ব্যাংক ঋণ সহায়তা",
    te: "బ్యాంక్ రుణ సహాయం",
    ta: "வங்கி கடன் உதவி",
  },
  bankLoanEligible: {
    en: "Bank loan support eligible",
    hi: "सरकारी योजना के तहत बैंक ऋण",
    hinglish: "Sarkari scheme ke tehat bank loan",
    mr: "सरकारी योजनेअंतर्गत बँक कर्ज",
    bn: "সরকারি প্রকল্পের আওতায় ব্যাংক ঋণ",
    te: "ప్రభుత్వ పథకం కింద బ్యాంక్ రుణం",
    ta: "அரசு திட்டத்தின் கீழ் வங்கி கடன் உதவி",
  },
  totalCostCenter: {
    en: "Total Cost",
    hi: "कुल लागत",
    hinglish: "Kul Lagat",
    mr: "एकूण खर्च",
    bn: "মোট ব্যয়",
    te: "మొత్తం ఖర్చు",
    ta: "மொத்த திட்டச் செலவு",
  },

  monthlyCashflowSplit: {
    en: "Monthly Cashflow Split",
    hi: "मासिक आमदनी पाई चार्ट",
    hinglish: "Monthly Cashflow Split",
    mr: "मासिक रोख प्रवाह पाय चार्ट",
    bn: "মাসিক নগদ প্রবাহ পাই চার্ট",
    te: "నెలవారీ నగదు ప్రవాహం పై చార్ట్",
    ta: "மாதாந்திர பணப்புழக்க பை விளக்கப்படம்",
  },
  operatingCostsVsMargin: {
    en: "Operating Costs vs Real Take-Home Margin",
    hi: "कुल बिक्री में से खर्च और शुद्ध बचत",
    hinglish: "Kharche vs Real Pocket Munafa",
    mr: "एकूण विक्रीतील खर्च व शुद्ध नफा",
    bn: "মোট বিক্রিতে খরচ এবং প্রকৃত নিট লাভ",
    te: "మొత్తం అమ్మకాల్లో ఖర్చులు మరియు నికర మిగులు",
    ta: "மொத்த விற்பனையில் செலவு மற்றும் நிகர லாபம்",
  },
  monthlyOperatingCosts: {
    en: "Monthly Operating Costs",
    hi: "मासिक कुल खर्च (Costs)",
    hinglish: "Mahine Ka Kharcha",
    mr: "मासिक एकूण खर्च",
    bn: "মাসিক পরিচালনা ব্যয়",
    te: "నెలవారీ నిర్వహణ ఖర్చులు",
    ta: "மாதாந்திர செயல்பாட்டு செலவுகள்",
  },
  operationalCostsUpkeep: {
    en: "Operational costs & upkeep",
    hi: "कच्चा माल, मजदूरी व बिल",
    hinglish: "Kacha maal, mazdoori aur bill",
    mr: "कच्चा माल, मजुरी व वीज बिल",
    bn: "কাঁচামাল, মজুরি ও বিল",
    te: "ముడిసరుకు, కూలీలు & బిల్లులు",
    ta: "மூலப்பொருள், கூலி & கட்டணங்கள்",
  },
  netTakeHomeProfit: {
    en: "Net Take-Home Profit",
    hi: "शुद्ध मासिक बचत (Profit)",
    hinglish: "Shudh Pocket Munafa",
    mr: "शुद्ध मासिक नफा",
    bn: "প্রকৃত মাসিক নিট লাভ",
    te: "నికర నెలవారీ లాభం",
    ta: "நிகர மாதாந்திர லாபம்",
  },
  cleanPocketProfit: {
    en: "Clean pocket profit",
    hi: "आपकी जेब में शुद्ध बचत",
    hinglish: "Aapki jeb me saaf bachat",
    mr: "आपल्या खिशात उरणारा नफा",
    bn: "পকেটে অবশিষ্ট প্রকৃত লাভ",
    te: "జేబులో మిగిలే నికర లాభం",
    ta: "கையில் மிஞ்சும் நிகர லாபம்",
  },
  monthlyRevenueCenter: {
    en: "Monthly Revenue",
    hi: "मासिक बिक्री",
    hinglish: "Mahine Ki Bikri",
    mr: "मासिक विक्री",
    bn: "মাসিক বিক্রয়",
    te: "నెలవారీ అమ్మకాలు",
    ta: "மாதாந்திர விற்பனை",
  },

  // 4 Big KPI Cards
  inPocketMonthly: {
    en: "In-Pocket Monthly",
    hi: "जेब में बचत",
    hinglish: "Jeb Me Bachat",
    mr: "खिशात उरणारी बचत",
    bn: "পকেটে অবশিষ্ট অর্থ",
    te: "జేబులో మిగిలే మొత్తం",
    ta: "கைக்கு வரும் நிகர லாபம்",
  },
  netMonthlyProfit: {
    en: "Net Monthly Profit",
    hi: "हर महीने शुद्ध मुनाफा",
    hinglish: "Har Mahine Shudh Munafa",
    mr: "दरमहा निव्वळ नफा",
    bn: "মাসিক নিট লাভ",
    te: "నెలవారీ నికర లాభం",
    ta: "மாதாந்திர நிகர லாபம்",
  },
  inPocketDesc: {
    en: "Money left in your pocket after all expenses",
    hi: "सारे खर्चे निकालने के बाद आपका पैसा",
    hinglish: "Saare kharche nikaalne ke baad aapka paisa",
    mr: "सर्व खर्च वजा केल्यानंतर आपल्या हाती उरणारा नफा",
    bn: "সকল খরচ বাদ দিয়ে আপনার হাতে থাকা অর্থ",
    te: "అన్ని ఖర్చులు పోను మీ చేతికి వచ్చే డబ్బు",
    ta: "அனைத்து செலவுகளும் போக உங்கள் கையில் எஞ்சியிருக்கும் பணம்",
  },

  annualTag: {
    en: "Annual",
    hi: "1 साल में",
    hinglish: "1 Saal Me",
    mr: "1 वर्षात",
    bn: "১ বছরে",
    te: "1 సంవత్సరంలో",
    ta: "1 ஆண்டில்",
  },
  yearlyTotalProfit: {
    en: "Yearly Total Profit",
    hi: "1 साल की कुल बचत",
    hinglish: "1 Saal Ki Kul Bachat",
    mr: "1 वर्षाची एकूण बचत",
    bn: "১ বছরের মোট সঞ্চয়",
    te: "1 సంవత్సరం మొత్తం పొదుపు",
    ta: "ஆண்டு மொத்த சேமிப்பு",
  },
  yearlyTotalDesc: {
    en: "Estimated total savings after 1 full year",
    hi: "12 महीने का कुल अनुमानित फायदा",
    hinglish: "12 mahine ka kul anumanit faayda",
    mr: "12 महिन्यांचा एकूण अंदाजित नफा",
    bn: "১ বছর পর আনুমানিক মোট সঞ্চয়",
    te: "1 పూర్తి సంవత్సరం తర్వాత అంచనా వేసిన మొత్తం పొదుపు",
    ta: "1 முழு ஆண்டிற்குப் பிறகு மதிப்பிடப்பட்ட மொத்த சேமிப்பு",
  },

  returnRateTag: {
    en: "Return Rate",
    hi: "मुनाफे की दर",
    hinglish: "Munafey Ki Dar",
    mr: "परतावा दर",
    bn: "লাভের হার",
    te: "రాబడి రేటు",
    ta: "வருவாய் விகிதம்",
  },
  annualReturnRoi: {
    en: "Annual Return on Money (ROI)",
    hi: "वार्षिक रिटर्न (ROI)",
    hinglish: "Saalana Return (ROI)",
    mr: "वार्षिक परतावा (ROI)",
    bn: "বার্ষিক রিটার্ন (ROI)",
    te: "వార్షిక రాబడి (ROI)",
    ta: "ஆண்டு முதலீட்டு வருவாய் (ROI)",
  },
  returnRateDesc: {
    en: "Profit generated per ₹100 of money invested",
    hi: "हर ₹100 लगाने पर सालाना कितना पैसा बनेगा",
    hinglish: "Har ₹100 lagane par saal me kitna banega",
    mr: "गुंतवलेल्या प्रत्येक ₹100 वर मिळणारा वार्षिक नफा",
    bn: "বিনিয়োগকৃত প্রতি ১০০ টাকায় অর্জিত বার্ষিক লাভ",
    te: "పెట్టుబడి పెట్టిన ప్రతి ₹100 పై వచ్చే వార్షిక రాబడి",
    ta: "முதலீடு செய்த ஒவ்வொரு ₹100-க்கும் கிடைக்கும் ஆண்டு வருமானம்",
  },

  recoveryTag: {
    en: "Recovery",
    hi: "लागत वापसी",
    hinglish: "Lagaat Wapsi",
    mr: "भांडवल परतफेड",
    bn: "পুঁজি ফেরত",
    te: "పెట్టుబడి రికవరీ",
    ta: "முதலீடு மீட்பு",
  },
  paybackTimePeriod: {
    en: "Payback Time Period",
    hi: "मूल धन वापसी समय",
    hinglish: "Paisa Wapsi Ka Time",
    mr: "भांडवल परतीचा कालावधी",
    bn: "পুঁজি ফিরে আসার সময়",
    te: "పెట్టుబడి తిరిగి వచ్చే కాలం",
    ta: "முதலீடு திரும்பப் பெறும் காலம்",
  },
  recoveryTimeDesc: {
    en: "Months needed to recover your initial margin capital",
    hi: "जितने महीने में आपकी लगाई पूँजी वापस आ जाएगी",
    hinglish: "Jitne mahine me lagayi poonji wapas aa jayegi",
    mr: "सुरुवातीचे गुंतवलेले भांडवल वसूल होण्यासाठी लागणारे महिने",
    bn: "প্রারম্ভিক মূলধন তুলে নিতে প্রয়োজনীয় মাস",
    te: "మీ ప్రారంభ మూలధనం రికవరీ కావడానికి పట్టే నెలలు",
    ta: "ஆரம்ப மூலதனத்தை திரும்பப் பெற தேவையான மாதங்கள்",
  },
  monthsUnit: {
    en: "Months",
    hi: "महीने",
    hinglish: "Mahine",
    mr: "महिने",
    bn: "মাস",
    te: "నెలలు",
    ta: "மாதங்கள்",
  },

  // Simple Explanation Box
  simpleExplanation: {
    en: "Simple Explanation in Plain Words",
    hi: "सरल भाषा में समझें",
    hinglish: "Saral Bhasha Me Samjhein",
    mr: "सोप्या भाषेत समजून घ्या",
    bn: "সহজ ভাষায় বুঝুন",
    te: "సరళమైన మాటల్లో అర్థం చేసుకోండి",
    ta: "எளிய தமிழில் புரிந்துகொள்ளுங்கள்",
  },
  govtLoanEligibility: {
    en: "Government Loan Eligibility:",
    hi: "सरकारी लोन सुविधा:",
    hinglish: "Sarkari Loan Eligibility:",
    mr: "सरकारी कर्ज पात्रता:",
    bn: "সরকারি ঋণ সুবিধা:",
    te: "ప్రభుత్వ రుణ అర్హత:",
    ta: "அரசு கடன் தகுதி:",
  },
  monthlyLoanEmi: {
    en: "Monthly Loan EMI:",
    hi: "महीने की किश्त (EMI):",
    hinglish: "Har Mahine Ki EMI:",
    mr: "मासिक हप्ता (EMI):",
    bn: "মাসিক কিস্তি (EMI):",
    te: "నెలవారీ వాయిదా (EMI):",
    ta: "மாதாந்திர தவணை (EMI):",
  },
  localVillageDemand: {
    en: "Local Village Demand:",
    hi: "स्थानीय माँग:",
    hinglish: "Local Village Demand:",
    mr: "स्थानिक मागणी:",
    bn: "স্থানীয় চাহিদা:",
    te: "స్థానిక డిమాండ్:",
    ta: "உள்ளூர் தேவை:",
  },

  // Save to MySQL DB Card
  saveRecordToDb: {
    en: "Save Record to Aiven MySQL 8.4",
    hi: "Aiven MySQL क्लाउड डेटाबेस में सुरक्षित करें",
    hinglish: "Aiven MySQL Cloud Database Me Save Karein",
    mr: "Aiven MySQL क्लाऊड डेटाबेसमध्ये सुरक्षित करा",
    bn: "Aiven MySQL ক্লাউড ডাটাবেসে সংরক্ষণ করুন",
    te: "Aiven MySQL క్లౌడ్ డేటాబేస్‌లో భద్రపరచండి",
    ta: "Aiven MySQL கிளவுட் டேட்டாபேஸில் சேமிக்கவும்",
  },
  saveRecordSub: {
    en: "Persist applicant profile, financial metrics, and scheme evaluation.",
    hi: "इस व्यापार का पूरा मूल्यांकन व प्रोजेक्ट पर्चा हमेशा के लिए सहेजें।",
    hinglish: "Is business ka poora evaluation hamesha ke liye save karein.",
    mr: "या व्यवसायाचे संपूर्ण मूल्यांकन व प्रकल्प अहवाल कायमस्वरूपी जतन करा.",
    bn: "উদ্যোক্তার বিবরণ, আর্থিক মেট্রিক্স এবং প্রকল্প মূল্যায়ন নিরাপদে সংরক্ষণ করুন।",
    te: "దరఖాస్తుదారు ప్రొఫైల్, ఆర్థిక లెక్కలు మరియు పథకం మూల్యాంకనం శాశ్వతంగా సేవ్ చేయండి.",
    ta: "விண்ணப்பதாரர் சுயவிவரம், நிதி அளவீடுகள் மற்றும் திட்ட மதிப்பீட்டை நிரந்தரமாக சேமிக்கவும்.",
  },
  saveEvaluationBtn: {
    en: "Save Evaluation",
    hi: "डेटाबेस में सहेजें",
    hinglish: "Save to Database",
    mr: "डेटाबेसमध्ये जतन करा",
    bn: "ডাটাবেসে সংরক্ষণ করুন",
    te: "డేటాబేస్‌లో సేవ్ చేయి",
    ta: "டேட்டாபேஸில் சேமிக்கவும்",
  },
  savingBtn: {
    en: "Saving...",
    hi: "सहेजा जा रहा है...",
    hinglish: "Save ho raha hai...",
    mr: "जतन होत आहे...",
    bn: "সংরক্ষণ হচ্ছে...",
    te: "సేవ్ అవుతోంది...",
    ta: "சேமிக்கப்படுகிறது...",
  },
  savedBtn: {
    en: "Saved to MySQL",
    hi: "MySQL में सुरक्षित",
    hinglish: "MySQL Me Saved",
    mr: "MySQL मध्ये जतन केले",
    bn: "MySQL-এ সংরক্ষিত",
    te: "MySQL లో సేవ్ అయింది",
    ta: "MySQL-இல் சேமிக்கப்பட்டது",
  },
  successfullySaved: {
    en: "Successfully Saved!",
    hi: "सफलतापूर्वक सुरक्षित!",
    hinglish: "Successfully Saved!",
    mr: "यशस्वीरीत्या जतन केले!",
    bn: "সফলভাবে সংরক্ষিত!",
    te: "విజయవంతంగా సేవ్ చేయబడింది!",
    ta: "வெற்றிகரமாக சேமிக்கப்பட்டது!",
  },
  businessIdLabel: {
    en: "Business ID:",
    hi: "रिकॉर्ड आईडी:",
    hinglish: "Business ID:",
    mr: "नोंद आयडी:",
    bn: "রেকর্ড আইডি:",
    te: "రికార్డు ID:",
    ta: "பதிவு எண்:",
  },
  reportCodeLabel: {
    en: "Report Code:",
    hi: "रिपोर्ट कोड:",
    hinglish: "Report Code:",
    mr: "अहवाल कोड:",
    bn: "রিপোর্ট কোড:",
    te: "నివేదిక కోడ్:",
    ta: "அறிக்கை குறியீடு:",
  },
  copyCodeBtn: {
    en: "Copy Code",
    hi: "कोड कॉपी करें",
    hinglish: "Code Copy Karein",
    mr: "कोड कॉपी करा",
    bn: "কোড কপি করুন",
    te: "కోడ్ కాపీ చేయండి",
    ta: "குறியீட்டை நகலெடு",
  },
  copiedBtn: {
    en: "Copied",
    hi: "कॉपी हो गया",
    hinglish: "Copy Ho Gaya",
    mr: "कॉपी झाले",
    bn: "কপি হয়েছে",
    te: "కాపీ అయింది",
    ta: "நகலெடுக்கப்பட்டது",
  },
  viewInHistoryBtn: {
    en: "View in History",
    hi: "इतिहास में देखें",
    hinglish: "History Me Dekhein",
    mr: "इतिहासात पहा",
    bn: "ইতিহাসে দেখুন",
    te: "చరిత్రలో చూడండి",
    ta: "வரலாற்றில் காண்க",
  },

  // Explore Detailed Pages
  explorePagesTitle: {
    en: "Explore Detailed Pages:",
    hi: "आगे की जानकारी के लिए पेज चुनें:",
    hinglish: "Aage Ki Jankari Ke Liye Page Chunein:",
    mr: "सविस्तर माहितीसाठी पृष्ठ निवडा:",
    bn: "বিস্তারিত তথ্যের জন্য পৃষ্ঠা নির্বাচন করুন:",
    te: "వివరాల కోసం పేజీలను ఎంచుకోండి:",
    ta: "கூடுதல் விவரங்களுக்கு பக்கங்களைத் தேர்ந்தெடுக்கவும்:",
  },

  // Page 02: Profit & Money Math
  flowSales: {
    en: "Total Sales (Revenue)",
    hi: "कुल बिक्री (Bikri)",
    hinglish: "Kul Bikri (Revenue)",
    mr: "एकूण विक्री (Revenue)",
    bn: "মোট বিক্রয় (রাজস্ব)",
    te: "మొత్తం అమ్మకాలు (ఆదాయం)",
    ta: "மொத்த விற்பனை (வருவாய்)",
  },
  flowSalesSub: {
    en: "Money in from customers",
    hi: "ग्राहक से आया पैसा",
    hinglish: "Grahak se aaya paisa",
    mr: "ग्राहकांकडून आलेले पैसे",
    bn: "ক্রেতাদের কাছ থেকে প্রাপ্ত অর্থ",
    te: "వినియోగదారుల నుండి వచ్చిన డబ్బు",
    ta: "வாடிக்கையாளர்களிடமிருந்து வந்த பணம்",
  },
  flowExpenses: {
    en: "Total Expenses (Costs)",
    hi: "कुल खर्च (Kharcha)",
    hinglish: "Kul Kharcha (Costs)",
    mr: "एकूण खर्च (Costs)",
    bn: "মোট ব্যয় (খরচ)",
    te: "మొత్తం ఖర్చులు (వ్యయాలు)",
    ta: "மொத்த செலவுகள்",
  },
  flowExpensesSub: {
    en: "Materials, rent, power, feed",
    hi: "माल, बिजली, किराया आदि",
    hinglish: "Maal, bijli, kiraya wagairah",
    mr: "कच्चा माल, वीज, भाडे इत्यादी",
    bn: "কাঁচামাল, বিদ্যুৎ, ভাড়া ইত্যাদি",
    te: "సరుకులు, కరెంట్, అద్దె మొదలైనవి",
    ta: "பொருட்கள், மின்சாரம், வாடகை போன்றவை",
  },
  flowProfit: {
    en: "Net Monthly Profit",
    hi: "शुद्ध मुनाफा (Munafa)",
    hinglish: "Shudh Munafa (Profit)",
    mr: "निव्वळ मासिक नफा",
    bn: "মাসিক নিট লাভ",
    te: "నెలవారీ నికర లాభం",
    ta: "நிகர மாதாந்திர லாபம்",
  },
  flowProfitSub: {
    en: "Real money in your hand",
    hi: "आपकी सीधी बचत",
    hinglish: "Aapki seedhi bachat",
    mr: "आपल्या हातात उरणारी प्रत्यक्ष बचत",
    bn: "আপনার হাতে থাকা প্রকৃত সঞ্চয়",
    te: "మీ చేతిలో మిగిలే నిజమైన డబ్బు",
    ta: "உங்கள் கையில் மிஞ்சும் உண்மையான பணம்",
  },
  profitMarginLabel: {
    en: "Profit Margin",
    hi: "मुनाफा मार्जिन",
    hinglish: "Profit Margin",
    mr: "नफा मार्जिन",
    bn: "লাভের মার্জিন",
    te: "లాభాల మార్జిన్",
    ta: "லாப விகிதம்",
  },
  expenseRatioLabel: {
    en: "Expense Ratio",
    hi: "खर्च का अनुपात",
    hinglish: "Kharcha Ratio",
    mr: "खर्च प्रमाण",
    bn: "ব্যয়ের অনুপাত",
    te: "ఖర్చుల నిష్పత్తి",
    ta: "செலவு விகிதம்",
  },
  breakEvenLabel: {
    en: "Monthly Break-Even Target",
    hi: "महीने का ब्रेक-ईवन लक्ष्य",
    hinglish: "Mahine Ka Break-Even Target",
    mr: "मासिक ब्रेक-इव्हन उद्दिष्ट",
    bn: "মাসিক ব্রেক-ইভেন লক্ষ্যমাত্রা",
    te: "నెలవారీ బ్రేక్-ఈవెన్ లక్ష్యం",
    ta: "மாதாந்திர சமநிலை இலக்கு",
  },
  monthlyCashSurplus: {
    en: "Monthly Cash Surplus",
    hi: "महीने का अधिशेष (Surplus)",
    hinglish: "Mahine Ka Surplus",
    mr: "मासिक रोख शिल्लक (Surplus)",
    bn: "মাসিক নগদ উদ্বৃত্ত",
    te: "నెలవారీ నగదు మిగులు",
    ta: "மாதாந்திர பண உபரி",
  },
  financialStrength: {
    en: "Financial Strength",
    hi: "वित्तीय स्थिति (Strength)",
    hinglish: "Financial Strength",
    mr: "आर्थिक स्थिती",
    bn: "আর্থিক সক্ষমতা",
    te: "ఆర్థిక బలం",
    ta: "நிதி நிலைத்தன்மை",
  },
  financialRisk: {
    en: "Financial Risk",
    hi: "वित्तीय जोखिम (Risk)",
    hinglish: "Financial Risk",
    mr: "आर्थिक जोखीम",
    bn: "আর্থিক ঝুঁকি",
    te: "ఆర్థిక రిస్క్",
    ta: "நிதி ஆபத்து",
  },
  practicalTipTitle: {
    en: "Practical Money Tip:",
    hi: "गाँव के व्यापारी के लिए आसान सलाह:",
    hinglish: "Practical Vyapar Tip:",
    mr: "व्यावहारिक आर्थिक सल्ला:",
    bn: "ব্যবহারিক আর্থিক পরামর্শ:",
    te: "ఆచరణాత్మక వ్యాపార సలహా:",
    ta: "நடைமுறை வணிக ஆலோசனை:",
  },
  practicalTipDesc: {
    en: "Keep a daily ledger of expenses. Limit customer credit (udhaar) to trusted buyers, and buy raw materials in bulk directly from main wholesale mandis to save 5-10% extra.",
    hi: "दुकान या फार्म में हमेशा अपनी कच्ची पर्ची या डायरी में रोज़ का खर्चा लिखें। कोशिश करें कि उधारी सीमित रखें और माल थोक मंडी से सीधे नकद में कम दाम पर खरीदें।",
    hinglish: "Dukaan me hamesha daily kharcha diary me likhein. Udhaari kam rakhein aur wholesale mandi se saste me maal khareedein.",
    mr: "दुकानात किंवा शेतात दैनंदिन खर्च नेहमी नोंदवून ठेवा. उधारी मर्यादित ठेवा आणि मुख्य घाऊक बाजारातून थेट खरेदी करून 5-10% अधिक बचत करा.",
    bn: "প্রতিদিনের খরচের খাতা রাখুন। বিশ্বস্ত ক্রেতা ছাড়া বাকি দেওয়া সীমিত রাখুন এবং সরাসরি পাইকারি বাজার থেকে পণ্য কিনে ৫-১০% অতিরিক্ত সাশ্রয় করুন।",
    te: "రోజువారీ ఖర్చుల రికార్డును నిర్వహించండి. అప్పులు పరిమితం చేయండి మరియు హోల్‌సేల్ మార్కెట్ నుండి నేరుగా కొనుగోలు చేసి 5-10% అదనంగా ఆదా చేయండి.",
    ta: "தினசரி செலவுகளை குறிப்பேட்டில் எழுதி வாருங்கள். கடன் கொடுப்பதை குறைத்து, மொத்த விற்பனை சந்தையிலிருந்து நேரடியாக கொள்முதல் செய்து 5-10% கூடுதல் சேமிப்பு பெறுங்கள்.",
  },

  // Page 04: Govt Loan
  matchedTierLabel: {
    en: "Matched Tier:",
    hi: "योजना श्रेणी:",
    hinglish: "Matched Tier:",
    mr: "योजना श्रेणी:",
    bn: "প্রকল্পের স্তর:",
    te: "పథకం కేటగిరీ:",
    ta: "திட்டப் பிரிவு:",
  },
  screeningNoticeTitle: {
    en: "Eligibility Screening Notice: ",
    hi: "पात्रता स्क्रीनिंग सूचना: ",
    hinglish: "Screening Notice: ",
    mr: "पात्रता तपासणी सूचना: ",
    bn: "যোগ্যতা যাচাই সংক্রান্ত বিজ্ঞপ্তি: ",
    te: "అర్హత పరిశీలన నోటీసు: ",
    ta: "தகுதி ஆய்வு அறிவிப்பு: ",
  },
  screeningNoticeDesc: {
    en: "This result is an indicative screening based on the details you provided. Scheme rules, eligibility criteria, and interest rates are determined by financing institutions and nodal ministries. Always verify current criteria on the official government portal before applying.",
    hi: "यह परिणाम आपकी दर्ज जानकारी के आधार पर एक प्रारंभिक स्क्रीनिंग है। सरकारी नियम व ब्याज दरें समय के साथ बदल सकती हैं। किसी भी योजना में आवेदन करने से पहले आधिकारिक सरकारी पोर्टल अथवा अपनी बैंक शाखा से पात्रता सत्यापित अवश्य करें।",
    hinglish: "Yeh screening aapke numbers par based hai. Apply karne se pehle official portal ya bank branch se confirm zaroor karein.",
    mr: "हा निकाल आपण भरलेल्या माहितीवर आधारित प्राथमिक तपासणी आहे. कोणत्याही योजनेत अर्ज करण्यापूर्वी अधिकृत सरकारी पोर्टल किंवा बँकेत खात्री करा.",
    bn: "এই ফলাফলটি আপনার দেওয়া তথ্যের ভিত্তিতে একটি প্রাথমিক যাচাই। যেকোনো প্রকল্পে আবেদন করার পূর্বে অফিসিয়াল সরকারি পোর্টাল বা ব্যাংক থেকে নিয়মাবলী নিশ্চিত করুন।",
    te: "ఈ ఫలితం మీరు అందించిన వివరాల ఆధారంగా ప్రాథమిక పరిశీలన మాత్రమే. దరఖాస్తు చేయడానికి ముందు అధికారిక పోర్టల్ లేదా బ్యాంకులో వివరాలను ధృవీకరించుకోండి.",
    ta: "இந்த முடிவு உங்கள் தகவலின் அடிப்படையிலான முதற்கட்ட ஆய்வு மட்டுமே. விண்ணப்பிக்கும் முன் அதிகாரப்பூர்வ அரசு தளம் அல்லது வங்கிக் கிளையில் விவரங்களை சரிபார்க்கவும்.",
  },

  // Page 05: EMI
  comfortableEmi: {
    en: "Comfortable & Affordable EMI",
    hi: "किश्त भरना आसान व सुरक्षित है",
    hinglish: "EMI Dena Aasan aur Safe Hai",
    mr: "हप्ता फेडणे सहज व सुरक्षित आहे",
    bn: "কিস্তি পরিশোধ সহজ ও নিরাপদ",
    te: "వాయిదా చెల్లింపు సులభం మరియు సురక్షితం",
    ta: "தவணை செலுத்துவது எளிது மற்றும் பாதுகாப்பானது",
  },
  cautionEmi: {
    en: "Manage EMI with Care",
    hi: "किश्त पर नजर रखें",
    hinglish: "EMI Par Dhyan Dein",
    mr: "हप्त्यावर लक्ष ठेवा",
    bn: "কিস্তির বিষয়ে সতর্ক থাকুন",
    te: "వాయిదాపై జాగ్రత్త వహించండి",
    ta: "தவணையை கவனமாக நிர்வகிக்கவும்",
  },
  monthlyDue: {
    en: "Monthly Due",
    hi: "हर माह देय",
    hinglish: "Har Mahine Due",
    mr: "दरमहा देय",
    bn: "প্রতি মাসে প্রদেয়",
    te: "నెలవారీ చెల్లించాల్సినది",
    ta: "மாதாந்திர தவணை",
  },
  annualInterestRate: {
    en: "Annual Interest Rate",
    hi: "वार्षिक ब्याज दर",
    hinglish: "Saalana Byaj Dar",
    mr: "वार्षिक व्याज दर",
    bn: "বার্ষিক সুদের হার",
    te: "వార్షిక వడ్డీ రేటు",
    ta: "ஆண்டு வட்டி விகிதம்",
  },
  totalRepaymentTenure: {
    en: "Total Repayment Tenure",
    hi: "लोन की कुल अवधि",
    hinglish: "Loan Ka Kul Time",
    mr: "कर्जाचा एकूण कालावधी",
    bn: "ঋণ পরিশোধের মোট মেয়াদ",
    te: "మొత్తం రుణ కాలపరిమితి",
    ta: "கடன் திருப்பிச் செலுத்தும் காலம்",
  },
  totalInterestPayable: {
    en: "Total Interest Payable",
    hi: "कुल ब्याज भुगतान",
    hinglish: "Kul Byaj Ka Bhugtan",
    mr: "एकूण देय व्याज",
    bn: "মোট প্রদেয় সুদ",
    te: "మొత్తం చెల్లించాల్సిన వడ్డీ",
    ta: "மொத்த செலுத்த வேண்டிய வட்டி",
  },

  // Page 06: Market
  localMarketDemand: {
    en: "Local Customer Demand",
    hi: "स्थानीय माँग (Demand)",
    hinglish: "Local Demand",
    mr: "स्थानिक ग्राहकांची मागणी",
    bn: "স্থানীয় ক্রেতাদের চাহিদা",
    te: "స్థానిక వినియోగదారుల డిమాండ్",
    ta: "உள்ளூர் வாடிக்கையாளர் தேவை",
  },
  existingCompetition: {
    en: "Existing Competition",
    hi: "प्रतिद्वंदी (Competition)",
    hinglish: "Competition Units",
    mr: "विद्यमान स्पर्धा",
    bn: "বর্তমান প্রতিযোগিতা",
    te: "ప్రస్తుత పోటీ",
    ta: "போட்டியாளர்களின் எண்ணிக்கை",
  },
  marketPotentialScore: {
    en: "Market Potential Score",
    hi: "बाज़ार क्षमता (Potential)",
    hinglish: "Market Potential Score",
    mr: "बाजार क्षमता गुण",
    bn: "বাজার সম্ভাব্যতা স্কোর",
    te: "మార్కెట్ సామర్థ్య స్కోరు",
    ta: "சந்தை சாத்தியக்கூறு மதிப்பீடு",
  },
  locationSuitability: {
    en: "Location Suitability",
    hi: "स्थान अनुकूलता",
    hinglish: "Location Suitability",
    mr: "जागेची योग्यता",
    bn: "স্থানের উপযোগিতা",
    te: "ప్రదేశ అనుకూలత",
    ta: "இடத்தின் பொருத்தம்",
  },
  // Government Loan & Schemes (Page 04)
  govtScreeningNoticeTitle: {
    en: "Eligibility Screening Notice: ",
    hi: "पात्रता स्क्रीनिंग सूचना: ",
    hinglish: "Eligibility Screening Notice: ",
    mr: "पात्रता तपासणी सूचना: ",
    bn: "যোগ্যতা যাচাইকরণ নোটিশ: ",
    te: "అర్హత స్క్రీనింగ్ నోటీసు: ",
    ta: "தகுதி ஆய்வு அறிவிப்பு: ",
  },
  govtScreeningNoticeDesc: {
    en: "This result is an indicative screening based on the details you provided. Scheme rules, eligibility criteria, and interest rates are determined by financing institutions and nodal ministries. Always verify current criteria on the official government portal before applying.",
    hi: "यह परिणाम आपकी दर्ज जानकारी के आधार पर एक प्रारंभिक स्क्रीनिंग है। सरकारी नियम व ब्याज दरें समय के साथ बदल सकती हैं। किसी भी योजना में आवेदन करने से पहले आधिकारिक सरकारी पोर्टल अथवा अपनी बैंक शाखा से पात्रता सत्यापित अवश्य करें।",
    hinglish: "Yeh screening aapki di gayi jankari par aadharit hai. Bank apply karne se pehle official portal par check karein.",
    mr: "हा निकाल आपण दिलेल्या माहितीवर आधारित प्राथमिक तपासणी आहे. अधिकृत सरकारी पोर्टल किंवा बँकेत जाऊन खात्री करा.",
    bn: "এই ফলাফল আপনার প্রদত্ত তথ্যের ভিত্তিতে একটি প্রাথমিক স্ক্রীনিং। কোনো প্রকল্পে আবেদন করার পূর্বে অফিসিয়াল সরকারি পোর্টাল বা ব্যাংক শাখা থেকে তথ্য যাচাই করে নিন।",
    te: "ఈ ఫలితం మీరు అందించిన సమాచారం ఆధారంగా ప్రాథమిక స్క్రీనింగ్ మాత్రమే. దరఖాస్తు చేయడానికి ముందు అధికారిక పోర్టల్ లేదా బ్యాంకులో వివరాలు ధృవీకరించుకోండి.",
    ta: "இந்த முடிவு நீங்கள் அளித்த தகவலின் அடிப்படையிலான பூர்வாங்க மதிப்பீடு ஆகும். விண்ணப்பிக்கும் முன் அதிகாரப்பூர்வ அரசு தளம் அல்லது வங்கிக் கிளையில் விவரங்களை சரிபார்க்கவும்.",
  },
  matchedTierLabel: {
    en: "Matched Tier:",
    hi: "योजना श्रेणी:",
    hinglish: "Matched Tier:",
    mr: "योजना श्रेणी:",
    bn: "প্রকল্পের স্তর:",
    te: "పథక శ్రేణి:",
    ta: "திட்டப் பிரிவு:",
  },
  schemeSubtitle: {
    en: "Indicative scheme screening based on your self-reported capital and business category. Final sanction requires lender appraisal.",
    hi: "आपके द्वारा दर्ज निवेश और श्रेणी के आधार पर प्रारंभिक योजना स्क्रीनिंग। अंतिम स्वीकृति बैंक सत्यापन पर निर्भर है।",
    hinglish: "Aapke capital aur category ke aadhar par scheme screening. Final sanction bank par depend hai.",
    mr: "आपल्या भांडवल व व्यवसाय प्रकारानुसार प्राथमिक तपासणी. अंतिम मंजुरी बँकेच्या मूल्यांकनावर अवलंबून आहे.",
    bn: "আপনার মূলধন ও ব্যবসার ধরনের ভিত্তিতে প্রাথমিক স্ক্রীনিং। চূড়ান্ত ঋণ অনুমোদন ব্যাংক মূল্যায়নের উপর নির্ভরশীল।",
    te: "మీరు పేర్కొన్న పెట్టుబడి ఆధారంగా ప్రాథమిక పథక స్క్రీనింగ్. తుది ఆమోదం బ్యాంక్ ధృవీకరణపై ఆధారపడి ఉంటుంది.",
    ta: "உங்கள் சுய முதலீட்டு விவரங்களின் அடிப்படையிலான திட்டம். இறுதி ஒப்புதல் வங்கியின் ஆய்வுக்கு உட்பட்டது.",
  },
  indicativeSchemeMatch: {
    en: "Indicative Scheme Match",
    hi: "स्क्रीन की गई सरकारी योजना",
    hinglish: "Screened Govt Scheme",
    mr: "तपासलेली सरकारी योजना",
    bn: "বাছাইকৃত সরকারি প্রকল্প",
    te: "ఎంపికైన ప్రభుత్వ పథకం",
    ta: "பரிந்துரைக்கப்பட்ட அரசு திட்டம்",
  },
  centralSchemeScreening: {
    en: "Central Scheme • Indicative Screening",
    hi: "केंद्रीय योजना • प्रारंभिक स्क्रीनिंग",
    hinglish: "Central Scheme • Indicative Screening",
    mr: "केंद्रीय योजना • प्राथमिक तपासणी",
    bn: "কেন্দ্রীয় প্রকল্প • প্রাথমিক যাচাই",
    te: "కేంద్ర పథకం • ప్రాథమిక స్క్రీనింగ్",
    ta: "மத்திய திட்டம் • பூர்வாங்க மதிப்பீடு",
  },
  totalProjectCostLabel: {
    en: "Total Project Cost",
    hi: "कुल प्रोजेक्ट लागत (Total Cost)",
    hinglish: "Total Project Cost",
    mr: "एकूण प्रकल्प खर्च",
    bn: "মোট প্রকল্প ব্যয়",
    te: "మొత్తం ప్రాజెక్ట్ ఖర్చు",
    ta: "மொத்த திட்டச் செலவு",
  },
  totalCostSub: {
    en: "Full capital required for machinery & setup",
    hi: "व्यापार को पूरी तरह शुरू करने की लागत",
    hinglish: "Business shuru karne ki poori cost",
    mr: "व्यवसाय पूर्णपणे सुरू करण्यासाठी लागणारा खर्च",
    bn: "যন্ত্রপাতি ও সেটআপের জন্য মোট প্রয়োজনীয় অর্থ",
    te: "యంత్రాలు & సెటప్ కోసం మొత్తం అవసరమైన పెట్టుబడి",
    ta: "இயந்திரங்கள் மற்றும் அமைப்பிற்கு தேவையான முழு முதலீடு",
  },
  promoterContributionLabel: {
    en: "Your Contribution (Margin 10%)",
    hi: "आपका हिस्सा / मार्जिन (10%)",
    hinglish: "Aapka Margin (10%)",
    mr: "आपला वाटा / मार्जिन (10%)",
    bn: "আপনার নিজস্ব বিনিয়োগ (মার্জিন ১০%)",
    te: "మీ వాటా / మార్జిన్ (10%)",
    ta: "உங்கள் பங்களிப்பு / மார்ஜின் (10%)",
  },
  promoterContributionSub: {
    en: "Cash or savings you provide as owner margin",
    hi: "यह पैसा आपको अपनी जेब से लगाना होगा",
    hinglish: "Yeh paisa aapko apni jeb se lagana hoga",
    mr: "हे पैसे आपल्याला स्वतःच्या खिशातून गुंतवावे लागतील",
    bn: "এই অর্থ আপনার নিজের সঞ্চয় থেকে দিতে হবে",
    te: "ఈ డబ్బును మీరు స్వంతంగా సమకూర్చుకోవాలి",
    ta: "இந்தத் தொகையை உங்கள் சேமிப்பிலிருந்து அளிக்க வேண்டும்",
  },
  loanAssistanceLabel: {
    en: "Indicative Loan Assistance (Up to 90%)",
    hi: "अनुमानित बैंक लोन सहायता",
    hinglish: "Bank Loan Sahayata (Up to 90%)",
    mr: "अंदाजे बँक कर्ज सहाय्य",
    bn: "আনুমানিক ব্যাংক ঋণ সহায়তা (৯০% পর্যন্ত)",
    te: "అంచనా బ్యాంక్ రుణ సహాయం (90% వరకు)",
    ta: "மதிப்பிடப்பட்ட வங்கி கடன் உதவி (90% வரை)",
  },
  loanAssistanceSub: {
    en: "Indicative loan ceiling under scheme (subject to lender appraisal)",
    hi: "बैंक या वित्तीय संस्थान द्वारा अधिकतम संभावित राशि (सत्यापन अधीन)",
    hinglish: "Bank dwara milne yogya anumanit rashi",
    mr: "बँकेकडून मिळणारी संभाव्य कमाल रक्कम (पडताळणी अधीन)",
    bn: "ব্যাংক বা আর্থিক প্রতিষ্ঠান থেকে সম্ভাব্য সর্বোচ্চ ঋণ (যাচাইসাপেক্ষ)",
    te: "బ్యాంక్ ద్వారా గరిష్ట సంభావ్య రుణం (పరిశీలనకు లోబడి)",
    ta: "வங்கி மூலம் கிடைக்கக்கூடிய அதிகபட்ச சாத்தியமான தொகை",
  },
  interestTenureLabel: {
    en: "Interest Rate & Tenure",
    hi: "ब्याज दर व अवधि",
    hinglish: "Interest Rate aur Tenure",
    mr: "व्याज दर आणि कालावधी",
    bn: "সুদের হার ও পরিশোধের মেয়াদ",
    te: "వడ్డీ రేటు & కాలపరిమితి",
    ta: "வட்டி விகிதம் மற்றும் கால அளவு",
  },
  notApplicable: {
    en: "Not applicable",
    hi: "लागू नहीं",
    hinglish: "Laagu nahi",
    mr: "लागू नाही",
    bn: "প্রযোজ্য নয়",
    te: "వర్తించదు",
    ta: "பொருந்தாது",
  },
  applicationStepsTitle: {
    en: "Application Procedure Steps",
    hi: "आवेदन के चरण",
    hinglish: "Application Steps",
    mr: "अर्जाचे टप्पे",
    bn: "আবেদনের ধাপসমূহ",
    te: "దరఖాస్తు విధానం",
    ta: "விண்ணப்ப நடைமுறை படிகள்",
  },
  applicationStepsDesc: {
    en: "Official step-by-step procedure to apply for credit and subsidies under this scheme",
    hi: "योजना के तहत लोन और सहायता प्राप्त करने की क्रमबद्ध प्रक्रिया",
    hinglish: "Scheme ke tehat loan paane ka step-by-step tareeka",
    mr: "योजनेअंतर्गत कर्ज मिळविण्याची पायरी-दर-पायरी पद्धत",
    bn: "এই প্রকল্পের আওতায় ঋণ ও ভর্তুকির জন্য ধাপে ধাপে আবেদনের নিয়ম",
    te: "ఈ పథకం కింద రుణం & రాయితీ పొందే క్రమబద్ధమైన విధానం",
    ta: "இத்திட்டத்தின் கீழ் கடன் மற்றும் மானியம் பெறுவதற்கான வழிமுறைகள்",
  },
  requiredDocsTitle: {
    en: "Required Documents Checklist",
    hi: "ज़रूरी कागज़ातों की सूची",
    hinglish: "Zaroori Documents Checklist",
    mr: "आवश्यक कागदपत्रांची यादी",
    bn: "প্রয়োজনীয় নথিপত্রের তালিকা",
    te: "అవసరమైన పత్రాల జాబితా",
    ta: "தேவையான ஆவணங்களின் பட்டியல்",
  },
  requiredDocsDesc: {
    en: "Official document checklist required by financing institutions for this scheme",
    hi: "बैंक जाने या ऑनलाइन आवेदन से पहले ये दस्तावेज़ ज़रूर तैयार रखें",
    hinglish: "Bank jaane se pehle ye documents ready rakhein",
    mr: "बँकेत जाण्यापूर्वी ही कागदपत्रे नक्की तयार ठेवा",
    bn: "ব্যাংকে যাওয়ার পূর্বে এই সকল নথিপত্র প্রস্তুত রাখুন",
    te: "బ్యాంకుకు వెళ్లే ముందు ఈ పత్రాలను సిద్ధంగా ఉంచుకోండి",
    ta: "வங்கிக்கு செல்வதற்கு முன் இந்த ஆவணங்களை தயார் செய்து கொள்ளவும்",
  },
  docItemHelp: {
    en: "Required for identity, eligibility & bank appraisal",
    hi: "सत्यापन एवं बैंक लोन प्रोसेसिंग हेतु आवश्यक",
    hinglish: "Verification aur loan process ke liye zaroori",
    mr: "पडताळणी आणि बँक कर्ज प्रक्रियेसाठी आवश्यक",
    bn: "পরিচয় যাচাই এবং ব্যাংক ঋণ প্রক্রিয়ার জন্য আবশ্যক",
    te: "ధృవీకరణ మరియు బ్యాంక్ రుణ ప్రక్రియకు అవసరం",
    ta: "சரிபார்ப்பு மற்றும் கடன் செயலாக்கத்திற்கு அவசியமானது",
  },
  officialSourceLabel: {
    en: "Official Source: ",
    hi: "आधिकारिक स्रोत: ",
    hinglish: "Official Source: ",
    mr: "अधिकृत स्रोत: ",
    bn: "অফিসিয়াল উৎস: ",
    te: "అధికారిక మూలం: ",
    ta: "அதிகாரப்பூர்வ ஆதாரம்: ",
  },
  visitOfficialPortal: {
    en: "Visit Official Portal →",
    hi: "आधिकारिक पोर्टल देखें →",
    hinglish: "Official Portal Dekhein →",
    mr: "अधिकृत पोर्टल पहा →",
    bn: "অফিসিয়াল পোর্টাল দেখুন →",
    te: "అధికారిక పోర్టల్ చూడండి →",
    ta: "அதிகாரப்பூர்வ தளத்தை பார்க்கவும் →",
  },
  wantToCheckEmiTitle: {
    en: "Want to check your monthly EMI?",
    hi: "जानना चाहते हैं महीने की किश्त कितनी आएगी?",
    hinglish: "Check your monthly EMI?",
    mr: "मासिक हप्ता किती येईल हे जाणून घ्यायचे आहे?",
    bn: "জানতে চান প্রতি মাসে কত কিস্তি দিতে হবে?",
    te: "నెలవారీ వాయిదా (EMI) ఎంత అవుతుందో తెలుసుకోవాలనుకుంటున్నారా?",
    ta: "மாதாந்திர தவணை (EMI) எவ்வளவு வரும் என்று அறிய வேண்டுமா?",
  },
  wantToCheckEmiDesc: {
    en: "Review repayment affordability and verify that your monthly profit easily covers the EMI.",
    hi: "देखें कि लोन चुकाने के लिए हर महीने कितनी किश्त भरनी होगी और क्या आपका मुनाफा इसके लिए पर्याप्त है।",
    hinglish: "Dekhein kitni EMI aayegi aur kya profit ise cover karega.",
    mr: "कर्ज फेडण्यासाठी दरमहा किती हप्ता भरावा लागेल आणि नफा पुरेसा आहे का ते तपासा.",
    bn: "লোন পরিশোধে প্রতি মাসে কত কিস্তি হবে এবং আপনার লাভ তা মেটাতে যথেষ্ট কিনা দেখুন।",
    te: "రుణం తీర్చడానికి ఎంత EMI చెల్లించాలో మరియు మీ లాభం దానికి సరిపోతుందో లేదో చూడండి.",
    ta: "கடன் திருப்பிச் செலுத்த எவ்வளவு தவணை வரும் மற்றும் உங்கள் லாபம் போதுமானதா என்று பார்க்கவும்.",
  },
  checkEmiBtn: {
    en: "Check EMI & Schedule →",
    hi: "किश्त व ईएमआई देखें →",
    hinglish: "EMI & Schedule Dekhein →",
    mr: "हप्ता व वेळापत्रक पहा →",
    bn: "কিস্তি ও সময়সূচি দেখুন →",
    te: "వాయిదా & షెడ్యూల్ చూడండి →",
    ta: "தவணை & அட்டவணையை காண்க →",
  },

  // EMI & Repayment (Page 05)
  emiHeaderTitle: {
    en: "Loan Repayment & EMI Breakdown",
    hi: "लोन चुकाने का आसान प्लान",
    hinglish: "Loan Repayment & EMI Plan",
    mr: "कर्ज फेडण्याचा सुलभ प्लॅन",
    bn: "ঋণ পরিশোধ ও কিস্তির হিসাব",
    te: "రుణ చెల్లింపు & EMI ప్రణాళిక",
    ta: "கடன் திருப்பிச் செலுத்தும் திட்டம்",
  },
  emiHeaderDesc: {
    en: "Clear calculation of your monthly installment, interest cost, and repayment schedule.",
    hi: "हर महीने बैंक को कितनी किश्त देनी होगी और क्या आपका मुनाफा इस किश्त को आसानी से संभाल सकता है।",
    hinglish: "Har mahine kitni EMI deni hogi aur profit ise handle kar sakta hai ya nahi.",
    mr: "दरमहा बँकेला किती हप्ता द्यावा लागेल आणि नफा हा हप्ता सहज पेलू शकेल का ते पहा.",
    bn: "ব্যাংকের মাসিক কিস্তির পরিমাণ এবং আপনার লাভ থেকে তা পরিশোধের সামর্থ্য যাচাই করুন।",
    te: "ప్రతి నెలా ఎంత EMI చెల్లించాలో మరియు మీ లాభం దానిని సులభంగా భరించగలదో లెక్కించండి.",
    ta: "வங்கிக்கு செலுத்த வேண்டிய மாதாந்திர தவணை மற்றும் உங்கள் லாபத்தின் பாதுகாப்பு நிலை.",
  },
  emiAffordableVerdict: {
    en: "Comfortable & Affordable EMI",
    hi: "किश्त भरना आसान व सुरक्षित है",
    hinglish: "EMI Safe aur Aasan Hai",
    mr: "हप्ता भरणे सोपे व सुरक्षित आहे",
    bn: "কিস্তি পরিশোধ সহজ ও নিরাপদ",
    te: "వాయిదా చెల్లింపు సులభం & సురక్షితం",
    ta: "தவணை செலுத்துவது எளிதானது மற்றும் பாதுகாப்பானது",
  },
  emiCautionVerdict: {
    en: "Manage EMI with Care",
    hi: "किश्त पर नजर रखें",
    hinglish: "EMI par dhyan dein",
    mr: "हप्त्यावर लक्ष ठेवा",
    bn: "কিস্তির উপর সতর্ক নজর রাখুন",
    te: "వాయిదా చెల్లింపుపై జాగ్రత్త వహించండి",
    ta: "தவணையை கவனமாக நிர்வகிக்கவும்",
  },
  emiPortionMsg: {
    en: "Only {ratio}% of your net earnings is required for EMI.",
    hi: "आपकी कमाई का केवल {ratio}% हिस्सा किश्त में जाएगा।",
    hinglish: "Aapki kamai ka sirf {ratio}% EMI me jayega.",
    mr: "आपल्या उत्पन्नाचा फक्त {ratio}% भाग हप्त्यात जाईल.",
    bn: "আপনার আয়ের মাত্র {ratio}% অংশ কিস্তিতে যাবে।",
    te: "మీ సంపాదనలో కేవలం {ratio}% మాత్రమే వాయిదాకు సరిపోతుంది.",
    ta: "உங்கள் வருமானத்தில் {ratio}% மட்டுமே தவணைக்கு செலவாகும்.",
  },
  monthlyDueTag: {
    en: "Monthly Due",
    hi: "हर माह देय",
    hinglish: "Monthly Due",
    mr: "दरमहा देय",
    bn: "প্রতি মাসে প্রদেয়",
    te: "నెలవారీ చెల్లించాల్సినది",
    ta: "மாதாந்திர நிலுவை",
  },
  estimatedMonthlyEmi: {
    en: "Estimated Monthly EMI",
    hi: "महीने की किश्त (EMI)",
    hinglish: "Monthly EMI",
    mr: "मासिक हप्ता (EMI)",
    bn: "আনুমানিক মাসিক কিস্তি (EMI)",
    te: "అంచనా నెలవారీ వాయిదా (EMI)",
    ta: "மதிப்பிடப்பட்ட மாதாந்திர தவணை (EMI)",
  },
  interestCostTag: {
    en: "Interest Cost",
    hi: "ब्याज लागत",
    hinglish: "Byaj Lagat",
    mr: "व्याज खर्च",
    bn: "সুদের খরচ",
    te: "వడ్డీ ఖర్చు",
    ta: "வட்டி செலவு",
  },
  totalInterestPaid: {
    en: "Total Interest Paid",
    hi: "कुल ब्याज (Total Interest)",
    hinglish: "Total Interest",
    mr: "एकूण व्याज",
    bn: "পরিশোধযোগ্য মোট সুদ",
    te: "మొత్తం చెల్లించే వడ్డీ",
    ta: "மொத்த வட்டித் தொகை",
  },
  totalInterestSub: {
    en: "Cost of credit across the entire loan period",
    hi: "पूरी अवधि में कुल अतिरिक्त ब्याज",
    hinglish: "Poore loan tenure me byaj",
    mr: "संपूर्ण मुदतीतील एकूण अतिरिक्त व्याज",
    bn: "সম্পূর্ণ মেয়াদের জন্য মোট সুদের খরচ",
    te: "మొత్తం రుణ కాలంలో అయ్యే అదనపు వడ్డీ",
    ta: "முழு கடன் காலத்தில் செலுத்தும் மொத்த வட்டி",
  },
  tenureGraceTag: {
    en: "Tenure & Grace",
    hi: "अवधि व ग्रेस",
    hinglish: "Tenure aur Grace",
    mr: "मुदत व सवलत",
    bn: "মেয়াদ ও গ্রেস পিরিয়ড",
    te: "కాలపరిమితి & రాయితీ కాలం",
    ta: "கால அளவு & சலுகைக் காலம்",
  },
  totalTenureLabel: {
    en: "Total Repayment Tenure",
    hi: "लोन चुकाने का समय",
    hinglish: "Loan Repayment Tenure",
    mr: "कर्ज परतफेडीचा कालावधी",
    bn: "ঋণ পরিশোধের মোট সময়কাল",
    te: "మొత్తం రుణ కాలపరిమితి",
    ta: "மொத்த திருப்பிச் செலுத்தும் காலம்",
  },
  monthsUnit: {
    en: "Months",
    hi: "महीने",
    hinglish: "Months",
    mr: "महिने",
    bn: "মাস",
    te: "నెలలు",
    ta: "மாதங்கள்",
  },
  emiBurdenMeterTitle: {
    en: "EMI Affordability Meter",
    hi: "किश्त सुरक्षा मीटर (EMI Affordability)",
    hinglish: "EMI Safety Meter",
    mr: "हप्ता सुरक्षा मीटर",
    bn: "কিস্তি সামর্থ্য মিটার",
    te: "వాయిదా భద్రతా మీటర్",
    ta: "தவணை பாதுகாப்பு அளவுகோல்",
  },
  emiBurdenMeterSub: {
    en: "Proportion of your income used to service the monthly installment.",
    hi: "यह बताता है कि आपकी बचत में से कितना हिस्सा किश्त में जा रहा है।",
    hinglish: "Yeh batata hai ki profit ka kitna hissa EMI me ja raha hai.",
    mr: "आपल्या नफ्यातून किती हिस्सा हप्त्यात जातो ते दर्शवते.",
    bn: "আপনার আয়ের কত অংশ কিস্তিতে ব্যবহৃত হচ্ছে তা দেখায়।",
    te: "మీ ఆదాయంలో ఎంత భాగం వాయిదాకు వెళ్తుందో ఇది చూపుతుంది.",
    ta: "உங்கள் வருமானத்தில் எவ்வளவு பங்கு தவணைக்கு செலவாகிறது என்பதைக் காட்டுகிறது.",
  },
  repaymentScheduleTitle: {
    en: "Quarterly Repayment Schedule",
    hi: "तिमाही किश्त सारणी (Repayment Schedule)",
    hinglish: "Repayment Schedule",
    mr: "त्रैमासिक परतफेड सारणी",
    bn: "ত্রৈমাসিক কিস্তি পরিশোধের সময়সূচি",
    te: "త్రైమాసిక రుణ చెల్లింపు పట్టిక",
    ta: "காலாண்டு கடன் திருப்பிச் செலுத்தும் அட்டவணை",
  },
  repaymentScheduleDesc: {
    en: "Quarter-by-quarter breakdown of installment, interest, and outstanding principal",
    hi: "हर 3 महीने (तिमाही) के अनुसार किश्त, ब्याज और बचा हुआ लोन देखें",
    hinglish: "Quarter ke hisaab se EMI aur outstanding principal",
    mr: "प्रत्येक 3 महिन्यांनुसार हप्ता, व्याज आणि शिल्लक कर्ज पहा",
    bn: "প্রতি তিন মাসের কিস্তি, সুদ এবং অবশিষ্ট ঋণের বিবরণী",
    te: "ప్రతి 3 నెలలకు వాయిదా, వడ్డీ & మిగిలిన అసలు వివరాలు",
    ta: "ஒவ்வொரு 3 மாத தவணை, வட்டி மற்றும் மீதமுள்ள கடன் விவரங்கள்",
  },

  // Market & Hyper-local (Page 06)
  customerRadiusTitle: {
    en: "Customer Radius & Coverage",
    hi: "ग्राहक पहुँच का दायरा (Radius)",
    hinglish: "Customer Radius",
    mr: "ग्राहक पोहोच मर्यादा",
    bn: "ক্রেতা পরিসর ও বিস্তার",
    te: "వినియోగదారుల పరిధి",
    ta: "வாடிக்கையாளர் எல்லை",
  },
  customerRadiusSub: {
    en: "Primary and extended village reach",
    hi: "आप कहाँ-कहाँ तक सामान बेच सकते हैं",
    hinglish: "Aap kahan tak maal bech sakte hain",
    mr: "आपण कुठे कुठे माल विकू शकता",
    bn: "আপনি কত দূর পর্যন্ত পণ্য বিক্রি করতে পারেন",
    te: "మీరు ఎక్కడి వరకు సరుకు అమ్ముకోవచ్చు",
    ta: "நீங்கள் எங்கெல்லாம் பொருட்களை விற்க முடியும்",
  },
  bestSellingChannelsTitle: {
    en: "Best Selling & Distribution Channels",
    hi: "बिक्री के प्रमुख माध्यम (Channels)",
    hinglish: "Best Selling Channels",
    mr: "विक्रीचे प्रमुख मार्ग",
    bn: "বিক্রয়ের সেরা মাধ্যমসমূহ",
    te: "ఉత్తమ విక్రయ మార్గాలు",
    ta: "சிறந்த விற்பனை வழிகள்",
  },
  bestSellingChannelsSub: {
    en: "Where & how to distribute your products",
    hi: "गाँव में माल आसानी से बेचने के तरीके",
    hinglish: "Gaon me maal bechne ke tareeqe",
    mr: "गावात माल सहज विकण्याचे मार्ग",
    bn: "স্থানীয় বাজারে পণ্য সহজে বিক্রির কৌশল",
    te: "గ్రామంలో సరుకు సులభంగా అమ్ముకునే మార్గాలు",
    ta: "கிராமத்தில் பொருட்களை எளிதாக விற்பனை செய்யும் வழிகள்",
  },
  localMarketAdvisoryTitle: {
    en: "Local Market Advisory Summary",
    hi: "स्थानीय बाज़ार सलाह (Market Advisory)",
    hinglish: "Local Market Advisory",
    mr: "स्थानिक बाजार सल्ला",
    bn: "স্থানীয় বাজার পরামর্শ সারসংক্ষেপ",
    te: "స్థానిక మార్కెట్ సలహా సారాంశం",
    ta: "உள்ளூர் சந்தை ஆலோசனை சுருக்கம்",
  },
  liveOsmGrounded: {
    en: "Live OSM Grounded",
    hi: "लाइव डेटा आधारित",
    hinglish: "Live Data Grounded",
    mr: "थेट डेटा आधारित",
    bn: "লাইভ তথ্যভিত্তিক",
    te: "ప్రత్యక్ష డేటా ఆధారిత",
    ta: "நேரலை தரவு அடிப்படையிலானது",
  },
  localStrategyTipTitle: {
    en: "Local Market Strategy Recommendation:",
    hi: "स्थानीय बाज़ार की विशेष सलाह:",
    hinglish: "Market Strategy Tip:",
    mr: "स्थानिक बाजारपेठेची विशेष सूचना:",
    bn: "স্থানীয় বাজার কৌশলগত পরামর্শ:",
    te: "స్థానిక మార్కెట్ వ్యూహం:",
    ta: "உள்ளூர் சந்தை உத்தி ஆலோசனை:",
  },

  // Opportunities (Page 07)
  unservedNichesTitle: {
    en: "Unserved Local Niches & Growth Avenues",
    hi: "कमाई बढ़ाने के अनूठे मौके",
    hinglish: "Naye Business Mauke",
    mr: "कमाई वाढवण्याच्या अनोख्या संधी",
    bn: "আয় বৃদ্ধির অনন্য সুযোগসমূহ",
    te: "ఆదాయం పెంచుకోవడానికి ప్రత్యేక అవకాశాలు",
    ta: "வருமானத்தை பெருக்கும் தனித்துவமான வாய்ப்புகள்",
  },
  unservedNichesSub: {
    en: "Identified local gaps where customer demand exists but few or no local competitors currently operate.",
    hi: "गाँव में ऐसे क्षेत्र जहाँ अन्य दुकानदार ध्यान नहीं दे रहे हैं और आप कम खर्चे में ज़्यादा कमा सकते हैं।",
    hinglish: "Aise areas jahan competition kam hai aur profit zyada ho sakta hai.",
    mr: "अशा जागा जिथे इतर व्यावसायिक लक्ष देत नाहीत आणि आपण कमी खर्चात जास्त कमवू शकता.",
    bn: "যেসব ক্ষেত্রে স্থানীয় চাহিদা আছে কিন্তু প্রতিযোগিতা কম, ফলে আপনি সহজেই লাভবান হতে পারেন।",
    te: "ఇతర వ్యాపారులు దృష్టి పెట్టని మరియు తక్కువ ఖర్చుతో ఎక్కువ సంపాదించగల అవకాశాలు.",
    ta: "போட்டியாளர்கள் இல்லாத, அதிக லாபம் ஈட்டக்கூடிய உள்ளூர் வணிக வாய்ப்புகள்.",
  },
  highPotentialNiches: {
    en: "High-Potential Niche Opportunities",
    hi: "पहचाने गए नए मौके (Candidate Niches)",
    hinglish: "High-Potential Niches",
    mr: "ओळखलेल्या नवीन संधी",
    bn: "চিহ্নিত উচ্চ-সম্ভাব্য সুযোগ",
    te: "గుర్తించిన సరికొత్త అవకాశాలు",
    ta: "அடையாளம் காணப்பட்ட புதிய வாய்ப்புகள்",
  },
  marketEvidenceReasoning: {
    en: "Market Evidence & Reasoning",
    hi: "यह मौका क्यों सही है? (Evidence)",
    hinglish: "Ground Evidence",
    mr: "ही संधी योग्य का आहे? (पुरावा)",
    bn: "এই সুযোগ কেন লাভজনক? (প্রমাণ)",
    te: "ఈ అవకాశం ఎందుకు సరైనది? (ఆధారం)",
    ta: "இந்த வாய்ப்பு ஏன் சரியானது? (சான்று)",
  },
  futureExpansionRoads: {
    en: "Future Expansion Roads",
    hi: "विस्तार के रास्ते (Growth Areas)",
    hinglish: "Expansion Roads",
    mr: "व्यवसाय विस्ताराचे मार्ग",
    bn: "ভবিষ্যত ব্যবসা সম্প্রসারণের পথ",
    te: "భవిష్యత్ విస్తరణ మార్గాలు",
    ta: "எதிர்கால வணிக விரிவாக்க வழிகள்",
  },
  firstStepAdvice: {
    en: "First Step Advice:",
    hi: "शुरुआती सलाह:",
    hinglish: "First Step Advice:",
    mr: "सुरुवातीचा सल्ला:",
    bn: "প্রাথমিক পরামর্শ:",
    te: "ప్రారంభ సలహా:",
    ta: "ஆரம்ப ஆலோசனை:",
  },

  // SWOT (Page 08)
  swotHeaderTitle: {
    en: "SWOT Analysis for Micro-Enterprise",
    hi: "व्यापार की असली ताकत व सावधानियाँ",
    hinglish: "Business SWOT Analysis",
    mr: "व्यवसायाची खरी ताकद व सावधगिरी",
    bn: "ব্যবসার শক্তি, দুর্বলতা ও সতর্কতা (SWOT)",
    te: "వ్యాపార బలాలు & తీసుకోవాల్సిన జాగ్రత్తలు",
    ta: "வணிகத்தின் பலம் & எச்சரிக்கைகள் (SWOT)",
  },
  swotHeaderSub: {
    en: "Clear audit of your business advantages, internal gaps, market opportunities, and external risks.",
    hi: "जानिए आपकी मजबूत बातें क्या हैं और किन कमज़ोरियों पर पहले से सतर्क रहना है।",
    hinglish: "Janiye business ki taqat aur kamzoriyon ko.",
    mr: "आपल्या व्यवसायाचे फायदे आणि कोणत्या मर्यादांवर लक्ष ठेवायचे ते जाणून घ्या.",
    bn: "আপনার ব্যবসায়িক সুবিধা এবং দুর্বল দিকগুলো আগে থেকেই জেনে সতর্ক থাকুন।",
    te: "మీ వ్యాపార బలాలు మరియు జాగ్రత్త వహించాల్సిన బలహీనతలను తెలుసుకోండి.",
    ta: "உங்கள் தொழில் பலம் மற்றும் முன்கூட்டியே கவனிக்க வேண்டிய பலவீனங்களை அறியவும்.",
  },
  strengthsTitle: {
    en: "Strengths (Your Advantages)",
    hi: "ताकत (Strengths)",
    hinglish: "Taqat (Strengths)",
    mr: "सामर्थ्य (Strengths)",
    bn: "শক্তি (Strengths)",
    te: "బలాలు (Strengths)",
    ta: "பலம் (Strengths)",
  },
  strengthsSub: {
    en: "Key assets & local advantages",
    hi: "आपकी खासियत जो आपको आगे रखेगी",
    hinglish: "Khaas baatein jo aage rakhein",
    mr: "आपले वैशिष्ट्य जे आपल्याला पुढे ठेवेल",
    bn: "আপনার বিশেষ সুবিধা যা আপনাকে এগিয়ে রাখবে",
    te: "మిమ్మల్ని ముందుకు నడిపించే ప్రత్యేకతలు",
    ta: "உங்களை முன்னிலைப்படுத்தும் சிறப்பம்சங்கள்",
  },
  weaknessesTitle: {
    en: "Weaknesses (Areas to Improve)",
    hi: "कमज़ोरी (Weaknesses)",
    hinglish: "Kamzori (Weaknesses)",
    mr: "मर्यादा (Weaknesses)",
    bn: "দুর্বলতা (Weaknesses)",
    te: "బలహీనతలు (Weaknesses)",
    ta: "பலவீனம் (Weaknesses)",
  },
  weaknessesSub: {
    en: "Internal limitations to watch out for",
    hi: "जहाँ आपको सुधार करने की ज़रूरत है",
    hinglish: "Jahan sudhar ki zaroorat hai",
    mr: "जिथे सुधारणा करण्याची गरज आहे",
    bn: "যেসব ক্ষেত্রে উন্নতি প্রয়োজন",
    te: "మెరుగుపరుచుకోవాల్సిన అంతర్గత అంశాలు",
    ta: "மேம்படுத்த வேண்டிய பகுதிகள்",
  },
  opportunitiesTitle: {
    en: "Opportunities (Growth Roads)",
    hi: "नए रास्ते (Opportunities)",
    hinglish: "Naye Raaste (Opportunities)",
    mr: "संधी (Opportunities)",
    bn: "সুযোগ (Opportunities)",
    te: "అవకాశాలు (Opportunities)",
    ta: "வாய்ப்புகள் (Opportunities)",
  },
  opportunitiesSub: {
    en: "External chances for higher revenue",
    hi: "भविष्य में और ज़्यादा कमाने के मौके",
    hinglish: "Bhavishya me kamai badhane ke mauke",
    mr: "भविष्यात अधिक नफा मिळवण्याच्या संधी",
    bn: "ভবিষ্যতে আয় বৃদ্ধির সম্ভাবনা",
    te: "భవిష్యత్తులో అధిక ఆదాయం పొందే అవకాశాలు",
    ta: "வருமானத்தை உயர்த்தும் எதிர்கால வாய்ப்புகள்",
  },
  threatsTitle: {
    en: "Threats (Risks to Guard Against)",
    hi: "बाहरी खतरे (Threats)",
    hinglish: "Bahari Khatre (Threats)",
    mr: "धोके (Threats)",
    bn: "বাহ্যিক ঝুঁকি (Threats)",
    te: "ముప్పులు (Threats)",
    ta: "அச்சுறுத்தல்கள் (Threats)",
  },
  threatsSub: {
    en: "External factors that could hurt profit",
    hi: "मौसम, मंडी या उधारी जैसे खतरे",
    hinglish: "Mausam, mandi ya udhari ke khatre",
    mr: "हवामान, बाजार किंवा उधारी यासारखे धोके",
    bn: "আবহাওয়া, বাজার দর বা বাকির ঝুঁকি",
    te: "వాతావరణం, మార్కెట్ లేదా అప్పుల ప్రమాదం",
    ta: "வானிலை, சந்தை அல்லது கடன் ஆபத்துகள்",
  },
  goldenRuleTitle: {
    en: "Golden Rule for Village Enterprise:",
    hi: "व्यापारी के लिए महत्वपूर्ण नियम:",
    hinglish: "Golden Rule:",
    mr: "व्यावसायिकासाठी महत्त्वाचा नियम:",
    bn: "গ্রামীণ ব্যবসার জন্য সুবর্ণ নিয়ম:",
    te: "గ్రామీణ వ్యాపారానికి ముఖ్యమైన నియమం:",
    ta: "கிராமப்புற தொழிலுக்கான பொன்னான விதி:",
  },

  // Risk (Page 09)
  riskHeaderTitle: {
    en: "Risk Assessment & Loss Prevention",
    hi: "व्यापार की सुरक्षा व जोखिम मीटर",
    hinglish: "Risk Assessment & Safety Meter",
    mr: "व्यवसाय सुरक्षा व जोखीम मापक",
    bn: "ঝুঁকি মূল্যায়ন ও ক্ষতি প্রতিরোধ নির্দেশিকা",
    te: "రిస్క్ అంచనా & నష్ట నివారణ",
    ta: "ஆபத்து மதிப்பீடு & இழப்பு தடுப்பு",
  },
  riskHeaderSub: {
    en: "Clear audit of operational risks, financial safety buffers, and practical ways to protect your capital.",
    hi: "यह जांचें कि आपके व्यापार में नुकसान होने की कितनी संभावना है और किन सावधानियों से नुकसान से बचा जा सकता है।",
    hinglish: "Nuksan ke risk aur us se bachne ke tareeqe dekhein.",
    mr: "व्यवसायात नुकसान होण्याची शक्यता किती आहे आणि सावधगिरी कशी बाळगावी ते तपासा.",
    bn: "ব্যবসায়ে ক্ষতির সম্ভাবনা কতটুকু এবং কীভাবে তা এড়ানো যায় তা জেনে নিন।",
    te: "వ్యాపారంలో నష్టాల సంభావ్యత మరియు మూలధనాన్ని కాపాడుకునే మార్గాలను పరిశీలించండి.",
    ta: "தொழிலில் நஷ்டம் ஏற்பட வாய்ப்புள்ளதா மற்றும் மூலதனத்தை பாதுகாக்கும் வழிகள்.",
  },
  lowRiskVerdict: {
    en: "Low Risk - Safe Proposition",
    hi: "कम जोखिम - सुरक्षित व्यापार (Low Risk)",
    hinglish: "Low Risk - Safe Proposition",
    mr: "कमी जोखीम - सुरक्षित व्यवसाय",
    bn: "স্বল্প ঝুঁকি - নিরাপদ ব্যবসা",
    te: "తక్కువ రిస్క్ - సురక్షితమైన వ్యాపారం",
    ta: "குறைந்த ஆபத்து - பாதுகாப்பான வணிகம்",
  },
  moderateRiskVerdict: {
    en: "Moderate Risk - Caution Advised",
    hi: "मध्यम जोखिम - संभल कर चलें (Moderate Risk)",
    hinglish: "Moderate Risk - Dhyan dein",
    mr: "मध्यम जोखीम - सावधगिरी बाळगा",
    bn: "মাঝারি ঝুঁকি - সতর্কতা অবলম্বন করুন",
    te: "మధ్యస్థ రిస్క్ - జాగ్రత్త అవసరం",
    ta: "மிதமான ஆபத்து - எச்சரிக்கை தேவை",
  },
  riskMeterTitle: {
    en: "Enterprise Safety Gauge",
    hi: "सुरक्षा थर्मामीटर (Risk Meter)",
    hinglish: "Safety Meter",
    mr: "सुरक्षा मापक",
    bn: "ব্যবসা নিরাপত্তা থার্মোমিটার",
    te: "భద్రతా గేజ్ (రిస్క్ మీటర్)",
    ta: "பாதுகாப்பு அளவுகோல்",
  },

  // Report Card (Page 11)
  reportHeaderTitle: {
    en: "Printable Business Feasibility Dossier",
    hi: "बैंक व पंचायत हेतु व्यापार पर्चा",
    hinglish: "Vyapar Parcha Dossier",
    mr: "बँक व पंचायतीसाठी व्यवसाय अहवाल",
    bn: "ব্যাংক ও পঞ্চায়েতের জন্য ব্যবসার প্রতিবেদন (পর্চা)",
    te: "బ్యాంక్ & పంచాయతీ కోసం వ్యాపార నివేదిక",
    ta: "வங்கி & பஞ்சாயத்துக்கான திட்ட அறிக்கை (பர்ச்சா)",
  },
  reportHeaderSub: {
    en: "Formal 1-page project card designed to show to local bank managers, CSC centers, or Gram Panchayat.",
    hi: "यह पर्चा आप सीधे प्रिंट करके या फोन में सेव करके बैंक मैनेजर या जन सेवा केंद्र में दिखा सकते हैं।",
    hinglish: "Yeh parcha bank manager ya CSC center me dikha sakte hain.",
    mr: "हा अहवाल आपण थेट प्रिंट करून बँक व्यवस्थापक किंवा ग्राहक सेवा केंद्रात दाखवू शकता.",
    bn: "এই প্রতিবেদনটি সরাসরি প্রিন্ট করে ব্যাংক ম্যানেজার বা সিএসসি কেন্দ্রে জমা দিতে পারেন।",
    te: "ఈ నివేదికను నేరుగా ముద్రించి బ్యాంక్ మేనేజర్ లేదా సేవా కేంద్రంలో చూపించవచ్చు.",
    ta: "இந்த அறிக்கையை அச்சிட்டு வங்கி மேலாளர் அல்லது பொது சேவை மையத்தில் காண்பிக்கலாம்.",
  },
  printParchaBtn: {
    en: "Print / Save PDF Report",
    hi: "पर्चा प्रिंट करें (Print Parcha)",
    hinglish: "Print Parcha",
    mr: "अहवाल प्रिंट करा (PDF)",
    bn: "প্রতিবেদন প্রিন্ট করুন (PDF)",
    te: "నివేదిక ముద్రించండి (PDF)",
    ta: "அறிக்கையை அச்சிடுக (PDF)",
  },
  parchaBoardSub: {
    en: "Rural Micro-Enterprise Advisory Board • MSME Aligned",
    hi: "ग्रामीण उद्योग संवर्धन मंच • भारत सरकार दिशा-निर्देश",
    hinglish: "Rural Enterprise Board • MSME Aligned",
    mr: "ग्रामीण उद्योग संवर्धन मंच • शासन मार्गदर्शक तत्त्वे",
    bn: "গ্রামীণ ক্ষুদ্র উদ্যোগ সহায়তা বোর্ড • এমএসএমই নির্দেশিকা",
    te: "గ్రామీణ సూక్ష్మ పరిశ్రమల మండలి • MSME మార్గదర్శకాలు",
    ta: "கிராமப்புற தொழில் வழிகாட்டல் வாரியம் • MSME இணக்கமானது",
  },
  parchaDocTitle: {
    en: "Micro-Enterprise Feasibility Project Card",
    hi: "व्यापार व्यवहार्यता व प्रोजेक्ट रिपोर्ट",
    hinglish: "Project Feasibility Report",
    mr: "व्यवसाय व्यवहार्यता व प्रकल्प अहवाल",
    bn: "ক্ষুদ্র ব্যবসা সম্ভাব্যতা ও প্রকল্প রিপোর্ট",
    te: "సూక్ష్మ వ్యాపార సాధ్యత ప్రాజెక్ట్ నివేదిక",
    ta: "குறுந்தொழில் சாத்தியக்கூறு திட்ட அறிக்கை",
  },
  applicantSectionTitle: {
    en: "Applicant & Proposed Enterprise Details",
    hi: "उद्यमी व व्यापार की जानकारी",
    hinglish: "Applicant aur Business Jankari",
    mr: "उद्योजक व व्यवसायाची माहिती",
    bn: "উদ্যোক্তা ও প্রস্তাবিত ব্যবসার বিবরণ",
    te: "దరఖాస్తుదారు & వ్యాపార వివరాలు",
    ta: "விண்ணப்பதாரர் & தொழில் விவரங்கள்",
  },
  financialSummarySectionTitle: {
    en: "Financial Viability Statement",
    hi: "वित्तीय हिसाब-किताब (Financial Summary)",
    hinglish: "Financial Summary",
    mr: "आर्थिक व्यवहार्यता विवरण",
    bn: "আর্থিক সম্ভাব্যতা বিবৃতি",
    te: "ఆర్థిక లాభదాయకత ప్రకటన",
    ta: "நிதி சாத்தியக்கூறு அறிக்கை",
  },
  bankCreditSectionTitle: {
    en: "Bank Financing & Scheme Alignment",
    hi: "बैंक लोन व सरकारी योजना (Bank Credit)",
    hinglish: "Bank Credit aur Scheme",
    mr: "बँक कर्ज व सरकारी योजना",
    bn: "ব্যাংক অর্থায়ন ও সরকারি প্রকল্প",
    te: "బ్యాంక్ రుణం & ప్రభుత్వ పథకం",
    ta: "வங்கி நிதி உதவி & அரசு திட்டம்",
  },
  applicantSignature: {
    en: "Applicant / Promoter Signature",
    hi: "उद्यमी / आवेदक के हस्ताक्षर",
    hinglish: "Applicant Signature",
    mr: "उद्योजक / अर्जदाराची स्वाक्षरी",
    bn: "উদ্যোক্তা / আবেদনকারীর স্বাক্ষর",
    te: "దరఖాస్తుదారు సంతకం",
    ta: "விண்ணப்பதாரர் கையொப்பம்",
  },
  bankManagerSignature: {
    en: "Branch Manager / Credit Officer",
    hi: "बैंक अधिकारी / शाखा प्रबंधक",
    hinglish: "Branch Manager / Credit Officer",
    mr: "शाखा व्यवस्थापक / कर्ज अधिकारी",
    bn: "শাখা ব্যবস্থাপক / ঋণ কর্মকর্তা",
    te: "బ్రాంచ్ మేనేజర్ / క్రెడిట్ అధికారి",
    ta: "வங்கி மேலாளர் / கடன் அதிகாரி",
  },
  signatureAndSeal: {
    en: "Signature & Seal",
    hi: "हस्ताक्षर व शाखा मोहर",
    hinglish: "Signature aur Stamp",
    mr: "स्वाक्षरी आणि शिक्का",
    bn: "স্বাক্ষর ও অফিশিয়াল সিল",
    te: "సంతకం & ముద్ర",
    ta: "கையொப்பம் & முத்திரை",
  },
  parchaFooterDisclaimer: {
    en: "Computer-generated feasibility dossier generated via Vyapaa₹ AI. Aligned with PMEGP & Mudra financing parameters.",
    hi: "यह पर्चा Vyapaa₹ AI द्वारा तैयार किया गया है। यह एमएसएमई व मुद्रा लोन दिशा-निर्देशों के अनुरूप अनुमानित वित्तीय गणना दर्शाता है।",
    hinglish: "Vyapaa₹ AI dwara taiyar kiya gaya parcha. MSME & Mudra loan parameters ke anuroop.",
    mr: "हा अहवाल Vyapaa₹ AI द्वारे तयार केला आहे. हे MSME आणि मुद्रा कर्ज नियमांनुसार अंदाजित आर्थिक आकडे दर्शवते.",
    bn: "এই প্রতিবেদনটি Vyapaa₹ AI দ্বারা প্রস্তুত। এটি পিএমইজিপি ও মুদ্রা ঋণ নির্দেশিকা অনুসারে হিসাবকৃত।",
    te: "ఈ నివేదిక Vyapaa₹ AI ద్వారా రూపొందించబడింది. ఇది PMEGP & ముద్రా నిబంధనలకు అనుగుణంగా ఉంది.",
    ta: "இந்த அறிக்கை Vyapaa₹ AI மூலம் உருவாக்கப்பட்டது. இது PMEGP மற்றும் முத்ரா வழிகாட்டுதல்களுக்கு உட்பட்டது.",
  },
  selectSidePage: {
    en: "Select Side Page",
    hi: "पेज चुनें (Side Pages)",
    hinglish: "Page Chunein",
    mr: "पृष्ठ निवडा",
    bn: "পৃষ্ঠা নির্বাচন করুন",
    te: "పేజీని ఎంచుకోండి",
    ta: "பக்கத்தைத் தேர்ந்தெடுக்கவும்",
  },
  pagesCount: {
    en: "Pages",
    hi: "पेज",
    hinglish: "Pages",
    mr: "पृष्ठे",
    bn: "পৃষ্ঠা",
    te: "పేజీలు",
    ta: "பக்கங்கள்",
  },
  needHelp: {
    en: "Need Help?",
    hi: "मदद चाहिए?",
    hinglish: "Madad Chahiye?",
    mr: "मदत हवी आहे का?",
    bn: "সাহায্য প্রয়োজন?",
    te: "సహాయం కావాలా?",
    ta: "உதவி தேவையா?",
  },
  sidebarHelpDesc: {
    en: "Click 'Listen in Voice' to hear explanations in simple speech.",
    hi: "ऊपर 'बोलकर सुनाएं' बटन दबाकर हर पेज की बात अपनी भाषा में सुनें।",
    hinglish: "'Listen in Voice' click karke aasan aawaaz mein sunein.",
    mr: "सोप्या भाषेत स्पष्टीकरण ऐकण्यासाठी 'बोलून ऐका' वर क्लिक करा.",
    bn: "সহজ ভাষায় ব্যাখ্যা শুনতে 'ভয়েস শুনুন' এ ক্লিক করুন।",
    te: "సులభమైన మాటల్లో వినడానికి 'వాయిస్ వినండి' పై క్లిక్ చేయండి.",
    ta: "எளிய குரலில் விளக்கங்களைக் கேட்க 'குரலில் கேளுங்கள்' என்பதைக் கிளிக் செய்யவும்.",
  },
  requiresVerification: {
    en: "Requires Verification",
    hi: "सत्यापन आवश्यक",
    hinglish: "Verification Required",
    mr: "पडताळणी आवश्यक",
    bn: "যাচাইকরণ প্রয়োজন",
    te: "ధృవీకరణ అవసరం",
    ta: "சரிபார்ப்பு தேவை",
  },
};

// ================= DYNAMIC TRANSLATION: COMMON BUSINESS ITEMS =================
const DYNAMIC_PHRASE_DICTIONARY: Record<string, Record<string, string>> = {
  // Application Steps
  "Prepare business/project information and feasibility report": {
    en: "Prepare business/project information and feasibility report",
    hi: "व्यवसाय/प्रोजेक्ट की जानकारी व व्यवहार्यता रिपोर्ट (पर्चा) तैयार करें",
    hinglish: "Business information aur feasibility report taiyar karein",
    mr: "व्यवसाय/प्रकल्पाची माहिती व व्यवहार्यता अहवाल तयार करा",
    bn: "ব্যবসা/প্রকল্পের তথ্য এবং সম্ভাব্যতা প্রতিবেদন প্রস্তুত করুন",
    te: "వ్యాపార/ప్రాజెక్ట్ సమాచారం మరియు సాధ్యత నివేదికను సిద్ధం చేయండి",
    ta: "வணிக/திட்ட தகவல் மற்றும் சாத்தியக்கூறு அறிக்கையை தயார் செய்யவும்",
  },
  "Submit application with KYC documents to eligible Member Lending Institution": {
    en: "Submit application with KYC documents to eligible Member Lending Institution",
    hi: "पात्र बैंक या वित्तीय संस्थान में केवाईसी दस्तावेज़ों के साथ आवेदन जमा करें",
    hinglish: "Bank me KYC documents ke sath aavedan jama karein",
    mr: "पात्र बँक किंवा वित्तीय संस्थेत केवायसी कागदपत्रांसह अर्ज सादर करा",
    bn: "যোগ্য ব্যাংক বা আর্থিক প্রতিষ্ঠানে কেওয়াইসি নথিপত্র সহ আবেদন জমা দিন",
    te: "అర్హత కలిగిన బ్యాంకులో కేవైసీ పత్రాలతో దరఖాస్తును సమర్పించండి",
    ta: "தகுதியான வங்கியில் கேஒய்சி ஆவணங்களுடன் விண்ணப்பத்தை சமர்ப்பிக்கவும்",
  },
  "Undergo lender appraisal and field verification": {
    en: "Undergo lender appraisal and field verification",
    hi: "बैंक अधिकारी द्वारा प्रोजेक्ट मूल्यांकन व ज़मीनी सत्यापन पूरा करवाएं",
    hinglish: "Bank dwara field verification aur appraisal karwayen",
    mr: "बँकेकडून प्रकल्प मूल्यांकन आणि प्रत्यक्ष जागेची पडताळणी करून घ्या",
    bn: "ব্যাংক কর্মকর্তার প্রকল্প মূল্যায়ন এবং সরেজমিন যাচাইকরণ সম্পন্ন করুন",
    te: "బ్యాంక్ ద్వారా ప్రాజెక్ట్ పరిశీలన మరియు ఫీల్డ్ వెరిఫికేషన్ చేయించుకోండి",
    ta: "வங்கி மதிப்பீடு மற்றும் நேரடி கள சரிபார்ப்பை மேற்கொள்ளுங்கள்",
  },
  "Loan sanction and fund disbursement to enterprise account": {
    en: "Loan sanction and fund disbursement to enterprise account",
    hi: "लोन स्वीकृति पत्र प्राप्त करें और व्यावसायिक खाते में राशि ट्रांसफर करवाएं",
    hinglish: "Loan sanction hone par account me paise transfer karwayen",
    mr: "कर्ज मंजुरी पत्र मिळवा आणि व्यवसाय खात्यात निधी जमा करून घ्या",
    bn: "ঋণ অনুমোদন এবং ব্যবসায়িক অ্যাকাউন্টে অর্থ ছাড় করান",
    te: "రుణ ఆమోదం పొంది వ్యాపార ఖాతాలోకి నిధులను జమ చేయించుకోండి",
    ta: "கடன் ஒப்புதல் பெற்று வணிக கணக்கில் நிதியை பெற்றுக் கொள்ளுங்கள்",
  },

  // Documents
  "Aadhaar Card (Identity & address verification)": {
    en: "Aadhaar Card (Identity & address verification)",
    hi: "आधार कार्ड (पहचान व पते का प्रमाण)",
    hinglish: "Aadhaar Card (Identity & Address Proof)",
    mr: "आधार कार्ड (ओळख व पत्त्याचा पुरावा)",
    bn: "আধার কার্ড (পরিচয় ও ঠিকানার প্রমাণপত্র)",
    te: "ఆధార్ కార్డు (గుర్తింపు & చిరునామా ధృవీకరణ)",
    ta: "ஆதார் அட்டை (அடையாளம் & முகவரி சான்று)",
  },
  "PAN Card (Financial verification)": {
    en: "PAN Card (Financial verification)",
    hi: "पैन कार्ड (वित्तीय पहचान प्रमाण)",
    hinglish: "PAN Card (Financial verification)",
    mr: "पॅन कार्ड (आर्थिक पडताळणी)",
    bn: "প্যান কার্ড (আর্থিক শনাক্তকরণ প্রমাণপত্র)",
    te: "పాన్ కార్డు (ఆర్థిక ధృవీకరణ)",
    ta: "பான் அட்டை (நிதி சரிபார்ப்பு)",
  },
  "Bank passbook statement (Last 6 months)": {
    en: "Bank passbook statement (Last 6 months)",
    hi: "बैंक पासबुक या खाता विवरण (पिछले 6 महीने)",
    hinglish: "Bank Passbook Statement (Pichhle 6 mahine)",
    mr: "बँक पासबुक किंवा स्टेटमेंट (मागील 6 महिने)",
    bn: "ব্যাংক পাসবই বা হিসাব বিবরণী (বিগত ৬ মাস)",
    te: "బ్యాంక్ పాస్‌బుక్ స్టేట్‌మెంట్ (గత 6 నెలలు)",
    ta: "வங்கி பாஸ்புக் அறிக்கை (கடந்த 6 மாதங்கள்)",
  },
  "Business Project Report / Feasibility Parcha": {
    en: "Business Project Report / Feasibility Parcha",
    hi: "व्यापार प्रोजेक्ट रिपोर्ट / व्यवहार्यता पर्चा (Vyapaar Parcha)",
    hinglish: "Project Report / Vyapaar Parcha",
    mr: "व्यवसाय प्रकल्प अहवाल / व्यवहार्यता अहवाल (पर्चा)",
    bn: "ব্যবসা প্রকল্প রিপোর্ট / সম্ভাব্যতা প্রতিবেদন (পর্চা)",
    te: "వ్యాపార ప్రాజెక్ట్ నివేదిక / సాధ్యత పర్చా",
    ta: "வணிக திட்ட அறிக்கை / சாத்தியக்கூறு பர்ச்சா",
  },
  "Business premises / place proof": {
    en: "Business premises / place proof",
    hi: "दुकान/व्यवसाय स्थल का प्रमाण (किरायानामा या स्वामित्व)",
    hinglish: "Business premises / Jagah ka proof",
    mr: "व्यवसाय जागेचा पुरावा (भाडेकरार किंवा मालकी हक्क)",
    bn: "ব্যবসায়িক স্থানের প্রমাণপত্র (ভাড়া চুক্তি বা মালিকানা)",
    te: "వ్యాపార స్థల రుజువు (అద్దె లేదా స్వంత పత్రాలు)",
    ta: "வணிக வளாகம் / இடத்திற்கான சான்று",
  },
  "Passport size photographs": {
    en: "Passport size photographs",
    hi: "पासपोर्ट साइज फोटो (2 प्रतियां)",
    hinglish: "Passport size photos",
    mr: "पासपोर्ट आकाराची छायाचित्रे",
    bn: "পাসপোর্ট সাইজের রঙিন ছবি",
    te: "పాస్‌పోర్ట్ సైజు ఫోటోలు",
    ta: "பாஸ்போர்ட் அளவு புகைப்படங்கள்",
  },

  // Strengths
  "Direct personal relationship with village community & elders": {
    en: "Direct personal relationship with village community & elders",
    hi: "गाँव के समुदाय और बुजुर्गों से सीधा और व्यक्तिगत संबंध",
    hinglish: "Gaon ke logon aur buzurgon se seedha parichay",
    mr: "गावातील समुदाय आणि ज्येष्ठ नागरिकांशी थेट व वैयक्तिक संबंध",
    bn: "গ্রামের মানুষ এবং মুরব্বিদের সাথে সরাসরি ব্যক্তিগত সুসম্পর্ক",
    te: "గ్రామస్తులు మరియు పెద్దలతో ప్రత్యక్ష వ్యక్తిగత సంబంధాలు",
    ta: "கிராம மக்கள் மற்றும் பெரியவர்களுடன் நேரடி தனிப்பட்ட உறவு",
  },
  "Lower fixed overhead expenses compared to urban establishments": {
    en: "Lower fixed overhead expenses compared to urban establishments",
    hi: "शहरों की तुलना में दुकान का किराया व स्थायी खर्चे बहुत कम",
    hinglish: "Shehar ke mukable dukaan ka kiraya aur kharche bohot kam",
    mr: "शहरातील दुकानांच्या तुलनेत भाडे व स्थिर खर्च खूप कमी",
    bn: "শহরের তুলনায় দোকান ভাড়া এবং স্থায়ী পরিচালনা ব্যয় অত্যন্ত কম",
    te: "పట్టణాలతో పోలిస్తే స్థిర నిర్వహణ ఖర్చులు మరియు అద్దె చాలా తక్కువ",
    ta: "நகரங்களை விட நிலையான செலவுகள் மற்றும் வாடகை மிகக் குறைவு",
  },
  "Availability of local raw materials within walking distance": {
    en: "Availability of local raw materials within walking distance",
    hi: "स्थानीय कच्चा माल पास में ही आसानी से उपलब्ध",
    hinglish: "Local raw material aas-paas hi aasaani se uplabdh",
    mr: "स्थानिक कच्चा माल जवळच सहज उपलब्ध",
    bn: "স্থানীয় কাঁচামাল হাতের কাছেই সহজে সহজলভ্য",
    te: "స్థానిక ముడి సరుకులు సమీపంలోనే సులభంగా లభించడం",
    ta: "உள்ளூர் மூலப்பொருட்கள் அருகிலேயே எளிதாகக் கிடைப்பது",
  },

  // Weaknesses
  "Limited initial cash reserve for unexpected equipment breakdown": {
    en: "Limited initial cash reserve for unexpected equipment breakdown",
    hi: "अचानक मशीनरी खराब होने की स्थिति में सीमित शुरुआती नकदी",
    hinglish: "Machine kharab hone par emergency cash reserve kam hona",
    mr: "यंत्रसामग्रीच्या अचानक बिघाडासाठी मर्यादित सुरुवातीचा रोख साठा",
    bn: "যন্ত্রপাতি হঠাৎ নষ্ট হলে মেরামতের জন্য সীমিত জরুরি নগদ তহবিল",
    te: "యంత్రాల మరమ్మతుల కోసం ప్రారంభంలో పరిమిత నగదు నిల్వలు ఉండటం",
    ta: "இயந்திர பழுது போன்ற எதிர்பாராத செலவுகளுக்கு ஆரம்ப பண கையிருப்பு குறைவு",
  },
  "Reliance on seasonal agricultural harvest payment cycles": {
    en: "Reliance on seasonal agricultural harvest payment cycles",
    hi: "फसल कटाई और मौसमी कृषि भुगतान चक्र पर ग्राहकों की निर्भरता",
    hinglish: "Fasal aane par payment milne ki aadat par nirbharta",
    mr: "पीक कापणी आणि हंगामी शेती उत्पन्नाच्या चक्रावर अवलंबित्व",
    bn: "ফসল ওঠার মৌসুম এবং কৃষিনির্ভর অর্থপ্রদান চক্রের ওপর নির্ভরতা",
    te: "రైతుల పంట చేతికి వచ్చే కాలంపై ఆధారపడి చెల్లింపులు జరగడం",
    ta: "பயிர் அறுவடை மற்றும் பருவகால விவசாய பண சுழற்சியை நம்பியிருத்தல்",
  },
  "Limited formal bookkeeping or computer invoice systems": {
    en: "Limited formal bookkeeping or computer invoice systems",
    hi: "कंप्यूटर बिलिंग या औपचारिक बहीखाता प्रणाली का अभाव",
    hinglish: "Computer billing ya pakka hisab-kitab na hona",
    mr: "औपचारिक हिशेब किंवा संगणकीय बिलिंग प्रणालीचा अभाव",
    bn: "কম্পিউটারাইজড বিলিং বা আনুষ্ঠানিক হিসাব সংরক্ষণের অভাব",
    te: "కంప్యూటర్ బిల్లింగ్ లేదా సరైన ఖాతా పుస్తకాల నిర్వహణ లేకపోవడం",
    ta: "முறையான கணக்கு புத்தகங்கள் அல்லது கணினி ரசீது முறை இல்லாமை",
  },

  // Opportunities (SWOT)
  "Expanding to adjacent gram panchayats through weekly haats": {
    en: "Expanding to adjacent gram panchayats through weekly haats",
    hi: "साप्ताहिक हाट बाज़ारों के माध्यम से पास की ग्राम पंचायतों में विस्तार",
    hinglish: "Weekly haat ke zariye paas ki panchayaton me vistar",
    mr: "साप्ताहिक बाजारांच्या माध्यमातून लगतच्या ग्रामपंचायतींमध्ये व्यवसाय विस्तार",
    bn: "সাপ্তাহিক হাটের মাধ্যমে পার্শ্ববর্তী গ্রাম পঞ্চায়েতগুলোতে ব্যবসা সম্প্রসারণ",
    te: "వారపు సంతల ద్వారా సమీప గ్రామ పంచాయతీలకు వ్యాపారాన్ని విస్తరించడం",
    ta: "வாராந்திர சந்தைகள் மூலம் அருகிலுள்ள கிராம ஊராட்சிகளுக்கு விரிவுபடுத்துதல்",
  },
  "Tapping government subsidy programs (PMEGP / Mudra / KCC)": {
    en: "Tapping government subsidy programs (PMEGP / Mudra / KCC)",
    hi: "सरकारी सब्सिडी योजनाओं (PMEGP / मुद्रा / केसीसी) का लाभ उठाना",
    hinglish: "Sarkari subsidy schemes (PMEGP / Mudra / KCC) ka fayda uthana",
    mr: "सरकारी अनुदान योजनांचा (PMEGP / मुद्रा / KCC) लाभ घेणे",
    bn: "সরকারি ভর্তুকি প্রকল্পের (PMEGP / মুদ্রা / KCC) আর্থিক সুবিধা গ্রহণ",
    te: "ప్రభుత్వ రాయితీ పథకాలను (PMEGP / ముద్రా / KCC) ఉపయోగించుకోవడం",
    ta: "அரசு மானிய திட்டங்களை (PMEGP / முத்ரா / KCC) பயன்படுத்திக் கொள்ளுதல்",
  },
  "Bundling complementary products for village families": {
    en: "Bundling complementary products for village families",
    hi: "ग्रामीण परिवारों के लिए रोज़मर्रा के सहायक उत्पादों का कॉम्बो तैयार करना",
    hinglish: "Gaon ke parivaron ke liye zaroori cheezon ka combo banana",
    mr: "ग्रामीण कुटुंबांसाठी दैनंदिन गरजेच्या पूरक वस्तूंचे संच देणे",
    bn: "গ্রামীণ পরিবারের জন্য নিত্যপ্রয়োজনীয় পণ্যের যৌথ প্যাকেজ সরবরাহ",
    te: "గ్రామ కుటుంబాల కోసం నిత్యవసర అనుబంధ ఉత్పత్తులను కలిపి అందించడం",
    ta: "கிராம குடும்பங்களுக்கு தேவையான தொடர்புடைய பொருட்களை இணைத்து வழங்குதல்",
  },

  // Threats
  "Sudden price inflation in input raw materials / animal feed": {
    en: "Sudden price inflation in input raw materials / animal feed",
    hi: "कच्चे माल या पशु आहार की कीमतों में अचानक वृद्धि",
    hinglish: "Raw material ya pashu aahar ki keemat badhne ka risk",
    mr: "कच्चा माल किंवा पशुखाद्याचे दर वाढल्यास होणारा तोटा",
    bn: "কাঁচামাল বা পশুখাদ্যের মূল্যে আকস্মিক মূল্যবৃদ্ধি",
    te: "ముడి సరుకులు లేదా దాణా ధరలు పెరిగితే వచ్చే నష్ట భయం",
    ta: "தீவனம் அல்லது மூலப்பொருள் விலை உயர்வின் பாதிப்பு",
  },
  "Weather interruptions or localized power cuts": {
    en: "Weather interruptions or localized power cuts",
    hi: "मौसम की खराबी या स्थानीय बिजली कटौती की समस्या",
    hinglish: "Mausam ki kharabi ya bijli katne ki samasya",
    mr: "हवामानातील बदल किंवा स्थानिक वीज पुरवठ्यातील व्यत्यय",
    bn: "প্রতিকূল আবহাওয়া বা স্থানীয় লোডশেডিং ও বিদ্যুৎ বিভ্রাট",
    te: "వాతావరణ మార్పులు లేదా స్థానిక విద్యుత్ సరఫరాలో అంతరాయాలు",
    ta: "வானிலை தடங்கல்கள் அல்லது உள்ளூர் மின்வெட்டு சிக்கல்கள்",
  },
  "Credit demands (udhaar) from relatives and neighbors": {
    en: "Credit demands (udhaar) from relatives and neighbors",
    hi: "रिश्तेदारों और पड़ोसियों द्वारा अत्यधिक उधारी की मांग",
    hinglish: "Rishtedaron aur padosiyon dwara udhaar ki maang",
    mr: "नातेवाईक आणि शेजाऱ्यांकडून उधारीची मागणी",
    bn: "আত্মীয়-স্বজন এবং প্রতিবেশীদের অতিরিক্ত বাকির দাবি",
    te: "బంధువులు మరియు ఇరుగుపొరుగు వారి నుండి అప్పుల (ఉధార్) ఒత్తిడి",
    ta: "உறவினர்கள் மற்றும் அண்டை வீட்டாரிடமிருந்து கடன் (உதார்) கேட்கும் நெருக்கடி",
  },

  // Candidate Niches
  "Value-added packaging (e.g. bottled fresh milk, paneer, curd packets)": {
    en: "Value-added packaging (e.g. bottled fresh milk, paneer, curd packets)",
    hi: "मूल्य-संवर्धित पैकेजिंग (जैसे बोतल बंद ताजा दूध, पनीर, दही के पैकेट)",
    hinglish: "Value-added packaging (Paneer, Dahi, Packaged Milk)",
    mr: "मूल्यवर्धित पॅकेजिंग (उदा. बाटलीबंद ताजे दूध, पनीर, दह्याचे पाकीट)",
    bn: "মূল্য সংযোজিত প্যাকেজিং (যেমন বোতলজাত খাঁটি দুধ, পনির, দইয়ের প্যাকেট)",
    te: "విలువ జోడించిన ప్యాకేజింగ్ (ఉదా: సీసా పాలు, పన్నీర్, పెరుగు ప్యాకెట్లు)",
    ta: "மதிப்பு கூட்டப்பட்ட பேக்கேஜிங் (எ.கா: பாட்டில் பால், பன்னீர், தயிர் பாக்கெட்டுகள்)",
  },
  "Home delivery subscription for village teachers & government staff": {
    en: "Home delivery subscription for village teachers & government staff",
    hi: "गाँव के शिक्षकों और सरकारी कर्मचारियों के लिए होम डिलीवरी मासिक सदस्यता",
    hinglish: "Teachers aur sarkari staff ke liye home delivery subscription",
    mr: "गावातील शिक्षक व सरकारी कर्मचाऱ्यांसाठी थेट घरपोच मासिक सेवा",
    bn: "গ্রামের শিক্ষক এবং সরকারি চাকরিজীবীদের জন্য হোম ডেলিভারি মাসিক সেবা",
    te: "గ్రామ ఉపాధ్యాయులు & ప్రభుత్వ ఉద్యోగుల కోసం హోమ్ డెలివరీ సబ్‌స్క్రిప్షన్",
    ta: "கிராமத்து ஆசிரியர்கள் & அரசு ஊழியர்களுக்கான டோர் டெலிவரி மாதாந்திர சேவை",
  },
  "Seasonal festival bulk packages and weekly haat stalls": {
    en: "Seasonal festival bulk packages and weekly haat stalls",
    hi: "त्योहारों के अवसर पर थोक पैक और साप्ताहिक हाट बाज़ार स्टॉल",
    hinglish: "Teohar bulk packs aur weekly haat stalls",
    mr: "सण-उत्सवांच्या काळात घाऊक संच आणि साप्ताहिक बाजारात स्टॉल",
    bn: "উৎসবের মরসুমে পাইকারি প্যাকেজ এবং সাপ্তাহিক হাটে বিশেষ স্টল",
    te: "పండుగల ప్రత్యేక ప్యాకేజీలు మరియు వారపు సంతలలో ప్రత్యేక స్టాళ్ళు",
    ta: "பண்டிகை கால மொத்த தொகுப்புகள் மற்றும் வாராந்திர சந்தை கடைகள்",
  },
  "Tie-up with local self-help groups (SHGs / Sakhi Mandals)": {
    en: "Tie-up with local self-help groups (SHGs / Sakhi Mandals)",
    hi: "स्थानीय महिला स्वयं सहायता समूहों (SHG / सखी मंडल) के साथ साझेदारी",
    hinglish: "Local SHG (Sakhi Mandal) ke sath tie-up",
    mr: "स्थानिक महिला बचत गट (SHG / सखी मंडळ) यांच्याशी भागीदारी",
    bn: "স্থানীয় স্বনির্ভর দল (SHG / সখী মণ্ডল)-এর সাথে ব্যবসায়িক চুক্তি",
    te: "స్థానిక స్వయం సహాయక సంఘాలతో (SHG / సఖీ మండలి) భాగస్వామ్యం",
    ta: "உள்ளூர் மகளிர் சுயஉதவி குழுக்களுடன் (SHG) கூட்டு ஒப்பந்தம்",
  },

  // Evidence
  "High daily consumption with lack of hygienic local branded alternatives": {
    en: "High daily consumption with lack of hygienic local branded alternatives",
    hi: "दैनिक खपत बहुत अधिक है लेकिन स्वच्छ व स्थानीय ब्रांडेड विकल्पों की भारी कमी है",
    hinglish: "Daily consumption zyada hai par hygienic local brand nahi hai",
    mr: "दैनिक वापर खूप जास्त आहे पण स्वच्छ व दर्जेदार स्थानिक पर्यायांचा अभाव आहे",
    bn: "দৈনন্দিন চাহিদা ব্যাপক কিন্তু স্বাস্থ্যকর স্থানীয় ব্র্যান্ডেড বিকল্পের চরম অভাব",
    te: "రోజువారీ వినియోగం ఎక్కువ ఉన్నప్పటికీ పరిశుభ్రమైన స్థానిక బ్రాండెడ్ ఉత్పత్తులు లేవు",
    ta: "தினசரி நுகர்வு அதிகம், ஆனால் சுகாதாரமான உள்ளூர் பிராண்டட் தயாரிப்புகள் இல்லை",
  },
  "Rising disposable income among semi-urban and rural service workers": {
    en: "Rising disposable income among semi-urban and rural service workers",
    hi: "कस्बों और ग्रामीण नौकरीपेशा परिवारों की क्रय शक्ति व आमदनी में लगातार वृद्धि",
    hinglish: "Gaon ke naukri-pesha logon ki aamdani me lagatar badhotri",
    mr: "ग्रामीण व निमशहरी भागातील नोकरदार कुटुंबांच्या उत्पन्नात वाढ",
    bn: "আধা-শহুরে ও গ্রামীণ চাকরিজীবী পরিবারগুলোর ক্রয়ক্ষমতা ও আয় বৃদ্ধি পাচ্ছে",
    te: "గ్రామీణ మరియు పట్టణ ఉద్యోగుల ఖర్చు చేయగల ఆదాయం పెరుగుతోంది",
    ta: "கிராமப்புற மற்றும் சிறுநகர ஊழியர்களின் செலவு செய்யும் வருமானம் உயர்ந்துள்ளது",
  },
  "Local buyers travel 8-10 km to tehsil market for better quality": {
    en: "Local buyers travel 8-10 km to tehsil market for better quality",
    hi: "अच्छी गुणवत्ता पाने के लिए स्थानीय ग्राहक 8-10 किमी दूर तहसील बाज़ार जाते हैं",
    hinglish: "Achi quality ke liye log 8-10 km door tehsil bazaar jate hain",
    mr: "उत्कृष्ट दर्जा मिळवण्यासाठी स्थानिक ग्राहक 8-10 किमी दूर तहसील बाजारात जातात",
    bn: "ভালো মানের পণ্যের জন্য স্থানীয় ক্রেতারা ৮-১০ কিমি দূরের তহশিল বাজারে যান",
    te: "మంచి నాణ్యత కోసం స్థానిక కస్టమర్లు 8-10 కిమీ దూరంలోని తాలూకా మార్కెట్‌కు వెళ్తున్నారు",
    ta: "நல்ல தரத்திற்காக உள்ளூர் மக்கள் 8-10 கிமீ தொலைவிலுள்ள தாலுகா சந்தைக்கு செல்கின்றனர்",
  },

  // Future expansion paths
  "Supply to nearby school mid-day meal or anganwadi centers": {
    en: "Supply to nearby school mid-day meal or anganwadi centers",
    hi: "पास के स्कूलों के मिड-डे मील या आंगनवाड़ी केंद्रों में पौष्टिक आपूर्ति",
    hinglish: "Paas ke school mid-day meal ya anganwadi me supply",
    mr: "जवळच्या शाळांमधील मध्यान्ह भोजन किंवा अंगणवाडी केंद्रांना पुरवठा",
    bn: "নিকটস্থ স্কুলের মিড-ডে মিল বা অঙ্গনওয়াড়ি কেন্দ্রে পুষ্টিকর খাদ্য সরবরাহ",
    te: "సమీప పాఠశాలల మధ్యాహ్న భోజనం లేదా అంగన్‌వాడీ కేంద్రాలకు సరఫరా చేయడం",
    ta: "அருகிலுள்ள பள்ளி மதிய உணவு அல்லது அங்கன்வாடி மையங்களுக்கு விநியோகம்",
  },
  "Collaborate with dairy cooperatives or agricultural FPOs": {
    en: "Collaborate with dairy cooperatives or agricultural FPOs",
    hi: "डेयरी सहकारी समितियों या कृषक उत्पादक संगठनों (FPO) के साथ सहयोग",
    hinglish: "Dairy cooperatives ya Kisan FPO ke sath milkar kaam karein",
    mr: "दुग्ध सहकारी संस्था किंवा शेतकरी उत्पादक कंपन्यांशी (FPO) सहकार्य",
    bn: "দুগ্ধ সমবায় সমিতি বা কৃষক উৎপাদক সংস্থার (FPO) সাথে যৌথ উদ্যোগ",
    te: "డైరీ సహకార సంఘాలు లేదా రైతు ఉత్పత్తిదారుల సంస్థలతో (FPO) భాగస్వామ్యం",
    ta: "பால் கூட்டுறவு சங்கங்கள் அல்லது உழவர் உற்பத்தியாளர் அமைப்புகளுடன் (FPO) கூட்டு",
  },
  "Add complementary daily-use FMCG goods to store inventory": {
    en: "Add complementary daily-use FMCG goods to store inventory",
    hi: "दुकान में दैनिक उपयोग के सहायक एफएमसीजी उत्पाद भी जोड़ें",
    hinglish: "Dukaan me rojana use hone wale FMCG products bhi jodein",
    mr: "दुकानात दैनंदिन वापराच्या पूरक एफएमसीजी वस्तूंचा समावेश करा",
    bn: "দোকানের স্টকে নিত্যপ্রয়োজনীয় অন্যান্য খাদ্য ও প্রসাধন সামগ্রী যুক্ত করুন",
    te: "షాపులో రోజువారీ ఉపయోగపడే ఇతర నిత్యవసర వస్తువులను చేర్చడం",
    ta: "கடையின் இருப்பில் தினசரி பயன்பாட்டு எப்எம்சிஜி பொருட்களை சேர்த்தல்",
  },

  // Risk Factors
  "Vulnerability to input feed or raw material price increases": {
    en: "Vulnerability to input feed or raw material price increases",
    hi: "पशु आहार या कच्चे माल की कीमतों में बढ़ोतरी का वित्तीय जोखिम",
    hinglish: "Raw material ya fodder ki keemat badhne ka risk",
    mr: "कच्चा माल किंवा पशुखाद्याचे दर वाढल्यास होणारा तोटा",
    bn: "পশুখাদ্য বা কাঁচামালের মূল্যবৃদ্ধির প্রতি সংবেদনশীলতা",
    te: "ముడి సరుకులు లేదా దాణా ధరలు పెరిగితే వచ్చే నష్ట భయం",
    ta: "தீவனம் அல்லது மூலப்பொருள் விலை உயர்வின் பாதிப்பு",
  },
  "Seasonal drop in footfall during peak harvest or monsoon weeks": {
    en: "Seasonal drop in footfall during peak harvest or monsoon weeks",
    hi: "फसल कटाई के व्यस्त समय या भारी बारिश के दौरान ग्राहकों की संख्या में मौसमी कमी",
    hinglish: "Barsaat ya kheti ke mausam me grahakon ki sankhya kam hona",
    mr: "कापणीचा हंगाम किंवा पावसाळ्यात ग्राहकांच्या गर्दीत तात्पुरती घट",
    bn: "ফসল তোলার ভরা মরসুমে বা বর্ষার দিনগুলোতে ক্রেতাদের আনাগোনা কমে যাওয়া",
    te: "పంట కోతల సమయంలో లేదా వర్షాకాలంలో కస్టమర్ల రాక తగ్గడం",
    ta: "அறுவடை காலம் அல்லது மழைக்காலத்தில் வாடிக்கையாளர் வருகை குறைதல்",
  },
  "High dependence on key repeat village customers": {
    en: "High dependence on key repeat village customers",
    hi: "गाँव के गिने-चुने नियमित ग्राहकों पर अत्यधिक निर्भरता",
    hinglish: "Gaon ke kuch regular grahakon par bohot zyada nirbharta",
    mr: "गावातील मोजक्याच नियमित ग्राहकांवर जास्त अवलंबित्व",
    bn: "গ্রামের নির্দিষ্ট কয়েকজন নিয়মিত ক্রেতার ওপর অতিরিক্ত নির্ভরশীলতা",
    te: "గ్రామంలోని కొంతమంది రెగ్యులర్ కస్టమర్లపైనే అధికంగా ఆధారపడటం",
    ta: "குறிப்பிட்ட சில வழக்கமான கிராமத்து வாடிக்கையாளர்களை மட்டுமே நம்பியிருத்தல்",
  },

  // Recommendations
  "Maintain a cash reserve equivalent to at least 1-2 months of operational expenses.": {
    en: "Maintain a cash reserve equivalent to at least 1-2 months of operational expenses.",
    hi: "कम से कम 1-2 महीने के परिचालन खर्च के बराबर नकद आपातकालीन रिजर्व हमेशा रखें।",
    hinglish: "Kam se kam 1-2 mahine ke kharche barabar cash reserve rakhein.",
    mr: "किमान 1-2 महिन्यांच्या दैनंदिन खर्चाएवढा रोख आपत्कालीन साठा नेहमी बाळगा.",
    bn: "কমপক্ষে ১-২ মাসের পরিচালনা ব্যয়ের সমপরিমাণ জরুরি নগদ সঞ্চয় আলাদা রাখুন।",
    te: "కనీసం 1-2 నెలల నిర్వహణ ఖర్చులకు సరిపడా నగదు నిల్వను అత్యవసర నిధిగా ఉంచండి.",
    ta: "குறைந்தபட்சம் 1-2 மாத செயல்பாட்டு செலவுகளுக்கு சமமான பண இருப்பு வைத்திருங்கள்.",
  },
  "Form relationships with at least 2 alternate wholesale suppliers to avoid supply squeeze.": {
    en: "Form relationships with at least 2 alternate wholesale suppliers to avoid supply squeeze.",
    hi: "सप्लाई रुकने से बचने के लिए कम से कम 2 वैकल्पिक थोक सप्लायरों से संपर्क बनाए रखें।",
    hinglish: "Supply na ruke isliye kam se kam 2 wholesale suppliers se parichay rakhein.",
    mr: "मालाचा तुटवडा टाळण्यासाठी किमान 2 पर्यायी घाऊक पुरवठादारांशी संपर्क ठेवा.",
    bn: "সরবরাহ সংকট এড়াতে কমপক্ষে ২টি বিকল্প পাইকারি সরবরাহকারীর সাথে সম্পর্ক রাখুন।",
    te: "సరుకు కొరత రాకుండా కనీసం ఇద్దరు ప్రత్యామ్నాయ హోల్‌సేల్ సరఫరాదారులతో సంబంధాలు కలిగి ఉండండి.",
    ta: "விநியோக தடையைத் தவிர்க்க குறைந்தது 2 மாற்று மொத்த விற்பனையாளர்களுடன் தொடர்பில் இருங்கள்.",
  },
  "Limit informal customer credit (udhaar) and encourage UPI / digital instant payments.": {
    en: "Limit informal customer credit (udhaar) and encourage UPI / digital instant payments.",
    hi: "अत्यधिक उधारी से बचें और ग्राहकों को यूपीआई या नकद भुगतान के लिए प्रोत्साहित करें।",
    hinglish: "Zyada udhaar na dein aur UPI / cash payment ko badhava dein.",
    mr: "विनाकारण उधारी देणे टाळा आणि ग्राहकांना UPI किंवा रोख पेमेंटसाठी प्रोत्साहन द्या.",
    bn: "অনানুষ্ঠানিক বাকি সীমিত করুন এবং ইউপিআই বা নগদ তাৎক্ষণিক অর্থপ্রদানকে উৎসাহিত করুন।",
    te: "అనవసరమైన అప్పులు (ఉధార్) తగ్గించి, UPI లేదా నగదు చెల్లింపులను ప్రోత్సహించండి.",
    ta: "அதிகப்படியான கடனை (உதார்) தவிர்த்து, UPI அல்லது உடனடி பணப் பரிவர்த்தனையை ஊக்குவிக்கவும்.",
  },
};

export function translateDynamicPhrase(phrase: string = "", lang: string = "hi"): string {
  if (!phrase) return phrase;
  const trimmed = phrase.trim();
  const code = (lang || "hi").toLowerCase();
  if (DYNAMIC_PHRASE_DICTIONARY[trimmed]?.[code]) {
    return DYNAMIC_PHRASE_DICTIONARY[trimmed][code];
  }
  return phrase;
}

export function getUI(key: string, lang: string = "hi", fallback: string = ""): string {
  const code = (lang || "hi").toLowerCase();
  if (COMMON_UI[key]?.[code]) {
    return COMMON_UI[key][code];
  }
  const dict = getT(code);
  if (dict && dict[key]) {
    return dict[key];
  }
  if (COMMON_UI[key]?.en) {
    return COMMON_UI[key].en;
  }
  return fallback || key;
}

export default {
  getT,
  tKey,
  getUI,
  getPageBadge,
  getBcp47Locale,
  translateVerdict,
  translateVerdictDescription,
  translateAffordability,
  translateStrength,
  translateRisk,
  translateDemand,
  translateCategory,
  translateRepaymentPeriod,
  translateDynamicPhrase,
  PAGE_BADGES,
  COMMON_UI,
};

