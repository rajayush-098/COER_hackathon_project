import {
  getPageBadge,
  getUI,
  translateDynamicPhrase,
} from "../utils/translationHelper";

export default function PageOpportunities({ result, lang = "hi" }) {
  const isHi = lang === "hi";

  const opp = result.hyper_local_profile?.opportunity_analysis ?? {};
  const niches = opp.identified_niches ?? [
    "Value-added packaging (e.g. bottled fresh milk, paneer, curd packets)",
    "Home delivery subscription for village teachers & government staff",
    "Seasonal festival bulk packages and weekly haat stalls",
    "Tie-up with local self-help groups (SHGs / Sakhi Mandals)",
  ];
  const evidence = opp.evidence_basis ?? [
    "High daily consumption with lack of hygienic local branded alternatives",
    "Rising disposable income among semi-urban and rural service workers",
    "Local buyers travel 8-10 km to tehsil market for better quality",
  ];
  const localOpps = result.hyper_local_profile?.local_opportunities ?? [];

  return (
    <div className="side-page-content">
      <div className="page-header-banner">
        <div className="page-header-text">
          <span className="page-badge-pill">
            {getPageBadge("opportunities", lang)}
          </span>
          <h2>{getUI("unservedNichesTitle", lang, "Unserved Local Niches & Growth Avenues")}</h2>
          <p className="page-sub-desc">
            {getUI("unservedNichesSub", lang, "Identified local gaps where customer demand exists but few or no local competitors currently operate.")}
          </p>
        </div>

        <div className="govt-emblem-badge">
          <div>
            <strong>
              {opp.status === "Active Opportunities"
                ? (lang === "bn" ? "সক্রিয় সুযোগ" : lang === "mr" ? "सक्रिय संधी" : lang === "te" ? "క్రియాశీల అవకాశాలు" : lang === "ta" ? "செயலில் உள்ள வாய்ப்புகள்" : isHi ? "सक्रिय अवसर" : "Active Opportunities")
                : (opp.status || "Active Opportunities")}
            </strong>
            <small>
              {lang === "bn"
                ? `অগ্রাধিকার: ${opp.validation_priority || "উচ্চ"}`
                : lang === "mr"
                ? `प्राधान्य: ${opp.validation_priority || "उच्च"}`
                : lang === "te"
                ? `ప్రాధాన్యత: ${opp.validation_priority || "అధిక"}`
                : lang === "ta"
                ? `முன்னுரிமை: ${opp.validation_priority || "உயர்"}`
                : isHi
                ? `प्राथमिकता: ${opp.validation_priority || "High"}`
                : `Priority: ${opp.validation_priority || "High"}`}
            </small>
          </div>
        </div>
      </div>

      {/* Niches List */}
      <div className="detail-card">
        <div className="detail-card-head">
          <div>
            <h3>{getUI("highPotentialNiches", lang, "High-Potential Niche Opportunities")}</h3>
            <p>
              {lang === "bn"
                ? "এই কৌশলগুলোর মাধ্যমে সাধারণ ব্যবসাকে বিশেষ ও লাভজনক করে তুলুন"
                : lang === "mr"
                ? "या पद्धतींचा वापर करून व्यवसाय अधिक फायदेशीर बनवा"
                : lang === "te"
                ? "ఈ పద్ధతులతో మీ వ్యాపారాన్ని ప్రత్యేకంగా మరియు లాభదాయకంగా మార్చుకోండి"
                : lang === "ta"
                ? "இந்த வழிகள் மூலம் சாதாரண தொழிலை அதிக லாபம் தரும் தொழிலாக மாற்றலாம்"
                : isHi
                ? "इन तरीकों से आप अपने साधारण व्यापार को खास बना सकते हैं"
                : "Smart variations to earn premium margins"}
            </p>
          </div>
        </div>

        <div className="niches-grid">
          {niches.map((niche, idx) => (
            <div key={idx} className="niche-card">
              <div className="niche-badge">
                <span>
                  {lang === "bn"
                    ? `সুযোগ #${idx + 1}`
                    : lang === "mr"
                    ? `संधी #${idx + 1}`
                    : lang === "te"
                    ? `అవకాశం #${idx + 1}`
                    : lang === "ta"
                    ? `வாய்ப்பு #${idx + 1}`
                    : isHi
                    ? `मौका #${idx + 1}`
                    : `Niche #${idx + 1}`}
                </span>
              </div>
              <h4>{translateDynamicPhrase(niche, lang)}</h4>
              <p className="niche-tip">
                {lang === "bn"
                  ? "স্বল্প পুঁজিতে শুরু করা যায় এবং এর ফলে নিয়মিত বাঁধা ক্রেতা তৈরি হয়।"
                  : lang === "mr"
                  ? "कमी खर्चात सुरू करता येतो आणि यामुळे नियमित ग्राहक जोडले जातात."
                  : lang === "te"
                  ? "తక్కువ ఖర్చుతో ప్రారంభించవచ్చు మరియు దీనివల్ల శాశ్వత కస్టమర్లు ఏర్పడతారు."
                  : lang === "ta"
                  ? "குறைந்த செலவில் தொடங்கலாம் மற்றும் நிரந்தர வாடிக்கையாளர்களை உருவாக்குகிறது."
                  : isHi
                  ? "कम लागत में शुरू किया जा सकता है और इससे ग्राहकों का नियमित जुड़ाव बनता है।"
                  : "Low incremental setup cost with high recurring customer loyalty."}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence and Local opportunities */}
      <div className="two-column-grid">
        <div className="detail-card">
          <div className="detail-card-head">
            <div>
              <h3>{getUI("marketEvidenceReasoning", lang, "Market Evidence & Reasoning")}</h3>
              <p>
                {lang === "bn"
                  ? "মাঠ পর্যায়ের বাস্তব তথ্যের ভিত্তিতে বিশ্লেষণ"
                  : lang === "mr"
                  ? "जमिनीवरील प्रत्यक्ष माहितीवर आधारित विश्लेषण"
                  : lang === "te"
                  ? "క్షేత్రస్థాయి వాస్తవ డేటా ఆధారిత విశ్లేషణ"
                  : lang === "ta"
                  ? "கள உண்மை தரவுகளின் அடிப்படையிலான பகுப்பாய்வு"
                  : isHi
                  ? "ज़मीनी सच्चाई के आधार पर विश्लेषण"
                  : "Ground data backing these opportunities"}
              </p>
            </div>
          </div>

          <ul className="evidence-list">
            {evidence.map((item, idx) => (
              <li key={idx} className="evidence-item">
                <div>
                  <strong>{translateDynamicPhrase(item, lang)}</strong>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="detail-card">
          <div className="detail-card-head">
            <div>
              <h3>{getUI("futureExpansionRoads", lang, "Future Expansion Roads")}</h3>
              <p>
                {lang === "bn"
                  ? "ব্যবসা স্থায়ী হওয়ার পর পরবর্তী পদক্ষেপ"
                  : lang === "mr"
                  ? "व्यवसाय स्थिरावल्यानंतर पुढील वाटचाल"
                  : lang === "te"
                  ? "వ్యాపారం స్థిరపడిన తర్వాత తదుపరి దశలు"
                  : lang === "ta"
                  ? "தொழில் நிலைபெற்ற பிறகு அடுத்த கட்ட வளர்ச்சி"
                  : isHi
                  ? "व्यापार जमने के बाद आगे क्या करें"
                  : "Next steps once initial business stabilizes"}
              </p>
            </div>
          </div>

          <ul className="evidence-list">
            {(localOpps.length > 0 ? localOpps : [
              "Supply to nearby school mid-day meal or anganwadi centers",
              "Collaborate with dairy cooperatives or agricultural FPOs",
              "Add complementary daily-use FMCG goods to store inventory",
            ]).map((oppItem, idx) => (
              <li key={idx} className="evidence-item">
                <div>
                  <strong>{translateDynamicPhrase(oppItem, lang)}</strong>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Simple advice box */}
      <div className="village-tip-banner">
        <div>
          <h4>{getUI("firstStepAdvice", lang, "First Step Advice:")}</h4>
          <p>
            {lang === "bn"
              ? "প্রথমে মূল ব্যবসাটিকে ৯০ দিন ভালো করে দাঁড় করান। নিয়মিত নগদ প্রবাহ শুরু হলে ধীরে ধীরে একটি করে নতুন ক্ষেত্রে বিনিয়োগ করুন।"
              : lang === "mr"
              ? "पहिले मुख्य व्यवसाय 90 दिवस चांगला चालवा. नियमित ग्राहक तयार झाल्यावर खेळत्या भांडवलावर ताण न देता एकेका नवीन संधीचा विस्तार करा."
              : lang === "te"
              ? "మొదటి 90 రోజులు మీ ప్రధాన వ్యాపారంపై దృష్టి పెట్టండి. క్రమం తప్పకుండా ఆదాయం రావడం మొదలయ్యాక, ఒక్కొక్క కొత్త అవకాశాన్ని విస్తరించండి."
              : lang === "ta"
              ? "முதல் 90 நாட்களுக்கு உங்கள் முக்கிய தொழிலை நிலைநிறுத்துங்கள். வழக்கமான பணப்புழக்கம் வந்ததும், நடைமுறை மூலதனத்தை பாதிக்காமல் புதிய வாய்ப்புகளை விரிவாக்குங்கள்."
              : isHi
              ? "पहले मुख्य काम को 3-4 महीने अच्छे से जमा लें। जब नियमित ग्राहक बन जाएं, तब इनमें से 1 या 2 नए मौकों को धीरे-धीरे जोड़ें। एक साथ सारा पैसा न लगाएं।"
              : "Focus on your core product for the first 90 days. Once regular cash flow is steady, test one value-added niche at a time without straining your working capital."}
          </p>
        </div>
      </div>
    </div>
  );
}
