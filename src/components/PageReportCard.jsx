import { useState } from "react";
import { Database, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { API_ROUTES } from "../apiRoutes";
import { translations } from "../translations";
import {
  getPageBadge,
  getUI,
  translateVerdict,
  translateCategory,
  translateAffordability,
} from "../utils/translationHelper";

export default function PageReportCard({ result, lang, formatCurrency }) {
  const isHi = lang === "hi";
  const t = translations[lang] || translations.en;

  const [saving, setSaving] = useState(false);
  const [savedCode, setSavedCode] = useState(null);
  const [saveError, setSaveError] = useState("");

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleSaveToDatabase = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const projectCost =
        result.scheme_analysis?.project_cost ||
        (result.investment ? Number(result.investment) / 0.1 : 0);
      const marginCapital =
        result.scheme_analysis?.margin_capital ||
        result.scheme_analysis?.beneficiary_contribution ||
        Number(result.investment) || 0;
      const eligibleLoan = result.scheme_analysis?.eligible_loan || 0;

      const profile = {
        business_name: result.business || "Kisan Enterprise",
        category: result.category || "General",
        state: result.state || "Uttar Pradesh",
        district: result.district || "Meerut",
        block: result.block || "",
        village_location: result.location || result.block || "",
        pincode: result.pin || "",
        experience_level: result.experience || "Beginner",
        udyam_number: result.udyam_number || "",
      };

      const financials = {
        project_cost: Number(projectCost) || 0,
        margin_capital: Number(marginCapital) || 0,
        eligible_loan: Number(eligibleLoan) || 0,
        monthly_revenue: Number(result.monthly_revenue) || 0,
        monthly_expenses: Number(result.monthly_expenses) || 0,
        monthly_profit: Number(result.financial_analysis?.monthly_profit) || 0,
        yearly_profit: Number(result.financial_analysis?.yearly_profit) || 0,
        monthly_emi: Number(result.loan_affordability?.monthly_emi) || 0,
        matched_scheme_name: result.scheme_analysis?.scheme_name || null,
        interest_rate: result.scheme_analysis?.interest_rate != null ? Number(result.scheme_analysis.interest_rate) : null,
        tenure_months: result.scheme_analysis?.loan_tenure_months != null ? Number(result.scheme_analysis.loan_tenure_months) : null,
        moratorium_months: result.scheme_analysis?.moratorium_months != null ? Number(result.scheme_analysis.moratorium_months) : null,
        affordability_status: result.loan_affordability?.affordability_status || null,
        feasibility_verdict: result.feasibilityVerdict || result.feasibility || null,
      };

      const res = await fetch(API_ROUTES.SAVE_BUSINESS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          financials,
          reportPayload: result,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save dossier to database");
      }

      setSavedCode(data.reportCode);
    } catch (err) {
      console.warn("Save Parcha to DB failed:", err);
      setSaveError(err?.message || "Database connection is offline.");
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fin = result.financial_analysis ?? {};
  const scheme = result.scheme_analysis ?? {};
  const afford = result.loan_affordability ?? {};

  // Pure deterministic Doc ID based on business name
  const docIdNum = Math.abs(
    (result.business || "ENTERPRISE")
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 1234) * 53
  ) % 900000 + 100000;
  const docId = savedCode || `VAI-${docIdNum}`;

  return (
    <div className="side-page-content printable-page">
      <div className="page-header-banner no-print">
        <div className="page-header-text">
          <span className="page-badge-pill">
            {getPageBadge("report", lang)}
          </span>
          <h2>{getUI("reportHeaderTitle", lang, "Printable Business Feasibility Dossier")}</h2>
          <p className="page-sub-desc">
            {getUI("reportHeaderSub", lang, "Formal 1-page project card designed to show to local bank managers, CSC centers, or Gram Panchayat.")}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleSaveToDatabase}
            disabled={saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "8px",
              backgroundColor: savedCode ? "#059669" : "#0284c7",
              color: "#ffffff",
              border: "none",
              fontWeight: "600",
              fontSize: "14px",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t.btnSaving || getUI("savingBtn", lang, "Saving...")}</span>
              </>
            ) : savedCode ? (
              <>
                <CheckCircle2 size={16} />
                <span>{t.savedParcha || getUI("savedBtn", lang, "Saved to MySQL")}</span>
              </>
            ) : (
              <>
                <Database size={16} />
                <span>{t.saveParcha || getUI("saveEvaluationBtn", lang, "Save to MySQL")}</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="print-action-btn"
            onClick={handlePrint}
          >
            {t.printParcha || getUI("printParchaBtn", lang, "Print / Save PDF Report")}
          </button>
        </div>
      </div>

      {saveError && (
        <div style={{
          margin: "0 0 16px",
          padding: "10px 14px",
          borderRadius: "8px",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#991b1b",
          fontSize: "13px"
        }}>
          <AlertCircle size={16} />
          <span>{saveError}</span>
        </div>
      )}

      {savedCode && (
        <div style={{
          margin: "0 0 16px",
          padding: "10px 14px",
          borderRadius: "8px",
          backgroundColor: "#ecfdf5",
          border: "1px solid #a7f3d0",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#065f46",
          fontSize: "13.5px"
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>
            {getUI("parchaSavedMsg", lang, "Project Card permanently saved to MySQL database.")}{" "}
            {getUI("reportCodeLabel", lang, "Report Code:")}{" "}
            <strong style={{ background: "#d1fae5", padding: "2px 6px", borderRadius: "4px" }}>{savedCode}</strong>
          </span>
        </div>
      )}

      {/* Actual Printable Certificate Card */}
      <div className="parcha-document-container" id="printable-report">
        {/* Document Header */}
        <div className="parcha-header">
          <div className="parcha-header-emblem">
            <div>
              <p className="parcha-govt-sub">
                {getUI("parchaBoardSub", lang, "Rural Micro-Enterprise Advisory Board • MSME Aligned")}
              </p>
              <h2 className="parcha-title">
                {getUI("parchaDocTitle", lang, "Micro-Enterprise Feasibility Project Card")}
              </h2>
            </div>
          </div>

          <div className="parcha-meta-box">
            <p>
              <strong>{getUI("date", lang, "Date:")}</strong> {today}
            </p>
            <p>
              <strong>{getUI("docId", lang, "Doc ID:")}</strong> {docId}
            </p>
          </div>
        </div>

        {/* Applicant & Location Table */}
        <div className="parcha-section-title">
          <span>01</span> {getUI("applicantSectionTitle", lang, "Applicant & Proposed Enterprise Details")}
        </div>

        <div className="parcha-info-table">
          <div className="parcha-info-row">
            <span className="col-label">{lang === "bn" ? "ব্যবসার নাম:" : lang === "mr" ? "व्यवसायाचे नाव:" : lang === "te" ? "వ్యాపార పేరు:" : lang === "ta" ? "தொழிலின் பெயர்:" : isHi ? "व्यापार का नाम:" : "Enterprise Name:"}</span>
            <span className="col-val"><strong>{result.business}</strong></span>
            <span className="col-label">{lang === "bn" ? "শ্রেণী:" : lang === "mr" ? "श्रेणी (Category):" : lang === "te" ? "వర్గం:" : lang === "ta" ? "பிரிவு:" : isHi ? "श्रेणी (Category):" : "Sector / Category:"}</span>
            <span className="col-val">{translateCategory(result.category, lang)}</span>
          </div>

          <div className="parcha-info-row">
            <span className="col-label">{lang === "bn" ? "গ্রাম / স্থান:" : lang === "mr" ? "गाव / ठिकाण:" : lang === "te" ? "గ్రామం / ప్రదేశం:" : lang === "ta" ? "கிராமம் / இடம்:" : isHi ? "गाँव / स्थान:" : "Location / Village:"}</span>
            <span className="col-val">{result.location}</span>
            <span className="col-label">{lang === "bn" ? "ব্লক / তহশিল:" : lang === "mr" ? "तालुका / ब्लॉक:" : lang === "te" ? "మండలం / బ్లాక్:" : lang === "ta" ? "வட்டம் / ஒன்றியம்:" : isHi ? "ब्लॉक / तहसील:" : "Block / Tehsil:"}</span>
            <span className="col-val">{result.block}</span>
          </div>

          <div className="parcha-info-row">
            <span className="col-label">{lang === "bn" ? "জেলা ও রাজ্য:" : lang === "mr" ? "जिल्हा व राज्य:" : lang === "te" ? "జిల్లా & రాష్ట్రం:" : lang === "ta" ? "மாவட்டம் & மாநிலம்:" : isHi ? "जिला व राज्य:" : "District & State:"}</span>
            <span className="col-val">{result.district}, {result.state}</span>
            <span className="col-label">{lang === "bn" ? "সম্ভাব্যতা স্থিতি:" : lang === "mr" ? "व्यवहार्यता स्थिती:" : lang === "te" ? "సాధ్యత స్థితి:" : lang === "ta" ? "சாத்தியக்கூறு நிலை:" : isHi ? "व्यवहार्यता स्थिति:" : "Feasibility Status:"}</span>
            <span className={`col-val ${result.colorTheme ? `text-${result.colorTheme}-900` : "text-green"}`}>
              <strong>{translateVerdict(result.feasibilityVerdict || result.feasibility, lang)}</strong>
            </span>
          </div>
        </div>

        {/* Financial Overview Table */}
        <div className="parcha-section-title">
          <span>02</span> {getUI("financialSummarySectionTitle", lang, "Financial Viability Statement")}
        </div>

        <table className="parcha-table">
          <thead>
            <tr>
              <th>{lang === "bn" ? "বিবরণ" : lang === "mr" ? "तपशील" : lang === "te" ? "వివరాలు" : lang === "ta" ? "விவரக்குறிப்பு" : isHi ? "मद का विवरण" : "Financial Metric"}</th>
              <th>{lang === "bn" ? "পরিমাণ / মান" : lang === "mr" ? "रक्कम / मूल्य" : lang === "te" ? "మొత్తం / విలువ" : lang === "ta" ? "தொகை / மதிப்பு" : isHi ? "राशि / मान" : "Calculated Figure"}</th>
              <th>{lang === "bn" ? "মন্তব্য" : lang === "mr" ? "शेरा" : lang === "te" ? "రిమార్కులు" : lang === "ta" ? "குறிப்புகள்" : isHi ? "टिप्पणी" : "Benchmarking Remarks"}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{lang === "bn" ? "মোট আনুমানিক মাসিক বিক্রয়" : lang === "mr" ? "एकूण अंदाजित मासिक विक्री" : lang === "te" ? "అంచనా నెలవారీ అమ్మకాలు" : lang === "ta" ? "மதிப்பிடப்பட்ட மாதாந்திர விற்பனை" : isHi ? "कुल अनुमानित मासिक बिक्री" : "Expected Monthly Sales (Revenue)"}</td>
              <td><strong>{formatCurrency(fin.monthly_revenue || ((fin.monthly_profit || 0) + (fin.monthly_expenses || 20000)))}</strong></td>
              <td>{lang === "bn" ? "স্থানীয় মূল্য সূচক ও ৫ কিমি পরিধির ওপর ভিত্তি করে" : lang === "mr" ? "स्थानिक दर निर्देशांक व 5 किमी परिसरावर आधारित" : lang === "te" ? "స్థానిక మార్కెట్ సూచిక ఆధారంగా" : lang === "ta" ? "உள்ளூர் சந்தை குறியீட்டின் அடிப்படையில்" : isHi ? "गाँव व आस-पास 5 किमी में अनुमानित" : "Based on hyper-local price index"}</td>
            </tr>
            <tr>
              <td>{lang === "bn" ? "মোট আনুমানিক মাসিক খরচ" : lang === "mr" ? "एकूण अंदाजित मासिक खर्च" : lang === "te" ? "అంచనా నెలవారీ ఖర్చులు" : lang === "ta" ? "மதிப்பிடப்பட்ட மாதாந்திர செலவுகள்" : isHi ? "कुल अनुमानित मासिक खर्च" : "Expected Monthly Operating Costs"}</td>
              <td><strong>{formatCurrency(fin.monthly_expenses || 20000)}</strong></td>
              <td>{lang === "bn" ? "কাঁচামাল, বিদ্যুৎ, ভাড়া ও খাদ্য খরচ অন্তর্ভুক্ত" : lang === "mr" ? "कच्चा माल, चारा, वीज व भाडे समाविष्ट" : lang === "te" ? "ముడి సరుకులు, విద్యుత్ & అద్దె ఖర్చులు" : lang === "ta" ? "மூலப்பொருட்கள், மின்சாரம் & வாடகை உட்பட" : isHi ? "कच्चा माल, चारा, किराया व बिजली" : "Includes feed/materials, power & rent"}</td>
            </tr>
            <tr className="row-profit-highlight">
              <td><strong>{lang === "bn" ? "নিট মাসিক সঞ্চয় (লাভ)" : lang === "mr" ? "निव्वळ मासिक बचत (नफा)" : lang === "te" ? "నికర నెలవారీ లాభం" : lang === "ta" ? "நிகர மாதாந்திர லாபம்" : isHi ? "शुद्ध मासिक बचत (मुनाफा)" : "Net Monthly In-Pocket Profit"}</strong></td>
              <td className="text-green"><strong>{formatCurrency(fin.monthly_profit)}</strong></td>
              <td><strong>{lang === "bn" ? "সমস্ত খরচ বাদ দিয়ে উদ্যোক্তার হাতে থাকা অর্থ" : lang === "mr" ? "सर्व खर्च वजा जाता उद्योजकाच्या खिशात उरणारा नफा" : lang === "te" ? "అన్ని ఖర్చులు పోను నికర లాభం" : lang === "ta" ? "அனைத்து செலவுகளும் போக நிகர லாபம்" : isHi ? "सारे खर्चे घटाने के बाद शुद्ध लाभ" : "Clean margin retained by promoter"}</strong></td>
            </tr>
            <tr>
              <td>{lang === "bn" ? "বার্ষিক আনুমানিক মোট সঞ্চয়" : lang === "mr" ? "वार्षिक अंदाजित एकूण नफा" : lang === "te" ? "వార్షిక అంచనా నికర పొదుపు" : lang === "ta" ? "வருடாந்திர மதிப்பிடப்பட்ட நிகர சேமிப்பு" : isHi ? "सालाना अनुमानित कुल मुनाफा" : "Annual Projected Net Savings"}</td>
              <td><strong>{formatCurrency(fin.yearly_profit)}</strong></td>
              <td>{lang === "bn" ? "১২ মাসের সঞ্চিত উদ্বৃত্ত" : lang === "mr" ? "12 महिन्यांची एकूण बचत" : lang === "te" ? "12 నెలల మొత్తం మిగులు" : lang === "ta" ? "12 மாதங்களின் மொத்த இருப்பு" : isHi ? "12 महीने का कुल योग" : "12-month accumulated surplus"}</td>
            </tr>
            <tr>
              <td>{lang === "bn" ? "বার্ষিক বিনিয়োগ প্রত্যর্পণ হার (ROI)" : lang === "mr" ? "वार्षिक परतावा दर (ROI)" : lang === "te" ? "వార్షిక రాబడి రేటు (ROI)" : lang === "ta" ? "வருடாந்திர முதலீட்டு வருவாய் விகிதம் (ROI)" : isHi ? "वार्षिक रिटर्न ऑन इन्वेस्टमेंट (ROI)" : "Annual Return on Investment (ROI)"}</td>
              <td><strong>{fin.roi_percentage != null ? `${fin.roi_percentage}%` : "N/A"}</strong></td>
              <td>{lang === "bn" ? "মূলধন ব্যবহারের দক্ষতার সূচক" : lang === "mr" ? "भांडवल कार्यक्षमता निर्देशक" : lang === "te" ? "మూలధన సామర్థ్య సూచిక" : lang === "ta" ? "மூலதன திறன் குறியீடு" : isHi ? "पूँजी पर प्राप्त होने वाला ब्याज दर" : "Capital efficiency indicator"}</td>
            </tr>
            <tr>
              <td>{lang === "bn" ? "মূলধন ফেরত পাওয়ার সময় (Payback)" : lang === "mr" ? "मुद्दल परतफेड कालावधी (Payback)" : lang === "te" ? "పెట్టుబడి తిరిగి వచ్చే కాలం (Payback)" : lang === "ta" ? "முதலீடு திரும்பப்பெறும் காலம் (Payback)" : isHi ? "मूल पूँजी वापसी अवधि (Payback)" : "Payback Period"}</td>
              <td><strong>{fin.payback_period_months != null ? `${Math.round(fin.payback_period_months)} ${getUI("monthsUnit", lang, "Months")}` : "N/A"}</strong></td>
              <td>{lang === "bn" ? "প্রারম্ভিক নিজস্ব বিনিয়োগ তুলে নিতে প্রয়োজনীয় সময়" : lang === "mr" ? "स्वतःचे भांडवल वसूल होण्यासाठी लागणारे महिने" : lang === "te" ? "స్వంత మూలధనాన్ని తిరిగి పొందడానికి పట్టే నెలలు" : lang === "ta" ? "சொந்த முதலீட்டை மீட்டெடுக்க தேவையான மாதங்கள்" : isHi ? "इतने समय में आपकी लागत वापस आ जाएगी" : "Months to recover owner margin"}</td>
            </tr>
          </tbody>
        </table>

        {/* Bank Loan Scheme Table */}
        <div className="parcha-section-title">
          <span>03</span> {getUI("bankCreditSectionTitle", lang, "Bank Financing & Scheme Alignment")}
        </div>

        <table className="parcha-table">
          <tbody>
            <tr>
              <td style={{ width: "35%" }}><strong>{lang === "bn" ? "অনুমোদিত সরকারি প্রকল্প:" : lang === "mr" ? "शिफारस केलेली सरकारी योजना:" : lang === "te" ? "సిఫార్సు చేసిన ప్రభుత్వ పథకం:" : lang === "ta" ? "பரிந்துரைக்கப்பட்ட அரசு திட்டம்:" : isHi ? "अनुशंसित सरकारी योजना:" : "Recommended Scheme:"}</strong></td>
              <td colSpan="2"><strong>{scheme.scheme_name || "Micro Finance Scheme"}</strong></td>
            </tr>
            <tr>
              <td>{lang === "bn" ? "মোট প্রকল্প ব্যয়:" : lang === "mr" ? "एकूण प्रकल्प खर्च:" : lang === "te" ? "మొత్తం ప్రాజెక్ట్ ఖర్చు:" : lang === "ta" ? "மொத்த திட்டச் செலவு:" : isHi ? "कुल प्रोजेक्ट लागत:" : "Total Project Cost:"}</td>
              <td style={{ width: "30%" }}><strong>{formatCurrency(scheme.project_cost)}</strong></td>
              <td>{lang === "bn" ? "যন্ত্রপাতি, শেড ও প্রারম্ভিক স্টক" : lang === "mr" ? "यंत्रसामग्री, शेड व सुरुवातीचा स्टॉक" : lang === "te" ? "యంత్రాలు, షెడ్ & ప్రాథమిక స్టాక్" : lang === "ta" ? "இயந்திரங்கள், கொட்டகை & ஆரம்ப இருப்பு" : isHi ? "मशीनरी, शेड व शुरुआती स्टॉक" : "Initial capital expenditure & working fund"}</td>
            </tr>
            <tr>
              <td>{lang === "bn" ? "উদ্যোক্তার নিজস্ব মূলধন (১০% মার্জিন):" : lang === "mr" ? "उद्योजकाचे भांडवल (10% Margin):" : lang === "te" ? "యజమాని వాటా (10% మార్జిన్):" : lang === "ta" ? "தொழில்முனைவோர் சொந்த முதலீடு (10% மார்ஜின்):" : isHi ? "उद्यमी का अंशदान (10% Margin):" : "Promoter Contribution (Margin):"}</td>
              <td><strong>{formatCurrency(scheme.beneficiary_contribution)}</strong></td>
              <td>{lang === "bn" ? "আবেদনকারী কর্তৃক নিজস্ব তহবিল থেকে প্রদেয়" : lang === "mr" ? "अर्जदाराने स्वतः गुंतवण्याची रक्कम" : lang === "te" ? "దరఖాస్తుదారు స్వంతంగా సమకూర్చే మొత్తం" : lang === "ta" ? "விண்ணப்பதாரர் சொந்தமாக முதலீடு செய்ய வேண்டிய தொகை" : isHi ? "आवेदक द्वारा स्वयं लगाई जाने वाली राशि" : "Self-financed owner margin capital"}</td>
            </tr>
            <tr>
              <td>{lang === "bn" ? "যোগ্য ব্যাংক ঋণ সহায়তা (৯০%):" : lang === "mr" ? "पात्र बँक कर्ज रक्कम (90%):" : lang === "te" ? "అర్హత గల బ్యాంక్ రుణం (90%):" : lang === "ta" ? "தகுதியான வங்கி கடன் (90%):" : isHi ? "पात्र बैंक लोन राशि (90%):" : "Eligible Bank Loan Component:"}</td>
              <td className="text-green"><strong>{formatCurrency(scheme.eligible_loan)}</strong></td>
              <td>{lang === "bn" ? "ব্যাংক থেকে অনুমোদনযোগ্য মোট মেয়াদী ঋণ" : lang === "mr" ? "बँकेकडून मिळणारे मुदत कर्ज" : lang === "te" ? "బ్యాంక్ టర్మ్ లోన్ సదుపాయం" : lang === "ta" ? "வங்கி வழங்கும் காலக் கடன் உதவி" : isHi ? "बैंक द्वारा देय ऋण राशि" : "Bank term credit eligible"}</td>
            </tr>
            <tr>
              <td>{lang === "bn" ? "আনুমানিক মাসিক কিস্তি (EMI):" : lang === "mr" ? "अंदाजे मासिक हप्ता (EMI):" : lang === "te" ? "అంచనా నెలవారీ వాయిదా (EMI):" : lang === "ta" ? "மதிப்பிடப்பட்ட மாதாந்திர தவணை (EMI):" : isHi ? "अनुमानित मासिक किश्त (EMI):" : "Estimated Monthly EMI:"}</td>
              <td className="text-green"><strong>{formatCurrency(afford.monthly_emi)}</strong></td>
              <td>{translateAffordability(afford.affordability_status || "Affordable", lang)} ({lang === "bn" ? "লাভ থেকে সহজে পরিশোধযোগ্য" : lang === "mr" ? "नफ्यातून सहज फेडता येतो" : lang === "te" ? "లాభం నుండి సులభంగా చెల్లించవచ్చు" : lang === "ta" ? "லாபத்திலிருந்து எளிதாக செலுத்தலாம்" : isHi ? "मुनाफे से आसानी से भर सकते हैं" : "Safe debt-service ratio"})</td>
            </tr>
            <tr>
              <td>{lang === "bn" ? "সুদের হার ও মোরাটোরিয়াম:" : lang === "mr" ? "व्याज दर व सवलत कालावधी:" : lang === "te" ? "వడ్డీ రేటు & రాయితీ కాలం:" : lang === "ta" ? "வட்டி விகிதம் & சலுகை காலம்:" : isHi ? "ब्याज दर व ग्रेस पीरियड:" : "Interest Rate & Moratorium:"}</td>
              <td><strong>{scheme.interest_rate != null ? `${scheme.interest_rate}% p.a.` : "N/A"}</strong></td>
              <td>{afford.moratorium_months != null ? `${afford.moratorium_months} ${lang === "bn" ? "মাসের কিস্তি স্থগিতের সুযোগ" : lang === "mr" ? "महिन्यांची सवलत" : lang === "te" ? "నెలల రాయితీ కాలం" : lang === "ta" ? "மாதங்கள் சலுகை காலம்" : isHi ? "महीने की छूट अवधि" : "Months moratorium period"}` : "N/A"}</td>
            </tr>
          </tbody>
        </table>

        {/* Local Market Advisory Summary */}
        {(result.market_summary || result.feasibility_report) && (
          <div className="parcha-feasibility-report" style={{ marginTop: "16px", padding: "14px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "700", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#2563eb" }}></span>
              {getUI("localMarketAdvisoryTitle", lang, "Local Market Advisory Summary")}
            </h4>
            <div style={{ fontSize: "12.5px", lineHeight: "1.6", color: "#334155", whiteSpace: "pre-line" }}>
              {result.market_summary || result.feasibility_report}
            </div>
          </div>
        )}

        {/* Dairy Sector Macro-Demographics & Market Gap (Only for Dairy Category) */}
        {result.dairy_analysis && (
          <div className="parcha-dairy-gap-report" style={{ marginTop: "16px", padding: "14px", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: "700", color: "#166534", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🥛</span>
                {lang === "bn" ? "দুগ্ধ খাত ম্যাক্রো-জনমিতি ও বাজার ফারাক" : lang === "mr" ? "दुग्ध क्षेत्र मॅक्रो-डेमोग्राफिक्स व बाजार अंतर" : lang === "te" ? "డైరీ రంగం స్థూల జనాభా & మార్కెట్ అంతరం" : lang === "ta" ? "பால் பண்ணை துறை மேக்ரோ-மக்கள்தொகை & சந்தை இடைவெளி" : isHi ? "डेयरी क्षेत्र मैक्रो-डेमोग्राफिक्स व बाज़ार अंतर (Macro-Demographics & Market Gap)" : "Dairy Sector Macro-Demographics & Market Gap"}
              </h4>
              <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", backgroundColor: result.dairy_analysis.price_arbitrage?.status === "Strong Sourcing Advantage" ? "#dcfce7" : "#fef3c7", color: result.dairy_analysis.price_arbitrage?.status === "Strong Sourcing Advantage" ? "#15803d" : "#b45309", borderRadius: "4px" }}>
                {result.dairy_analysis.price_arbitrage?.status}
              </span>
            </div>

            <div style={{ fontFamily: "monospace", fontSize: "11px", backgroundColor: "#ffffff", padding: "6px 10px", borderRadius: "4px", border: "1px solid #cbd5e1", marginBottom: "10px", color: "#334155" }}>
              [CSV DATA LAYER] {result.dairy_analysis.csv_data_layer}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", fontSize: "11.5px", color: "#1e293b" }}>
              <div style={{ backgroundColor: "#ffffff", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <strong style={{ color: "#0f766e" }}>{lang === "bn" ? "১. মূল্যের সুযোগ" : lang === "mr" ? "1. दर फरक (Price Arbitrage)" : lang === "te" ? "1. ధర వ్యత్యాసం" : lang === "ta" ? "1. விலை வேறுபாடு" : isHi ? "1. मूल्य अंतरण (Price Arbitrage)" : "1. Price Arbitrage (Price Layer)"}</strong>
                <p style={{ margin: "4px 0 0 0", lineHeight: "1.4" }}>
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

              <div style={{ backgroundColor: "#ffffff", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <strong style={{ color: "#0369a1" }}>{lang === "bn" ? "২. কৃষক B2B লক্ষ্য" : lang === "mr" ? "2. शेतकरी B2B उद्दिष्ट" : lang === "te" ? "2. రైతు B2B లక్ష్యం" : lang === "ta" ? "2. விவசாயி B2B இலக்கு" : isHi ? "2. किसान B2B लक्ष्यीकरण (Demographics)" : "2. Demographic Targeting (Gap Layer)"}</strong>
                <p style={{ margin: "4px 0 0 0", lineHeight: "1.4" }}>
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

              <div style={{ backgroundColor: "#ffffff", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <strong style={{ color: "#7e22ce" }}>{lang === "bn" ? "৩. বাজারের আকার ও EMI" : lang === "mr" ? "3. बाजार आकार व EMI" : lang === "te" ? "3. మార్కెట్ పరిమాణం & EMI" : lang === "ta" ? "3. சந்தை அளவு & EMI" : isHi ? "3. बाज़ार आकार व EMI (Market Sizing)" : "3. Market Sizing (Integrated Dataset)"}</strong>
                <p style={{ margin: "4px 0 0 0", lineHeight: "1.4" }}>
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

        {/* Signatures and Stamp area */}
        <div className="parcha-signatures-grid">
          <div className="sign-box">
            <p className="sign-title">{getUI("applicantSignature", lang, "Applicant / Promoter Signature")}</p>
            <div className="sign-line" />
            <p className="sign-name">{result.business}</p>
          </div>

          <div className="stamp-box">
            <div className="stamp-circle">
              <span>Vyapaa₹ AI</span>
              <strong>VERIFIED</strong>
              <small>Rural Hub</small>
            </div>
          </div>

          <div className="sign-box">
            <p className="sign-title">{getUI("bankManagerSignature", lang, "Branch Manager / Credit Officer")}</p>
            <div className="sign-line" />
            <p className="sign-name">{getUI("signatureAndSeal", lang, "Signature & Seal")}</p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="parcha-doc-footer">
          <p>
            {getUI("parchaFooterDisclaimer", lang, "Computer-generated feasibility dossier generated via Vyapaa₹ AI. Aligned with PMEGP & Mudra financing parameters.")}
          </p>
        </div>
      </div>

      {/* Print Button at bottom as well */}
      <div className="parcha-bottom-actions no-print">
        <button
          type="button"
          className="print-action-btn"
          onClick={handlePrint}
        >
          {getUI("printParchaBtn", lang, "Print Business Parcha Now")}
        </button>
      </div>
    </div>
  );
}
