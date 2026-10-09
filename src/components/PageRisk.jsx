import {
  getPageBadge,
  getUI,
  translateRisk,
  translateDynamicPhrase,
} from "../utils/translationHelper";

export default function PageRisk({ result, lang = "hi" }) {
  const isHi = lang === "hi";

  const risk = result.risk_analysis ?? {};
  const score = risk.risk_score ?? 25;
  const level = risk.overall_risk_level || risk.risk_level || "Low";
  const finRisk = risk.financial_risk || result.advanced_financial_analysis?.financial_risk || "Low";
  const mktRisk = risk.market_risk || result.hyper_local_profile?.competition_level || "Moderate";

  const factors = risk.risk_factors ?? [
    "Vulnerability to input feed or raw material price increases",
    "Seasonal drop in footfall during peak harvest or monsoon weeks",
    "High dependence on key repeat village customers",
  ];

  const recommendations = risk.risk_recommendations ?? [
    "Maintain a cash reserve equivalent to at least 1-2 months of operational expenses.",
    "Form relationships with at least 2 alternate wholesale suppliers to avoid supply squeeze.",
    "Limit informal customer credit (udhaar) and encourage UPI / digital instant payments.",
  ];

  const isSafe = score <= 35 || level.toLowerCase().includes("low");

  return (
    <div className="side-page-content">
      <div className="page-header-banner">
        <div className="page-header-text">
          <span className="page-badge-pill">
            {getPageBadge("risk", lang)}
          </span>
          <h2>{getUI("riskHeaderTitle", lang, "Risk Assessment & Loss Prevention")}</h2>
          <p className="page-sub-desc">
            {getUI("riskHeaderSub", lang, "Clear audit of operational risks, financial safety buffers, and practical ways to protect your capital.")}
          </p>
        </div>

        <div className={`status-hero-tag ${isSafe ? "positive" : "warning"}`}>
          <div>
            <strong>
              {isSafe
                ? getUI("lowRiskVerdict", lang, "Low Risk - Safe Proposition")
                : getUI("moderateRiskVerdict", lang, "Moderate Risk - Caution Advised")}
            </strong>
            <p>
              {isSafe
                ? (lang === "bn"
                    ? "লাভ ও ব্যয়ের ভারসাম্য ভালো এবং নিরাপদ।"
                    : lang === "mr"
                    ? "नफा आणि खर्चाचा समतोल चांगला आहे."
                    : lang === "te"
                    ? "లాభాలు మరియు ఖర్చుల సమతుల్యత బాగుంది."
                    : lang === "ta"
                    ? "லாபம் மற்றும் செலவின் சமநிலை நன்றாக உள்ளது."
                    : isHi
                    ? "मुनाफा और खर्चे का संतुलन अच्छा है।"
                    : "Balanced operational margin with manageable downside.")
                : (lang === "bn"
                    ? "পরিচালন ব্যয় ও মাসিক বিক্রয়ে নিয়মিত নজর রাখুন।"
                    : lang === "mr"
                    ? "खर्च आणि विक्रीवर नियमित देखरेख ठेवा."
                    : lang === "te"
                    ? "ఖర్చులు మరియు అమ్మకాలపై నిరంతర నిఘా ఉంచండి."
                    : lang === "ta"
                    ? "செலவுகள் மற்றும் விற்பனையை தொடர்ந்து கண்காணிக்கவும்."
                    : isHi
                    ? "खर्चे और बिक्री पर नियमित निगरानी रखें।"
                    : "Tight control required over monthly operational costs.")}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Risk KPI Cards */}
      <div className="kpi-hero-grid">
        <div className={`kpi-hero-card ${isSafe ? "kpi-green" : "kpi-amber"}`}>
          <div className="kpi-top">
            <span className="kpi-tag">{lang === "bn" ? "স্কোর" : lang === "mr" ? "गुण" : lang === "te" ? "స్కోర్" : lang === "ta" ? "மதிப்பெண்" : isHi ? "स्कोर" : "Risk Score"}</span>
          </div>
          <p className="kpi-label">{lang === "bn" ? "মোট ঝুঁকি সূচক" : lang === "mr" ? "एकूण जोखीम गुण" : lang === "te" ? "మొత్తం రిస్క్ ఇండెక్స్" : lang === "ta" ? "மொத்த ஆபத்து குறியீடு" : isHi ? "कुल जोखिम स्कोर" : "Overall Risk Index"}</p>
          <h3 className="kpi-value">{score}/100</h3>
          <p className="kpi-hint">
            {lang === "bn"
              ? "স্কোর যত কম, ব্যবসা তত বেশি সুরক্ষিত"
              : lang === "mr"
              ? "कमी गुण म्हणजे अधिक सुरक्षित व्यवसाय"
              : lang === "te"
              ? "తక్కువ సంఖ్య అంటే మరింత సురక్షితమైన వ్యాపారం"
              : lang === "ta"
              ? "குறைந்த எண் என்றால் அதிக பாதுகாப்பான தொழில்"
              : isHi
              ? "जितना कम स्कोर, उतना ज़्यादा सुरक्षित व्यापार"
              : "Lower number means safer enterprise"}
          </p>
        </div>

        <div className="kpi-hero-card kpi-blue">
          <div className="kpi-top">
            <span className="kpi-tag">{lang === "bn" ? "মাত্রা" : lang === "mr" ? "पातळी" : lang === "te" ? "స్థాయి" : lang === "ta" ? "நிலை" : isHi ? "स्तर" : "Risk Level"}</span>
          </div>
          <p className="kpi-label">{lang === "bn" ? "ঝুঁকির মূল স্তর" : lang === "mr" ? "प्राथमिक जोखीम पातळी" : lang === "te" ? "ప్రాథమిక రిస్క్ స్థాయి" : lang === "ta" ? "முதன்மை ஆபத்து நிலை" : isHi ? "जोखिम का स्तर" : "Primary Risk Level"}</p>
          <h3 className="kpi-value">
            {translateRisk(level, lang)}
          </h3>
          <p className="kpi-hint">
            {lang === "bn" ? "আয়ের বিপরীতে নির্ধারিত ব্যয়ের ভিত্তিতে মূল্যায়িত" : lang === "mr" ? "उत्पन्न विरुद्ध स्थिर खर्चाच्या आधारे निश्चित" : lang === "te" ? "ఆదాయం మరియు ఖర్చుల ఆధారంగా లెక్కించబడింది" : lang === "ta" ? "வருவாய் மற்றும் செலவுகளின் அடிப்படையில் மதிப்பீடு" : isHi ? "वर्तमान आंकड़ों के अनुसार स्तर" : "Assessed from revenue vs fixed obligations"}
          </p>
        </div>

        <div className="kpi-hero-card kpi-purple">
          <div className="kpi-top">
            <span className="kpi-tag">{lang === "bn" ? "আর্থিক" : lang === "mr" ? "आर्थिक" : lang === "te" ? "ఆర్థిక" : lang === "ta" ? "நிதி" : isHi ? "वित्तीय" : "Financial"}</span>
          </div>
          <p className="kpi-label">{lang === "bn" ? "আর্থিক চাপ ঝুঁকি" : lang === "mr" ? "आर्थिक ताण जोखीम" : lang === "te" ? "ఆర్థిక రిస్క్" : lang === "ta" ? "நிதி நெருக்கடி ஆபத்து" : isHi ? "पैसे का जोखिम (Financial)" : "Financial Stress Risk"}</p>
          <h3 className="kpi-value">
            {translateRisk(finRisk, lang)}
          </h3>
          <p className="kpi-hint">
            {lang === "bn" ? "ঋণ কিস্তি পরিশোধে অসুবিধার সম্ভাবনা" : lang === "mr" ? "हप्ता भरताना ताण येण्याची शक्यता" : lang === "te" ? "రుణం చెల్లింపులో ఇబ్బందుల సంభావ్యత" : lang === "ta" ? "கடன் தவணை செலுத்துவதில் சிரமத்தின் வாய்ப்பு" : isHi ? "किश्त और खर्च भरने में खतरा" : "Likelihood of repayment strain"}
          </p>
        </div>

        <div className="kpi-hero-card kpi-amber">
          <div className="kpi-top">
            <span className="kpi-tag">{lang === "bn" ? "বাজার" : lang === "mr" ? "बाजार" : lang === "te" ? "మార్కెట్" : lang === "ta" ? "சந்தை" : isHi ? "बाज़ार" : "Market"}</span>
          </div>
          <p className="kpi-label">{lang === "bn" ? "বাজার ও চাহিদা ঝুঁকি" : lang === "mr" ? "बाजार व मागणी जोखीम" : lang === "te" ? "మార్కెట్ & డిమాండ్ రిస్క్" : lang === "ta" ? "சந்தை & தேவை ஆபத்து" : isHi ? "बाज़ार का जोखिम (Market)" : "Market & Demand Risk"}</p>
          <h3 className="kpi-value">
            {translateRisk(mktRisk, lang)}
          </h3>
          <p className="kpi-hint">
            {lang === "bn" ? "প্রতিযোগিতা এবং ক্রেতা চাহিদার প্রভাব" : lang === "mr" ? "स्पर्धा आणि ग्राहकांच्या आवडीचा परिणाम" : lang === "te" ? "పోటీ మరియు కస్టమర్ల ప్రాధాన్యతల ప్రభావం" : lang === "ta" ? "போட்டி மற்றும் வாடிக்கையாளர் தேவையின் தாக்கம்" : isHi ? "प्रतिद्वंदियों व ग्राहक पसंद का असर" : "Competition and customer churn impact"}
          </p>
        </div>
      </div>

      {/* Visual Risk Gauge Meter */}
      <div className="detail-card">
        <div className="detail-card-head">
          <div>
            <h3>{getUI("riskMeterTitle", lang, "Enterprise Safety Gauge")}</h3>
            <p>
              {lang === "bn" ? "আপনার ব্যবসা কোন সুরক্ষা অঞ্চলে রয়েছে তা দেখুন" : lang === "mr" ? "आपला व्यवसाय कोणत्या सुरक्षा क्षेत्रात येतो ते पहा" : lang === "te" ? "మీ వ్యాపారం ఏ భద్రతా జోన్‌లో ఉందో చూడండి" : lang === "ta" ? "உங்கள் தொழில் எந்த பாதுகாப்பு மண்டலத்தில் உள்ளது என்பதைப் பார்க்கவும்" : isHi ? "देखें कि आपका व्यापार किस जोन में आता है" : "Visual safety zone classification"}
            </p>
          </div>
        </div>

        <div className="meter-container">
          <div className="meter-info-row">
            <span>
              {lang === "bn" ? "হিসাবকৃত ঝুঁকি স্কোর:" : lang === "mr" ? "गणना केलेला जोखीम गुण:" : lang === "te" ? "రిస్క్ స్కోర్:" : lang === "ta" ? "மதிப்பிடப்பட்ட ஆபத்து மதிப்பெண்:" : isHi ? "वर्तमान रिस्क स्कोर:" : "Calculated Risk Score:"}{" "}
              <strong>{score}/100</strong>
            </span>
            <span className={isSafe ? "tag-green" : "tag-amber"}>
              {isSafe
                ? (lang === "bn" ? "নিরাপদ অঞ্চল (Green Safe Zone)" : lang === "mr" ? "सुरक्षित क्षेत्र (Green Safe Zone)" : lang === "te" ? "సురక్షిత జోన్ (Safe Zone)" : lang === "ta" ? "பாதுகாப்பான மண்டலம் (Safe Zone)" : isHi ? "सुरक्षित जोन (Green Safe Zone)" : "Safe & Protected Zone")
                : (lang === "bn" ? "সতর্কতা অঞ্চল (Caution Zone)" : lang === "mr" ? "सावधगिरी क्षेत्र (Caution Zone)" : lang === "te" ? "హెచ్చరిక జోన్ (Caution Zone)" : lang === "ta" ? "எச்சரிக்கை மண்டலம் (Caution Zone)" : isHi ? "मध्यम जोन (Caution Zone)" : "Caution Zone")}
            </span>
          </div>

          <div className="progress-track" style={{ height: "16px" }}>
            <div
              className={`progress-fill ${isSafe ? "green" : "amber"}`}
              style={{ width: `${Math.min(100, Math.max(8, score))}%` }}
            />
          </div>

          <div className="meter-scale-markers">
            <span className="text-green">
              0-35: {lang === "bn" ? "নিরাপদ" : lang === "mr" ? "सुरक्षित" : lang === "te" ? "సురక్షితం" : lang === "ta" ? "பாதுகாப்பானது" : isHi ? "सुरक्षित (Safe)" : "Safe"}
            </span>
            <span className="text-amber">
              36-65: {lang === "bn" ? "মাঝারি" : lang === "mr" ? "मध्यम" : lang === "te" ? "మధ్యస్థం" : lang === "ta" ? "மிதமானது" : isHi ? "मध्यम (Moderate)" : "Moderate"}
            </span>
            <span className="text-red">
              66-100: {lang === "bn" ? "উচ্চ ঝুঁকি" : lang === "mr" ? "जास्त जोखीम" : lang === "te" ? "అధిక రిస్క్" : lang === "ta" ? "அதிக ஆபத்து" : isHi ? "जोखिम भरा (High Risk)" : "High Risk"}
            </span>
          </div>
        </div>
      </div>

      {/* Risk factors vs Recommendations */}
      <div className="two-column-grid">
        <div className="detail-card">
          <div className="detail-card-head">
            <div>
              <h3>
                {lang === "bn" ? "প্রধান ঝুঁকি উপাদানসমূহ" : lang === "mr" ? "प्रमुख जोखीम घटक" : lang === "te" ? "ప్రధాన రిస్క్ అంశాలు" : lang === "ta" ? "முக்கிய ஆபத்து காரணிகள்" : isHi ? "मुख्य खतरे (Key Risk Factors)" : "Primary Risk Factors"}
              </h3>
              <p>
                {lang === "bn" ? "যে বিষয়গুলোতে বিশেষভাবে সতর্ক দৃষ্টি রাখা প্রয়োজন" : lang === "mr" ? "ज्या गोष्टींवर विशेष लक्ष देणे गरजेचे आहे" : lang === "te" ? "ప్రత్యేక శ్రద్ధ వహించాల్సిన అంశాలు" : lang === "ta" ? "சிறப்புக் கவனம் செலுத்த வேண்டிய விஷயங்கள்" : isHi ? "इन बातों पर विशेष ध्यान देने की जरूरत है" : "Specific elements that could cause friction"}
              </p>
            </div>
          </div>

          <ul className="channel-list">
            {factors.map((item, idx) => (
              <li key={idx} className="channel-item">
                <span className="ch-num ch-amber">{idx + 1}</span>
                <div>
                  <strong>{translateDynamicPhrase(item, lang)}</strong>
                  <p>
                    {lang === "bn"
                      ? "এজন্য আগে থেকেই সতর্ক থাকুন এবং ব্যাকআপ বা অতিরিক্ত প্রস্তুতি রাখুন।"
                      : lang === "mr"
                      ? "यासाठी आधीच सावध राहा आणि पर्यायी व्यवस्था किंवा बॅकअप तयार ठेवा."
                      : lang === "te"
                      ? "దీనిపై ముందుగానే అప్రమత్తంగా ఉండి ప్రత్యామ్నాయ ప్రణాళిక సిద్ధం చేసుకోండి."
                      : lang === "ta"
                      ? "இதற்கு முன்கூட்டியே எச்சரிக்கையாக இருந்து மாற்று ஏற்பாடுகளை தயார் செய்யுங்கள்."
                      : isHi
                      ? "इसके लिए पहले से सतर्क रहें और अतिरिक्त स्टॉक या बैकअप तैयार रखें।"
                      : "Prepare proactive countermeasures before launching operations."}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="detail-card">
          <div className="detail-card-head">
            <div>
              <h3>
                {lang === "bn" ? "সুরক্ষা ও সতর্কতা পদক্ষেপ" : lang === "mr" ? "सुरक्षेचे उपाय व सल्ला" : lang === "te" ? "రక్షణ చర్యలు & సలహాలు" : lang === "ta" ? "பாதுகாப்பு வழிகாட்டுதல்கள்" : isHi ? "बचाव के उपाय (Safety Steps)" : "Protective Recommendations"}
              </h3>
              <p>
                {lang === "bn" ? "ক্ষতি ও লোকসান এড়াতে প্রয়োজনীয় পদক্ষেপ" : lang === "mr" ? "नुकसान टाळण्यासाठी काय करावे" : lang === "te" ? "నష్టాలను నివారించడానికి ఆచరణాత్మక చర్యలు" : lang === "ta" ? "நஷ்டத்தைத் தவிர்க்க என்ன செய்ய வேண்டும்" : isHi ? "नुकसान से बचने के लिए क्या करें" : "Proven actions to safeguard your enterprise"}
              </p>
            </div>
          </div>

          <ul className="channel-list">
            {recommendations.map((item, idx) => (
              <li key={idx} className="channel-item">
                <span className="ch-num ch-green">{idx + 1}</span>
                <div>
                  <strong>{translateDynamicPhrase(item, lang)}</strong>
                  <p>
                    {lang === "bn"
                      ? "এই নিয়ম মেনে চললে আপনার ব্যবসা যেকোনো মৌসুমে নিরাপদ থাকবে।"
                      : lang === "mr"
                      ? "हा नियम पाळल्यास आपला व्यवसाय प्रत्येक ऋतूत सुरक्षित राहील."
                      : lang === "te"
                      ? "ఈ నియమాన్ని పాటించడం వల్ల మీ వ్యాపారం అన్ని కాలాల్లో సురక్షితంగా ఉంటుంది."
                      : lang === "ta"
                      ? "இந்த விதியைப் பின்பற்றுவது உங்கள் தொழிலை அனைத்து பருவங்களிலும் பாதுகாக்கும்."
                      : isHi
                      ? "यह नियम अपनाने से आपका व्यापार हर मौसम में सुरक्षित रहेगा।"
                      : "Strict adherence protects working capital during slow seasons."}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Emergency fund tip */}
      <div className="village-tip-banner">
        <div>
          <h4>
            {lang === "bn"
              ? "জরুরি তহবিল সংরক্ষণ নিয়ম (Emergency Cash Buffer):"
              : lang === "mr"
              ? "आपत्कालीन राखीव निधी नियम (Emergency Cash Buffer):"
              : lang === "te"
              ? "అత్యవసర నిధి నియమం (Emergency Cash Buffer):"
              : lang === "ta"
              ? "அவசர பண சேமிப்பு விதி (Emergency Cash Buffer):"
              : isHi
              ? "आपातकालीन तिजोरी नियम (Emergency Cash Buffer):"
              : "Emergency Reserve Rule:"}
          </h4>
          <p>
            {lang === "bn"
              ? "প্রতি মাসে নিট লাভের ১০% আলাদা ব্যাংক একাউন্ট বা তহবিলে 'জরুরি সঞ্চয়' হিসেবে রাখুন। কোনো যন্ত্রপাতি নষ্ট হলে বা মন্দার সময় আপনাকে চড়া সুদে স্থানীয় ঋণ নিতে হবে না।"
              : lang === "mr"
              ? "दरमहा नफ्याचा 10% भाग वेगळ्या बँक खात्यात 'आपत्कालीन निधी' म्हणून ठेवा. मंदी, आजारपण किंवा यंत्र बिघाड झाल्यास खासगी सावकाराकडून व्याजाने कर्ज घेण्याची गरज पडणार नाही."
              : lang === "te"
              ? "ప్రతి నెలా లాభంలో 10% ప్రత్యేక ఖాతాలో 'అత్యవసర నిధి'గా ఉంచండి. యంత్రాలు పాడైనా లేదా మందగమనం వచ్చినా ప్రైవేట్ వడ్డీ వ్యాపారులను ఆశ్రయించాల్సిన అవసరం ఉండదు."
              : lang === "ta"
              ? "ஒவ்வொரு மாதமும் லாபத்தில் 10% தொகையை தனி கணக்கில் 'அவசர நிதி'யாக சேமிக்கவும். இயந்திரம் பழுதானாலோ அல்லது மந்தநிலை ஏற்பட்டாலோ கந்துவட்டி கடன் வாங்க வேண்டிய அவசியம் இருக்காது."
              : isHi
              ? "हर महीने मुनाफे का 10% हिस्सा अलग बैंक खाते या गुल्लक में 'आपातकालीन फंड' के रूप में रखें। जब कभी मंदी, बीमारी या मशीन में खराबी आए, तो आपको किसी साहूकार से ब्याज पर कर्ज नहीं लेना पड़ेगा।"
              : "Always retain 10% of monthly profit in a separate savings account as an emergency buffer. If a machine breaks down or sales dip during heavy monsoons, you will never need high-interest local private loans."}
          </p>
        </div>
      </div>
    </div>
  );
}
