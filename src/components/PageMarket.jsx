import { useState, useEffect, useRef } from "react";
import { Loader2, Sparkles } from "lucide-react";
import HyperLocalScanner from "./HyperLocalScanner";
import { getDistrictCoordinates, getCategoryOsmTag } from "../utils/geoUtils";
import { API_ROUTES } from "../apiRoutes";
import {
  getUI,
  getPageBadge,
  translateDemand,
  translateDynamicPhrase,
} from "../utils/translationHelper";

export default function PageMarket({ 
  result, 
  lang = "hi", 
  formData, 
  userCoords, 
  onScanComplete,
  localMarketData
}) {
  const isHi = lang === "hi";

  // State to hold the dynamic AI-generated market advisory
  const [liveAdvisory, setLiveAdvisory] = useState(
    result?.market_summary || result?.feasibility_report || ""
  );
  const [isGeneratingAdvisory, setIsGeneratingAdvisory] = useState(false);
  const lastScannedKeyRef = useRef("");

  const market = result.hyper_local_profile ?? {};
  const reach = market.market_reach ?? {};
  const rawDemand = market.local_demand ?? "Moderate";
  const demand = translateDemand(rawDemand, lang);
  const score = market.market_potential_score ?? 75;
  const suitability = market.location_suitability ?? "Suitable";
  const channels = reach.distribution_channels ?? [
    "Local Village Market / Haat",
    "Direct Farm / Shop Pickup",
    "Supply to Nearest Kasba / Tehsil Mandi",
  ];

  // Resolve coordinates and OSM tag dynamically without hardcoded Meerut defaults
  const targetDistrict = (formData?.district || result?.district || "").trim();
  const targetState = (formData?.state || result?.state || "").trim();
  const defaultCoords = getDistrictCoordinates(targetDistrict, targetState);
  const userLat = userCoords?.lat || formData?.userLat || (defaultCoords ? defaultCoords[0] : null);
  const userLng = userCoords?.lng || formData?.userLng || (defaultCoords ? defaultCoords[1] : null);
  const businessCategoryTag = getCategoryOsmTag(formData?.category || result?.category || "Dairy & Milk Products");

  // Automatically trigger AI advisory generation when scan results arrive
  useEffect(() => {
    if (!localMarketData || localMarketData.status === "unavailable" || localMarketData.competitors === null || localMarketData.competitors === undefined) return;

    const compCount = Array.isArray(localMarketData.competitors) ? localMarketData.competitors.length : localMarketData.competitors;
    const bankCount = Array.isArray(localMarketData.banks) ? localMarketData.banks.length : (localMarketData.banks || 0);
    const mandiCount = Array.isArray(localMarketData.mandis) ? localMarketData.mandis.length : (localMarketData.mandis || 0);

    const scanKey = `${compCount}-${bankCount}-${mandiCount}-${targetDistrict}`;
    if (lastScannedKeyRef.current === scanKey) return;
    lastScannedKeyRef.current = scanKey;

    const generateLiveMarketAdvisory = async () => {
      setIsGeneratingAdvisory(true);
      try {
        const categoryName = formData?.category || result?.category || "Rural Enterprise";

        const promptQuery = isHi
          ? `रियल-टाइम फील्ड डेटा (10 किमी दायरा, OpenStreetMap): ${compCount} प्रतिद्वंदी, ${bankCount} बैंक, ${mandiCount} मंडी/वेयरहाउस। ${targetDistrict ? `${targetDistrict}, ` : ""}${targetState} में ${categoryName} के व्यापार की व्यावहारिकता पर 3-4 वाक्यों का संक्षिप्त बाज़ार सारांश लिखें। 
          CRITICAL: DO NOT use any Markdown formatting like *, #, or **. Write in plain text only.`
          : `Real-time field data (10km radius, OpenStreetMap): Exactly ${compCount} competitors, ${bankCount} banks, and ${mandiCount} mandis/warehouses found. Provide a concise 3-4 sentence Local Market Feasibility Summary for starting a ${categoryName} in ${targetDistrict ? `${targetDistrict}, ` : ""}${targetState}. 
          CRITICAL: DO NOT use any Markdown formatting (no asterisks, no hashes, no bolding). Write in plain text paragraphs only.`;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(API_ROUTES.ADVISOR, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: promptQuery,
            question: promptQuery,
            language: lang,
            selectedLanguage: isHi ? "Hindi" : "English",
            businessContext: { businessType: categoryName, district: targetDistrict, state: targetState },
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          let reply = (data?.reply || data?.answer || data?.text || "").trim();
          reply = reply.replace(/[*#_`]/g, ""); 
          
          if (reply) {
            setLiveAdvisory(reply);
          }
        }
      } catch (err) {
        console.warn("Failed to generate live market advisory:", err);
      } finally {
        setIsGeneratingAdvisory(false);
      }
    };

    generateLiveMarketAdvisory();
  }, [localMarketData, targetDistrict, targetState, lang, isHi, formData, result]);

  return (
    <div className="side-page-content">
      <div className="page-header-banner">
        <div className="page-header-text">
          <span className="page-badge-pill">
            {getPageBadge("market", lang)}
          </span>
          <h2>
            {lang === "bn"
              ? `${result.location || targetDistrict || "আপনার এলাকা"}-এ বাজার ও ক্রেতা চাহিদা বিশ্লেষণ`
              : lang === "mr"
              ? `${result.location || targetDistrict || "आपला परिसर"} येथील स्थानिक बाजार व ग्राहक विश्लेषण`
              : lang === "te"
              ? `${result.location || targetDistrict || "మీ ప్రాంతం"}లో మార్కెట్ & డిమాండ్ విశ్లేషణ`
              : lang === "ta"
              ? `${result.location || targetDistrict || "உங்கள் பகுதி"} சந்தை மற்றும் நுகர்வோர் தேவை ஆய்வு`
              : isHi
              ? `${result.location || targetDistrict || "इलाके"} में बाज़ार व ग्राहकों का विश्लेषण`
              : `Local Market Demand in ${result.location || targetDistrict || "Your Area"}`}
          </h2>
          <p className="page-sub-desc">
            {lang === "bn"
              ? "ওপেনস্ট্রিটম্যাপ (Overpass API) দ্বারা আপনার এলাকা ও ১০-৫০ কিমি ব্যাসার্ধে ব্যাংক, মান্ডি ও প্রতিযোগীদের লাইভ স্ক্যান।"
              : lang === "mr"
              ? "ओपनस्ट्रीटमॅप (Overpass API) द्वारे आपल्या गावात व 10-50 किमी परिसरात बँका, बाजारपेठा व स्पर्धकांचे थेट स्कॅन."
              : lang === "te"
              ? "ఓపెన్‌స్ట్రీట్‌మ్యాప్ ద్వారా మీ గ్రామంలో మరియు 10-50 కిమీ పరిధిలో బ్యాంకులు, మండీలు మరియు పోటీదారుల ప్రత్యక్ష స్కాన్."
              : lang === "ta"
              ? "ஓபன்ஸ்ட்ரீட்மேப் மூலம் உங்கள் பகுதியில் 10-50 கிமீ சுற்றளவில் வங்கிகள், சந்தைகள் மற்றும் போட்டியாளர்களின் நேரலை ஆய்வு."
              : isHi
              ? "ओपनस्ट्रीटमैप (Overpass API) द्वारा आपके गाँव व आस-पास के 10-50 किमी के दायरे में बैंकों, मंडियों और प्रतिद्वंदियों का लाइव स्कैन।"
              : "Live visual scan of banks, mandis, and competitors across 10-50 km radius via OpenStreetMap (Overpass API)."}
          </p>
        </div>
      </div>

      {/* Comprehensive OpenStreetMap & Leaflet Hyper-Local Environment Scanner */}
      <HyperLocalScanner
        userLat={userLat}
        userLng={userLng}
        businessCategory={formData?.category || result?.category || "Dairy & Milk Products"}
        businessCategoryTag={businessCategoryTag}
        onScanComplete={onScanComplete}
        scannedData={localMarketData}
        businessName={formData?.business_name || result?.business || "Kisan Dairy Farm"}
        district={targetDistrict}
        state={targetState}
        lang={lang}
      />

      {/* 4 Market Highlight Cards */}
      <div className="kpi-hero-grid">
        <div className="kpi-hero-card kpi-green">
          <div className="kpi-top">
            <span className="kpi-tag">{lang === "bn" ? "চাহিদা" : lang === "mr" ? "मागणी" : isHi ? "माँग स्तर" : "Demand"}</span>
          </div>
          <p className="kpi-label">{getUI("localVillageDemand", lang, "Local Customer Demand")}</p>
          <h3 className="kpi-value text-green">{demand}</h3>
          <p className="kpi-hint">
            {lang === "bn"
              ? "গ্রাম ও স্থানীয় বাজারে এই পণ্যের গ্রাহক চাহিদা"
              : lang === "mr"
              ? "गावात व परिसरात या उत्पादनाची निकड"
              : isHi
              ? "गाँव व कस्बे में इस उत्पाद की जरूरत"
              : "Appetite for this product or service locally"}
          </p>
        </div>

        {/* Dynamic Grounded Competition Card */}
        <div className="kpi-hero-card kpi-amber">
          <div className="kpi-top">
            <span className="kpi-tag">{lang === "bn" ? "প্রতিযোগিতা" : lang === "mr" ? "स्पर्धा" : isHi ? "प्रतिद्वंद्विता" : "Competition"}</span>
          </div>
          <p className="kpi-label">{getUI("existingCompetition", lang, "Existing Competition")}</p>
          <h3 className="kpi-value">
            {localMarketData?.status === "unavailable" || (localMarketData && localMarketData.competitors === null)
              ? (lang === "bn" ? "তথ্য অনুপলব্ধ" : isHi ? "डेटा अनुपलब्ध" : "Unavailable")
              : localMarketData?.competitors !== undefined && localMarketData?.competitors !== null
              ? (localMarketData.competitors === 0 || (Array.isArray(localMarketData.competitors) && localMarketData.competitors.length === 0)
                  ? (lang === "bn" ? "০ প্রতিযোগী" : isHi ? "0 प्रतिद्वंदी" : "0 Competitors")
                  : `${Array.isArray(localMarketData.competitors) ? localMarketData.competitors.length : localMarketData.competitors} ${lang === "bn" ? "টি ইউনিট" : isHi ? "इकाइयाँ" : "Units"}`)
              : (lang === "bn" ? "এখনও স্ক্যান হয়নি" : isHi ? "अभी स्कैन नहीं हुआ" : "Not scanned yet")}
          </h3>
          <p className="kpi-hint">
            {localMarketData?.status === "unavailable" || (localMarketData && localMarketData.competitors === null)
              ? (lang === "bn" ? "ম্যাপ সার্ভার থেকে তথ্য সংগ্রহ করা যায়নি" : isHi ? "मानचित्र सर्वर से फ़ील्ड डेटा प्राप्त नहीं हो सका" : "Field data could not be retrieved from map service")
              : localMarketData?.competitors !== undefined && localMarketData?.competitors !== null
              ? (localMarketData.competitors === 0 || (Array.isArray(localMarketData.competitors) && localMarketData.competitors.length === 0)
                  ? (lang === "bn" ? "স্ক্যান সম্পন্ন — ১০ কিমি ব্যাসার্ধে কোনো প্রতিযোগী নেই" : isHi ? "स्कैन पूरा हुआ — 10 किमी दायरे में कोई प्रतिद्वंदी नहीं (OpenStreetMap सत्यापित)" : "Scan completed — 0 competitors found in 10 km (OpenStreetMap verified)")
                  : (lang === "bn" ? "১০ কিমি ব্যাসার্ধে চিহ্নিত ব্যবসায়িক ইউনিট" : isHi ? "10 किमी के दायरे में पाई गई दुकानें (OpenStreetMap)" : "Verified units detected in 10 km (OpenStreetMap)"))
              : (lang === "bn" ? "বাস্তব তথ্য দেখতে নিচে 'Scan Area' ক্লিক করুন" : isHi ? "वास्तविक गणना देखने के लिए नीचे 'Scan Area' पर क्लिक करें" : "Click 'Scan Area' below to analyze your local market")}
          </p>
        </div>

        <div className="kpi-hero-card kpi-purple">
          <div className="kpi-top">
            <span className="kpi-tag">{lang === "bn" ? "স্কোর" : lang === "mr" ? "गुण" : isHi ? "बाज़ार स्कोर" : "Score"}</span>
          </div>
          <p className="kpi-label">{getUI("marketPotentialScore", lang, "Market Potential Score")}</p>
          <h3 className="kpi-value text-purple">{score}/100</h3>
          <p className="kpi-hint">
            {lang === "bn" ? "ব্যবসার সফলতার সামগ্রিক সম্ভাবনা সূচক" : isHi ? "व्यापार के सफल होने की संभावना" : "Overall local viability index out of 100"}
          </p>
        </div>

        <div className="kpi-hero-card kpi-blue">
          <div className="kpi-top">
            <span className="kpi-tag">{lang === "bn" ? "অবস্থান" : lang === "mr" ? "स्थान" : isHi ? "स्थान उपयुक्तता" : "Location"}</span>
          </div>
          <p className="kpi-label">{getUI("locationSuitability", lang, "Location Suitability")}</p>
          <h3 className="kpi-value">{suitability}</h3>
          <p className="kpi-hint">
            {lang === "bn" ? "আপনার নির্বাচিত এলাকার ভৌগোলিক উপযুক্ততা" : isHi ? "आपके चुने हुए गाँव/स्थान की अनुकूलता" : "Strategic suitability of selected site"}
          </p>
        </div>
      </div>

      {/* Customer Radius & Distribution */}
      <div className="two-column-grid">
        <div className="detail-card">
          <div className="detail-card-head">
            <div>
              <h3>{getUI("customerRadiusTitle", lang, "Customer Radius & Coverage")}</h3>
              <p>{getUI("customerRadiusSub", lang, "Primary and extended village reach")}</p>
            </div>
          </div>

          <div className="radius-display-row">
            <div className="radius-box rad-primary">
              <span className="rad-circle">5 KM</span>
              <div>
                <strong>{lang === "bn" ? "প্রাথমিক বিস্তার (৫ কিমি)" : isHi ? "प्राथमिक दायरा (Primary)" : "Primary Reach (5 km)"}</strong>
                <p>
                  {lang === "bn"
                    ? "নিয়মিত স্থানীয় ক্রেতা ও প্রতিবেশী গ্রামীণ গ্রাহক"
                    : isHi
                    ? "रोज़ाना आने वाले स्थानीय ग्रामीण व पास के पड़ोस के ग्राहक"
                    : "Core village residents & regular footfall within 5 km"}
                </p>
              </div>
            </div>

            <div className="radius-box rad-extended">
              <span className="rad-circle">10 KM</span>
              <div>
                <strong>{lang === "bn" ? "বর্ধিত বিস্তার (১০ কিমি)" : isHi ? "विस्तारित दायरा (Extended)" : "Extended Reach (10 km)"}</strong>
                <p>
                  {lang === "bn"
                    ? "সাপ্তাহিক হাট, আশপাশের ৪-৫টি গ্রাম ও প্রধান সংযোগ সড়ক"
                    : isHi
                    ? "सप्ताहिक हाट, आस-पास के 4-5 गाँव और मुख्य संपर्क सड़क"
                    : "Weekly haat bazaars, connecting villages & road transit"}
                </p>
              </div>
            </div>
          </div>

          <div className="market-meta-list">
            <div className="meta-item">
              <span>{lang === "bn" ? "ভোক্তা ভিত্তি:" : isHi ? "उपभोक्ता आधार:" : "Consumer Base:"}</span>
              <strong>{reach.consumer_base || (lang === "bn" ? "গ্রামীণ পরিবার ও কৃষক" : isHi ? "ग्रामीण परिवार व किसान" : "Rural households & farming families")}</strong>
            </div>
            <div className="meta-item">
              <span>{lang === "bn" ? "পৌঁছানোর ধরন:" : isHi ? "पहुँच का प्रकार:" : "Market Reach Type:"}</span>
              <strong>{reach.reach_type || (lang === "bn" ? "হাইপার-লোকাল গ্রামীণ ক্লাস্টার" : isHi ? "हाइपर-लोकल ग्रामीण क्लस्टर" : "Hyper-local rural cluster")}</strong>
            </div>
            <div className="meta-item">
              <span>{lang === "bn" ? "তথ্যের নির্ভরযোগ্যতা:" : isHi ? "डेटा विश्वसनीयता:" : "Data Confidence:"}</span>
              <strong className="text-green">{reach.confidence || "High (85%+)"}</strong>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-card-head">
            <div>
              <h3>{getUI("bestSellingChannelsTitle", lang, "Best Selling & Distribution Channels")}</h3>
              <p>{getUI("bestSellingChannelsSub", lang, "Where & how to distribute your products")}</p>
            </div>
          </div>

          <ul className="channel-list">
            {channels.map((ch, idx) => (
              <li key={idx} className="channel-item">
                <span className="ch-num">{idx + 1}</span>
                <div>
                  <strong>{translateDynamicPhrase(ch, lang)}</strong>
                  <p>
                    {idx === 0
                      ? (lang === "bn"
                          ? "দোকান বা খামার থেকে সরাসরি নগদ বিক্রয়, কোনো দালাল ছাড়া।"
                          : lang === "mr"
                          ? "दुकान किंवा शेतातून थेट ग्राहकांना रोख विक्री, मध्यस्थांशिवाय."
                          : lang === "te"
                          ? "షాప్ లేదా ఫామ్ నుండి దళారులు లేకుండా వినియోగదారులకు ప్రత్యక్ష నగదు అమ్మకాలు."
                          : lang === "ta"
                          ? "இடைத்தரகர்கள் இல்லாமல் வாடிக்கையாளர்களுக்கு நேரடியாக விற்பனை."
                          : isHi
                          ? "दुकान या फार्म से सीधे नकद बिक्री, बिना किसी बिचौलिए के।"
                          : "Direct retail sales to end consumers without middlemen.")
                      : idx === 1
                      ? (lang === "bn"
                          ? "গ্রামের সাপ্তাহিক হাট ও বাজারে স্টল দিয়ে পণ্য বিক্রয়।"
                          : lang === "mr"
                          ? "गावातील आठवडी बाजार व पेठेत स्टॉल लावून विक्री."
                          : lang === "te"
                          ? "గ్రామ వారపు సంతలు మరియు మార్కెట్లలో స్టాల్ ఏర్పాటు చేసి విక్రయించడం."
                          : lang === "ta"
                          ? "கிராம வாராந்திர சந்தைகளில் ஸ்டால் அமைத்து விற்பனை."
                          : isHi
                          ? "गाँव के साप्ताहिक हाट व पैठ बाज़ार में स्टॉल लगाकर बिक्री।"
                          : "Weekly haat bazaar stalls and community market days.")
                      : (lang === "bn"
                          ? "নিকটবর্তী হোটেল, মিষ্টির দোকান বা পাইকারদের পাইকারি সরবরাহ।"
                          : lang === "mr"
                          ? "जवळपासची हॉटेल्स, गोड दुकाने किंवा घाऊक व्यापाऱ्यांना घाऊक पुरवठा."
                          : lang === "te"
                          ? "సమీప హోటళ్ళు, స్వీట్ షాపులు లేదా టోకు వ్యాపారులకు హోల్‌సేల్ సరఫరా."
                          : lang === "ta"
                          ? "அருகிலுள்ள உணவகங்கள், இனிப்புக் கடைகள் அல்லது மொத்த வியாபாரிகளுக்கு விநியோகம்."
                          : isHi
                          ? "नज़दीकी होटल, डेयरी या थोक व्यापारी को बल्क सप्लाई।"
                          : "Bulk supply partnerships with local retailers & eateries.")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Local Market Summary - Dynamic & Grounded */}
      <div style={{ marginTop: "24px", padding: "18px 20px", background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: "#2563eb" }}></span>
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
              {getUI("localMarketAdvisoryTitle", lang, "Local Market Advisory Summary")}
            </h4>
          </div>
          {localMarketData && (
            <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", backgroundColor: "#ecfdf5", color: "#059669", borderRadius: "12px", border: "1px solid #a7f3d0", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <Sparkles size={11} />
              {getUI("liveOsmGrounded", lang, "Live OSM Grounded")}
            </span>
          )}
        </div>

        <div style={{ fontSize: "14px", lineHeight: "1.7", color: "#334155", background: "#f8fafc", padding: "14px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", minHeight: "60px" }}>
          {isGeneratingAdvisory ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#0284c7" }}>
              <Loader2 size={16} className="spinning-icon" />
              <span>
                {lang === "bn"
                  ? `মাঠ পর্যায়ের তথ্যের (${localMarketData?.competitorsCount ?? (Array.isArray(localMarketData?.competitors) ? localMarketData.competitors.length : (localMarketData?.competitors || 0))} প্রতিযোগী, ${localMarketData?.banksCount ?? (Array.isArray(localMarketData?.banks) ? localMarketData.banks.length : (localMarketData?.banks || 0))} ব্যাংক) ভিত্তিতে পরামর্শ প্রস্তুত হচ্ছে...`
                  : lang === "mr"
                  ? `स्थानिक डेटाच्या (${localMarketData?.competitorsCount ?? (Array.isArray(localMarketData?.competitors) ? localMarketData.competitors.length : (localMarketData?.competitors || 0))} स्पर्धक, ${localMarketData?.banksCount ?? (Array.isArray(localMarketData?.banks) ? localMarketData.banks.length : (localMarketData?.banks || 0))} बँका) आधारे सल्ला तयार होत आहे...`
                  : lang === "te"
                  ? `క్షేత్ర స్థాయి డేటా (${localMarketData?.competitorsCount ?? (Array.isArray(localMarketData?.competitors) ? localMarketData.competitors.length : (localMarketData?.competitors || 0))} పోటీదారులు, ${localMarketData?.banksCount ?? (Array.isArray(localMarketData?.banks) ? localMarketData.banks.length : (localMarketData?.banks || 0))} బ్యాంకులు) ఆధారంగా సలహా సిద్ధమవుతోంది...`
                  : lang === "ta"
                  ? `கள தரவுகளின் (${localMarketData?.competitorsCount ?? (Array.isArray(localMarketData?.competitors) ? localMarketData.competitors.length : (localMarketData?.competitors || 0))} போட்டியாளர்கள், ${localMarketData?.banksCount ?? (Array.isArray(localMarketData?.banks) ? localMarketData.banks.length : (localMarketData?.banks || 0))} வங்கிகள்) அடிப்படையில் வழிகாட்டல் தயாராகிறது...`
                  : isHi
                  ? `फ़ील्ड डेटा (${localMarketData?.competitorsCount ?? (Array.isArray(localMarketData?.competitors) ? localMarketData.competitors.length : (localMarketData?.competitors || 0))} प्रतिद्वंदी, ${localMarketData?.banksCount ?? (Array.isArray(localMarketData?.banks) ? localMarketData.banks.length : (localMarketData?.banks || 0))} बैंक) के आधार पर सलाह तैयार हो रही है...`
                  : `Generating advisory based on ${localMarketData?.competitorsCount ?? (Array.isArray(localMarketData?.competitors) ? localMarketData.competitors.length : (localMarketData?.competitors || 0))} competitors and ${localMarketData?.banksCount ?? (Array.isArray(localMarketData?.banks) ? localMarketData.banks.length : (localMarketData?.banks || 0))} banks...`}
              </span>
            </div>
          ) : (
            liveAdvisory || (lang === "bn" ? "স্ক্যান সম্পন্ন হলে পরামর্শ এখানে প্রদর্শিত হবে।" : lang === "mr" ? "स्कॅन पूर्ण झाल्यावर सल्ला येथे दिसेल." : lang === "te" ? "స్కాన్ పూర్తయిన తర్వాత సలహా ఇక్కడ కనిపిస్తుంది." : lang === "ta" ? "ஸ்கேன் முடிந்ததும் வழிகாட்டல் இங்கே காண்பிக்கப்படும்." : isHi ? "स्कैन पूरा होने पर सलाह यहाँ प्रदर्शित होगी।" : "Advisory will display once scan finishes.")
          )}
        </div>
      </div>

      {/* Dairy Sector Macro-Demographics & Market Gap (Only for Dairy Category) */}
      {result?.dairy_analysis && (
        <div style={{ marginTop: "20px", padding: "16px 20px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>🥛</span>
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#166534" }}>
                {lang === "bn"
                  ? "দুগ্ধ খাত ম্যাক্রো-জনমিতি ও বাজার ফারাক"
                  : lang === "mr"
                  ? "दुग्धव्यवसाय मॅक्रो-डेमोग्राफिक्स व बाजार फरक (Macro-Demographics & Market Gap)"
                  : lang === "te"
                  ? "పాడి పరిశ్రమ స్థానిక జనాభా & మార్కెట్ వ్యత్యాస విశ్లేషణ"
                  : lang === "ta"
                  ? "பால் துறை பெரு-மக்கள்தொகை & சந்தை இடைவெளி"
                  : isHi
                  ? "डेयरी क्षेत्र मैक्रो-डेमोग्राफिक्स व बाज़ार अंतर (Macro-Demographics & Market Gap)"
                  : "Dairy Sector Macro-Demographics & Market Gap"}
              </h4>
            </div>
            <span style={{ fontSize: "11px", fontWeight: "600", padding: "3px 10px", backgroundColor: result.dairy_analysis.price_arbitrage?.status === "Strong Sourcing Advantage" ? "#dcfce7" : "#fef3c7", color: result.dairy_analysis.price_arbitrage?.status === "Strong Sourcing Advantage" ? "#15803d" : "#b45309", borderRadius: "6px", border: "1px solid #86efac" }}>
              {result.dairy_analysis.price_arbitrage?.status}
            </span>
          </div>

          <div style={{ fontFamily: "monospace", fontSize: "11.5px", backgroundColor: "#ffffff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", marginBottom: "12px", color: "#334155" }}>
            [CSV DATA LAYER] {result.dairy_analysis.csv_data_layer}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", fontSize: "12px", color: "#1e293b" }}>
            <div style={{ backgroundColor: "#ffffff", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <strong style={{ color: "#0f766e" }}>
                {lang === "bn" ? "১. মূল্যের সুযোগ (Price Arbitrage)" : lang === "mr" ? "1. दर फरक (Price Arbitrage)" : lang === "te" ? "1. ధర వ్యత్యాసం (Price Arbitrage)" : lang === "ta" ? "1. விலை வேறுபாடு (Price Arbitrage)" : isHi ? "1. मूल्य अंतरण (Price Arbitrage)" : "1. Price Arbitrage (Price Layer)"}
              </strong>
              <p style={{ margin: "6px 0 0 0", lineHeight: "1.5" }}>
                {lang === "bn"
                  ? (result.dairy_analysis.price_arbitrage?.explanation_bn ||
                     `স্থানীয় কাঁচা দুধ সংগ্রহের হার (₹${result.dairy_analysis.price_arbitrage?.sourcing_price || 38}/লিটার) এবং খুচরা বিক্রির বাজার দরের (₹${result.dairy_analysis.price_arbitrage?.retail_price || 62}/লিটার) মধ্যে প্রায় ₹${result.dairy_analysis.price_arbitrage?.margin || 24}/লিটার লাভজনক ব্যবধান বিদ্যমান।`)
                  : lang === "mr"
                  ? (result.dairy_analysis.price_arbitrage?.explanation_mr ||
                     `स्थानिक कच्च्या दुधाचा खरेदी दर (₹${result.dairy_analysis.price_arbitrage?.sourcing_price || 38}/लिटर) आणि किरकोळ विक्री दर (₹${result.dairy_analysis.price_arbitrage?.retail_price || 62}/लिटर) यांमध्ये सुमारे ₹${result.dairy_analysis.price_arbitrage?.margin || 24}/लिटरचा चांगला नफा उपलब्ध आहे.`)
                  : lang === "te"
                  ? (result.dairy_analysis.price_arbitrage?.explanation_te ||
                     `స్థానిక పచ్చి పాల సేకరణ ధర (₹${result.dairy_analysis.price_arbitrage?.sourcing_price || 38}/లీటర్) మరియు రిటైల్ అమ్మకపు ధర (₹${result.dairy_analysis.price_arbitrage?.retail_price || 62}/లీటర్) మధ్య సుమారు ₹${result.dairy_analysis.price_arbitrage?.margin || 24}/లీటర్ మంచి లాభం లభిస్తుంది.`)
                  : lang === "ta"
                  ? (result.dairy_analysis.price_arbitrage?.explanation_ta ||
                     `உள்ளூர் பால் கொள்முதல் விலை (₹${result.dairy_analysis.price_arbitrage?.sourcing_price || 38}/லிட்டர்) மற்றும் சில்லறை விற்பனை விலைக்கு (₹${result.dairy_analysis.price_arbitrage?.retail_price || 62}/லிட்டர்) இடையே சுமார் ₹${result.dairy_analysis.price_arbitrage?.margin || 24}/லிட்டர் கூடுதல் லாபம் கிடைக்கும்.`)
                  : isHi
                  ? result.dairy_analysis.price_arbitrage?.explanation_hi
                  : result.dairy_analysis.price_arbitrage?.explanation}
              </p>
            </div>

            <div style={{ backgroundColor: "#ffffff", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <strong style={{ color: "#0369a1" }}>
                {lang === "bn" ? "২. কৃষক B2B লক্ষ্য (Demographics)" : lang === "mr" ? "2. शेतकरी B2B उद्दिष्ट (Demographics)" : lang === "te" ? "2. రైతు B2B లక్ష్యం (Demographics)" : lang === "ta" ? "2. விவசாயி B2B இலக்கு (Demographics)" : isHi ? "2. किसान B2B लक्ष्यीकरण (Demographics)" : "2. Demographic Targeting (Gap Layer)"}
              </strong>
              <p style={{ margin: "6px 0 0 0", lineHeight: "1.5" }}>
                {lang === "bn"
                  ? (result.dairy_analysis.demographic_targeting?.explanation_bn ||
                     `এই জেলায় প্রায় ${Number(result.dairy_analysis.demographic_targeting?.total_b2b_dairy_farmers || 48000).toLocaleString("en-IN")} নিবন্ধিত দুগ্ধ চাষী পরিবার রয়েছে। স্থানীয় সংগ্রহ ব্যবস্থা গড়ে তুলে দালালদের কমিশন বাদ দিয়ে সরাসরি তাদের সাথে কাজ করা সম্ভব।`)
                  : lang === "mr"
                  ? (result.dairy_analysis.demographic_targeting?.explanation_mr ||
                     `या जिल्ह्यात सुमारे ${Number(result.dairy_analysis.demographic_targeting?.total_b2b_dairy_farmers || 48000).toLocaleString("en-IN")} नोंदणीकृत शेतकरी कुटुंबे आहेत. मध्यस्थांशिवाय थेट त्यांच्याकडून संकलन करून चांगला नफा मिळवता येईल.`)
                  : lang === "te"
                  ? (result.dairy_analysis.demographic_targeting?.explanation_te ||
                     `ఈ జిల్లాలో సుమారు ${Number(result.dairy_analysis.demographic_targeting?.total_b2b_dairy_farmers || 48000).toLocaleString("en-IN")} నమోదైన పాడి రైతు కుటుంబాలు ఉన్నాయి. దళారులు లేకుండా నేరుగా వారి నుండి పాలను సేకరించవచ్చు.`)
                  : lang === "ta"
                  ? (result.dairy_analysis.demographic_targeting?.explanation_ta ||
                     `இந்த மாவட்டத்தில் சுமார் ${Number(result.dairy_analysis.demographic_targeting?.total_b2b_dairy_farmers || 48000).toLocaleString("en-IN")} பதிவு செய்யப்பட்ட பால் பண்ணை விவசாயிகள் உள்ளனர். இடைத்தரகர்கள் இல்லாமல் நேரடியாக கொள்முதல் செய்யலாம்.`)
                  : isHi
                  ? result.dairy_analysis.demographic_targeting?.explanation_hi
                  : result.dairy_analysis.demographic_targeting?.explanation}
              </p>
            </div>

            <div style={{ backgroundColor: "#ffffff", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <strong style={{ color: "#7e22ce" }}>
                {lang === "bn" ? "৩. বাজারের আকার ও EMI (Market Sizing)" : lang === "mr" ? "3. बाजार आकार व EMI (Market Sizing)" : lang === "te" ? "3. మార్కెట్ పరిమాణం & EMI (Market Sizing)" : lang === "ta" ? "3. சந்தை அளவு & EMI (Market Sizing)" : isHi ? "3. बाज़ार आकार व EMI (Market Sizing)" : "3. Market Sizing (Integrated Dataset)"}
              </strong>
              <p style={{ margin: "6px 0 0 0", lineHeight: "1.5" }}>
                {lang === "bn"
                  ? (result.dairy_analysis.market_sizing?.explanation_bn ||
                     `উদ্বৃত্ত দুধ ও পনির, দই ইত্যাদি প্রক্রিয়াজাত করে বাজারজাত করলে মাসিক কিস্তি (${result.dairy_analysis.market_sizing?.emi_coverage_ratio || "3.8"}x গুণ কভারেজ সহ) অতি সহজেই সুরক্ষিত থাকবে।`)
                  : lang === "mr"
                  ? (result.dairy_analysis.market_sizing?.explanation_mr ||
                     `अतिरिक्त दुग्ध प्रक्रिया (पनीर, दही) केल्याने मासिक बँक हप्ता (${result.dairy_analysis.market_sizing?.emi_coverage_ratio || "3.8"}x पटीने) अत्यंत सुरक्षितपणे फेडता येईल.`)
                  : lang === "te"
                  ? (result.dairy_analysis.market_sizing?.explanation_te ||
                     `పాల ఉత్పత్తుల తయారీ ద్వారా వచ్చే అదనపు ఆదాయం బ్యాంకు వాయిదాను (${result.dairy_analysis.market_sizing?.emi_coverage_ratio || "3.8"}x రెట్ల కవరేజ్‌తో) సులభంగా చెల్లించేలా చేస్తుంది.`)
                  : lang === "ta"
                  ? (result.dairy_analysis.market_sizing?.explanation_ta ||
                     `பால் மதிப்பு கூட்டப்பட்ட பொருட்கள் மூலம் கிடைக்கும் கூடுதல் வருமானம் மாதாந்திர தவணையை (${result.dairy_analysis.market_sizing?.emi_coverage_ratio || "3.8"}x மடங்கு) எளிதாக ஈடுகட்டும்.`)
                  : isHi
                  ? result.dairy_analysis.market_sizing?.explanation_hi
                  : result.dairy_analysis.market_sizing?.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Local Recommendation advice */}
      <div className="village-tip-banner">
        <div>
          <h4>{getUI("localStrategyTipTitle", lang, "Local Market Strategy Recommendation:")}</h4>
          <p>
            {market.recommendation
              ? translateDynamicPhrase(market.recommendation, lang)
              : (lang === "bn"
                ? "স্থানীয় বাজারে আস্থাই সবচেয়ে বড় মূলধন। পণ্যের খাঁটি মান এবং সঠিক ওজন বজায় রাখুন। প্রথম ৩ মাসে পরিচিতি বাড়াতে গ্রাহকদের সাথে সুসম্পর্ক ও হোয়াটসঅ্যাপ গ্রুপ ব্যবহার করুন।"
                : lang === "mr"
                ? "स्थानिक बाजारात विश्वास हीच सर्वात मोठी संपत्ती आहे. चांगली गुणवत्ता व अचूक वजन ठेवा. सुरुवातीच्या ३ महिन्यांत ग्राहकांशी सुसंवाद आणि व्हॉट्सॲप ग्रुपचा वापर करून प्रचार करा."
                : lang === "te"
                ? "స్థానిక మార్కెట్‌లో నమ్మకమే అతిపెద్ద పెట్టుబడి. ఉత్పత్తుల నాణ్యత, సరైన తూకం పాటించండి. మొదటి 3 నెలల్లో స్థానిక వాట్సాప్ గ్రూపులు మరియు పరిచయాలతో ప్రచారం చేసుకోండి."
                : lang === "ta"
                ? "உள்ளூர் சந்தையில் நம்பிக்கையே மிகப்பெரிய மூலதனம். தரமான தயாரிப்புகளையும் துல்லியமான எடையையும் பேணுங்கள். ஆரம்ப 3 மாதங்களில் வாடிக்கையாளர் நன்மதிப்பையும் வாட்ஸ்அப் குழுக்களையும் பயன்படுத்துங்கள்."
                : isHi
                ? "गाँव के बाज़ार में भरोसा सबसे बड़ी पूँजी है। अच्छी गुणवत्ता और सही तौल रखें। शुरुआती 3 महीनों में ग्राहकों को अपने उत्पाद का प्रचार करने के लिए माउथ-टू-माउथ पब्लिसिटी और मोबाइल व्हाट्सएप ग्रुप का उपयोग करें।"
                : "Trust and fair pricing build the strongest rural moat. Maintain consistent quality, offer transparent weight, and utilize local WhatsApp groups and word-of-mouth among panchayat members.")}
          </p>
        </div>
      </div>
    </div>
  );
}
