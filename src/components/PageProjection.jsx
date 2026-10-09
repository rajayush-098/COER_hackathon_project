import { useState } from "react";
import MinimalPieChart from "./MinimalPieChart";
import { getPageBadge } from "../utils/translationHelper";

export default function PageProjection({ result, formatCurrency, lang = "hi" }) {
  const isHi = lang === "hi";
  const [pieMode, setPieMode] = useState("quarterly");
  const projection = result.profit_projection ?? [];
  const monthlyProfit = result.financial_analysis?.monthly_profit ?? 0;

  const m3 = projection[2]?.cumulative_profit ?? monthlyProfit * 3;
  const m6 = projection[5]?.cumulative_profit ?? monthlyProfit * 6;
  const m9 = projection[8]?.cumulative_profit ?? monthlyProfit * 9;
  const m12 = projection[11]?.cumulative_profit ?? monthlyProfit * 12;

  const maxCum = m12 > 0 ? m12 : 1;

  const q1 = m3;
  const q2 = Math.max(0, m6 - m3);
  const q3 = Math.max(0, m9 - m6);
  const q4 = Math.max(0, m12 - m9);

  const getQName = (qNum, monthsStr) => {
    switch (lang) {
      case "bn":
        return `ত্রৈমাসিক ${qNum} (মাস ${monthsStr})`;
      case "mr":
        return `तिमाही ${qNum} (महिना ${monthsStr})`;
      case "te":
        return `త్రైమాసికం ${qNum} (నెలలు ${monthsStr})`;
      case "ta":
        return `காலாண்டு ${qNum} (மாதங்கள் ${monthsStr})`;
      case "hi":
      case "hinglish":
        return `तिमाही ${qNum} (महीना ${monthsStr})`;
      default:
        return `Q${qNum} (Months ${monthsStr})`;
    }
  };

  const quarterlyData = [
    {
      name: getQName(1, "1-3"),
      value: q1,
      color: "#2563eb",
      sublabel: lang === "bn" ? "প্রারম্ভিক সঞ্চয় গঠন" : lang === "mr" ? "सुरुवातीची जमा बचत" : lang === "te" ? "ప్రారంభ పొదుపు సమీకరణ" : lang === "ta" ? "ஆரம்ப சேமிப்பு குவிப்பு" : isHi ? "शुरुआती जमा बचत" : "Initial savings accumulation",
    },
    {
      name: getQName(2, "4-6"),
      value: q2,
      color: "#7c3aed",
      sublabel: lang === "bn" ? "ব্যবসা স্থিতিশীলকরণ" : lang === "mr" ? "व्यवसाय स्थिरीकरण" : lang === "te" ? "వ్యాపార స్థిరీకరణ & స్థిర వృద్ధి" : lang === "ta" ? "தொழில் நிலைப்படுத்தல் & வளர்ச்சி" : isHi ? "व्यवसाय स्थिरीकरण" : "Stabilization & steady growth",
    },
    {
      name: getQName(3, "7-9"),
      value: q3,
      color: "#0d9488",
      sublabel: lang === "bn" ? "ধারাবাহিক গ্রাহক বৃদ্ধি" : lang === "mr" ? "स्थिर गती व ग्राहक वाढ" : lang === "te" ? "స్థిరమైన కస్టమర్ నిలుపుదల" : lang === "ta" ? "நிலையான வாடிக்கையாளர் பெருக்கம்" : isHi ? "स्थिर गति व ग्राहक वृद्धि" : "Consistent customer retention",
    },
    {
      name: getQName(4, "10-12"),
      value: q4,
      color: "#16a34a",
      sublabel: lang === "bn" ? "বছরের চূড়ান্ত মোট সঞ্চয়" : lang === "mr" ? "वार्षिक सर्वोच्च बचत" : lang === "te" ? "సంవత్సరాంతపు మొత్తం పొదుపు" : lang === "ta" ? "ஆண்டு இறுதி ஒட்டுமொத்த சேமிப்பு" : isHi ? "सालाना शीर्ष बचत" : "Year-end accumulated wealth",
    },
  ];

  const margin = Number(result.scheme_analysis?.beneficiary_contribution || result.investment || 0);
  const recoveredCap = Math.min(margin, m12);
  const netSurplus = Math.max(0, m12 - margin);

  const recoveryData = [
    {
      name: lang === "bn" ? "বিনিয়োগকৃত মূলধন ফেরত" : lang === "mr" ? "गुंतवलेल्या भांडवलाची वसुली" : lang === "te" ? "ప్రారంభ మూలధన రికవరీ" : lang === "ta" ? "ஆரம்ப மூலதன மீட்பு" : isHi ? "लगाई गई पूँजी की वापसी" : "Initial Capital Recovered",
      value: recoveredCap,
      color: "#b45309",
      sublabel: lang === "bn" ? "নিজের পকেটের বিনিয়োগ ফেরত" : lang === "mr" ? "स्वतःच्या खिशातील पैसा परत" : lang === "te" ? "స్వంత పెట్టుబడి వాపసు" : lang === "ta" ? "சுய முதலீட்டு தொகை மீட்பு" : isHi ? "आपकी जेब से लगा पैसा वापस" : "Return of your self-invested cash",
    },
    {
      name: lang === "bn" ? "অতিরিক্ত প্রকৃত সম্পদ সৃষ্টি" : lang === "mr" ? "अतिरिक्त निव्वळ संपत्ती निर्मिती" : lang === "te" ? "నికర మిగులు సంపద సృష్టి" : lang === "ta" ? "நிகர உபரி செல்வ உருவாக்கம்" : isHi ? "अतिरिक्त शुद्ध धन निर्माण" : "Net Wealth Creation (Surplus)",
      value: netSurplus > 0 ? netSurplus : 0,
      color: "#16a34a",
      sublabel: lang === "bn" ? "মূলধন তোলার পর অতিরিক্ত উদ্বৃত্ত" : lang === "mr" ? "भांडवल परतीनंतर तयार झालेला अतिरिक्त नफा" : lang === "te" ? "పెట్టుబడి తీసిన తర్వాత మిగిలిన అదనపు సంపద" : lang === "ta" ? "மூலதன மீட்புக்குப் பிறகு உருவான கூடுதல் உபரி" : isHi ? "पूँजी वापसी के बाद बना अतिरिक्त धन" : "Surplus retained beyond initial investment",
    },
  ];

  return (
    <div className="side-page-content">
      <div className="page-header-banner">
        <div className="page-header-text">
          <span className="page-badge-pill">
            {getPageBadge("projection", lang)}
          </span>
          <h2>
            {lang === "bn" ? "১ বছরে আপনার মোট সঞ্চয় ও প্রাক্কলন" : lang === "mr" ? "1 वर्षात आपली एकूण बचत" : lang === "te" ? "1 సంవత్సరంలో మీ మొత్తం పొదుపు టైమ్‌లైన్" : lang === "ta" ? "1 ஆண்டில் உங்கள் மொத்த சேமிப்பு காலக்கோடு" : isHi ? "1 साल में आपकी कुल बचत" : "1-Year Cumulative Profit Timeline"}
          </h2>
          <p className="page-sub-desc">
            {lang === "bn"
              ? "সময়ের সাথে সাথে প্রতি মাসে আপনার ব্যাংক অ্যাকাউন্টে কত টাকা জমবে তার বিস্তারিত রূপরেখা।"
              : lang === "mr"
              ? "वेळेनुसार दरमहा आपल्या तिजोरीत किती बचत जमा होत जाईल ते पहा."
              : lang === "te"
              ? "సమయం గడిచేకొద్దీ ప్రతి నెలా మీ వద్ద ఎంత పొదుపు నిల్వ అవుతుందో గమనించండి."
              : lang === "ta"
              ? "காலப்போக்கில் ஒவ்வொரு மாதமும் உங்கள் கையில் எவ்வளவு சேமிப்பு குவிகிறது என்பதைக் கண்காணிக்கவும்."
              : isHi
              ? "देखें कि समय के साथ हर महीने आपकी तिजोरी में कितनी बचत जमा होती जाएगी।"
              : "Track how your monthly savings accumulate into a substantial capital reserve over 12 months."}
          </p>
        </div>
      </div>

      {/* 3 Milestone Badges */}
      <div className="milestone-grid">
        <div className="milestone-card">
          <span className="milestone-flag">
            {lang === "bn" ? "৩ মাস পর" : lang === "mr" ? "3 महिन्यांनंतर" : lang === "te" ? "3 నెలల తర్వాత" : lang === "ta" ? "3 மாதங்களுக்குப் பிறகு" : isHi ? "3 महीने बाद" : "After 3 Months"}
          </span>
          <h3 className="milestone-val">{formatCurrency(m3)}</h3>
          <p className="milestone-note">
            {lang === "bn" ? "প্রারম্ভিক খরচ ও কার্যক্রম স্থিতিশীল" : lang === "mr" ? "सुरुवातीचा खर्च व व्यवस्था स्थिर होईल" : lang === "te" ? "ప్రారంభ నిర్వహణ ఖర్చులు స్థిరపడతాయి" : lang === "ta" ? "ஆரம்ப செயல்பாட்டு செலவுகள் நிலைப்படுத்தப்படும்" : isHi ? "शुरुआती लागत और व्यवस्था संभल जाएगी" : "Early working capital stabilized"}
          </p>
        </div>

        <div className="milestone-card">
          <span className="milestone-flag">
            {lang === "bn" ? "৬ মাস পর" : lang === "mr" ? "6 महिन्यांनंतर" : lang === "te" ? "6 నెలల తర్వాత" : lang === "ta" ? "6 மாதங்களுக்குப் பிறகு" : isHi ? "6 महीने बाद" : "After 6 Months"}
          </span>
          <h3 className="milestone-val">{formatCurrency(m6)}</h3>
          <p className="milestone-note">
            {lang === "bn" ? "মূলধনের অর্ধেকের বেশি উঠে আসবে" : lang === "mr" ? "आपले निम्म्याहून अधिक भांडवल परत येईल" : lang === "te" ? "సగానికి పైగా పెట్టుబడి తిరిగి వస్తుంది" : lang === "ta" ? "பாதிக்கும் மேற்பட்ட முதலீடு மீட்டெடுக்கப்படும்" : isHi ? "आपकी आधी से ज़्यादा पूँजी वापस आ जाएगी" : "Major portion of initial investment recovered"}
          </p>
        </div>

        <div className="milestone-card highlight">
          <span className="milestone-flag">
            {lang === "bn" ? "১ পূর্ণ বছর পর" : lang === "mr" ? "1 वर्ष पूर्ण झाल्यावर" : lang === "te" ? "1 పూర్తి సంవత్సరం తర్వాత" : lang === "ta" ? "1 முழு ஆண்டு முடிவில்" : isHi ? "1 साल पूरा होने पर" : "After 1 Full Year"}
          </span>
          <h3 className="milestone-val text-green">{formatCurrency(m12)}</h3>
          <p className="milestone-note">
            {lang === "bn" ? "বার্ষিক মোট নিট সঞ্চয় আপনার হাতে থাকবে" : lang === "mr" ? "वार्षिक एकूण शुद्ध बचत आपल्या खिशात असेल" : lang === "te" ? "పూర్తి వార్షిక నికర పొదుపు మీ చేతిలో ఉంటుంది" : lang === "ta" ? "முழு ஆண்டு நிகர சேமிப்பு உங்கள் கையில் இருக்கும்" : isHi ? "सालाना कुल शुद्ध बचत आपकी जेब में होगी" : "Full annual savings to expand or reinvest"}
          </p>
        </div>
      </div>

      {/* Visual Chart Bars for each month */}
      <div className="projection-visual-card">
        <div className="card-top-head">
          <div>
            <h3>
              {lang === "bn" ? "মাসিক সঞ্চয় বৃদ্ধির গ্রাফ" : lang === "mr" ? "मासिक बचतीचा आलेख" : lang === "te" ? "నెలవారీ పొదుపు వృద్ధి చార్ట్" : lang === "ta" ? "மாதாந்திர சேமிப்பு வளர்ச்சி விளக்கப்படம்" : isHi ? "मासिक बचत का ग्राफ" : "Monthly Savings Growth Chart"}
            </h3>
            <p>
              {lang === "bn" ? "মাস ১ থেকে মাস ১২ পর্যন্ত ক্রমবর্ধিষ্ণু সঞ্চয়" : lang === "mr" ? "महिना 1 ते महिना 12 पर्यंत बचतीची वाढ" : lang === "te" ? "నెల 1 నుండి 12 వరకు నిరంతర పొదుపు ప్రగతి" : lang === "ta" ? "மாதம் 1 முதல் 12 வரை மொத்த சேமிப்பின் வளர்ச்சி" : isHi ? "महीना 1 से महीना 12 तक बचत का बढ़ना" : "Progress of total accumulated money"}
            </p>
          </div>
        </div>

        <div className="projection-bars-container">
          {projection.map((item, idx) => {
            const pct = Math.max(8, Math.min(100, (item.cumulative_profit / maxCum) * 100));
            const isMilestone = idx === 2 || idx === 5 || idx === 11;
            return (
              <div key={idx} className={`proj-bar-col ${isMilestone ? "milestone-col" : ""}`}>
                <div className="proj-bar-tooltip">
                  {formatCurrency(item.cumulative_profit)}
                </div>
                <div className="proj-bar-track">
                  <div
                    className={`proj-bar-fill ${isMilestone ? "milestone-bar" : ""}`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="proj-bar-label">M{idx + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Pie Chart: 12-Month Accumulation Breakdown */}
      <div className="detail-card" style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--text-main)",
              }}
            >
              {lang === "bn" ? "১২ মাসের পুঞ্জীভূত সঞ্চয়ের পাই চার্ট" : lang === "mr" ? "12 महिन्यांच्या बचतीचा पाय चार्ट" : lang === "te" ? "12 నెలల మొత్తం పొదుపు పై చార్ట్" : lang === "ta" ? "12 மாத சேமிப்பு பகிர்வு பை விளக்கப்படம்" : isHi ? "12 महीने की बचत का पाई चार्ट" : "12-Month Accumulation Pie Chart"}
            </h3>
            <p
              style={{
                margin: "2px 0 0 0",
                fontSize: "13px",
                color: "var(--text-muted)",
              }}
            >
              {lang === "bn" ? "১ বছরের মোট সঞ্চয় কীভাবে গড়ে উঠেছে তা দেখুন" : lang === "mr" ? "1 वर्षाची एकूण बचत कशी तयार झाली ते पहा" : lang === "te" ? "1 సంవత్సరం మొత్తం పొదుపు ఎలా సమకూరిందో చూడండి" : lang === "ta" ? "1 ஆண்டு மொத்த சேமிப்பு எவ்வாறு உருவானது என்பதைக் காண்க" : isHi ? "देखें कि 1 वर्ष की कुल बचत किस प्रकार बनी" : "Visual breakdown of your 1-year accumulated annual profit"}
            </p>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              onClick={() => setPieMode("quarterly")}
              style={{
                padding: "4px 12px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "20px",
                border: "1px solid",
                borderColor: pieMode === "quarterly" ? "#16a34a" : "#cbd5e1",
                backgroundColor: pieMode === "quarterly" ? "#dcfce7" : "#ffffff",
                color: pieMode === "quarterly" ? "#166534" : "#475569",
                cursor: "pointer",
              }}
            >
              {lang === "bn" ? "ত্রৈমাসিক অংশ" : lang === "mr" ? "तिमाही विभागणी" : lang === "te" ? "త్రైమాసిక విభజన" : lang === "ta" ? "காலாண்டு பங்கு" : isHi ? "तिमाही विभाजन" : "Quarterly Share"}
            </button>
            <button
              type="button"
              onClick={() => setPieMode("recovery")}
              style={{
                padding: "4px 12px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "20px",
                border: "1px solid",
                borderColor: pieMode === "recovery" ? "#16a34a" : "#cbd5e1",
                backgroundColor: pieMode === "recovery" ? "#dcfce7" : "#ffffff",
                color: pieMode === "recovery" ? "#166534" : "#475569",
                cursor: "pointer",
              }}
            >
              {lang === "bn" ? "পুঁজি ফেরত বনাম উদ্বৃত্ত" : lang === "mr" ? "भांडवल परतावा vs नफा" : lang === "te" ? "రికవరీ వర్సెస్ మిగులు" : lang === "ta" ? "மீட்பு vs உபரி" : isHi ? "पूँजी वापसी vs मुनाफा" : "Recovery vs Surplus"}
            </button>
          </div>
        </div>

        <MinimalPieChart
          data={pieMode === "quarterly" ? quarterlyData : recoveryData}
          formatCurrency={formatCurrency}
          height={210}
          centerText={{
            primary: lang === "bn" ? "বার্ষিক মোট সঞ্চয়" : lang === "mr" ? "वार्षिक एकूण बचत" : lang === "te" ? "వార్షిక పొదుపు" : lang === "ta" ? "ஆண்டு சேமிப்பு" : isHi ? "1 साल की कुल बचत" : "Annual Profit",
            secondary: formatCurrency(m12),
          }}
        />
      </div>

      {/* Clear Table for multi-lingual users */}
      <div className="detail-card">
        <div className="detail-card-head">
          <div>
            <h3>
              {lang === "bn" ? "মাসভিত্তিক সঞ্চয়ের হিসাব (বিবরণী)" : lang === "mr" ? "महिनेवार हिशोब वही" : lang === "te" ? "నెలవారీ రికార్డు వివరాలు" : lang === "ta" ? "மாதாந்திர கணக்கு அறிக்கை" : isHi ? "महीनेवार बही-खाता (Table)" : "Month-by-Month Statement"}
            </h3>
            <p>
              {lang === "bn" ? "প্রতি মাসের লাভ এবং মোট জমাকৃত অর্থ" : lang === "mr" ? "दरमहा बचत व एकूण जमा रक्कम" : lang === "te" ? "ప్రతి నెలా పొదుపు & మొత్తం నిల్వ వివరాలు" : lang === "ta" ? "ஒவ்வொரு மாத சேமிப்பு மற்றும் மொத்த இருப்பு" : isHi ? "हर महीने की बचत और कुल जमा राशि" : "Exact numbers for every month"}
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>{lang === "bn" ? "মাস" : lang === "mr" ? "महिना" : lang === "te" ? "నెల" : lang === "ta" ? "மாதம்" : isHi ? "महीना" : "Month"}</th>
                <th>{lang === "bn" ? "সেই মাসের লাভ" : lang === "mr" ? "त्या महिन्याचा नफा" : lang === "te" ? "ఆ నెల నికర లాభం" : lang === "ta" ? "அந்த மாத லாபம்" : isHi ? "उस महीने की बचत" : "Monthly Profit"}</th>
                <th>{lang === "bn" ? "মোট জমাকৃত সঞ্চয়" : lang === "mr" ? "एकूण जमा बचत" : lang === "te" ? "మొత్తం నిల్వ పొదుపు" : lang === "ta" ? "மொத்த சேர்ந்த சேமிப்பு" : isHi ? "कुल जमा बचत" : "Total Accumulated Savings"}</th>
                <th>{lang === "bn" ? "মাইলফলক স্থিতি" : lang === "mr" ? "टप्पा स्थिती" : lang === "te" ? "మైలురాయి స్థితి" : lang === "ta" ? "மைல்கல் நிலை" : isHi ? "स्थिति" : "Milestone Status"}</th>
              </tr>
            </thead>
            <tbody>
              {projection.map((item, idx) => (
                <tr key={idx} className={idx === 11 ? "row-highlight" : ""}>
                  <td>
                    <strong>
                      {lang === "bn" ? `মাস ${idx + 1}` : lang === "mr" ? `महिना ${idx + 1}` : lang === "te" ? `నెల ${idx + 1}` : lang === "ta" ? `மாதம் ${idx + 1}` : isHi ? `महीना ${idx + 1}` : item.month}
                    </strong>
                  </td>
                  <td className="text-green">{formatCurrency(item.monthly_profit)}</td>
                  <td>
                    <strong>{formatCurrency(item.cumulative_profit)}</strong>
                  </td>
                  <td>
                    {idx === 2 ? (
                      <span className="pill-badge pill-blue">
                        {lang === "bn" ? "৩ মাসের যাচাই" : lang === "mr" ? "3 महिने टप्पा" : lang === "te" ? "3 నెలల పరిశీలన" : lang === "ta" ? "3 மாத ஆய்வு" : "3-Month Check"}
                      </span>
                    ) : idx === 5 ? (
                      <span className="pill-badge pill-purple">
                        {lang === "bn" ? "অর্ধ-বার্ষিক ধাপ" : lang === "mr" ? "अर्ध-वार्षिक टप्पा" : lang === "te" ? "అర్ధ వార్షిక మైలురాయి" : lang === "ta" ? "அரை ஆண்டு மைல்கல்" : "Half-Year Mark"}
                      </span>
                    ) : idx === 11 ? (
                      <span className="pill-badge pill-green">
                        {lang === "bn" ? "১ বছরের লক্ষ্য পূরণ" : lang === "mr" ? "1 वर्ष ध्येयपूर्ती" : lang === "te" ? "1 సంవత్సర లక్ష్యం" : lang === "ta" ? "1 ஆண்டு இலக்கு" : "1-Year Goal"}
                      </span>
                    ) : (
                      <span className="pill-badge pill-gray">
                        {lang === "bn" ? "চলমান" : lang === "mr" ? "सक्रिय" : lang === "te" ? "కొనసాగుతోంది" : lang === "ta" ? "செயலில்" : "Active"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

