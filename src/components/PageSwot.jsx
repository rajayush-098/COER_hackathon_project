import {
  getPageBadge,
  getUI,
  translateDynamicPhrase,
} from "../utils/translationHelper";

export default function PageSwot({ result, lang = "hi", formatCurrency }) {
  const isHi = lang === "hi";

  const swot = result.hyper_local_profile?.swot_analysis ?? {};
  const strengths = swot.strengths ?? [
    "Direct personal relationship with village community & elders",
    "Lower fixed overhead expenses compared to urban establishments",
    "Availability of local raw materials within walking distance",
  ];
  const weaknesses = swot.weaknesses ?? [
    "Limited initial cash reserve for unexpected equipment breakdown",
    "Reliance on seasonal agricultural harvest payment cycles",
    "Limited formal bookkeeping or computer invoice systems",
  ];
  const opportunities = swot.opportunities ?? [
    "Expanding to adjacent gram panchayats through weekly haats",
    "Tapping government subsidy programs (PMEGP / Mudra / KCC)",
    "Bundling complementary products for village families",
  ];
  const threats = swot.threats ?? [
    "Sudden price inflation in input raw materials / animal feed",
    "Weather interruptions or localized power cuts",
    "Credit demands (udhaar) from relatives and neighbors",
  ];

  const marginCap = swot.budget_context?.available_margin_capital;

  return (
    <div className="side-page-content">
      <div className="page-header-banner">
        <div className="page-header-text">
          <span className="page-badge-pill">
            {getPageBadge("swot", lang)}
          </span>
          <h2>{getUI("swotHeaderTitle", lang, "SWOT Analysis for Micro-Enterprise")}</h2>
          <p className="page-sub-desc">
            {getUI("swotHeaderSub", lang, "Clear audit of your business advantages, internal gaps, market opportunities, and external risks.")}
          </p>
        </div>

        {marginCap != null && (
          <div className="govt-emblem-badge">
            <div>
              <strong>
                {lang === "bn" ? "পুঁজি ভিত্তি" : lang === "mr" ? "भांडवल संदर्भ" : lang === "te" ? "మూలధన ప్రాతిపదిక" : lang === "ta" ? "மூலதன அடிப்படை" : isHi ? "पूँजी संदर्भ" : "Capital Baseline"}
              </strong>
              <small>
                {formatCurrency(marginCap)} {lang === "bn" ? "মার্জিন" : lang === "mr" ? "मार्जिन" : lang === "te" ? "మార్జిన్" : lang === "ta" ? "மார்ஜின்" : isHi ? "मार्जिन" : "Margin"}
              </small>
            </div>
          </div>
        )}
      </div>

      {/* 4 Big SWOT Cards Grid */}
      <div className="swot-cards-grid">
        {/* STRENGTHS */}
        <div className="swot-card swot-strengths">
          <div className="swot-card-head">
            <div>
              <h3>{getUI("strengthsTitle", lang, "Strengths (Your Advantages)")}</h3>
              <p>{getUI("strengthsSub", lang, "Key assets & local advantages")}</p>
            </div>
          </div>
          <ul className="swot-list">
            {strengths.map((item, idx) => (
              <li key={idx} className="swot-item">
                <span>{translateDynamicPhrase(item, lang)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* WEAKNESSES */}
        <div className="swot-card swot-weaknesses">
          <div className="swot-card-head">
            <div>
              <h3>{getUI("weaknessesTitle", lang, "Weaknesses (Areas to Improve)")}</h3>
              <p>{getUI("weaknessesSub", lang, "Internal limitations to watch out for")}</p>
            </div>
          </div>
          <ul className="swot-list">
            {weaknesses.map((item, idx) => (
              <li key={idx} className="swot-item">
                <span>{translateDynamicPhrase(item, lang)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* OPPORTUNITIES */}
        <div className="swot-card swot-opportunities">
          <div className="swot-card-head">
            <div>
              <h3>{getUI("opportunitiesTitle", lang, "Opportunities (Growth Roads)")}</h3>
              <p>{getUI("opportunitiesSub", lang, "External chances for higher revenue")}</p>
            </div>
          </div>
          <ul className="swot-list">
            {opportunities.map((item, idx) => (
              <li key={idx} className="swot-item">
                <span>{translateDynamicPhrase(item, lang)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* THREATS */}
        <div className="swot-card swot-threats">
          <div className="swot-card-head">
            <div>
              <h3>{getUI("threatsTitle", lang, "Threats (Risks to Guard Against)")}</h3>
              <p>{getUI("threatsSub", lang, "External factors that could hurt profit")}</p>
            </div>
          </div>
          <ul className="swot-list">
            {threats.map((item, idx) => (
              <li key={idx} className="swot-item">
                <span>{translateDynamicPhrase(item, lang)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Practical Action Takeaway */}
      <div className="village-tip-banner">
        <div>
          <h4>{getUI("goldenRuleTitle", lang, "Golden Rule for Village Enterprise:")}</h4>
          <p>
            {lang === "bn"
              ? "নিজের 'শক্তি'র (যেমন পরিচিতি, সদ্ব্যবহার ও পণ্যের খাঁটি মান) পূর্ণ সদ্ব্যবহার করুন। 'দুর্বলতা' (যেমন অতিরিক্ত বাকি দেওয়া) কঠোরভাবে প্রতিরোধ করুন—দোকানে 'আজ নগদ, কাল বাকি' বোর্ড লাগিয়ে কার্যকরী মূলধন নিরাপদ রাখুন।"
              : lang === "mr"
              ? "आपल्या 'सामर्थ्या'चा (उदा. विश्वास व उत्तम दर्जा) पुरेपूर फायदा घ्या. 'मर्यादांवर' (उदा. उधारी) नियंत्रण ठेवण्यासाठी दुकानात 'रोख व्यवहार' नियम पाळा आणि खेळते भांडवल सुरक्षित ठेवा."
              : lang === "te"
              ? "మీ 'బలాలను' (నమ్మకం & నాణ్యత) పూర్తిగా సద్వినియోగం చేసుకోండి. 'బలహీనతలను' (అప్పులు ఇవ్వడం) నియంత్రించి, నగదు చెల్లింపులకే ప్రాధాన్యతనిచ్చి రోజువారీ మూలధనాన్ని కాపాడుకోండి."
              : lang === "ta"
              ? "உங்கள் 'பலங்களை' (நம்பிக்கை & தரம்) முழுமையாகப் பயன்படுத்துங்கள். 'பலவீனங்களை' (கடன் கொடுப்பது) தவிர்த்து, ரொக்க விற்பனைக்கு முன்னுரிமை கொடுத்து நடைமுறை மூலதனத்தைப் பாதுகாக்கவும்."
              : isHi
              ? "अपनी 'ताकत' (जैसे ग्राहकों से मधुर संबंध और अच्छी क्वालिटी) का पूरा लाभ उठाएं। 'कमज़ोरी' (जैसे उधारी) को सख्त नियम बनाकर रोकें — 'आज नकद, कल उधार' का बोर्ड दुकान पर ज़रूर लगाएं।"
              : "Double down on your strengths (trust & freshness). Protect against threats by strictly limiting informal customer credit—post a polite 'Cash Preferred' reminder to keep daily working capital safe."}
          </p>
        </div>
      </div>
    </div>
  );
}
