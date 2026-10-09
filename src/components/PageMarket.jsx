import { useState, useEffect, useRef } from "react";
import { Loader2, Sparkles } from "lucide-react";
import HyperLocalScanner from "./HyperLocalScanner";
import { getDistrictCoordinates, getCategoryOsmTag } from "../utils/geoUtils";
import { API_ROUTES } from "../apiRoutes";
import {
  getUI,
  getPageBadge,
  translateDemand,
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
                  <strong>{ch}</strong>
                  <p>
                    {idx === 0
                      ? (lang === "bn" ? "দোকান বা খামার থেকে সরাসরি নগদ বিক্রয়, কোনো দালাল ছাড়া।" : isHi ? "दुकान या फार्म से सीधे नकद बिक्री, बिना किसी बिचौलिए के।" : "Direct retail sales to end consumers without middlemen.")
                      : idx === 1
                      ? (lang === "bn" ? "গ্রামের সাপ্তাহিক হাট ও বাজারে স্টল দিয়ে পণ্য বিক্রয়।" : isHi ? "गाँव के साप्ताहिक हाट व पैठ बाज़ार में स्टॉल लगाकर बिक्री।" : "Weekly haat bazaar stalls and community market days.")
                      : (lang === "bn" ? "নিকটবর্তী হোটেল, মিষ্টির দোকান বা পাইকারদের পাইকারি সরবরাহ।" : isHi ? "नज़दीकी होटल, डेयरी या थोक व्यापारी को बल्क सप्लाई।" : "Bulk supply partnerships with local retailers & eateries.")}
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
                  : isHi
                  ? `फ़ील्ड डेटा (${localMarketData?.competitorsCount ?? (Array.isArray(localMarketData?.competitors) ? localMarketData.competitors.length : (localMarketData?.competitors || 0))} प्रतिद्वंदी, ${localMarketData?.banksCount ?? (Array.isArray(localMarketData?.banks) ? localMarketData.banks.length : (localMarketData?.banks || 0))} बैंक) के आधार पर सलाह तैयार हो रही है...`
                  : `Generating advisory based on ${localMarketData?.competitorsCount ?? (Array.isArray(localMarketData?.competitors) ? localMarketData.competitors.length : (localMarketData?.competitors || 0))} competitors and ${localMarketData?.banksCount ?? (Array.isArray(localMarketData?.banks) ? localMarketData.banks.length : (localMarketData?.banks || 0))} banks...`}
              </span>
            </div>
          ) : (
            liveAdvisory || (lang === "bn" ? "স্ক্যান সম্পন্ন হলে পরামর্শ এখানে প্রদর্শিত হবে।" : isHi ? "स्कैन पूरा होने पर सलाह यहाँ प्रदर्शित होगी।" : "Advisory will display once scan finishes.")
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
                {lang === "bn" ? "দুগ্ধ খাত ম্যাক্রো-জনমিতি ও বাজার ফারাক" : isHi ? "डेयरी क्षेत्र मैक्रो-डेमोग्राफिक्स व बाज़ार अंतर (Macro-Demographics & Market Gap)" : "Dairy Sector Macro-Demographics & Market Gap"}
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
              <strong style={{ color: "#0f766e" }}>{lang === "bn" ? "১. মূল্যের সুযোগ" : isHi ? "1. मूल्य अंतरण (Price Arbitrage)" : "1. Price Arbitrage (Price Layer)"}</strong>
              <p style={{ margin: "6px 0 0 0", lineHeight: "1.5" }}>
                {isHi ? result.dairy_analysis.price_arbitrage?.explanation_hi : result.dairy_analysis.price_arbitrage?.explanation}
              </p>
            </div>

            <div style={{ backgroundColor: "#ffffff", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <strong style={{ color: "#0369a1" }}>{lang === "bn" ? "২. কৃষক B2B লক্ষ্য" : isHi ? "2. किसान B2B लक्ष्यीकरण (Demographics)" : "2. Demographic Targeting (Gap Layer)"}</strong>
              <p style={{ margin: "6px 0 0 0", lineHeight: "1.5" }}>
                {isHi ? result.dairy_analysis.demographic_targeting?.explanation_hi : result.dairy_analysis.demographic_targeting?.explanation}
              </p>
            </div>

            <div style={{ backgroundColor: "#ffffff", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <strong style={{ color: "#7e22ce" }}>{lang === "bn" ? "৩. বাজারের আকার" : isHi ? "3. बाज़ार आकार व EMI (Market Sizing)" : "3. Market Sizing (Integrated Dataset)"}</strong>
              <p style={{ margin: "6px 0 0 0", lineHeight: "1.5" }}>
                {isHi ? result.dairy_analysis.market_sizing?.explanation_hi : result.dairy_analysis.market_sizing?.explanation}
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
            {market.recommendation ||
              (lang === "bn"
                ? "স্থানীয় বাজারে আস্থাই সবচেয়ে বড় মূলধন। পণ্যের খাঁটি মান এবং সঠিক ওজন বজায় রাখুন। প্রথম ৩ মাসে পরিচিতি বাড়াতে গ্রাহকদের সাথে সুসম্পর্ক ও হোয়াটসঅ্যাপ গ্রুপ ব্যবহার করুন।"
                : isHi
                ? "गाँव के बाज़ार में भरोसा सबसे बड़ी पूँजी है। अच्छी गुणवत्ता और सही तौल रखें। शुरुआती 3 महीनों में ग्राहकों को अपने उत्पाद का प्रचार करने के लिए माउथ-टू-माउथ पब्लिसिटी और मोबाइल व्हाट्सएप ग्रुप का उपयोग करें।"
                : "Trust and fair pricing build the strongest rural moat. Maintain consistent quality, offer transparent weight, and utilize local WhatsApp groups and word-of-mouth among panchayat members.")}
          </p>
        </div>
      </div>
    </div>
  );
}
