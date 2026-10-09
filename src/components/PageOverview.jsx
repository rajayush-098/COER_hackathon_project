import { useState } from "react";
import { Database, CheckCircle2, AlertCircle, Loader2, Copy, Check, History } from "lucide-react";
import MinimalPieChart from "./MinimalPieChart";
import { API_ROUTES } from "../apiRoutes";
import { translations } from "../translations";
import BusinessHistoryModal from "./BusinessHistoryModal";
import {
  getUI,
  getPageBadge,
  translateVerdict,
  translateVerdictDescription,
  translateCategory,
  translateDemand,
} from "../utils/translationHelper";

export default function PageOverview({
  result,
  formatCurrency,
  lang = "hi",
  onJumpPage,
  t: propT,
  onLoadEvaluation,
}) {
  const isHi = lang === "hi";
  const t = propT || translations[lang] || translations.en;

  const [savingToDb, setSavingToDb] = useState(false);
  const [dbSaveResult, setDbSaveResult] = useState(null);
  const [dbSaveError, setDbSaveError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleSaveToDb = async () => {
    setSavingToDb(true);
    setDbSaveError("");
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
        throw new Error(data.error || "Failed to save to database");
      }

      setDbSaveResult(data);
    } catch (err) {
      console.warn("Save to DB failed:", err);
      setDbSaveError(err?.message || "Database is currently offline or unreachable.");
    } finally {
      setSavingToDb(false);
    }
  };

  const handleCopyCode = (code) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const monthlyProfit = result.financial_analysis?.monthly_profit ?? 0;
  const yearlyProfit = result.financial_analysis?.yearly_profit ?? 0;
  const roi = result.financial_analysis?.roi_percentage ?? 0;
  const payback = result.financial_analysis?.payback_period_months;
  const colorTheme = result.colorTheme || "green";

  const themeClasses = {
    green: "bg-green-50 text-green-900 border-green-200",
    blue: "bg-blue-50 text-blue-900 border-blue-200",
    yellow: "bg-yellow-50 text-yellow-900 border-yellow-200",
    orange: "bg-orange-50 text-orange-900 border-orange-200",
    red: "bg-red-50 text-red-900 border-red-200",
  }[colorTheme] || "bg-green-50 text-green-900 border-green-200";

  const rawVerdict = result.feasibilityVerdict || result.feasibility || "Feasible & Safe";
  const verdictTitle = translateVerdict(rawVerdict, lang);
  const rawDescription = result.feasibilityDescription || "Healthy profit buffer. You can comfortably cover the EMI and unexpected expenses while taking a personal income.";
  const verdictDescription = translateVerdictDescription(rawDescription, lang);

  const margin = result.scheme_analysis?.beneficiary_contribution ?? (Number(result.investment) || 0);
  const eligibleLoan = result.scheme_analysis?.eligible_loan ?? 0;
  const capitalData = [
    {
      name: getUI("promoterMarginOwn", lang, "Promoter Margin (Own)"),
      value: margin,
      color: "#16a34a",
      sublabel: getUI("selfFinancedEquity", lang, "Self-financed owner equity"),
    },
    {
      name: getUI("bankLoanComponent", lang, "Bank Loan Component"),
      value: eligibleLoan,
      color: "#2563eb",
      sublabel: getUI("bankLoanEligible", lang, "Bank loan support eligible"),
    },
  ];

  const monthlyRev = Number(
    result.monthly_revenue ??
      result.financial_analysis?.monthly_revenue ??
      (monthlyProfit + (Number(result.monthly_expenses) || 0))
  );
  const monthlyExp = Number(result.monthly_expenses ?? Math.max(0, monthlyRev - monthlyProfit));
  const incomeData = [
    {
      name: getUI("monthlyOperatingCosts", lang, "Monthly Operating Costs"),
      value: monthlyExp,
      color: "#d97706",
      sublabel: getUI("operationalCostsUpkeep", lang, "Operational costs & upkeep"),
    },
    {
      name: getUI("netTakeHomeProfit", lang, "Net Take-Home Profit"),
      value: Math.max(0, monthlyProfit),
      color: "#059669",
      sublabel: getUI("cleanPocketProfit", lang, "Clean pocket profit"),
    },
  ];

  return (
    <div className="side-page-content">
      <div className="page-header-banner">
        <div className="page-header-text">
          <span className="page-badge-pill">
            {getPageBadge("overview", lang)}
          </span>
          <h2>
            {result.business} {lang === "hi" ? "का परिणाम" : lang === "bn" ? "- সম্ভাব্যতা সারসংক্ষেপ" : lang === "mr" ? "- व्यवहार्यता निष्कर्ष" : lang === "te" ? "- సాధ్యత సారాంశం" : lang === "ta" ? "- சாத்தியக்கூறு சுருக்கம்" : "- Feasibility Summary"}
          </h2>
          <p className="page-sub-desc">
            {result.location}, {result.block}, {result.district}, {result.state}
          </p>

          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="compact-history-trigger-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "20px",
                backgroundColor: "#f0fdf4",
                border: "1.5px solid #0f766e",
                color: "#065f46",
                fontSize: "12.5px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#dcfce7";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f0fdf4";
              }}
            >
              <History size={14} color="#0f766e" />
              <span>{t.businessHistoryBtn || getUI("businessHistory", lang, "Business History")}</span>
            </button>
          </div>
        </div>

        <div
          className={`border rounded-xl p-4 sm:p-5 ${themeClasses}`}
          style={{ maxWidth: "420px" }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <strong style={{ fontSize: "15px", fontWeight: "700" }}>
                {verdictTitle}
              </strong>
              {" "}
              {result.dscr != null && result.dscr !== 999 && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    border: "1px solid currentColor",
                    opacity: 0.9,
                  }}
                >
                  DSCR: {result.dscr.toFixed(2)}x
                </span>
              )}
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "12.5px", lineHeight: "1.4", opacity: 0.95 }}>
              {verdictDescription}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Big KPI Cards for Low-English users */}
      <div className="kpi-hero-grid">
        <div className="kpi-hero-card kpi-green">
          <div className="kpi-top">
            <span className="kpi-tag">
              {getUI("inPocketMonthly", lang, "In-Pocket Monthly")}
            </span>
          </div>
          <p className="kpi-label">
            {getUI("netMonthlyProfit", lang, "Net Monthly Profit")}
          </p>
          <h3 className="kpi-value">{formatCurrency(monthlyProfit)}</h3>
          <p className="kpi-hint">
            {getUI("inPocketDesc", lang, "Money left in your pocket after all expenses")}
          </p>
        </div>

        <div className="kpi-hero-card kpi-blue">
          <div className="kpi-top">
            <span className="kpi-tag">{getUI("annualTag", lang, "Annual")}</span>
          </div>
          <p className="kpi-label">
            {getUI("yearlyTotalProfit", lang, "Yearly Total Profit")}
          </p>
          <h3 className="kpi-value">{formatCurrency(yearlyProfit)}</h3>
          <p className="kpi-hint">
            {getUI("yearlyTotalDesc", lang, "Estimated total savings after 1 full year")}
          </p>
        </div>

        <div className="kpi-hero-card kpi-purple">
          <div className="kpi-top">
            <span className="kpi-tag">{getUI("returnRateTag", lang, "Return Rate")}</span>
          </div>
          <p className="kpi-label">
            {getUI("annualReturnRoi", lang, "Annual Return on Money (ROI)")}
          </p>
          <h3 className="kpi-value">{roi != null ? `${roi}%` : "N/A"}</h3>
          <p className="kpi-hint">
            {getUI("returnRateDesc", lang, "Profit generated per ₹100 of money invested")}
          </p>
        </div>

        <div className="kpi-hero-card kpi-amber">
          <div className="kpi-top">
            <span className="kpi-tag">{getUI("recoveryTag", lang, "Recovery")}</span>
          </div>
          <p className="kpi-label">
            {getUI("paybackTimePeriod", lang, "Payback Time Period")}
          </p>
          <h3 className="kpi-value">
            {payback != null ? `${Math.round(payback)} ${getUI("monthsUnit", lang, "Months")}` : "N/A"}
          </h3>
          <p className="kpi-hint">
            {getUI("recoveryTimeDesc", lang, "Months needed to recover your initial margin capital")}
          </p>
        </div>
      </div>

      {/* Visual Pie Charts: Capital Financing Split & Monthly Cashflow */}
      <div className="two-column-grid" style={{ marginBottom: "24px" }}>
        <div className="detail-card">
          <MinimalPieChart
            title={getUI("capitalFinancingBreakdown", lang, "Capital Financing Breakdown")}
            subtitle={getUI("ownerMarginVsBankLoan", lang, "Owner Margin Money vs Bank Term Loan")}
            data={capitalData}
            formatCurrency={formatCurrency}
            height={200}
            centerText={{
              primary: getUI("totalCostCenter", lang, "Total Cost"),
              secondary: formatCurrency(margin + eligibleLoan),
            }}
          />
        </div>

        <div className="detail-card">
          <MinimalPieChart
            title={getUI("monthlyCashflowSplit", lang, "Monthly Cashflow Split")}
            subtitle={getUI("operatingCostsVsMargin", lang, "Operating Costs vs Real Take-Home Margin")}
            data={incomeData}
            formatCurrency={formatCurrency}
            height={200}
            centerText={{
              primary: getUI("monthlyRevenueCenter", lang, "Monthly Revenue"),
              secondary: formatCurrency(monthlyRev),
            }}
          />
        </div>
      </div>

      {/* Aasan Bhasha Mein Samjhein (Easy Plain English / Regional Explanation Box) */}
      <div className="plain-speak-card">
        <div className="plain-speak-header">
          <span className="plain-speak-badge">{getUI("simpleExplanation", lang, "Simple Explanation in Plain Words")}</span>
        </div>
        <div className="plain-speak-body">
          <p className="plain-speak-lead">
            {lang === "bn" ? (
              <>
                যদি আপনি এই ব্যবসায় <strong>{formatCurrency(result.scheme_analysis?.beneficiary_contribution || margin)}</strong> নিজের পকেট থেকে বিনিয়োগ করেন,
                তবে সকল খরচ বাদ দিয়ে প্রতি মাসে আনুমানিক <strong>{formatCurrency(monthlyProfit)}</strong> নিট লাভ আপনার হাতে থাকবে।
                ১ পুরো বছরে আপনার মোট সঞ্চয় দাঁড়াবে প্রায় <strong>{formatCurrency(yearlyProfit)}</strong>।
              </>
            ) : lang === "mr" ? (
              <>
                जर आपण या व्यवसायात <strong>{formatCurrency(result.scheme_analysis?.beneficiary_contribution || margin)}</strong> स्वतःच्या खिशातून गुंतवले,
                तर सर्व खर्च वजा जाता दरमहा सुमारे <strong>{formatCurrency(monthlyProfit)}</strong> निव्वळ नफा खिशात उरेल.
                एका पूर्ण वर्षात आपली एकूण बचत सुमारे <strong>{formatCurrency(yearlyProfit)}</strong> होईल.
              </>
            ) : lang === "te" ? (
              <>
                మీరు ఈ వ్యాపారంలో మీ స్వంత డబ్బు <strong>{formatCurrency(result.scheme_analysis?.beneficiary_contribution || margin)}</strong> పెట్టుబడి పెడితే,
                అన్ని ఖర్చులు పోను ప్రతి నెలా సుమారు <strong>{formatCurrency(monthlyProfit)}</strong> మీ జేబులో మిగులుతుంది.
                పూర్తి 1 సంవత్సరంలో మీ మొత్తం పొదుపు సుమారు <strong>{formatCurrency(yearlyProfit)}</strong> చేరుకుంటుంది.
              </>
            ) : lang === "ta" ? (
              <>
                நீங்கள் இந்தத் தொழிலில் உங்கள் சொந்தப் பணம் <strong>{formatCurrency(result.scheme_analysis?.beneficiary_contribution || margin)}</strong> முதலீடு செய்தால்,
                அனைத்து செலவுகளும் போக ஒவ்வொரு மாதமும் சுமார் <strong>{formatCurrency(monthlyProfit)}</strong> உங்கள் கையில் மிஞ்சும்.
                1 முழு ஆண்டில் உங்கள் மொத்த சேமிப்பு தோராயமாக <strong>{formatCurrency(yearlyProfit)}</strong> ஆக உயரும்.
              </>
            ) : lang === "hi" ? (
              <>
                यदि आप इस व्यापार में <strong>{formatCurrency(result.scheme_analysis?.beneficiary_contribution || margin)}</strong> अपनी जेब से लगाते हैं,
                तो हर महीने लगभग <strong>{formatCurrency(monthlyProfit)}</strong> की शुद्ध बचत हो सकती है।
                साल भर में यह बचत लगभग <strong>{formatCurrency(yearlyProfit)}</strong> होगी।
              </>
            ) : (
              <>
                If you put in <strong>{formatCurrency(result.scheme_analysis?.beneficiary_contribution || margin)}</strong> of your own money,
                you can expect to keep about <strong>{formatCurrency(monthlyProfit)}</strong> in your pocket every month after all expenses.
                In 1 full year, your total savings will reach approximately <strong>{formatCurrency(yearlyProfit)}</strong>.
              </>
            )}
          </p>
          <div className="plain-speak-bullets">
            <div className="bullet-point">
              <div>
                <strong>{getUI("govtLoanEligibility", lang, "Government Loan Eligibility:")}</strong>{" "}
                <span>
                  {result.scheme_analysis?.status === "Not Eligible"
                    ? (lang === "bn"
                        ? " প্রকল্প ব্যয় ₹৫০ লাখের বেশি হওয়ায় সাধারণ প্রকল্পের অধীনে ঋণ প্রযোজ্য নয়। অন্যান্য অর্থায়ন বিকল্প দেখুন।"
                        : lang === "mr"
                        ? " प्रकल्प खर्च ₹50 लाखांपेक्षा जास्त असल्याने मानक योजनेअंतर्गत कर्ज उपलब्ध नाही. इतर पर्याय तपासा."
                        : lang === "te"
                        ? " ప్రాజెక్ట్ ఖర్చు ₹50 లక్షలు దాటడం వల్ల ప్రామాణిక పథకం కింద రుణం వర్తించదు. ఇతర ఎంపికలను చూడండి."
                        : lang === "ta"
                        ? " திட்டச் செலவு ₹50 லட்சத்தை விட அதிகமாக இருப்பதால் நிலையான திட்டத்தின் கீழ் கடன் கிடைக்காது. மாற்று வழிகளை ஆராயுங்கள்."
                        : isHi
                        ? " प्रोजेक्ट लागत ₹50 लाख से अधिक होने के कारण मानक योजना के तहत ऋण उपलब्ध नहीं है। अन्य विकल्पों की जाँच करें।"
                        : " Project cost exceeds ₹50 Lakh scheme limit. Check other financing options.")
                    : (lang === "bn"
                        ? ` আপনি ${result.scheme_analysis?.scheme_name || "সরকারি প্রকল্পের"} আওতায় প্রায় ${formatCurrency(result.scheme_analysis?.eligible_loan)} পর্যন্ত ব্যাংক ঋণ পেতে পারেন।`
                        : lang === "mr"
                        ? ` आपण ${result.scheme_analysis?.scheme_name || "सरकारी योजने"}अंतर्गत सुमारे ${formatCurrency(result.scheme_analysis?.eligible_loan)} पर्यंत बँक कर्ज मिळवू शकता.`
                        : lang === "te"
                        ? ` మీరు ${result.scheme_analysis?.scheme_name || "ప్రభుత్వ పథకం"} కింద సుమారు ${formatCurrency(result.scheme_analysis?.eligible_loan)} వరకు బ్యాంక్ రుణం పొందవచ్చు.`
                        : lang === "ta"
                        ? ` நீங்கள் ${result.scheme_analysis?.scheme_name || "அரசு திட்டத்தின்"} கீழ் சுமார் ${formatCurrency(result.scheme_analysis?.eligible_loan)} வரை வங்கி கடன் பெறத் தகுதியுடையவர்.`
                        : isHi
                        ? ` आप ${result.scheme_analysis?.scheme_name || "सरकारी योजना"} के तहत लगभग ${formatCurrency(result.scheme_analysis?.eligible_loan)} तक का बैंक लोन ले सकते हैं।`
                        : ` You are eligible for up to ${formatCurrency(result.scheme_analysis?.eligible_loan)} under the ${result.scheme_analysis?.scheme_name || "Govt Loan Scheme"}.`)}
                </span>
              </div>
            </div>
            {result.scheme_analysis?.status !== "Not Eligible" && (
              <div className="bullet-point">
                <div>
                  <strong>{getUI("monthlyLoanEmi", lang, "Monthly Loan EMI:")}</strong>{" "}
                  <span>
                    {lang === "bn"
                      ? ` ব্যাংকের মাসিক কিস্তি আনুমানিক ${formatCurrency(result.loan_affordability?.monthly_emi)}, যা আপনার লাভ থেকে সহজে পরিশোধ করা যাবে।`
                      : lang === "mr"
                      ? ` बँकेचा अंदाजे मासिक हप्ता ${formatCurrency(result.loan_affordability?.monthly_emi)} असेल, जो आपल्या नफ्यातून सहज फेडता येईल.`
                      : lang === "te"
                      ? ` బ్యాంక్ నెలవారీ వాయిదా సుమారు ${formatCurrency(result.loan_affordability?.monthly_emi)} ఉంటుంది, ఇది మీ లాభం నుండి సులభంగా చెల్లించవచ్చు.`
                      : lang === "ta"
                      ? ` வங்கியின் மாதாந்திர தவணை சுமார் ${formatCurrency(result.loan_affordability?.monthly_emi)} ஆகும், இது உங்கள் லாபத்திலிருந்து எளிதாக செலுத்தக்கூடியது.`
                      : isHi
                      ? ` बैंक की महीने की किश्त लगभग ${formatCurrency(result.loan_affordability?.monthly_emi)} होगी, जिसे आपके मुनाफे से आसानी से भरा जा सकता है।`
                      : ` The monthly loan EMI is estimated at ${formatCurrency(result.loan_affordability?.monthly_emi)}, which is comfortably covered by your profit.`}
                  </span>
                </div>
              </div>
            )}
            <div className="bullet-point">
              <div>
                <strong>{getUI("localVillageDemand", lang, "Local Village Demand:")}</strong>{" "}
                <span>
                  {lang === "bn"
                    ? ` আপনার এলাকায় এই ব্যবসার চাহিদা '${translateDemand(result.hyper_local_profile?.local_demand || "Good", lang)}' স্তরে রয়েছে।`
                    : lang === "mr"
                    ? ` आपल्या परिसरात या व्यवसायाची मागणी '${translateDemand(result.hyper_local_profile?.local_demand || "Good", lang)}' पातळीवर आहे.`
                    : lang === "te"
                    ? ` మీ ప్రాంతంలో ఈ వ్యాపారానికి '${translateDemand(result.hyper_local_profile?.local_demand || "Good", lang)}' డిమాండ్ ఉంది.`
                    : lang === "ta"
                    ? ` உங்கள் பகுதியில் இந்தத் தொழிலுக்கான தேவை '${translateDemand(result.hyper_local_profile?.local_demand || "Good", lang)}' நிலையில் உள்ளது.`
                    : isHi
                    ? ` आपके इलाके में इस व्यापार की माँग '${translateDemand(result.hyper_local_profile?.local_demand || "Good", lang)}' स्तर पर है।`
                    : ` Local demand in your village/area is '${result.hyper_local_profile?.local_demand || "Good"}'.`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aiven MySQL Database Persistence Card */}
      <div className="detail-card" style={{ marginBottom: "24px", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "18px 20px", background: "#ffffff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#e0f2fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0369a1"
            }}>
              <Database size={22} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                {getUI("saveRecordToDb", lang, "Save Record to Aiven MySQL 8.4")}
              </h4>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748b" }}>
                {getUI("saveRecordSub", lang, "Persist applicant profile, financial metrics, and scheme evaluation.")}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#f8fafc",
                color: "#334155",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "9px 15px",
                fontWeight: "600",
                fontSize: "13.5px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f1f5f9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f8fafc";
              }}
            >
              <History size={15} color="#0f766e" />
              <span>{t.businessHistoryBtn || getUI("businessHistory", lang, "Business History")}</span>
            </button>
            {" "}
            <button
              type="button"
              onClick={handleSaveToDb}
              disabled={savingToDb}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: dbSaveResult ? "#059669" : "#0f766e",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "9px 18px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: savingToDb ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {savingToDb ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{getUI("savingBtn", lang, "Saving...")}</span>
                </>
              ) : dbSaveResult ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>{getUI("savedBtn", lang, "Saved to MySQL")}</span>
                </>
              ) : (
                <>
                  <Database size={16} />
                  <span>{getUI("saveEvaluationBtn", lang, "Save Evaluation")}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {dbSaveResult && (
          <div style={{
            marginTop: "14px",
            padding: "12px 14px",
            borderRadius: "8px",
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#065f46", fontSize: "13.5px" }}>
              <CheckCircle2 size={18} color="#059669" />
              <span>
                <strong>{getUI("successfullySaved", lang, "Successfully Saved!")}</strong>{" "}
                {getUI("businessIdLabel", lang, "Business ID:")} #{dbSaveResult.businessId} • {getUI("reportCodeLabel", lang, "Report Code:")}{" "}
                <code style={{ background: "#d1fae5", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                  {dbSaveResult.reportCode}
                </code>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={() => handleCopyCode(dbSaveResult.reportCode)}
                style={{
                  background: "transparent",
                  border: "1px solid #10b981",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#047857",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedCode ? getUI("copiedBtn", lang, "Copied") : getUI("copyCodeBtn", lang, "Copy Code")}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                style={{
                  background: "#065f46",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <History size={13} />
                <span>{getUI("viewInHistoryBtn", lang, "View in History")}</span>
              </button>
            </div>
          </div>
        )}

        {dbSaveError && (
          <div style={{
            marginTop: "14px",
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
            <span>{dbSaveError}</span>
          </div>
        )}
      </div>

      {/* Quick Jump Action Cards */}
      <div className="quick-nav-section">
        <h4>{getUI("explorePagesTitle", lang, "Explore Detailed Pages:")}</h4>
        <div className="quick-jump-grid">
          <button
            type="button"
            className="quick-jump-btn"
            onClick={() => onJumpPage("profit")}
          >
            <div className="jump-text">
              <strong>{lang === "hi" ? "कमाई और खर्चा देखें" : lang === "bn" ? "আয় ও ব্যয়ের হিসাব" : lang === "mr" ? "नफा व खर्च पहा" : lang === "te" ? "ఆదాయం & ఖర్చులు" : lang === "ta" ? "வருமானம் & செலவு" : "Profit & Money Math"}</strong>
              <span>{lang === "hi" ? "बिक्री, खर्च और ब्रेक-ईवन" : lang === "bn" ? "বিক্রয়, খরচ ও ব্রেক-ইভেন" : lang === "mr" ? "विक्री, खर्च व नफा बिंदू" : lang === "te" ? "అమ్మకాలు & బ్రేక్-ఈవెన్" : lang === "ta" ? "விற்பனை & சமநிலை" : "Sales, costs & break-even"}</span>
            </div>
            <span className="jump-arrow">→</span>
          </button>

          <button
            type="button"
            className="quick-jump-btn"
            onClick={() => onJumpPage("loan")}
          >
            <div className="jump-text">
              <strong>{lang === "hi" ? "सरकारी लोन व सब्सिडी" : lang === "bn" ? "সরকারি ঋণ ও ভর্তুকি" : lang === "mr" ? "सरकारी कर्ज व सबसिडी" : lang === "te" ? "ప్రభుత్వ రుణం & రాయితీ" : lang === "ta" ? "அரசு கடன் & மானியம்" : "Govt Loan & Schemes"}</strong>
              <span>{lang === "hi" ? "बैंक लोन और आवेदन तरीका" : lang === "bn" ? "ব্যাংক ঋণ ও আবেদনের নিয়ম" : lang === "mr" ? "बँक कर्ज व अर्ज पद्धत" : lang === "te" ? "బ్యాంక్ రుణం & దరఖాస్తు" : lang === "ta" ? "வங்கி கடன் & விண்ணப்பம்" : "Check subsidy & apply steps"}</span>
            </div>
            <span className="jump-arrow">→</span>
          </button>

          <button
            type="button"
            className="quick-jump-btn"
            onClick={() => onJumpPage("emi")}
          >
            <div className="jump-text">
              <strong>{lang === "hi" ? "महीने की किश्त (EMI)" : lang === "bn" ? "মাসিক কিস্তি (EMI)" : lang === "mr" ? "मासिक हप्ता (EMI)" : lang === "te" ? "నెలవారీ వాయిదా (EMI)" : lang === "ta" ? "மாதாந்திர தவணை (EMI)" : "EMI & Repayment"}</strong>
              <span>{lang === "hi" ? "किश्त भरने की क्षमता" : lang === "bn" ? "কিস্তি পরিশোধের সামর্থ্য" : lang === "mr" ? "हप्ता फेडण्याची क्षमता" : lang === "te" ? "వాయిదా చెల్లింపు సామర్థ్యం" : lang === "ta" ? "தவணை செலுத்தும் திறன்" : "Schedule & affordability"}</span>
            </div>
            <span className="jump-arrow">→</span>
          </button>

          <button
            type="button"
            className="quick-jump-btn"
            onClick={() => onJumpPage("market")}
          >
            <div className="jump-text">
              <strong>{lang === "hi" ? "गाँव का बाज़ार व ग्राहक" : lang === "bn" ? "স্থানীয় বাজার ও ক্রেতা" : lang === "mr" ? "स्थानिक बाजार व ग्राहक" : lang === "te" ? "స్థానిక మార్కెట్ & వినియోగదారులు" : lang === "ta" ? "உள்ளூர் சந்தை & வாடிக்கையாளர்கள்" : "Local Market & Area"}</strong>
              <span>{lang === "hi" ? "ग्राहक दूरी और कम्पटीशन" : lang === "bn" ? "ক্রেতা পরিসর ও প্রতিযোগিতা" : lang === "mr" ? "ग्राहक पोहोच व स्पर्धा" : lang === "te" ? "వినియోగదారుల పరిధి & పోటీ" : lang === "ta" ? "வாடிக்கையாளர் எல்லை & போட்டி" : "Customer radius & channels"}</span>
            </div>
            <span className="jump-arrow">→</span>
          </button>
        </div>
      </div>

      {/* Compact Business History Modal */}
      <BusinessHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        currentBusiness={result}
        lang={lang}
        t={t}
        formatCurrency={formatCurrency}
        onLoadEvaluation={onLoadEvaluation}
      />
    </div>
  );
}

