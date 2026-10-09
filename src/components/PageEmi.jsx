import {
  getUI,
  getPageBadge,
} from "../utils/translationHelper";

export default function PageEmi({ result, formatCurrency, lang = "hi" }) {
  const isHi = lang === "hi";

  const schemeAnalysis = result.scheme_analysis ?? {};
  const loanAfford = result.loan_affordability ?? {};

  // Consume interest rate, tenure, moratorium, eligible loan, and EMI directly from central router
  const schemeInterestRate = schemeAnalysis.interest_rate ?? loanAfford.interest_rate ?? null;
  const tenureMonths = schemeAnalysis.loan_tenure_months ?? loanAfford.loan_tenure_months ?? null;
  const moratorium = schemeAnalysis.moratorium_months ?? loanAfford.moratorium_months ?? null;
  const eligibleLoan = schemeAnalysis.eligible_loan ?? 0;
  const monthlyEmi = loanAfford.monthly_emi ?? 0;
  const totalInterest = loanAfford.total_interest ?? 0;
  const isNotEligible = schemeAnalysis.status === "Not Eligible";

  const emiRatio =
    loanAfford.emi_to_income_ratio ??
    (result.financial_analysis?.monthly_revenue > 0 && monthlyEmi > 0
      ? Math.round((monthlyEmi / result.financial_analysis.monthly_revenue) * 100)
      : 0);

  const status = isNotEligible ? "Not Eligible" : emiRatio <= 35 ? "Affordable" : "High Repayment Burden";
  const isAffordable = !isNotEligible && (status === "Affordable" || emiRatio < 40);
  const schedule = loanAfford.quarterly_repayment_schedule ?? [];

  return (
    <div className="side-page-content">
      <div className="page-header-banner">
        <div className="page-header-text">
          <span className="page-badge-pill">
            {getPageBadge("emi", lang)}
          </span>
          <h2>{getUI("emiHeaderTitle", lang, "Loan Repayment & EMI Breakdown")}</h2>
          <p className="page-sub-desc">
            {getUI("emiHeaderDesc", lang, "Clear calculation of your monthly installment, interest cost, and repayment schedule.")}
          </p>
        </div>

        <div className={`status-hero-tag ${isAffordable ? "positive" : "warning"}`}>
          <div>
            <strong>
              {isAffordable
                ? getUI("emiAffordableVerdict", lang, "Comfortable & Affordable EMI")
                : getUI("emiCautionVerdict", lang, "Manage EMI with Care")}
            </strong>
            <p>
              {lang === "hi"
                ? `आपकी कमाई का केवल ${emiRatio}% हिस्सा किश्त में जाएगा।`
                : lang === "bn"
                ? `আপনার নিট আয়ের মাত্র ${emiRatio}% অংশ কিস্তিতে যাবে।`
                : lang === "mr"
                ? `आपल्या उत्पन्नाचा फक्त ${emiRatio}% भाग हप्त्यात जाईल.`
                : lang === "te"
                ? `మీ సంపాదనలో కేవలం ${emiRatio}% మాత్రమే వాయిదాకు సరిపోతుంది.`
                : lang === "ta"
                ? `உங்கள் வருமானத்தில் ${emiRatio}% மட்டுமே தவணைக்கு செலவாகும்.`
                : `Only ${emiRatio}% of your net earnings is required for EMI.`}
            </p>
          </div>
        </div>
      </div>

      {/* Big EMI Highlight Cards */}
      <div className="kpi-hero-grid">
        <div className="kpi-hero-card kpi-green">
          <div className="kpi-top">
            <span className="kpi-tag">{getUI("monthlyDueTag", lang, "Monthly Due")}</span>
          </div>
          <p className="kpi-label">{getUI("estimatedMonthlyEmi", lang, "Estimated Monthly EMI")}</p>
          <h3 className="kpi-value text-green">{formatCurrency(monthlyEmi)}</h3>
          <p className="kpi-hint">
            {eligibleLoan > 0
              ? (lang === "bn"
                  ? `যোগ্য ব্যাংক ঋণ: ${formatCurrency(eligibleLoan)} • প্রতি মাসে কিস্তি`
                  : lang === "mr"
                  ? `पात्र कर्ज: ${formatCurrency(eligibleLoan)} • दरमहा हप्ता`
                  : lang === "te"
                  ? `అర్హత రుణం: ${formatCurrency(eligibleLoan)} • నెలవారీ వాయిదా`
                  : lang === "ta"
                  ? `தகுதியான கடன்: ${formatCurrency(eligibleLoan)} • மாதாந்திர தவணை`
                  : isHi
                  ? `पात्र लोन: ${formatCurrency(eligibleLoan)} • प्रति माह किश्त`
                  : `Eligible Loan: ${formatCurrency(eligibleLoan)} • Monthly`)
              : (lang === "bn"
                  ? "প্রতি মাসে ব্যাংকে জমা দেওয়ার নির্ধারিত পরিমাণ"
                  : isHi
                  ? "प्रति माह बैंक में जमा करने योग्य राशि"
                  : "Fixed installment per month")}
          </p>
        </div>

        <div className="kpi-hero-card kpi-blue">
          <div className="kpi-top">
            <span className="kpi-tag">{getUI("interestRate", lang, "Interest Rate")}</span>
          </div>
          <p className="kpi-label">{getUI("annualInterestRate", lang, "Annual Interest Rate")}</p>
          <h3 className="kpi-value text-blue">
            {schemeInterestRate != null ? `${schemeInterestRate}% p.a.` : "N/A"}
          </h3>
          <p className="kpi-hint">
            {schemeAnalysis.scheme_name
              ? `${schemeAnalysis.scheme_name} (SIH26091)`
              : getUI("standardRate", lang, "Standard rate")}
          </p>
        </div>

        <div className="kpi-hero-card kpi-amber">
          <div className="kpi-top">
            <span className="kpi-tag">{getUI("interestCostTag", lang, "Interest Cost")}</span>
          </div>
          <p className="kpi-label">{getUI("totalInterestPaid", lang, "Total Interest Paid")}</p>
          <h3 className="kpi-value">{formatCurrency(totalInterest)}</h3>
          <p className="kpi-hint">
            {getUI("totalInterestSub", lang, "Cost of credit across the entire loan period")}
          </p>
        </div>

        <div className="kpi-hero-card kpi-purple">
          <div className="kpi-top">
            <span className="kpi-tag">{getUI("tenureGraceTag", lang, "Tenure & Grace")}</span>
          </div>
          <p className="kpi-label">{getUI("totalTenureLabel", lang, "Total Repayment Tenure")}</p>
          <h3 className="kpi-value">
            {tenureMonths != null ? `${tenureMonths} ${getUI("monthsUnit", lang, "Months")}` : "N/A"}
          </h3>
          <p className="kpi-hint">
            {moratorium != null
              ? (lang === "bn"
                  ? `শুরুর ${moratorium} মাস কিস্তি স্থগিতের সুবিধা থাকবে`
                  : lang === "mr"
                  ? `सुरुवातीचे ${moratorium} महिने सवलत कालावधी असेल`
                  : lang === "te"
                  ? `ప్రారంభ ${moratorium} నెలల రాయితీ కాలం ఉంటుంది`
                  : lang === "ta"
                  ? `ஆரம்ப ${moratorium} மாதங்கள் சலுகை காலமாக இருக்கும்`
                  : isHi
                  ? `शुरुआती ${moratorium} महीने ग्रेस/छूट अवधि रहेगी`
                  : `Includes initial ${moratorium} months moratorium`)
              : getUI("notApplicable", lang, "Not applicable")}
          </p>
        </div>
      </div>

      {/* EMI Safety Gauge */}
      <div className="detail-card">
        <div className="detail-card-head">
          <div>
            <h3>{getUI("emiBurdenMeterTitle", lang, "EMI Affordability Meter")}</h3>
            <p>
              {getUI("emiBurdenMeterSub", lang, "Proportion of your income used to service the monthly installment.")}
            </p>
          </div>
        </div>

        <div className="meter-container">
          <div className="meter-info-row">
            <span>
              {lang === "bn" ? "আয়ের উপর কিস্তির চাপ:" : lang === "mr" ? "उत्पन्नावर हप्त्याचा भार:" : lang === "te" ? "ఆదాయంపై వాయిదా భారం:" : lang === "ta" ? "வருமானத்தில் தவணையின் சுமை:" : isHi ? "कमाई पर किश्त का भार:" : "EMI to Profit Burden:"}{" "}
              <strong>{emiRatio}%</strong>
            </span>
            <span className={emiRatio <= 30 ? "tag-green" : emiRatio <= 50 ? "tag-amber" : "tag-red"}>
              {emiRatio <= 30
                ? (lang === "bn" ? "অত্যন্ত নিরাপদ" : lang === "mr" ? "अतिशय सुरक्षित" : lang === "te" ? "చాలా సురక్షితం" : lang === "ta" ? "மிகவும் பாதுகாப்பானது" : isHi ? "बहुत सुरक्षित (Very Safe)" : "Very Safe & Light")
                : emiRatio <= 50
                ? (lang === "bn" ? "সহনশীল" : lang === "mr" ? "सांभाळण्यासारखा" : lang === "te" ? "నిర్వహించదగినది" : lang === "ta" ? "கட்டுக்குள் உள்ளது" : isHi ? "सामान्य (Manageable)" : "Manageable")
                : (lang === "bn" ? "উচ্চ কিস্তির চাপ" : lang === "mr" ? "जास्त हप्ता भार" : lang === "te" ? "అధిక భారం" : lang === "ta" ? "அதிக சுமை" : isHi ? "भारी किश्त (High Burden)" : "High Burden")}
            </span>
          </div>

          <div className="progress-track" style={{ height: "14px" }}>
            <div
              className={`progress-fill ${
                emiRatio <= 30 ? "green" : emiRatio <= 50 ? "amber" : "red"
              }`}
              style={{ width: `${Math.min(100, Math.max(5, emiRatio))}%` }}
            />
          </div>

          <div className="meter-scale-markers">
            <span>0% ({lang === "bn" ? "সহজ" : lang === "mr" ? "सोपे" : isHi ? "आसान" : "Easy"})</span>
            <span>30% ({lang === "bn" ? "নিরাপদ সীমা" : lang === "mr" ? "सुरक्षित मर्यादा" : isHi ? "सुरक्षित सीमा" : "Safe"})</span>
            <span>50% ({lang === "bn" ? "সর্বোচ্চ মাত্রা" : lang === "mr" ? "कमाल मर्यादा" : isHi ? "अधिकतम" : "Upper Limit"})</span>
            <span>100%</span>
          </div>
        </div>

        <p className="meter-explanation">
          {loanAfford.affordability_message ||
            (lang === "bn"
              ? "আপনার মাসিক নিট সঞ্চয় কিস্তির চেয়ে অনেক বেশি, তাই আপনি সহজে ব্যাংকের ঋণ পরিশোধ করতে সক্ষম।"
              : lang === "mr"
              ? "आपली शुद्ध मासिक बचत हप्त्यापेक्षा खूप जास्त आहे, त्यामुळे बँक हप्ता वेळेवर फेडणे सहज शक्य आहे."
              : lang === "te"
              ? "మీ నికర నెలవారీ పొదుపు వాయిదా కంటే చాలా ఎక్కువ, కాబట్టి మీరు సమయానికి రుణం తీర్చగలరు."
              : lang === "ta"
              ? "உங்கள் மாதாந்திர நிகர சேமிப்பு தவணையை விட அதிகமாக உள்ளது, எனவே வங்கிக் கடனை எளிதாக திருப்பிச் செலுத்தலாம்."
              : isHi
              ? "आपकी शुद्ध मासिक बचत किश्त से काफी अधिक है, इसलिए आप बैंक को समय पर किश्त चुकाने में पूरी तरह सक्षम हैं।"
              : "Your net monthly profit comfortably exceeds the EMI obligation, giving you ample safety margin.")}
        </p>
      </div>

      {/* Full Quarterly Repayment Schedule Table */}
      <div className="detail-card">
        <div className="detail-card-head">
          <div>
            <h3>{getUI("repaymentScheduleTitle", lang, "Quarterly Repayment Schedule")}</h3>
            <p>
              {getUI("repaymentScheduleDesc", lang, "Quarter-by-quarter breakdown of installment, interest, and outstanding principal")}
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>{lang === "bn" ? "ত্রৈমাসিক" : lang === "mr" ? "तिमाही" : lang === "te" ? "త్రైమాసికం" : lang === "ta" ? "காலாண்டு" : isHi ? "तिमाही (Quarter)" : "Quarter"}</th>
                <th>{lang === "bn" ? "মাস" : lang === "mr" ? "महिने" : lang === "te" ? "నెలలు" : lang === "ta" ? "மாதங்கள்" : isHi ? "महीने (Months)" : "Months"}</th>
                <th>{lang === "bn" ? "ধাপ" : lang === "mr" ? "टप्पा" : lang === "te" ? "దశ" : lang === "ta" ? "கட்டம்" : isHi ? "दौर (Phase)" : "Phase"}</th>
                <th>{lang === "bn" ? "মোট কিস্তি (EMI)" : lang === "mr" ? "एकूण हप्ता (EMI)" : lang === "te" ? "మొత్తం వాయిదా (EMI)" : lang === "ta" ? "மொத்த தவணை (EMI)" : isHi ? "कुल किश्त (EMI)" : "Total EMI"}</th>
                <th>{lang === "bn" ? "সুদ" : lang === "mr" ? "व्याज" : lang === "te" ? "వడ్డీ" : lang === "ta" ? "வட்டி" : isHi ? "ब्याज (Interest)" : "Interest Part"}</th>
                <th>{lang === "bn" ? "আসল" : lang === "mr" ? "मुद्दल" : lang === "te" ? "అసలు" : lang === "ta" ? "அசல்" : isHi ? "मूलधन (Principal)" : "Principal Part"}</th>
                <th>{lang === "bn" ? "অবশিষ্ট ঋণ" : lang === "mr" ? "शिल्लक कर्ज" : lang === "te" ? "మిగిలిన రుణం" : lang === "ta" ? "மீதமுள்ள கடன்" : isHi ? "बाकी लोन (Outstanding)" : "Balance Left"}</th>
              </tr>
            </thead>
            <tbody>
              {schedule.length > 0 ? (
                schedule.map((item, index) => {
                  const translatedPhase =
                    item.phase?.includes("Moratorium")
                      ? (lang === "bn"
                          ? "কিস্তি স্থগিত (শুধুমাত্র সুদ)"
                          : lang === "mr"
                          ? "सवलत कालावधी (फक्त व्याज)"
                          : lang === "te"
                          ? "రాయితీ కాలం (వడ్డీ మాత్రమే)"
                          : lang === "ta"
                          ? "சலுகை காலம் (வட்டி மட்டும்)"
                          : isHi
                          ? "छूट अवधि (केवल ब्याज)"
                          : "Moratorium (Interest Only)")
                      : (lang === "bn"
                          ? "নিয়মিত কিস্তি"
                          : lang === "mr"
                          ? "नियमित परतफेड"
                          : lang === "te"
                          ? "సాధారణ చెల్లింపు"
                          : lang === "ta"
                          ? "வழக்கமான தவணை"
                          : isHi
                          ? "नियमित किश्त"
                          : "Standard Repayment");

                  return (
                    <tr key={index}>
                      <td>
                        <strong>{item.quarter}</strong>
                      </td>
                      <td>{item.months}</td>
                      <td>
                        <span
                          className={`pill-badge ${
                            item.phase?.includes("Moratorium") ? "pill-amber" : "pill-green"
                          }`}
                        >
                          {translatedPhase}
                        </span>
                      </td>
                      <td className="text-green">
                        <strong>{formatCurrency(item.emi_total)}</strong>
                      </td>
                      <td>{formatCurrency(item.interest_total)}</td>
                      <td>{formatCurrency(item.principal_total)}</td>
                      <td>{formatCurrency(item.outstanding_principal)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">
                    {lang === "bn"
                      ? "কিস্তি সময়সূচি উপলব্ধ নেই।"
                      : lang === "mr"
                      ? "हप्ता सारणी उपलब्ध नाही."
                      : lang === "te"
                      ? "వాయిదా పట్టిక అందుబాటులో లేదు."
                      : lang === "ta"
                      ? "தவணை அட்டவணை கிடைக்கவில்லை."
                      : isHi
                      ? "किश्त सारणी उपलब्ध नहीं है।"
                      : "No quarterly repayment schedule available."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
