import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Building2,
  HelpCircle,
  Mic,
  AlertCircle,
  Square,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Calculator,
  Coins,
  FileText,
  Store,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Wallet,
} from "lucide-react";
import { getAdvisorAdvice } from "../advisorLogic";
import { speakText, stopSpeaking } from "../utils/speech";
import { API_ROUTES } from "../apiRoutes";
import { getPageBadge, getUI } from "../utils/translationHelper";

const languageNames = {
  hi: "Hindi",
  en: "English",
  hinglish: "Hinglish",
  mr: "Marathi",
  bn: "Bengali",
  te: "Telugu",
  ta: "Tamil",
};

export default function PageAdvisor({ result, lang = "hi", formatCurrency, businessContext }) {
  const isHi = lang === "hi";
  const chatBottomRef = useRef(null);
  const msgCounterRef = useRef(1);
  const sessionTokenRef = useRef("");

  useEffect(() => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = `session-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
    }
  }, []);

  // Use robust merged businessContext fallback
  const rawCtx = businessContext || {};
  const ctx = {
    businessType: rawCtx.businessType || rawCtx.category || result?.category || "",
    businessName: rawCtx.businessName || rawCtx.business || rawCtx.business_name || result?.business || result?.business_name || (lang === "hi" ? "आपका व्यवसाय" : "Your Business"),
    district: rawCtx.district || result?.district || (lang === "hi" ? "स्थानीय क्षेत्र" : "Local Area"),
    state: rawCtx.state || result?.state || "",
    block: rawCtx.block || result?.block || "",
    totalInvestment: rawCtx.totalInvestment ?? rawCtx.investment ?? result?.financial_analysis?.initial_investment ?? null,
    promoterMargin: rawCtx.promoterMargin ?? rawCtx.promoter_margin ?? rawCtx.margin_capital ?? result?.scheme_analysis?.margin_capital ?? result?.scheme_analysis?.beneficiary_contribution ?? null,
    eligibleLoan: rawCtx.eligibleLoan ?? rawCtx.eligible_loan ?? result?.scheme_analysis?.eligible_loan ?? null,
    matchedScheme: rawCtx.matchedScheme ?? rawCtx.scheme_name ?? result?.scheme_analysis?.scheme_name ?? (lang === "hi" ? "क्रेडिट लिंक्ड योजना" : "Credit Scheme"),
    interestRate: rawCtx.interestRate ?? rawCtx.interest_rate ?? result?.scheme_analysis?.interest_rate ?? null,
    loanTenureMonths: rawCtx.loanTenureMonths ?? rawCtx.loan_tenure_months ?? result?.scheme_analysis?.loan_tenure_months ?? result?.loan_affordability?.loan_tenure_months ?? null,
    moratoriumMonths: rawCtx.moratoriumMonths ?? rawCtx.moratorium_months ?? result?.scheme_analysis?.moratorium_months ?? result?.loan_affordability?.moratorium_months ?? null,
    monthlyEmi: rawCtx.monthlyEmi ?? rawCtx.monthly_emi ?? result?.loan_affordability?.monthly_emi ?? null,
    totalProjectCost: rawCtx.totalProjectCost ?? rawCtx.project_cost ?? rawCtx.projectCost ?? result?.scheme_analysis?.project_cost ?? result?.financial_analysis?.initial_investment ?? null,
    monthlyRevenue: rawCtx.monthlyRevenue ?? rawCtx.monthly_revenue ?? result?.financial_analysis?.monthly_revenue ?? null,
    monthlyExpenses: rawCtx.monthlyExpenses ?? rawCtx.monthly_expenses ?? result?.financial_analysis?.monthly_expenses ?? null,
    monthlyProfit: rawCtx.monthlyProfit ?? rawCtx.monthly_profit ?? result?.financial_analysis?.monthly_profit ?? null,
    roiPercentage: rawCtx.roiPercentage ?? rawCtx.roi_percentage ?? result?.financial_analysis?.roi_percentage ?? null,
    feasibility: rawCtx.feasibility || result?.feasibilityVerdict || result?.feasibility || (isHi ? "सत्यापन आवश्यक" : "Requires Verification"),
    affordabilityStatus: rawCtx.affordabilityStatus || result?.loan_affordability?.affordability_status || (isHi ? "सत्यापन आवश्यक" : "Requires Verification"),
    localDemand: rawCtx.localDemand || result?.hyper_local_profile?.local_demand || "Medium",
    competitionLevel: rawCtx.competitionLevel || result?.risk_analysis?.competition_level || "Medium",
    localMarketData: rawCtx.localMarketData || result?.hyper_local_profile?.market_reach || null,
  };

  const getInitialGreeting = () => {
    const bName = ctx.businessName || (lang === "hi" ? "आपके व्यापार" : "Your Business");
    const bScheme = ctx.matchedScheme || (lang === "hi" ? "सरकारी योजना" : "Government Scheme");
    const formatAmount = (val) => {
      if (val == null) return lang === "hi" ? "अनिर्धारित" : "Pending";
      return formatCurrency ? formatCurrency(val) : `₹${Number(val).toLocaleString("en-IN")}`;
    };
    const bMargin = formatAmount(ctx.promoterMargin);
    const bLoan = formatAmount(ctx.eligibleLoan);
    const bEmi = formatAmount(ctx.monthlyEmi);
    const rateStr = ctx.interestRate ? `(@ ${ctx.interestRate})` : "";
    const locationStr = [ctx.district, ctx.state].filter(Boolean).join(", ") || (lang === "hi" ? "स्थानीय क्षेत्र" : "your area");

    switch (lang) {
      case "en":
        return `Hello! I am your AI Rural Business Advisor. I have loaded your complete business profile for **${bName}** (${ctx.businessType || "Enterprise"}) in ${locationStr}.
• Matched Scheme: **${bScheme}**
• Your Margin: **${bMargin}** | Bank Loan: **${bLoan}** ${rateStr}
• Estimated Monthly EMI: **${bEmi}**
How can I assist you with your equipment costs, scheme documents, market strategy, or profit margins?`;
      case "hinglish":
        return `Namaste! Main aapka AI Business Advisor hoon. Maine **${bName}** (${ctx.businessType || "Enterprise"}) ka poora hisab check kar liya hai.
• Matched Scheme: **${bScheme}**
• Aapka Margin (Apna Paisa): **${bMargin}** | Bank Loan: **${bLoan}** ${rateStr}
• Har Mahine Ki EMI: **${bEmi}**
Aap mujhse setup cost kam karne, machine khareedne ya gaon me bikri badhane ke baare me koi bhi sawal poochh sakte hain!`;
      case "mr":
        return `नमस्कार! मी तुमचा AI ग्रामीण व्यवसाय सल्लागार आहे. मी **${bName}** (${ctx.businessType || "व्यवसाय"}) चे संपूर्ण आकडे तपासले आहेत.
• शिफारस केलेली योजना: **${bScheme}**
• तुमचे भांडवल: **${bMargin}** | बँक कर्ज: **${bLoan}** ${rateStr}
• अंदाजे मासिक हप्ता (EMI): **${bEmi}**
तुम्ही मला खर्च कसा कमी करावा, यंत्रसामग्री कशी घ्यावी किंवा विक्री कशी वाढवावी याविषयी विचारू शकता.`;
      case "bn":
        return `নমস্কার! আমি আপনার AI গ্রামীণ ব্যবসা উপদেষ্টা। আমি **${bName}** (${ctx.businessType || "ব্যবসা"}) এর সমস্ত হিসাব পরীক্ষা করেছি।
• নির্বাচিত প্রকল্প: **${bScheme}**
• আপনার বিনিয়োগ: **${bMargin}** | ব্যাংক ঋণ: **${bLoan}** ${rateStr}
• আনুমানিক মাসিক কিস্তি (EMI): **${bEmi}**
খরচ কমানো, সরঞ্জাম ক্রয় বা স্থানীয় বাজারে বিক্রি বাড়ানোর বিষয়ে যেকোনো প্রশ্ন করুন।`;
      case "te":
        return `నమస్కారం! నేను మీ AI వ్యాపార సలహాదారుని. **${bName}** (${ctx.businessType || "వ్యాపారం"}) పూర్తి వివరాలు పరిశీలించాను.
• సిఫార్సు చేసిన పథకం: **${bScheme}**
• మీ పెట్టుబడి: **${bMargin}** | బ్యాంక్ రుణం: **${bLoan}** ${rateStr}
• నెలవారీ EMI: **${bEmi}**
సెటప్ ఖర్చు తగ్గించడం, పరికరాల కొనుగోలు లేదా అమ్మకాలు పెంచడం గురించి నన్ను అడగండి.`;
      case "ta":
        return `வணக்கம்! நான் உங்கள் AI கிராமப்புற வணிக ஆலோசகர். **${bName}** (${ctx.businessType || "வணிகம்"}) இன் அனைத்து விவரங்களையும் ஆய்வு செய்துள்ளேன்.
• தேர்ந்தெடுக்கப்பட்ட திட்டம்: **${bScheme}**
• உங்கள் முதலீடு: **${bMargin}** | வங்கி கடன்: **${bLoan}** ${rateStr}
• மாதாந்திர EMI: **${bEmi}**
செலவைக் குறைப்பது, இயந்திரங்கள் வாங்குவது அல்லது விற்பனையை அதிகரிப்பது குறித்து ஏதேனும் கேள்விகளைக் கேளுங்கள்.`;
      default:
        return `नमस्ते! मैं आपका AI ग्रामीण व्यापार सलाहकार हूँ। मैंने **${bName}** (${ctx.businessType || "व्यवसाय"}) के लिए आपके आंकड़े और सरकारी योजना का पूरा विश्लेषण तैयार किया है।
• अनुशंसित सरकारी योजना: **${bScheme}**
• आपका अंशदान (मार्जिन): **${bMargin}** | पात्र बैंक लोन: **${bLoan}** ${rateStr}
• अनुमानित मासिक किश्त (EMI): **${bEmi}**
आप मुझसे सेटअप लागत कम करने, मशीनरी बजट, बाज़ार की मांग या सरकारी सब्सिडी के नियम पर कोई भी सवाल पूछ सकते हैं।`;
    }
  };

  const [messages, setMessages] = useState(() => [
    {
      id: "initial",
      sender: "advisor",
      text: getInitialGreeting(),
      timestamp: "Just now",
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showAssumptions, setShowAssumptions] = useState(false);

  // Voice Conversation Mode State & Single Authoritative Refs
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState("idle"); // "idle" | "listening" | "thinking" | "speaking"
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState("");

  const voiceModeActiveRef = useRef(false);
  const recognitionRef = useRef(null);
  const isStartingRef = useRef(false);
  const isSendingRef = useRef(false);
  const voiceRestartTimeoutRef = useRef(null);
  const triggerVoiceQueryRef = useRef(null);
  const startVoiceListeningRef = useRef(null);

  // Safe detection of Web Speech API
  const isSpeechSupported = typeof window !== "undefined" && Boolean(
    window.SpeechRecognition || window.webkitSpeechRecognition
  );

  // Map application language to speech recognition locale
  const getRecognitionLang = useCallback((currentLang) => {
    switch (currentLang) {
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
  }, []);

  // Clean up recognition session and speech on unmount
  useEffect(() => {
    return () => {
      voiceModeActiveRef.current = false;
      if (voiceRestartTimeoutRef.current) {
        clearTimeout(voiceRestartTimeoutRef.current);
        voiceRestartTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore abort error on unmount
        }
        recognitionRef.current = null;
      }
      stopSpeaking();
    };
  }, []);

  // Safely and completely end voice conversation mode
  const endVoiceMode = useCallback(() => {
    voiceModeActiveRef.current = false;
    setIsVoiceMode(false);
    setVoiceState("idle");
    setVoiceTranscript("");
    setIsListening(false);
    isStartingRef.current = false;
    isSendingRef.current = false;

    if (voiceRestartTimeoutRef.current) {
      clearTimeout(voiceRestartTimeoutRef.current);
      voiceRestartTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore abort errors
      }
      recognitionRef.current = null;
    }

    stopSpeaking();
    setSpeakingId(null);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    isStartingRef.current = false;
  }, []);

  // Core recognition loop for hands-free Voice Mode
  const startVoiceListening = useCallback(() => {
    if (!voiceModeActiveRef.current) return;
    if (!isSpeechSupported) {
      setSpeechError(
        isHi
          ? "इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है। कृपया टाइप करके सवाल पूछें।"
          : "Voice input is not supported in this browser. Please type your question instead."
      );
      endVoiceMode();
      return;
    }

    if (isStartingRef.current) return;
    isStartingRef.current = true;

    // Abort any existing instance to prevent duplicates
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore abort
      }
      recognitionRef.current = null;
    }

    setVoiceState("listening");
    setIsListening(true);
    setVoiceTranscript("");
    setSpeechError("");

    try {
      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = getRecognitionLang(lang);
      recognition.maxAlternatives = 1;

      let capturedFinal = "";

      recognition.onstart = () => {
        isStartingRef.current = false;
        if (voiceModeActiveRef.current) {
          setIsListening(true);
          setVoiceState("listening");
          setSpeechError("");
        }
      };

      recognition.onresult = (event) => {
        let interim = "";
        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || "";
          if (item.isFinal) {
            capturedFinal += text;
          } else {
            interim += text;
          }
        }
        const spoken = (capturedFinal || interim).trim();
        if (spoken) {
          setVoiceTranscript(spoken);
        }
      };

      recognition.onerror = (event) => {
        isStartingRef.current = false;
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setSpeechError(
            isHi
              ? "माइक्रोफ़ोन अनुमति अस्वीकृत कर दी गई। कृपया माइक्रोफ़ोन की अनुमति दें या अपना सवाल टाइप करें।"
              : "Microphone permission was denied. Please allow microphone access or type your question instead."
          );
          endVoiceMode();
        }
        // Silence or abort errors will be handled seamlessly in onend
      };

      recognition.onend = () => {
        isStartingRef.current = false;
        setIsListening(false);
        recognitionRef.current = null;

        if (!voiceModeActiveRef.current) {
          setVoiceState("idle");
          return;
        }

        const query = capturedFinal.trim();
        if (query) {
          // Final transcript captured: automatically submit to AI without interim noise
          setVoiceTranscript("");
          if (triggerVoiceQueryRef.current) {
            triggerVoiceQueryRef.current(query);
          }
        } else {
          // No speech or silence detected: restart listening after short debounce if voice mode still active
          if (voiceModeActiveRef.current && !isSendingRef.current) {
            if (voiceRestartTimeoutRef.current) clearTimeout(voiceRestartTimeoutRef.current);
            voiceRestartTimeoutRef.current = setTimeout(() => {
              if (voiceModeActiveRef.current && !isSendingRef.current) {
                startVoiceListeningRef.current?.();
              }
            }, 350);
          }
        }
      };

      recognition.start();
    } catch (err) {
      isStartingRef.current = false;
      setIsListening(false);
      recognitionRef.current = null;
      console.warn("Speech recognition initialization error:", err);
      setSpeechError(
        isHi
          ? "वॉयस पहचान शुरू नहीं हो सकी। कृपया दोबारा प्रयास करें।"
          : "Failed to start voice recognition. Please try again."
      );
      endVoiceMode();
    }
  }, [endVoiceMode, getRecognitionLang, isHi, isSpeechSupported, lang]);

  useEffect(() => {
    startVoiceListeningRef.current = startVoiceListening;
  }, [startVoiceListening]);

  // Activate continuous hands-free Voice Mode
  const startVoiceMode = () => {
    if (!isSpeechSupported) {
      setSpeechError(
        isHi
          ? "इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है। कृपया टाइप करके सवाल पूछें।"
          : "Voice input is not supported in this browser. Please type your question instead."
      );
      return;
    }
    stopSpeaking();
    setSpeakingId(null);
    voiceModeActiveRef.current = true;
    setIsVoiceMode(true);
    setVoiceState("listening");
    startVoiceListeningRef.current?.();
  };

  // Toggle voice conversation mode on/off
  const toggleVoiceMode = () => {
    if (isVoiceMode || voiceModeActiveRef.current) {
      endVoiceMode();
    } else {
      startVoiceMode();
    }
  };

  // Pre-suggested prompts matching user requirements exactly
  const suggestedPrompts = [
    {
      id: "lower-cost",
      en: "How can I lower my initial setup cost?",
      hi: "मैं अपनी शुरुआती सेटअप लागत कैसे कम करूँ?",
      hinglish: "Apna shuruati setup kharcha kaise kam karein?",
      mr: "सुरुवातीचा सेटअप खर्च कसा कमी करावा?",
      bn: "প্রাথমিক সেটআপ খরচ কিভাবে কমাব?",
      te: "ప్రారంభ సెటప్ ఖర్చును ఎలా తగ్గించగలను?",
      ta: "ஆரம்ப அமைவு செலவை எவ்வாறு குறைக்கலாம்?",
    },
    {
      id: "cost-stress",
      en: "What happens if my costs increase by ₹5,000?",
      hi: "अगर मेरा खर्च ₹5,000 बढ़ जाए तो क्या होगा?",
      hinglish: "Agar monthly kharcha ₹5,000 badh jaye to kya hoga?",
      mr: "माझा खर्च ₹५,००० वाढल्यास काय होईल?",
      bn: "যদি আমার খরচ ₹৫,০০০ বৃদ্ধি পায় তবে কী হবে?",
      te: "నా ఖర్చులు ₹5,000 పెరిగితే ఏమవుతుంది?",
      ta: "என் செலவுகள் ₹5,000 உயர்ந்தால் என்ன நடக்கும்?",
    },
    {
      id: "emi-affordability",
      en: "Can I afford this monthly loan EMI?",
      hi: "क्या मैं हर महीने की किश्त (EMI) आसानी से भर पाऊंगा?",
      hinglish: "Kya main har mahine ki EMI aasani se nikal paunga?",
      mr: "मी दरमहा हप्ता (EMI) सहज फेडू शकेन का?",
      bn: "আমি কি সহজেই প্রতি মাসে কিস্তি দিতে পারব?",
      te: "నేను ప్రతి నెలా EMI సులభంగా చెల్లించగలనా?",
      ta: "மாதாந்திர தவணையை (EMI) நான் எளிதாக செலுத்த முடியுமா?",
    },
    {
      id: "without-loan",
      en: "Can I do this without a loan?",
      hi: "क्या मैं बिना बैंक लोन के यह काम शुरू कर सकता हूँ?",
      hinglish: "Kya bina loan ke ye kaam shuru ho sakta hai?",
      mr: "कर्जाशिवाय हा व्यवसाय सुरू करता येईल का?",
      bn: "ঋণ ছাড়া কি এই ব্যবসা করা সম্ভব?",
      te: "రుణం లేకుండా ఈ పని చేయగలనా?",
      ta: "கடன் இல்லாமல் இதை செய்ய முடியுமா?",
    },
    {
      id: "sales-drop",
      en: "What if sales are lower than expected?",
      hi: "अगर बिक्री अनुमान से कम रहे तो क्या होगा?",
      hinglish: "Agar sales thodi kam hui to munafa kaisa rahega?",
      mr: "अपेक्षेपेक्षा विक्री कमी झाल्यास काय?",
      bn: "বিক্রয় আশানুরূপ না হলে কী হবে?",
      te: "అమ్మకాలు తగ్గితే పరిస్థితి ఏమిటి?",
      ta: "விற்பனை குறைந்தால் என்ன நடக்கும்?",
    },
    {
      id: "main-risks",
      en: "What are the main risks for this business here?",
      hi: "यहाँ इस व्यापार में मुख्य खतरे और जोखिम क्या हैं?",
      hinglish: "Is business me sabse bada risk kya hai?",
      mr: "येथे या व्यवसायासाठी मुख्य जोखीम काय आहेत?",
      bn: "এখানে এই ব্যবসার মূল ঝুঁকিগুলি কী কী?",
      te: "ఇక్కడ ఈ వ్యాపారంలో ప్రధాన ప్రమాదాలు ఏమిటి?",
      ta: "இங்கு இந்த தொழிலுக்கான முக்கிய ஆபத்துகள் என்ன?",
    },
    {
      id: "scheme-documents",
      en: "What documents do I need for this government scheme?",
      hi: "इस सरकारी योजना के लिए मुझे कौन से कागज़ात चाहिए?",
      hinglish: "Is sarkari loan ke liye kaun se documents chahiye?",
      mr: "या सरकारी योजनेसाठी कोणती कागदपत्रे लागतील?",
      bn: "এই সরকারি ঋণের জন্য কী কী নথিপত্র লাগবে?",
      te: "ఈ ప్రభుత్వ రుణానికి ఏ పత్రాలు అవసరం?",
      ta: "இந்த அரசு கடனுதவிக்கு என்னென்ன ஆவணங்கள் தேவை?",
    },
    {
      id: "local-customers",
      en: "How to get more customers in my village?",
      hi: "गाँव और स्थानीय बाज़ार में ज़्यादा ग्राहक कैसे जोड़ें?",
      hinglish: "Gaon aur bazaar me zyada customer kaise layein?",
      mr: "स्थानिक बाजारपेठेत अधिक ग्राहक कसे मिळवावेत?",
      bn: "গ্রামের বাজারে বেশি ক্রেता কিভাবে আকর্ষণ করব?",
      te: "స్థానిక మార్కెట్‌లో ఎక్కువ మంది కస్టమర్లను ఎలా పొందాలి?",
      ta: "கிராமப்புற சந்தையில் அதிக வாடிக்கையாளர்களை ஈர்ப்பது எப்படி?",
    },
  ];

  const PROMPT_ICONS = {
    "lower-cost": Coins,
    "cost-stress": TrendingUp,
    "emi-affordability": Calculator,
    "without-loan": Wallet,
    "sales-drop": TrendingDown,
    "main-risks": AlertTriangle,
    "scheme-documents": FileText,
    "local-customers": Store,
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 80);
  };

  const handleSend = async (queryText) => {
    stopListening();
    const q = (queryText || inputQuestion).trim();
    if (!q) {
      setErrorMsg(isHi ? "कृपया अपना सवाल लिखें या नीचे से चुनें।" : "Please type a question or pick one from below.");
      return "";
    }

    setErrorMsg("");
    if (!queryText) {
      setInputQuestion("");
    }
    stopSpeaking();
    setSpeakingId(null);

    msgCounterRef.current += 1;
    const userMsgId = `user-msg-${msgCounterRef.current}`;
    msgCounterRef.current += 1;
    const advisorMsgId = `adv-msg-${msgCounterRef.current}`;
    const timeStr = "Now";

    // Append user message and loading advisor response with real loading state
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: "user", text: q, timestamp: timeStr },
      { id: advisorMsgId, sender: "advisor", text: "", isLoading: true, isStreaming: false, timestamp: timeStr },
    ]);

    setLoading(true);
    scrollToBottom();

    let finalReply;

    // Extract conversation history for multi-turn conversational reasoning
    const conversationHistory = messages
      .filter((m) => !m.isLoading && m.text && m.text.trim())
      .slice(-8)
      .map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text.trim(),
      }));

    try {
      const activeLanguage = languageNames[lang] || lang || "Hindi";
      const bName = ctx.businessName || result?.business || (isHi ? "व्यवसाय" : "Enterprise");
      const bDistrict = ctx.district || result?.district || (isHi ? "स्थानीय क्षेत्र" : "Local Area");
      const bState = ctx.state || result?.state || "";
      const bScheme = ctx.matchedScheme || result?.scheme_analysis?.scheme_name || (isHi ? "क्रेडिट योजना" : "Credit Scheme");
      const bMargin = ctx.promoterMargin ?? result?.scheme_analysis?.margin_capital ?? null;
      const bLoan = ctx.eligibleLoan ?? result?.scheme_analysis?.eligible_loan ?? null;
      const bEmi = ctx.monthlyEmi ?? result?.loan_affordability?.monthly_emi ?? null;

      // 1. Safely extract live map data
      const mData = ctx.localMarketData || {};
      const compCount = mData.competitors !== undefined && mData.competitors !== null
        ? (Array.isArray(mData.competitors) ? mData.competitors.length : mData.competitors)
        : null;
      const bankCount = mData.banks !== undefined && mData.banks !== null ? mData.banks : null;
      const mandiCount = mData.mandis !== undefined && mData.mandis !== null ? mData.mandis : null;
      
      const localMarketStr = ctx.localMarketData
        ? `REAL-TIME MARKET DATA (10km radius): ${compCount !== null ? `${compCount} competitors detected` : "Competitor data pending/unavailable"}, ${bankCount !== null ? `${bankCount} banks nearby` : "Bank location scan pending"}${mandiCount !== null ? `, ${mandiCount} mandis/markets` : ""}.`
        : "Local Market Context: Standard rural/semi-urban environment. Live map scan data pending.";

      // 2. Build the AI system prompt
      const profileSummary = `Profile: ${bName}, ${[bDistrict, bState].filter(Boolean).join(", ")}
Matched Scheme: ${bScheme}
Margin: ${bMargin != null ? `₹${Number(bMargin).toLocaleString("en-IN")}` : "Not specified"} | Loan: ${bLoan != null ? `₹${Number(bLoan).toLocaleString("en-IN")}` : "Not specified"} | EMI: ${bEmi != null ? `₹${Number(bEmi).toLocaleString("en-IN")}` : "Not specified"}

${localMarketStr}

CRITICAL AI INSTRUCTION: 
When advising the user, actively use the real-time market data. If they ask about strategy or risks, reference the verified field scan facts without inventing fabricated competitor shops. If they ask about loans, mention approaching the ${bankCount != null ? bankCount : "local"} nearby banks for the ${bScheme}.`;

      // 3. Package the payload for the backend
      const payload = {
        message: q,
        question: q,
        businessContext: {
          ...ctx,
          businessName: bName,
          district: bDistrict,
          state: bState,
          matchedScheme: bScheme,
          promoterMargin: bMargin,
          eligibleLoan: bLoan,
          monthlyEmi: bEmi,
          localMarketContext: localMarketStr,
          profileSummary,
        },
        language: lang,
        selectedLanguage: activeLanguage,
        history: conversationHistory,
      };

      // Real Gemini API call to the backend proxy with timeout handling
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(API_ROUTES.ADVISOR, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const generatedReply = (data?.reply || data?.answer || data?.text || "").trim();

      if (!generatedReply) {
        throw new Error("No response content returned from advisor");
      }

      finalReply = generatedReply;

      // Asynchronously log advisory conversation to MySQL (fail-safe)
      fetch(API_ROUTES.ADVISORY_HISTORY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken: sessionTokenRef.current,
          userQuery: q,
          aiResponse: generatedReply,
          language: lang,
          modelSource: data?.source || "gemini",
        }),
      }).catch(() => {});

      // Append the actual generated content string into the chat message state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === advisorMsgId
            ? { ...m, text: generatedReply, isLoading: false, isStreaming: false }
            : m
        )
      );
    } catch (err) {
      console.warn("API error, generating real contextual guidance:", err);
      // Fallback to local rule-based advisor logic so user never gets broken state or static placeholder
      try {
        const fallbackResp = getAdvisorAdvice({
          question: q,
          business_name: ctx.businessName || (isHi ? "व्यवसाय" : "Business"),
          category: ctx.businessType || (isHi ? "लघु उद्योग" : "Enterprise"),
          monthly_revenue: ctx.monthlyRevenue,
          monthly_expenses: ctx.monthlyExpenses,
          monthly_profit: ctx.monthlyProfit,
          monthly_emi: ctx.monthlyEmi,
          scheme_name: ctx.matchedScheme,
          eligible_loan: ctx.eligibleLoan,
          project_cost: ctx.totalProjectCost,
          promoter_margin: ctx.promoterMargin,
          interest_rate: ctx.interestRate,
          loan_tenure_months: ctx.loanTenureMonths,
          moratorium_months: ctx.moratoriumMonths,
          roi_percentage: result?.financial_analysis?.roi_percentage,
          affordability_status: result?.loan_affordability?.affordability_status,
          local_demand: ctx.localDemand,
          competition_level: ctx.competitionLevel,
          feasibility: ctx.feasibility,
          language: lang,
          history: conversationHistory,
        });

        const fallbackAnswer =
          fallbackResp?.answer ||
          (isHi
            ? `व्यापार सलाह: अपने शुरुआती निवेश को सीमित रखने के लिए उपकरण चरणबद्ध तरीके से खरीदें। क्रेडिट लिंक्ड सरकारी योजना के तहत मिलने वाली पूंजीगत सहायता से अपने कार्यशील पूंजी मार्जिन को सुरक्षित रखें।`
            : `Business Advice: Phase your machinery procurement to reduce upfront capital requirements, and leverage credit-linked capital assistance to maintain positive cash flow.`);

        finalReply = fallbackAnswer;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === advisorMsgId
              ? {
                  ...m,
                  text: fallbackAnswer,
                  isLoading: false,
                  isStreaming: false,
                }
              : m
          )
        );
      } catch (fbErr) {
        console.error("Fallback error:", fbErr);
        const errorReply =
          isHi
            ? "माफ़ कीजिए, अभी जवाब प्राप्त करने में थोड़ी समस्या आई। कृपया दोबारा प्रयास करें।"
            : "Sorry, could not generate advice at this moment. Please try again.";
        finalReply = errorReply;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === advisorMsgId
              ? {
                  ...m,
                  text: errorReply,
                  isLoading: false,
                  isStreaming: false,
                  isError: true,
                }
              : m
          )
        );
      }
    } finally {
      setLoading(false);
      scrollToBottom();
    }

    return finalReply;
  };

  // Automated Voice Conversation pipeline
  const triggerVoiceQuery = useCallback(
    async (queryText) => {
      if (!voiceModeActiveRef.current || isSendingRef.current) return;
      isSendingRef.current = true;
      setVoiceState("thinking");

      let reply = "";
      try {
        reply = await handleSend(queryText);
      } catch (err) {
        console.error("Voice conversation query error:", err);
      } finally {
        isSendingRef.current = false;
      }

      if (!voiceModeActiveRef.current) {
        setVoiceState("idle");
        return;
      }

      // Voice State: Speaking response via TTS
      setVoiceState("speaking");
      const cleanReply = (reply || "").trim();

      const spoken = speakText(cleanReply, lang, () => {
        // When speech finishes: automatically resume listening for user's next question
        if (voiceModeActiveRef.current) {
          startVoiceListening();
        } else {
          setVoiceState("idle");
        }
      });

      // If speech synthesis could not run or finished synchronously
      if (!spoken) {
        if (voiceModeActiveRef.current) {
          startVoiceListening();
        } else {
          setVoiceState("idle");
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, startVoiceListening]
  );

  useEffect(() => {
    triggerVoiceQueryRef.current = triggerVoiceQuery;
  }, [triggerVoiceQuery]);

  const handleSendMessage = handleSend;
  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    handleSend();
  };

  const handleVoiceToggle = (msgId, text) => {
    if (speakingId === msgId) {
      stopSpeaking();
      setSpeakingId(null);
    } else {
      stopSpeaking();
      const ok = speakText(text, lang);
      if (ok) {
        setSpeakingId(msgId);
      }
    }
  };

  const handleCopy = (msgId, text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleResetChat = () => {
    stopSpeaking();
    setSpeakingId(null);
    setMessages([
      {
        id: "initial",
        sender: "advisor",
        text: getInitialGreeting(),
        timestamp: "Just now",
      },
    ]);
  };

  return (
    <div className="side-page-content" style={{ padding: "0 0 24px 0" }}>
      {/* Header Banner */}
      <div className="page-header-banner">
        <div className="page-header-text">
          <span className="page-badge-pill">
            <Sparkles size={14} style={{ marginRight: "4px" }} />
            {getPageBadge("advisor", lang)}
          </span>
          <h2>
            {lang === "bn"
              ? "AI ব্যবসা উপদেষ্টার সাথে সরাসরি কথোপকথন"
              : lang === "mr"
              ? "AI व्यवसाय सल्लागाराशी थेट संवाद"
              : lang === "te"
              ? "AI వ్యాపార సలహాదారుతో ప్రత్యక్ష సంభాషణ"
              : lang === "ta"
              ? "AI வணிக ஆலோசகருடன் நேரடி உரையாடல்"
              : isHi
              ? "व्यापार सलाहकार से सीधी बातचीत"
              : "AI Business Mentor & Advisor"}
          </h2>
          <p className="page-sub-desc">
            {lang === "bn"
              ? "আপনার প্রকল্পের বাজেট, সরকারি ঋণ প্রকল্প ও লাভ-খরচের তথ্যের ভিত্তিতে ব্যক্তিগত ব্যবসায়িক পরামর্শ।"
              : lang === "mr"
              ? "आपल्या प्रकल्प बजेट, सरकारी योजना व नफ्याच्या आकडेवारीवर आधारित वैयक्तिक मार्गदर्शन."
              : lang === "te"
              ? "మీ ప్రాజెక్ట్ బడ్జెట్, ప్రభుత్వ పథకాలు మరియు లాభాల వివరాల ఆధారంగా వ్యక్తిగతీకరించిన సలహా."
              : lang === "ta"
              ? "உங்கள் திட்ட நிதி, அரசு திட்டம் மற்றும் லாப புள்ளிவிவரங்களின் அடிப்படையிலான வழிகாட்டுதல்."
              : isHi
              ? "आपके प्रोजेक्ट बजट, सरकारी योजना और मुनाफे के आंकड़ों पर आधारित व्यक्तिगत परामर्श।"
              : "Direct guidance powered by Gemini with full context of your investment, bank loan, and local demand."}
          </p>
        </div>

        <div className="govt-emblem-badge" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div>
            <strong>{lang === "bn" ? "AI উপদেষ্টা" : lang === "mr" ? "AI सल्लागार" : lang === "te" ? "AI సలహాదారు" : lang === "ta" ? "AI ஆலோசகர்" : isHi ? "AI मेंटॉर" : "Gemini AI"}</strong>
            <small>{lang === "bn" ? "সক্রিয় ও নির্ভুল" : lang === "mr" ? "सक्रिय व अचूक" : lang === "te" ? "ఖచ్చితమైనది" : lang === "ta" ? "துல்லியமானது" : isHi ? "सक्रिय व सटीक" : "Context-Aware"}</small>
          </div>
        </div>
      </div>

      {/* Active Business Context Bar */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: "12px",
          padding: "14px 18px",
          color: "#ffffff",
          marginBottom: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          border: "1px solid #334155",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "8px",
              backgroundColor: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              flexShrink: 0,
            }}
          >
            <Building2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
              {ctx.businessName} <span style={{ color: "#93c5fd", fontWeight: 500 }}>({ctx.businessType})</span>
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>
              {ctx.block ? `${ctx.block}, ` : ""}{ctx.district}, {ctx.state} • {lang === "bn" ? "প্রকল্প:" : lang === "mr" ? "योजना:" : lang === "te" ? "పథకం:" : lang === "ta" ? "திட்டம்:" : isHi ? "अनुशंसित योजना:" : "Scheme:"}{" "}
              <strong style={{ color: "#38bdf8" }}>{ctx.matchedScheme}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px" }}>
          <div style={{ background: "rgba(255,255,255,0.08)", padding: "6px 10px", borderRadius: "6px" }}>
            <span style={{ color: "#cbd5e1" }}>{lang === "bn" ? "নিজস্ব মূলধন:" : lang === "mr" ? "भांडवल:" : lang === "te" ? "స్వంత వాటా:" : lang === "ta" ? "முதலீடு:" : isHi ? "मार्जिन:" : "Margin:"}</span>{" "}
            <strong style={{ color: "#4ade80" }}>
              ₹{formatCurrency ? formatCurrency(ctx.promoterMargin) : ctx.promoterMargin?.toLocaleString("en-IN")}
            </strong>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", padding: "6px 10px", borderRadius: "6px" }}>
            <span style={{ color: "#cbd5e1" }}>{lang === "bn" ? "ব্যাংক ঋণ:" : lang === "mr" ? "बँक कर्ज:" : lang === "te" ? "బ్యాంక్ రుణం:" : lang === "ta" ? "வங்கி கடன்:" : isHi ? "बैंक लोन:" : "Loan:"}</span>{" "}
            <strong style={{ color: "#60a5fa" }}>
              ₹{formatCurrency ? formatCurrency(ctx.eligibleLoan) : ctx.eligibleLoan?.toLocaleString("en-IN")}
            </strong>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", padding: "6px 10px", borderRadius: "6px" }}>
            <span style={{ color: "#cbd5e1" }}>{lang === "bn" ? "মাসিক কিস্তি:" : lang === "mr" ? "मासिक हप्ता:" : lang === "te" ? "నెలవారీ EMI:" : lang === "ta" ? "மாத தவணை:" : isHi ? "मासिक EMI:" : "EMI:"}</span>{" "}
            <strong style={{ color: "#facc15" }}>
              ₹{formatCurrency ? formatCurrency(ctx.monthlyEmi) : ctx.monthlyEmi?.toLocaleString("en-IN")}
            </strong>
          </div>
        </div>
      </div>

      {/* Assumptions & Data Transparency (Part 7) */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          marginBottom: "16px",
          padding: "10px 16px",
          fontSize: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={() => setShowAssumptions((prev) => !prev)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={16} style={{ color: "#0284c7" }} />
            <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "12.5px" }}>
              {lang === "bn"
                ? "আর্থিক অনুমান ও তথ্যের উৎস (Data Provenance)"
                : lang === "mr"
                ? "आर्थिक गृहीतके व डेटा स्रोत (Data Provenance)"
                : lang === "te"
                ? "ఆర్థిక అంచనాలు & డేటా మూలాలు (Data Provenance)"
                : lang === "ta"
                ? "நிதி அனுமானங்கள் & தரவு மூலங்கள் (Data Provenance)"
                : isHi
                ? "वित्तीय मान्यताएं व डेटा स्रोत (Data Provenance)"
                : "Financial Assumptions & Data Provenance"}
            </span>
            <span style={{ fontSize: "11px", color: "#64748b", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
              {showAssumptions
                ? (lang === "bn" ? "লুকান" : lang === "mr" ? "लपवा" : lang === "te" ? "దాచండి" : lang === "ta" ? "மறைக்கவும்" : isHi ? "छिपाएं" : "Collapse")
                : (lang === "bn" ? "বিস্তারিত দেখুন" : lang === "mr" ? "तपशील पहा" : lang === "te" ? "వివరాలు చూడండి" : lang === "ta" ? "விவரங்களைப் பார்க்கவும்" : isHi ? "विवरण देखें" : "View Details")}
            </span>
          </div>
          <button
            type="button"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
            aria-label="Toggle assumptions"
          >
            {showAssumptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showAssumptions && (
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
              {/* User Provided */}
              {ctx.monthlyRevenue != null && (
                <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #dcfce7" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#15803d", fontWeight: 700, fontSize: "11px", textTransform: "uppercase" }}>
                    <CheckCircle2 size={13} />
                    <span>
                      {lang === "bn"
                        ? "ব্যবহারকারীর তথ্য"
                        : lang === "mr"
                        ? "वापरकर्त्याने नोंदवलेले"
                        : lang === "te"
                        ? "వినియోగదారు అందించిన వివరాలు"
                        : lang === "ta"
                        ? "பயனர் வழங்கிய விவரங்கள்"
                        : isHi
                        ? "उपयोगकर्ता द्वारा दर्ज"
                        : "User Provided"}
                    </span>
                  </div>
                  <div style={{ marginTop: "3px", color: "#1e293b", fontWeight: 600 }}>
                    {lang === "bn"
                      ? "আনুমানিক মাসিক বিক্রয়:"
                      : lang === "mr"
                      ? "अंदाजित मासिक विक्री:"
                      : lang === "te"
                      ? "అంచనా వేసిన నెలవారీ అమ్మకాలు:"
                      : lang === "ta"
                      ? "எதிர்பார்க்கப்படும் மாதாந்திர விற்பனை:"
                      : isHi
                      ? "अनुमानित मासिक बिक्री:"
                      : "Expected Monthly Sales:"}{" "}
                    ₹{formatCurrency ? formatCurrency(ctx.monthlyRevenue) : Number(ctx.monthlyRevenue).toLocaleString("en-IN")}
                  </div>
                </div>
              )}

              {ctx.monthlyExpenses != null && (
                <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #dcfce7" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#15803d", fontWeight: 700, fontSize: "11px", textTransform: "uppercase" }}>
                    <CheckCircle2 size={13} />
                    <span>
                      {lang === "bn"
                        ? "ব্যবহারকারীর তথ্য"
                        : lang === "mr"
                        ? "वापरकर्त्याने नोंदवलेले"
                        : lang === "te"
                        ? "వినియోగదారు అందించిన వివరాలు"
                        : lang === "ta"
                        ? "பயனர் வழங்கிய விவரங்கள்"
                        : isHi
                        ? "उपयोगकर्ता द्वारा दर्ज"
                        : "User Provided"}
                    </span>
                  </div>
                  <div style={{ marginTop: "3px", color: "#1e293b", fontWeight: 600 }}>
                    {lang === "bn"
                      ? "মাসিক পরিচালনা ব্যয়:"
                      : lang === "mr"
                      ? "मासिक परिचालन खर्च:"
                      : lang === "te"
                      ? "నెలవారీ నిర్వహణ ఖర్చు:"
                      : lang === "ta"
                      ? "மாதாந்திர செயல்பாட்டுச் செலவு:"
                      : isHi
                      ? "मासिक परिचालन खर्च:"
                      : "Monthly Operating Cost:"}{" "}
                    ₹{formatCurrency ? formatCurrency(ctx.monthlyExpenses) : Number(ctx.monthlyExpenses).toLocaleString("en-IN")}
                  </div>
                </div>
              )}

              {ctx.promoterMargin != null && (
                <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #dcfce7" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#15803d", fontWeight: 700, fontSize: "11px", textTransform: "uppercase" }}>
                    <CheckCircle2 size={13} />
                    <span>
                      {lang === "bn"
                        ? "ব্যবহারকারীর তথ্য"
                        : lang === "mr"
                        ? "वापरकर्त्याने नोंदवलेले"
                        : lang === "te"
                        ? "వినియోగదారు అందించిన వివరాలు"
                        : lang === "ta"
                        ? "பயனர் வழங்கிய விவரங்கள்"
                        : isHi
                        ? "उपयोगकर्ता द्वारा दर्ज"
                        : "User Provided"}
                    </span>
                  </div>
                  <div style={{ marginTop: "3px", color: "#1e293b", fontWeight: 600 }}>
                    {lang === "bn"
                      ? "উপলব্ধ নিজস্ব পুঁজি:"
                      : lang === "mr"
                      ? "उपलब्ध स्वतःचे भांडवल:"
                      : lang === "te"
                      ? "అందుబాటులో ఉన్న సొంత పెట్టుబడి:"
                      : lang === "ta"
                      ? "கிடைக்கும் சொந்த மூலதனம்:"
                      : isHi
                      ? "उपलब्ध मार्जिन पूँजी:"
                      : "Available Margin Capital:"}{" "}
                    ₹{formatCurrency ? formatCurrency(ctx.promoterMargin) : Number(ctx.promoterMargin).toLocaleString("en-IN")}
                  </div>
                </div>
              )}

              {/* Calculated */}
              {ctx.monthlyEmi != null && (
                <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #dbeafe" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#1d4ed8", fontWeight: 700, fontSize: "11px", textTransform: "uppercase" }}>
                    <Calculator size={13} />
                    <span>
                      {lang === "bn"
                        ? "গণনাকৃত (Calculated)"
                        : lang === "mr"
                        ? "गणना केलेले (Calculated)"
                        : lang === "te"
                        ? "లెక్కించబడినది (Calculated)"
                        : lang === "ta"
                        ? "கணக்கிடப்பட்டது (Calculated)"
                        : isHi
                        ? "गणना की गई (Calculated)"
                        : "Calculated"}
                    </span>
                  </div>
                  <div style={{ marginTop: "3px", color: "#1e293b", fontWeight: 600 }}>
                    {lang === "bn"
                      ? "মাসিক ব্যাংক কিস্তি (EMI):"
                      : lang === "mr"
                      ? "मासिक बँक हप्ता (EMI):"
                      : lang === "te"
                      ? "నెలవారీ బ్యాంక్ వాయిదా (EMI):"
                      : lang === "ta"
                      ? "மாதாந்திர வங்கி தவணை (EMI):"
                      : isHi
                      ? "मासिक बैंक किश्त (EMI):"
                      : "Monthly EMI:"}{" "}
                    ₹{formatCurrency ? formatCurrency(ctx.monthlyEmi) : Number(ctx.monthlyEmi).toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    {lang === "bn"
                      ? "হ্রাসমান আসল ভিত্তিতে হিসাবকৃত"
                      : lang === "mr"
                      ? "कमी होणाऱ्या मुद्दलाच्या सूत्राने"
                      : lang === "te"
                      ? "తగ్గుతున్న అసలు సూత్రం ఆధారంగా"
                      : lang === "ta"
                      ? "குறையும் அசல் சூத்திரத்தின்படி கணக்கிடப்பட்டது"
                      : isHi
                      ? "घटते मूलधन (Reducing-balance) फॉर्मूले से"
                      : "Computed via standard reducing-balance"}
                  </div>
                </div>
              )}

              {ctx.totalProjectCost != null && (
                <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #dbeafe" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#1d4ed8", fontWeight: 700, fontSize: "11px", textTransform: "uppercase" }}>
                    <Calculator size={13} />
                    <span>
                      {lang === "bn"
                        ? "গণনাকৃত (Calculated)"
                        : lang === "mr"
                        ? "गणना केलेले (Calculated)"
                        : lang === "te"
                        ? "లెక్కించబడినది (Calculated)"
                        : lang === "ta"
                        ? "கணக்கிடப்பட்டது (Calculated)"
                        : isHi
                        ? "गणना की गई (Calculated)"
                        : "Calculated"}
                    </span>
                  </div>
                  <div style={{ marginTop: "3px", color: "#1e293b", fontWeight: 600 }}>
                    {lang === "bn"
                      ? "মোট প্রকল্প ব্যয়:"
                      : lang === "mr"
                      ? "एकूण प्रकल्प खर्च:"
                      : lang === "te"
                      ? "మొత్తం ప్రాజెక్ట్ వ్యయం:"
                      : lang === "ta"
                      ? "மொத்த திட்டச் செலவு:"
                      : isHi
                      ? "कुल प्रोजेक्ट लागत:"
                      : "Total Project Cost:"}{" "}
                    ₹{formatCurrency ? formatCurrency(ctx.totalProjectCost) : Number(ctx.totalProjectCost).toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    {lang === "bn"
                      ? "১০% নিজস্ব মার্জিন অনুমানের ওপর ভিত্তি করে"
                      : lang === "mr"
                      ? "10% भांडवल आवश्यकतेवर आधारित"
                      : lang === "te"
                      ? "10% సొంత వాటా నిబంధనపై ఆధారపడి"
                      : lang === "ta"
                      ? "10% சொந்த முதலீட்டு விதியின் அடிப்படையில்"
                      : isHi
                      ? "10% मार्जिन पूँजी आवश्यकता के आधार पर"
                      : "Derived from 10% promoter equity rule"}
                  </div>
                </div>
              )}

              {/* Assumed */}
              <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #fef3c7" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#b45309", fontWeight: 700, fontSize: "11px", textTransform: "uppercase" }}>
                  <AlertTriangle size={13} />
                  <span>
                    {lang === "bn"
                      ? "অনুমান (Assumed)"
                      : lang === "mr"
                      ? "गृहीतक (Assumed)"
                      : lang === "te"
                      ? "అంచనా (Assumed)"
                      : lang === "ta"
                      ? "அனுமானம் (Assumed)"
                      : isHi
                      ? "मान्यता (Assumed)"
                      : "Assumed for Illustration"}
                  </span>
                </div>
                <div style={{ marginTop: "3px", color: "#1e293b", fontWeight: 600 }}>
                  {lang === "bn"
                    ? "সুদের হার:"
                    : lang === "mr"
                    ? "व्याज दर:"
                    : lang === "te"
                    ? "వడ్డీ రేటు:"
                    : lang === "ta"
                    ? "வட்டி விகிதம்:"
                    : isHi
                    ? "ब्याज दर:"
                    : "Interest Rate:"}{" "}
                  {ctx.interestRate ? `${ctx.interestRate}%` : "6.5% - 8.0%"}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {lang === "bn"
                    ? "ব্যাংকের নিয়ম ও ক্রেডিট স্কোরের ওপর নির্ভরশীল"
                    : lang === "mr"
                    ? "बँकेचे नियम व सिबिल स्कोअरवर अवलंबून"
                    : lang === "te"
                    ? "బ్యాంకు నిబంధనలు మరియు క్రెడిట్ స్కోర్‌పై ఆధారపడి ఉంటుంది"
                    : lang === "ta"
                    ? "வங்கி விதிமுறைகள் மற்றும் கிரெடிட் ஸ்கோரைப் பொறுத்தது"
                    : isHi
                    ? "बैंक के वास्तविक नियम व क्रेडिट स्कोर पर निर्भर"
                    : "Benchmark figure; final bank sanction terms may differ"}
                </div>
              </div>

              <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #fef3c7" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#b45309", fontWeight: 700, fontSize: "11px", textTransform: "uppercase" }}>
                  <AlertTriangle size={13} />
                  <span>
                    {lang === "bn"
                      ? "অনুমান (Assumed)"
                      : lang === "mr"
                      ? "गृहीतक (Assumed)"
                      : lang === "te"
                      ? "అంచనా (Assumed)"
                      : lang === "ta"
                      ? "அனுமானம் (Assumed)"
                      : isHi
                      ? "मान्यता (Assumed)"
                      : "Assumed for Illustration"}
                  </span>
                </div>
                <div style={{ marginTop: "3px", color: "#1e293b", fontWeight: 600 }}>
                  {lang === "bn"
                    ? "মেয়াদ ও গ্রেস পিরিয়ড:"
                    : lang === "mr"
                    ? "मुदत व सवलत कालावधी:"
                    : lang === "te"
                    ? "కాలపరిమితి & మారటోరియం:"
                    : lang === "ta"
                    ? "கால அளவு & அவகாசம்:"
                    : isHi
                    ? "अवधि व मोराटोरियम:"
                    : "Tenure & Moratorium:"}{" "}
                  {ctx.loanTenureMonths ? `${ctx.loanTenureMonths} ${getUI("monthsUnit", lang, "Months")}` : "36-84 Months"}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {lang === "bn"
                    ? "প্রকল্পের স্ট্যান্ডার্ড নির্দেশিকা অনুযায়ী"
                    : lang === "mr"
                    ? "योजनेच्या नियमांनुसार"
                    : lang === "te"
                    ? "పథకం మార్గదర్శకాల ప్రకారం"
                    : lang === "ta"
                    ? "திட்ட வழிகாட்டுதல்களின்படி"
                    : isHi
                    ? "योजना के मानक नियमों पर आधारित"
                    : "Standard benchmark; subject to sanction letter"}
                </div>
              </div>

              {/* Verified */}
              <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ede9fe" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6d28d9", fontWeight: 700, fontSize: "11px", textTransform: "uppercase" }}>
                  <ShieldCheck size={13} />
                  <span>
                    {lang === "bn"
                      ? "যাচাইকৃত ডেটাসেট (Verified Dataset)"
                      : lang === "mr"
                      ? "पडताळलेला डेटा (Verified Dataset)"
                      : lang === "te"
                      ? "ధృవీకరించబడిన డేటా (Verified Dataset)"
                      : lang === "ta"
                      ? "சரிபார்க்கப்பட்ட தரவு (Verified Dataset)"
                      : isHi
                      ? "सत्यापित डेटा (Verified Dataset)"
                      : "Verified Dataset"}
                  </span>
                </div>
                <div style={{ marginTop: "3px", color: "#1e293b", fontWeight: 600 }}>
                  {ctx.matchedScheme}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  JanSamarth / MoMSME Dataset (2026-09-24)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pre-suggested Prompts Bar */}
      <div className="detail-card" style={{ marginBottom: "16px", padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#334155" }}>
            <HelpCircle size={15} style={{ color: "#2563eb" }} />
            <span>
              {lang === "bn"
                ? "প্রস্তাবিত জরুরি প্রশ্নসমূহ (এক ক্লিকে জিজ্ঞাসা করুন):"
                : lang === "mr"
                ? "सुचवलेले महत्त्वाचे प्रश्न (एका क्लिकवर विचारा):"
                : lang === "te"
                ? "సూచించిన ముఖ్యాంశాలు (ఒక్క క్లిక్‌తో అడగండి):"
                : lang === "ta"
                ? "பரிந்துரைக்கப்பட்ட விரைவு கேள்விகள் (ஒரே கிளிக்கில் கேளுங்கள்):"
                : isHi
                ? "सुझाए गए प्रमुख सवाल (एक क्लिक में पूछें):"
                : "Suggested Quick Prompts (Click to ask):"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetChat}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
            title={lang === "bn" ? "নতুন চ্যাট" : lang === "mr" ? "नवीन प्रश्न" : isHi ? "नया सवाल" : "Reset Chat"}
          >
            <RotateCcw size={13} />
            <span>{lang === "bn" ? "নতুন চ্যাট" : lang === "mr" ? "नवीन प्रश्न" : isHi ? "नया सवाल" : "Clear Chat"}</span>
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {suggestedPrompts.map((sp) => {
            const promptText = sp[lang] || sp.en;
            const PromptIcon = PROMPT_ICONS[sp.id] || HelpCircle;
            return (
              <button
                key={sp.id}
                type="button"
                onClick={() => handleSend(promptText)}
                disabled={loading}
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "20px",
                  padding: "6px 14px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "#1e293b",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                  textAlign: "left",
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = "#e0f2fe";
                    e.currentTarget.style.borderColor = "#38bdf8";
                    e.currentTarget.style.color = "#0369a1";
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#f1f5f9";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.color = "#1e293b";
                }}
              >
                <PromptIcon size={13} style={{ color: "#2563eb", flexShrink: 0 }} />
                <span>{promptText}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dedicated Hands-Free Voice Conversation Mode Control Bar */}
      {!isVoiceMode ? (
        <div
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            border: "1.5px solid #93c5fd",
            borderRadius: "12px",
            padding: "12px 18px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                flexShrink: 0,
              }}
            >
              <Mic size={18} />
            </div>
            <div>
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1e3a8a" }}>
                {isHi ? "वॉयस बातचीत मोड (हैंड्स-फ्री वॉयस)" : "Voice Conversation Mode (Hands-Free)"}
              </div>
              <div style={{ fontSize: "12px", color: "#3b82f6" }}>
                {isHi
                  ? "बोलकर सवाल पूछें → AI जवाब देगा और बोलेगा → फिर से सुनेगा (टाइप करने या Send दबाने की ज़रूरत नहीं)"
                  : "Speak question → AI responds & speaks → listens again automatically (No typing or Send needed)"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={startVoiceMode}
            disabled={loading || !isSpeechSupported}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "9px 16px",
              fontWeight: 700,
              fontSize: "13px",
              cursor: loading || !isSpeechSupported ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
              transition: "all 0.15s ease",
            }}
          >
            <Radio size={15} />
            <span>{isHi ? "Start Voice Conversation (बातचीत शुरू करें)" : "Start Voice Conversation"}</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            background:
              voiceState === "listening"
                ? "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"
                : voiceState === "thinking"
                ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
                : "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
            border: `1.5px solid ${
              voiceState === "listening"
                ? "#f87171"
                : voiceState === "thinking"
                ? "#60a5fa"
                : "#34d399"
            }`,
            borderRadius: "12px",
            padding: "14px 18px",
            marginBottom: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            transition: "all 0.25s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {voiceState === "listening" && (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: "11px",
                      height: "11px",
                      borderRadius: "50%",
                      backgroundColor: "#ef4444",
                      animation: "pulse 1s infinite",
                    }}
                  />
                  <Mic size={20} color="#dc2626" />
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#b91c1c" }}>
                    {isHi ? "Listening... (सुन रहे हैं... बोलिए)" : "Listening..."}
                  </span>
                </>
              )}
              {voiceState === "thinking" && (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: "11px",
                      height: "11px",
                      borderRadius: "50%",
                      backgroundColor: "#2563eb",
                      animation: "pulse 1s infinite",
                    }}
                  />
                  <Bot size={20} color="#1d4ed8" />
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#1d4ed8" }}>
                    {isHi ? "Thinking... (AI सोच रहा है...)" : "Thinking..."}
                  </span>
                </>
              )}
              {voiceState === "speaking" && (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: "11px",
                      height: "11px",
                      borderRadius: "50%",
                      backgroundColor: "#059669",
                      animation: "pulse 1s infinite",
                    }}
                  />
                  <Volume2 size={20} color="#059669" />
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#047857" }}>
                    {isHi ? "Speaking... (AI बोल रहा है...)" : "Speaking..."}
                  </span>
                </>
              )}
            </div>

            {/* End Voice Conversation Button */}
            <button
              type="button"
              onClick={endVoiceMode}
              style={{
                backgroundColor: "#dc2626",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 6px rgba(220, 38, 38, 0.2)",
                transition: "all 0.15s ease",
              }}
              title="Stop continuous voice conversation"
            >
              <Square size={13} fill="#ffffff" />
              <span>{isHi ? "End Voice Conversation (समाप्त करें)" : "End Voice Conversation"}</span>
            </button>
          </div>

          {/* Transcript preview when user speaks */}
          {voiceTranscript && (
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#334155",
                fontStyle: "italic",
                marginTop: "10px",
                border: "1px dashed #cbd5e1",
              }}
            >
              "{voiceTranscript}"
            </div>
          )}
        </div>
      )}

      {/* Main Chat Thread */}
      <div
        style={{
          background: "#ffffff",
          border: "1.5px solid #e2e8f0",
          borderRadius: "14px",
          padding: "18px",
          minHeight: "360px",
          maxHeight: "520px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          marginBottom: "16px",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isUser ? "flex-end" : "flex-start",
                maxWidth: "100%",
              }}
            >
              {/* Sender label & Timestamp */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px",
                  fontSize: "11.5px",
                  color: "#64748b",
                  padding: "0 4px",
                }}
              >
                {isUser ? (
                  <>
                    <span>{msg.timestamp}</span>
                    <strong style={{ color: "#334155" }}>
                      {lang === "bn"
                        ? "আপনি"
                        : lang === "mr"
                        ? "तुम्ही"
                        : lang === "te"
                        ? "మీరు"
                        : lang === "ta"
                        ? "நீங்கள்"
                        : isHi
                        ? "आप"
                        : "You"}
                    </strong>
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: "#cbd5e1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <User size={11} color="#334155" />
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: "#059669",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Bot size={11} color="#ffffff" />
                    </div>
                    <strong style={{ color: "#059669" }}>
                      {lang === "bn"
                        ? "AI ব্যবসা উপদেষ্টা"
                        : lang === "mr"
                        ? "AI व्यवसाय सल्लागार"
                        : lang === "te"
                        ? "AI వ్యాపార సలహాదారు"
                        : lang === "ta"
                        ? "AI வணிக ஆலோசகர்"
                        : isHi
                        ? "AI व्यापार सलाहकार"
                        : "AI Business Mentor"}
                    </strong>
                    <span>{msg.timestamp}</span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                style={{
                  maxWidth: "85%",
                  backgroundColor: isUser ? "#1e40af" : msg.isError ? "#fef2f2" : "#f8fafc",
                  color: isUser ? "#ffffff" : msg.isError ? "#991b1b" : "#0f172a",
                  border: isUser
                    ? "none"
                    : msg.isError
                    ? "1px solid #fecaca"
                    : "1.5px solid #e2e8f0",
                  borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding: "14px 18px",
                  boxShadow: isUser
                    ? "0 2px 6px rgba(30, 64, 175, 0.2)"
                    : "0 1px 3px rgba(0,0,0,0.05)",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {(msg.isLoading || (msg.isStreaming && !msg.text) || (!msg.text && !msg.isError)) ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      color: "#0369a1",
                      backgroundColor: "#f0f9ff",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #bae6fd",
                    }}
                  >
                    <div className="spinner-dots" style={{ display: "inline-flex", gap: "4px" }}>
                      <span style={{ animation: "pulse 1s infinite" }}>●</span>
                      <span style={{ animation: "pulse 1s infinite 0.2s" }}>●</span>
                      <span style={{ animation: "pulse 1s infinite 0.4s" }}>●</span>
                    </div>
                    <span style={{ fontStyle: "italic", fontSize: "13.5px", fontWeight: 600 }}>
                      {lang === "bn"
                        ? "আপনার হিসাব পর্যালোচনা করা হচ্ছে..."
                        : lang === "mr"
                        ? "आपल्या आकडेवारीचे विश्लेषण करत आहे..."
                        : lang === "te"
                        ? "మీ గణాంకాలను విశ్లేషిస్తోంది..."
                        : lang === "ta"
                        ? "உங்கள் புள்ளிவிவரங்கள் ஆய்வு செய்யப்படுகின்றன..."
                        : isHi
                        ? "आपके आंकड़ों का विश्लेषण हो रहा है..."
                        : "Analyzing your numbers..."}
                    </span>
                  </div>
                ) : (
                  <div>{msg.text}</div>
                )}

                {/* Advisor Message Actions */}
                {!isUser && msg.text && !msg.isStreaming && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginTop: "10px",
                      paddingTop: "8px",
                      borderTop: "1px dashed #cbd5e1",
                      fontSize: "12px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleVoiceToggle(msg.id, msg.text)}
                      style={{
                        background: speakingId === msg.id ? "#fef08a" : "#ffffff",
                        border: "1px solid #cbd5e1",
                        color: speakingId === msg.id ? "#854d0e" : "#475569",
                        borderRadius: "16px",
                        padding: "3px 10px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontWeight: 600,
                        fontSize: "11.5px",
                        transition: "all 0.15s ease",
                      }}
                      title={speakingId === msg.id ? "Stop voice" : "Listen in voice"}
                    >
                      {speakingId === msg.id ? (
                        <>
                          <VolumeX size={13} />
                          <span>
                            {lang === "bn"
                              ? "আওয়াজ বন্ধ করুন"
                              : lang === "mr"
                              ? "आवाज थांबवा"
                              : lang === "te"
                              ? "వాయిస్ ఆపండి"
                              : lang === "ta"
                              ? "குரலை நிறுத்து"
                              : isHi
                              ? "आवाज़ रोकें"
                              : "Stop"}
                          </span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={13} />
                          <span>
                            {lang === "bn"
                              ? "শুনে নিন"
                              : lang === "mr"
                              ? "ऐका"
                              : lang === "te"
                              ? "వినండి"
                              : lang === "ta"
                              ? "கேளுங்கள்"
                              : isHi
                              ? "बोलकर सुनें"
                              : "Listen"}
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        color: "#475569",
                        borderRadius: "16px",
                        padding: "3px 10px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontWeight: 600,
                        fontSize: "11.5px",
                      }}
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check size={12} color="#16a34a" />
                          <span style={{ color: "#16a34a" }}>
                            {lang === "bn"
                              ? "কপি হয়েছে"
                              : lang === "mr"
                              ? "कॉपी झाले"
                              : lang === "te"
                              ? "కాపీ చేయబడింది"
                              : lang === "ta"
                              ? "நகலெடுக்கப்பட்டது"
                              : isHi
                              ? "कॉपी हो गया"
                              : "Copied"}
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>
                            {lang === "bn"
                              ? "কপি করুন"
                              : lang === "mr"
                              ? "कॉपी करा"
                              : lang === "te"
                              ? "కాపీ చేయండి"
                              : lang === "ta"
                              ? "நகலெடு"
                              : isHi
                              ? "कॉपी करें"
                              : "Copy"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Form Bar - Styled with Light Warm Color Palette (#FFFBEB / #FCD34D) & Dark Text (#1F2937) */}
      <form
        onSubmit={handleSubmit}
        className="advisor-query-form"
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "flex-end",
          backgroundColor: "#FFFBEB",
          borderRadius: "12px",
          padding: "10px 12px",
          border: "1.5px solid #FCD34D",
          boxShadow: "0 2px 8px rgba(217, 119, 6, 0.08)",
          transition: "all 0.2s ease",
        }}
      >
        <textarea
          rows={2}
          value={inputQuestion}
          className="advisor-query-textarea"
          onChange={(e) => {
            setInputQuestion(e.target.value);
            setErrorMsg("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={
            isVoiceMode
              ? lang === "bn"
                ? "🎙️ ভয়েস মোড সক্রিয়... আপনার প্রশ্ন বলুন (AI শুনে স্বয়ংক্রিয়ভাবে উত্তর দেবে)..."
                : lang === "mr"
                ? "🎙️ व्हॉइस मोड सुरू आहे... आपला प्रश्न बोला (AI ऐकून उत्तर देईल व बोलेल)..."
                : lang === "te"
                ? "🎙️ వాయిస్ మోడ్ యాక్టివ్... మీ ప్రశ్న మాట్లాడండి (AI విని సమాధానం చెబుతుంది)..."
                : lang === "ta"
                ? "🎙️ குரல் முறை செயலில் உள்ளது... உங்கள் கேள்வியைப் பேசுங்கள்..."
                : isHi
                ? "🎙️ वॉयस मोड चालू है... अपना सवाल बोलें (AI सुनकर जवाब देगा और बोलेगा)..."
                : "🎙️ Voice Mode Active... Speak your question (AI answers and speaks automatically)..."
              : lang === "bn"
              ? "এখানে আপনার ব্যবসা সম্পর্কিত যেকোনো প্রশ্ন লিখুন বা মাইকে বলুন..."
              : lang === "mr"
              ? "येथे आपल्या व्यवसायाबद्दल कोणताही प्रश्न लिहा किंवा बोला..."
              : lang === "te"
              ? "ఇక్కడ మీ వ్యాపారం గురించి ఏదైనా ప్రశ్న రాయండి లేదా మాట్లాడండి..."
              : lang === "ta"
              ? "உங்கள் தொழில் பற்றி ஏதேனும் கேள்வியை இங்கே தட்டச்சு செய்யவும் அல்லது பேசவும்..."
              : isHi
              ? "यहाँ अपने व्यापार के बारे में कोई भी सवाल लिखें या बोलें..."
              : "Ask any question about your numbers (type or click microphone to speak)..."
          }
          disabled={loading}
          style={{
            flex: 1,
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            fontSize: "14.5px",
            color: "#1F2937",
            caretColor: "#1F2937",
            padding: "6px 8px",
            lineHeight: 1.5,
            fontFamily: "inherit",
          }}
        />

        {/* Action Buttons: Voice Input Microphone + Send / Ask Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {/* Microphone Voice Button */}
          <button
            type="button"
            onClick={toggleVoiceMode}
            disabled={loading || !isSpeechSupported}
            aria-label={
              isVoiceMode
                ? lang === "bn"
                  ? "ভয়েস বন্ধ করুন"
                  : lang === "mr"
                  ? "व्हॉइस संभाषण समाप्त करा"
                  : isHi
                  ? "वॉयस बातचीत समाप्त करें"
                  : "End voice conversation"
                : lang === "bn"
                ? "ভয়েস শুরু করুন"
                : lang === "mr"
                ? "व्हॉइस संभाषण सुरू करा"
                : isHi
                ? "वॉयस बातचीत शुरू करें"
                : "Start voice conversation"
            }
            title={
              !isSpeechSupported
                ? lang === "bn"
                  ? "এই ব্রাউজারে ভয়েস সমর্থিত নয়।"
                  : lang === "mr"
                  ? "या ब्राउझरमध्ये व्हॉइस समर्थित नाही."
                  : isHi
                  ? "इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है।"
                  : "Voice input isn't supported in this browser."
                : isVoiceMode
                ? lang === "bn"
                  ? "ভয়েস কথোপকথন বন্ধ করতে ক্লিক করুন"
                  : lang === "mr"
                  ? "व्हॉइस संभाषण थांबवण्यासाठी क्लिक करा"
                  : isHi
                  ? "वॉयस बातचीत बंद करें"
                  : "Click to end voice conversation"
                : lang === "bn"
                ? "কথা বলে প্রশ্ন জিজ্ঞাসা করুন"
                : lang === "mr"
                ? "बोलून प्रश्न विचारा"
                : isHi
                ? "बोलकर बातचीत शुरू करें"
                : "Start Voice Conversation"
            }
            style={{
              height: "44px",
              padding: isVoiceMode ? "0 14px" : "0 12px",
              borderRadius: "8px",
              border: isVoiceMode
                ? "1.5px solid #EF4444"
                : !isSpeechSupported
                ? "1.5px solid #E5E7EB"
                : "1.5px solid #F59E0B",
              backgroundColor: isVoiceMode
                ? "#FEE2E2"
                : !isSpeechSupported
                ? "#F3F4F6"
                : "#FEF3C7",
              color: isVoiceMode
                ? "#DC2626"
                : !isSpeechSupported
                ? "#9CA3AF"
                : "#92400E",
              cursor: loading || !isSpeechSupported ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: "13px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            {isVoiceMode ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: "9px",
                    height: "9px",
                    borderRadius: "50%",
                    backgroundColor: "#DC2626",
                    animation: "pulse 1s infinite",
                  }}
                />
                <Square size={13} fill="#DC2626" />
                <span>
                  {voiceState === "speaking"
                    ? lang === "bn" ? "বলছেন..." : lang === "mr" ? "बोलत आहे..." : isHi ? "बोल रहे हैं..." : "Speaking..."
                    : voiceState === "thinking"
                    ? lang === "bn" ? "চিন্তা করছেন..." : lang === "mr" ? "विचार करत आहे..." : isHi ? "सोच रहे हैं..." : "Thinking..."
                    : lang === "bn" ? "শুনছেন..." : lang === "mr" ? "ऐकत आहे..." : isHi ? "सुन रहे हैं..." : "Listening..."}
                </span>
              </>
            ) : (
              <>
                <Mic size={17} style={{ opacity: isSpeechSupported ? 1 : 0.5 }} />
                <span className="hidden sm:inline" style={{ fontSize: "12.5px" }}>
                  {lang === "bn" ? "ভয়েস মোড" : lang === "mr" ? "व्हॉइस मोड" : lang === "te" ? "వాయిస్ మోడ్" : lang === "ta" ? "குரல் முறை" : isHi ? "वॉयस मोड" : "Voice Mode"}
                </span>
              </>
            )}
          </button>

          {/* Submit / Ask Button */}
          <button
            type="submit"
            onClick={(e) => {
              if (!loading && inputQuestion.trim()) {
                handleSubmit(e);
              }
            }}
            disabled={loading || !inputQuestion.trim()}
            style={{
              backgroundColor: loading ? "#0284c7" : !inputQuestion.trim() ? "#94a3b8" : "#1e40af",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 18px",
              fontWeight: 700,
              fontSize: "13.5px",
              cursor: loading || !inputQuestion.trim() ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
              transition: "all 0.15s ease",
              height: "44px",
            }}
          >
            {loading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span className="spinner-dots" style={{ display: "inline-flex", gap: "2px" }}>
                  <span>●</span>
                  <span>●</span>
                  <span>●</span>
                </span>
                <span>
                  {lang === "bn"
                    ? "হিসাব পর্যালোচনা হচ্ছে..."
                    : lang === "mr"
                    ? "आकडेवारी तपासत आहे..."
                    : lang === "te"
                    ? "గణాంకాలు విశ్లేషిస్తోంది..."
                    : lang === "ta"
                    ? "புள்ளிவிவரங்களை ஆய்வு செய்கிறது..."
                    : isHi
                    ? "आंकड़ों का विश्लेषण हो रहा है..."
                    : "Analyzing your numbers..."}
                </span>
              </span>
            ) : (
              <>
                <span>
                  {lang === "bn"
                    ? "জিজ্ঞাসা করুন"
                    : lang === "mr"
                    ? "विचारा"
                    : lang === "te"
                    ? "అడగండి"
                    : lang === "ta"
                    ? "கேளுங்கள்"
                    : isHi
                    ? "पूछें"
                    : "Ask"}
                </span>
                <Send size={15} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Active Listening Indicator Banner */}
      {isListening && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px 14px",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12.5px",
            color: "#DC2626",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#DC2626",
              animation: "pulse 1s infinite",
            }}
          />
          <span>
            {lang === "bn"
              ? "🎙️ মাইক্রোফোন সক্রিয়... আপনার প্রশ্ন বলুন (বলা শেষে 'শুনছেন...' বাটনে ক্লিক করে 'জিজ্ঞাসা করুন' চাপুন)"
              : lang === "mr"
              ? "🎙️ मायक्रोफोन सक्रिय आहे... आपला प्रश्न बोला"
              : isHi
              ? "🎙️ माइक्रोफ़ोन सक्रिय है... अपना सवाल बोलें (समाप्त होने पर 'सुन रहे हैं...' बटन दबाएँ, फिर 'पूछें' पर क्लिक करें)"
              : "🎙️ Microphone active... Speak your question (Click 'Listening...' to finish speaking, review/edit, then press Ask)"}
          </span>
        </div>
      )}

      {/* Speech Recognition Error Banner */}
      {speechError && (
        <div
          style={{
            marginTop: "8px",
            padding: "9px 14px",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#B91C1C",
            borderRadius: "8px",
            fontSize: "12.5px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{speechError}</span>
        </div>
      )}

      {loading && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px 14px",
            backgroundColor: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12.5px",
            color: "#0369a1",
            fontWeight: 600,
          }}
        >
          <div className="spinner-dots" style={{ display: "inline-flex", gap: "3px" }}>
            <span style={{ animation: "pulse 1s infinite" }}>●</span>
            <span style={{ animation: "pulse 1s infinite 0.2s" }}>●</span>
            <span style={{ animation: "pulse 1s infinite 0.4s" }}>●</span>
          </div>
          <span>Analyzing your numbers... (Gemini Rural Mentor)</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px 14px",
            backgroundColor: "#fef2f2",
            color: "#b91c1c",
            borderRadius: "6px",
            fontSize: "12.5px",
          }}
        >
          {errorMsg}
        </div>
      )}
    </div>
  );
}
