import { useState } from "react";
import { Database, CheckCircle2, AlertCircle, Loader2, Copy, Check } from "lucide-react";
import MinimalPieChart from "./MinimalPieChart";
import { API_ROUTES } from "../apiRoutes";

export default function PageOverview({ result, formatCurrency, lang, onJumpPage }) {
  const isHi = lang === "hi";

  const [savingToDb, setSavingToDb] = useState(false);
  const [dbSaveResult, setDbSaveResult] = useState(null);
  const [dbSaveError, setDbSaveError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

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

  const verdictTitle = result.feasibilityVerdict || result.feasibility || "Feasible & Safe";
  const verdictDescription = result.feasibilityDescription || (
    isHi
      ? "व्यापार के वित्तीय आँकड़े और किश्त चुकाने की क्षमता का विश्लेषण।"
      : "Financial metrics and loan debt service feasibility assessment."
  );

  const margin = result.scheme_analysis?.beneficiary_contribution ?? (Number(result.investment) || 0);
  const eligibleLoan = result.scheme_analysis?.eligible_loan ?? 0;
  const capitalData = [
    {
      name: isHi ? "उद्यमी अंशदान (मार्जिन)" : "Promoter Margin (Own)",
      value: margin,
      color: "#16a34a",
      sublabel: isHi ? "आपकी जेब से लगाई जाने वाली राशि" : "Self-financed owner equity",
    },
    {
      name: isHi ? "बैंक लोन सहायता (ऋण)" : "Bank Loan Component",
      value: eligibleLoan,
      color: "#2563eb",
      sublabel: isHi ? "सरकारी योजना के तहत बैंक ऋण" : "Bank loan support eligible",
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
      name: isHi ? "मासिक कुल खर्च (Costs)" : "Monthly Operating Costs",
      value: monthlyExp,
      color: "#d97706",
      sublabel: isHi ? "कच्चा माल, मजदूरी व बिल" : "Operational costs & upkeep",
    },
    {
      name: isHi ? "शुद्ध मासिक बचत (Profit)" : "Net Take-Home Profit",
      value: Math.max(0, monthlyProfit),
      color: "#059669",
      sublabel: isHi ? "आपकी जेब में शुद्ध बचत" : "Clean pocket profit",
    },
  ];

  return (
    <div className="side-page-content">
      <div className="page-header-banner">
        <div className="page-header-text">
          <span className="page-badge-pill">
            {isHi ? "पेज 01 • मुख्य सारांश व फैसला" : "Page 01 • Overview & Final Verdict"}
          </span>
          <h2>
            {isHi
              ? `${result.business} का परिणाम`
              : `${result.business} - Feasibility Summary`}
          </h2>
          <p className="page-sub-desc">
            {result.location}, {result.block}, {result.district}, {result.state}
          </p>
        </div>

        <div
          className={`border rounded-xl p-4 sm:p-5 ${themeClasses}`}
          style={{ maxWidth: "420px" }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <strong style={{ fontSize: "15px", fontWeight: "700" }}>
                {verdictTitle}
              </strong>
              {result.dscr != null && result.dscr !== 999 && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 7px",
                    borderRadius: "10px",
                    border: "1px solid currentColor",
                    opacity: 0.9,
                  }}
                >
                  DSCR: {result.dscr.toFixed(2)}x
                </span>
              )}
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "12.5px", lineHeight: "1.4", opacity: 0.95 }}>
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
              {isHi ? "जेब में बचत" : "In-Pocket Monthly"}
            </span>
          </div>
          <p className="kpi-label">
            {isHi ? "हर महीने शुद्ध मुनाफा" : "Net Monthly Profit"}
          </p>
          <h3 className="kpi-value">{formatCurrency(monthlyProfit)}</h3>
          <p className="kpi-hint">
            {isHi
              ? "सारे खर्चे निकालने के बाद आपका पैसा"
              : "Money left in your pocket after all expenses"}
          </p>
        </div>

        <div className="kpi-hero-card kpi-blue">
          <div className="kpi-top">
            <span className="kpi-tag">{isHi ? "1 साल में" : "Annual"}</span>
          </div>
          <p className="kpi-label">
            {isHi ? "1 साल की कुल बचत" : "Yearly Total Profit"}
          </p>
          <h3 className="kpi-value">{formatCurrency(yearlyProfit)}</h3>
          <p className="kpi-hint">
            {isHi
              ? "12 महीने का कुल अनुमानित फायदा"
              : "Estimated total savings after 1 full year"}
          </p>
        </div>

        <div className="kpi-hero-card kpi-purple">
          <div className="kpi-top">
            <span className="kpi-tag">{isHi ? "मुनाफे की दर" : "Return Rate"}</span>
          </div>
          <p className="kpi-label">
            {isHi ? "वार्षिक रिटर्न (ROI)" : "Annual Return on Money (ROI)"}
          </p>
          <h3 className="kpi-value">{roi != null ? `${roi}%` : "N/A"}</h3>
          <p className="kpi-hint">
            {isHi
              ? "हर ₹100 लगाने पर सालाना कितना पैसा बनेगा"
              : "Profit generated per ₹100 of money invested"}
          </p>
        </div>

        <div className="kpi-hero-card kpi-amber">
          <div className="kpi-top">
            <span className="kpi-tag">{isHi ? "लागत वापसी" : "Recovery"}</span>
          </div>
          <p className="kpi-label">
            {isHi ? "मूल धन वापसी समय" : "Payback Time Period"}
          </p>
          <h3 className="kpi-value">
            {payback != null ? `${Math.round(payback)} ${isHi ? "महीने" : "Months"}` : "N/A"}
          </h3>
          <p className="kpi-hint">
            {isHi
              ? "जितने महीने में आपकी लगाई पूँजी वापस आ जाएगी"
              : "Months needed to recover your initial margin capital"}
          </p>
        </div>
      </div>

      {/* Visual Pie Charts: Capital Financing Split & Monthly Cashflow */}
      <div className="two-column-grid" style={{ marginBottom: "24px" }}>
        <div className="detail-card">
          <MinimalPieChart
            title={isHi ? "पूँजी संरचना पाई चार्ट" : "Capital Financing Breakdown"}
            subtitle={isHi ? "उद्यमी अंशदान और बैंक ऋण सहायता" : "Owner Margin Money vs Bank Term Loan"}
            data={capitalData}
            formatCurrency={formatCurrency}
            height={200}
            centerText={{
              primary: isHi ? "कुल लागत" : "Total Cost",
              secondary: formatCurrency(margin + eligibleLoan),
            }}
          />
        </div>

        <div className="detail-card">
          <MinimalPieChart
            title={isHi ? "मासिक आमदनी पाई चार्ट" : "Monthly Cashflow Split"}
            subtitle={isHi ? "कुल बिक्री में से खर्च और शुद्ध बचत" : "Operating Costs vs Real Take-Home Margin"}
            data={incomeData}
            formatCurrency={formatCurrency}
            height={200}
            centerText={{
              primary: isHi ? "मासिक बिक्री" : "Monthly Revenue",
              secondary: formatCurrency(monthlyRev),
            }}
          />
        </div>
      </div>

      {/* Aasan Bhasha Mein Samjhein (Easy Plain English / Hindi Explanation Box) */}
      <div className="plain-speak-card">
        <div className="plain-speak-header">
          <span className="plain-speak-badge">{isHi ? "सरल भाषा में समझें" : "Simple Explanation in Plain Words"}</span>
        </div>
        <div className="plain-speak-body">
          <p className="plain-speak-lead">
            {isHi ? (
              <>
                यदि आप इस व्यापार में <strong>{formatCurrency(result.scheme_analysis?.beneficiary_contribution)}</strong> अपनी जेब से लगाते हैं,
                तो हर महीने लगभग <strong>{formatCurrency(monthlyProfit)}</strong> की शुद्ध बचत हो सकती है।
                साल भर में यह बचत लगभग <strong>{formatCurrency(yearlyProfit)}</strong> होगी।
              </>
            ) : (
              <>
                If you put in <strong>{formatCurrency(result.scheme_analysis?.beneficiary_contribution)}</strong> of your own money,
                you can expect to keep about <strong>{formatCurrency(monthlyProfit)}</strong> in your pocket every month after all expenses.
                In 1 full year, your total savings will reach approximately <strong>{formatCurrency(yearlyProfit)}</strong>.
              </>
            )}
          </p>
          <div className="plain-speak-bullets">
            <div className="bullet-point">
              <div>
                <strong>{isHi ? "सरकारी लोन सुविधा:" : "Government Loan Eligibility:"}</strong>
                <span>
                  {result.scheme_analysis?.status === "Not Eligible"
                    ? isHi
                      ? " प्रोजेक्ट लागत ₹50 लाख से अधिक होने के कारण मानक योजना के तहत ऋण उपलब्ध नहीं है। अन्य विकल्पों की जाँच करें।"
                      : " Project cost exceeds ₹50 Lakh scheme limit. Check other financing options."
                    : isHi
                    ? ` आप ${result.scheme_analysis?.scheme_name || "सरकारी योजना"} के तहत लगभग ${formatCurrency(result.scheme_analysis?.eligible_loan)} तक का बैंक लोन ले सकते हैं।`
                    : ` You are eligible for up to ${formatCurrency(result.scheme_analysis?.eligible_loan)} under the ${result.scheme_analysis?.scheme_name || "Govt Loan Scheme"}.`}
                </span>
              </div>
            </div>
            {result.scheme_analysis?.status !== "Not Eligible" && (
              <div className="bullet-point">
                <div>
                  <strong>{isHi ? "महीने की किश्त (EMI):" : "Monthly Loan EMI:"}</strong>
                  <span>
                    {isHi
                      ? ` बैंक की महीने की किश्त लगभग ${formatCurrency(result.loan_affordability?.monthly_emi)} होगी, जिसे आपके मुनाफे से आसानी से भरा जा सकता है।`
                      : ` The monthly loan EMI is estimated at ${formatCurrency(result.loan_affordability?.monthly_emi)}, which is comfortably covered by your profit.`}
                  </span>
                </div>
              </div>
            )}
            <div className="bullet-point">
              <div>
                <strong>{isHi ? "स्थानीय माँग:" : "Local Village Demand:"}</strong>
                <span>
                  {isHi
                    ? ` आपके इलाके में इस व्यापार की माँग '${result.hyper_local_profile?.local_demand || "अच्छी"}' स्तर पर है।`
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
                {isHi ? "Aiven MySQL क्लाउड डेटाबेस में सुरक्षित करें" : "Save Record to Aiven MySQL 8.4"}
              </h4>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748b" }}>
                {isHi
                  ? "इस व्यापार का पूरा मूल्यांकन व प्रोजेक्ट पर्चा हमेशा के लिए सहेजें।"
                  : "Persist applicant profile, financial metrics, and scheme evaluation."}
              </p>
            </div>
          </div>

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
                <span>{isHi ? "सहेजा जा रहा है..." : "Saving..."}</span>
              </>
            ) : dbSaveResult ? (
              <>
                <CheckCircle2 size={16} />
                <span>{isHi ? "सहेजा जा चुका है" : "Saved to MySQL"}</span>
              </>
            ) : (
              <>
                <Database size={16} />
                <span>{isHi ? "डेटाबेस में सहेजें (Save to DB)" : "Save Evaluation"}</span>
              </>
            )}
          </button>
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
                <strong>{isHi ? "सफलतापूर्वक सुरक्षित!" : "Successfully Saved!"}</strong>{" "}
                {isHi ? `रिकॉर्ड आईडी: #${dbSaveResult.businessId} • रिपोर्ट कोड:` : `Business ID: #${dbSaveResult.businessId} • Report Code:`}{" "}
                <code style={{ background: "#d1fae5", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                  {dbSaveResult.reportCode}
                </code>
              </span>
            </div>
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
              <span>{copiedCode ? (isHi ? "कॉपी हो गया" : "Copied") : (isHi ? "कोड कॉपी करें" : "Copy Code")}</span>
            </button>
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
        <h4>{isHi ? "आगे की जानकारी के लिए पेज चुनें:" : "Explore Detailed Pages:"}</h4>
        <div className="quick-jump-grid">
          <button
            type="button"
            className="quick-jump-btn"
            onClick={() => onJumpPage("profit")}
          >
            <div className="jump-text">
              <strong>{isHi ? "कमाई और खर्चा देखें" : "Profit & Money Math"}</strong>
              <span>{isHi ? "बिक्री, खर्च और ब्रेक-ईवन" : "Sales, costs & break-even"}</span>
            </div>
            <span className="jump-arrow">→</span>
          </button>

          <button
            type="button"
            className="quick-jump-btn"
            onClick={() => onJumpPage("loan")}
          >
            <div className="jump-text">
              <strong>{isHi ? "सरकारी लोन व सब्सिडी" : "Govt Loan & Schemes"}</strong>
              <span>{isHi ? "बैंक लोन और आवेदन तरीका" : "Check subsidy & apply steps"}</span>
            </div>
            <span className="jump-arrow">→</span>
          </button>

          <button
            type="button"
            className="quick-jump-btn"
            onClick={() => onJumpPage("emi")}
          >
            <div className="jump-text">
              <strong>{isHi ? "महीने की किश्त (EMI)" : "EMI & Repayment"}</strong>
              <span>{isHi ? "किश्त भरने की क्षमता" : "Schedule & affordability"}</span>
            </div>
            <span className="jump-arrow">→</span>
          </button>

          <button
            type="button"
            className="quick-jump-btn"
            onClick={() => onJumpPage("market")}
          >
            <div className="jump-text">
              <strong>{isHi ? "गाँव का बाज़ार व ग्राहक" : "Local Market & Area"}</strong>
              <span>{isHi ? "ग्राहक दूरी और कम्पटीशन" : "Customer radius & channels"}</span>
            </div>
            <span className="jump-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
