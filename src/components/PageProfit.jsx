import MinimalPieChart from "./MinimalPieChart";
import {
  getPageBadge,
  getUI,
  translateStrength,
  translateRisk,
} from "../utils/translationHelper";

export default function PageProfit({ result, formatCurrency, lang = "hi" }) {
  const isHi = lang === "hi";

  const rev = Number(result.monthly_revenue ?? result.financial_analysis?.monthly_revenue ?? ((result.financial_analysis?.monthly_profit || 0) + (result.advanced_financial_analysis?.break_even_revenue || 0)));
  const exp = Number(result.monthly_expenses ?? ((result.financial_analysis?.monthly_revenue - result.financial_analysis?.monthly_profit) || (result.advanced_financial_analysis?.break_even_revenue || 0)));
  const profit = result.financial_analysis?.monthly_profit ?? 0;

  const profitMargin = result.advanced_financial_analysis?.profit_margin ?? 0;
  const expenseRatio = result.advanced_financial_analysis?.expense_ratio ?? 0;
  const breakEven = result.advanced_financial_analysis?.break_even_revenue ?? 0;
  const surplus = result.advanced_financial_analysis?.monthly_cash_surplus ?? profit;
  const strength = result.advanced_financial_analysis?.financial_strength ?? "Moderate";
  const finRisk = result.advanced_financial_analysis?.financial_risk ?? "Low";

  const totalSales = (exp + Math.max(0, profit)) || rev;
  const profitPieData = [
    {
      name: getUI("monthlyOperatingCosts", lang, "Operating Costs (Expenses)"),
      value: exp,
      color: "#d97706",
      sublabel: getUI("operationalCostsUpkeep", lang, "Inventory, rent, power & supplies"),
    },
    {
      name: getUI("netTakeHomeProfit", lang, "Net Profit (Savings)"),
      value: Math.max(0, profit),
      color: "#16a34a",
      sublabel: getUI("cleanPocketProfit", lang, "Retained cash after all outlays"),
    },
  ];

  return (
    <div className="side-page-content">
      <div className="page-header-banner">
        <div className="page-header-text">
          <span className="page-badge-pill">
            {getPageBadge("profit", lang)}
          </span>
          <h2>
            {lang === "hi" ? "हर महीने का नफ़ा-नुकसान" : lang === "bn" ? "প্রতি মাসের আয়-ব্যয় ও নিট লাভ" : lang === "mr" ? "दरमहा नफा-तोटा व हिशोब" : lang === "te" ? "నెలవారీ ఆదాయం, ఖర్చులు & లాభం" : lang === "ta" ? "மாதாந்திர வருவாய், செலவு & லாபம்" : "Monthly Revenue, Cost & Profit"}
          </h2>
          <p className="page-sub-desc">
            {lang === "hi"
              ? "सरल गणित: कुल बिक्री में से सारा खर्च घटाकर शुद्ध जेब में कितना बचेगा।"
              : lang === "bn"
              ? "সহজ হিসাব: মোট বিক্রয় থেকে সমস্ত খরচ বাদ দিলে প্রকৃত পকেট লাভ কত হবে।"
              : lang === "mr"
              ? "सोपे गणित: एकूण विक्रीतून सर्व खर्च वजा करून खिशात उरणारा निव्वळ नफा."
              : lang === "te"
              ? "సులభమైన లెక్క: మొత్తం అమ్మకాల నుండి అన్ని ఖర్చులు తీసివేస్తే మీ చేతిలో మిగిలే నికర లాభం."
              : lang === "ta"
              ? "எளிய கணக்கு: மொத்த விற்பனையிலிருந்து அனைத்து செலவுகளையும் கழித்தால் கையில் நிற்கும் நிகர லாபம்."
              : "Clear money flow: Total sales minus all business expenses equals your real profit."}
          </p>
        </div>
      </div>

      {/* Visual Money Flow equation */}
      <div className="money-flow-equation">
        <div className="flow-step flow-in">
          <span className="flow-label">{getUI("flowSales", lang, "Total Sales (Revenue)")}</span>
          <strong className="flow-amt">+{formatCurrency(rev > 0 ? rev : profit + exp)}</strong>
          <span className="flow-sub">{getUI("flowSalesSub", lang, "Money in from customers")}</span>
        </div>

        <div className="flow-operator">−</div>

        <div className="flow-step flow-out">
          <span className="flow-label">{getUI("flowExpenses", lang, "Total Expenses (Costs)")}</span>
          <strong className="flow-amt">−{formatCurrency(exp)}</strong>
          <span className="flow-sub">{getUI("flowExpensesSub", lang, "Materials, rent, power, feed")}</span>
        </div>

        <div className="flow-operator">=</div>

        <div className="flow-step flow-result">
          <span className="flow-label">{getUI("flowProfit", lang, "Net Monthly Profit")}</span>
          <strong className="flow-amt">{formatCurrency(profit)}</strong>
          <span className="flow-sub">{getUI("flowProfitSub", lang, "Real money in your hand")}</span>
        </div>
      </div>

      {/* Visual Pie Chart: Monthly Sales Breakdown (Expenses vs Net Profit) */}
      <div className="detail-card" style={{ marginBottom: "24px" }}>
        <MinimalPieChart
          title={lang === "hi" ? "मासिक बिक्री का पाई चार्ट" : lang === "bn" ? "মাসিক বিক্রয়ের পাই চার্ট" : lang === "mr" ? "मासिक विक्री पाय चार्ट" : lang === "te" ? "నెలవారీ అమ్మకాల పై చార్ట్" : lang === "ta" ? "மாதாந்திர விற்பனை பை விளக்கப்படம்" : "Monthly Sales Allocation Pie Chart"}
          subtitle={
            lang === "hi"
              ? "कुल बिक्री में से खर्च और शुद्ध मुनाफे का वास्तविक हिस्सा"
              : lang === "bn"
              ? "মোট বিক্রিতে ব্যয় ও নিট লাভের প্রকৃত অনুপাত"
              : lang === "mr"
              ? "एकूण विक्रीतील खर्च व शुद्ध नफ्याचा प्रत्यक्ष वाटा"
              : lang === "te"
              ? "మొత్తం అమ్మకాల్లో ఖర్చులు & నికర లాభం వాటా"
              : lang === "ta"
              ? "மொத்த விற்பனையில் செலவு & நிகர லாபத்தின் பங்கு"
              : "Exact proportion of total customer sales kept as profit vs absorbed by expenses"
          }
          data={profitPieData}
          formatCurrency={formatCurrency}
          height={210}
          centerText={{
            primary: lang === "hi" ? "कुल बिक्री" : lang === "bn" ? "মোট বিক্রয়" : lang === "mr" ? "एकूण विक्री" : lang === "te" ? "మొత్తం అమ్మకాలు" : lang === "ta" ? "மொத்த விற்பனை" : "Gross Revenue",
            secondary: formatCurrency(totalSales),
          }}
        />
      </div>

      {/* Ratios and Break-Even Cards */}
      <div className="two-column-grid">
        <div className="detail-card">
          <div className="detail-card-head">
            <div>
              <h3>{lang === "hi" ? "मुनाफे का प्रतिशत" : lang === "bn" ? "লাভের হার ও খরচের অনুপাত" : lang === "mr" ? "नफा व खर्च प्रमाण" : lang === "te" ? "లాభాల మార్జిన్ & ఖర్చుల నిష్పత్తి" : lang === "ta" ? "லாப விகிதம் & செலவு விகிதம்" : "Profit Margin & Cost Ratio"}</h3>
              <p>{lang === "hi" ? "हर ₹100 की बिक्री पर कितना बचता है" : lang === "bn" ? "প্রতি ১০০ টাকা বিক্রিতে কত সাশ্রয় হয়" : lang === "mr" ? "प्रत्येक ₹100 च्या विक्रीवर किती नफा उरतो" : lang === "te" ? "ప్రతి ₹100 అమ్మకాలపై ఎంత మిగులుతుంది" : lang === "ta" ? "ஒவ்வொரு ₹100 விற்பனைக்கும் எவ்வளவு மிஞ்சுகிறது" : "Percentage of sales kept as profit"}</p>
            </div>
          </div>

          <div className="bar-stat-group">
            <div className="bar-header">
              <span>{getUI("profitMarginLabel", lang, "Profit Margin")}</span>
              <strong className="text-green">{profitMargin}%</strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill green"
                style={{ width: `${Math.min(100, Math.max(0, profitMargin))}%` }}
              />
            </div>
            <p className="bar-expl">
              {lang === "bn"
                ? `প্রতি ₹১০০ মূল্যের পণ্য বিক্রিতে প্রায় ₹${profitMargin} আপনার নিট লাভ হিসেবে জমা হয়।`
                : lang === "mr"
                ? `प्रत्येक ₹100 चे सामान विकल्यावर सुमारे ₹${profitMargin} नफा उरतो.`
                : lang === "te"
                ? `ప్రతి ₹100 సరుకు అమ్మితే సుమారు ₹${profitMargin} నికర లాభంగా మిగులుతుంది.`
                : lang === "ta"
                ? `ஒவ்வொரு ₹100 மதிப்புள்ள விற்பனைக்கும் ₹${profitMargin} உங்கள் நிகர லாபமாக மிஞ்சுகிறது.`
                : isHi
                ? `हर ₹100 का सामान बेचने पर आप लगभग ₹${profitMargin} बचा रहे हैं।`
                : `For every ₹100 worth of sales, ₹${profitMargin} is kept as your clean profit.`}
            </p>
          </div>

          <div className="bar-stat-group" style={{ marginTop: "20px" }}>
            <div className="bar-header">
              <span>{getUI("expenseRatioLabel", lang, "Expense Ratio")}</span>
              <strong className={expenseRatio > 70 ? "text-amber" : "text-blue"}>
                {expenseRatio}%
              </strong>
            </div>
            <div className="progress-track">
              <div
                className={`progress-fill ${expenseRatio > 70 ? "amber" : "blue"}`}
                style={{ width: `${Math.min(100, Math.max(0, expenseRatio))}%` }}
              />
            </div>
            <p className="bar-expl">
              {lang === "bn"
                ? `আপনার মোট আয়ের ${expenseRatio}% অংশ পরিচালনা ব্যয় ও কাঁচামালে চলে যাচ্ছে।`
                : lang === "mr"
                ? `आपल्या उत्पन्नाचा ${expenseRatio}% भाग खर्च व कच्च्या मालावर जात आहे.`
                : lang === "te"
                ? `మీ మొత్తం ఆదాయంలో ${expenseRatio}% భాగం నిర్వహణ ఖర్చులకు పోతుంది.`
                : lang === "ta"
                ? `உங்கள் வருமானத்தில் ${expenseRatio}% செயல்பாட்டு செலவுகள் மற்றும் பொருட்களுக்கு செலவாகிறது.`
                : isHi
                ? `आपकी कमाई का ${expenseRatio}% हिस्सा लागत और खर्चे में जा रहा है।`
                : `${expenseRatio}% of gross income is spent on running costs and materials.`}
            </p>
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-card-head">
            <div>
              <h3>{lang === "hi" ? "ब्रेक-ईवन बिक्री लक्ष्य" : lang === "bn" ? "ব্রেক-ইভেন বিক্রয় লক্ষ্যমাত্রা" : lang === "mr" ? "ब्रेक-इव्हन विक्री उद्दिष्ट" : lang === "te" ? "బ్రేక్-ఈవెన్ అమ్మకాల లక్ష్యం" : lang === "ta" ? "சமநிலை விற்பனை இலக்கு" : "Break-Even Sales Target"}</h3>
              <p>{lang === "hi" ? "खर्च निकालने के लिए न्यूनतम जरूरी बिक्री" : lang === "bn" ? "খরচ তোলার জন্য ন্যূনতম প্রয়োজনীয় বিক্রয়" : lang === "mr" ? "खर्च भरून काढण्यासाठी किमान विक्री" : lang === "te" ? "ఖర్చులు తీరడానికి కనీస అమ్మకాలు" : lang === "ta" ? "செலவுகளை ஈடுகட்ட குறைந்தபட்ச விற்பனை" : "Sales needed just to cover costs"}</p>
            </div>
          </div>

          <div className="break-even-box">
            <span className="be-label">{getUI("breakEvenLabel", lang, "Monthly Break-Even Target")}</span>
            <div className="be-value">{formatCurrency(breakEven)}</div>
            <p className="be-desc">
              {lang === "bn" ? (
                <>
                  প্রতি মাসে কমপক্ষে <strong>{formatCurrency(breakEven)}</strong> টাকার বিক্রয় হওয়া আবশ্যক যাতে সমস্ত পরিচালনা খরচ উঠে আসে।
                  এই অংকের বেশি বিক্রিত প্রতিটি টাকাই আপনার <strong>বিশুদ্ধ লাভ</strong>।
                </>
              ) : lang === "mr" ? (
                <>
                  सर्व खर्च भरून निघण्यासाठी दरमहा किमान <strong>{formatCurrency(breakEven)}</strong> ची विक्री आवश्यक आहे.
                  यापेक्षा जास्त झालेली विक्री हा आपला <strong>निव्वळ नफा</strong> असेल.
                </>
              ) : lang === "te" ? (
                <>
                  అన్ని ఖర్చులు పూడటానికి ప్రతి నెలా కనీసం <strong>{formatCurrency(breakEven)}</strong> అమ్మకాలు అవసరం.
                  దీనిని మించి వచ్చే ప్రతి రూపాయీ మీ <strong>నికర లాభం</strong>.
                </>
              ) : lang === "ta" ? (
                <>
                  அனைத்து செலவுகளையும் ஈடுகட்ட ஒவ்வொரு மாதமும் குறைந்தபட்சம் <strong>{formatCurrency(breakEven)}</strong> விற்பனை தேவை.
                  இதற்கு மேல் விற்கப்படும் ஒவ்வொரு ரூபாயும் உங்கள் <strong>நிகர லாபம்</strong>.
                </>
              ) : isHi ? (
                <>
                  हर महीने कम से कम <strong>{formatCurrency(breakEven)}</strong> की बिक्री होना ज़रूरी है
                  ताकि आपके खर्चे निकल सकें। इस आंकड़े से जितनी ज़्यादा बिक्री होगी, वह सब आपका
                  <strong> शुद्ध मुनाफा</strong> होगा।
                </>
              ) : (
                <>
                  You must sell at least <strong>{formatCurrency(breakEven)}</strong> each month to cover
                  all fixed and operational expenses. Every rupee sold beyond this number is your
                  <strong> pure profit</strong>.
                </>
              )}
            </p>
          </div>

          <div className="quick-stats-row">
            <div className="q-stat">
              <span>{getUI("monthlyCashSurplus", lang, "Monthly Cash Surplus")}</span>
              <strong>{formatCurrency(surplus)}</strong>
            </div>
            <div className="q-stat">
              <span>{getUI("financialStrength", lang, "Financial Strength")}</span>
              <strong className={strength === "Strong" ? "text-green" : "text-amber"}>
                {translateStrength(strength, lang)}
              </strong>
            </div>
            <div className="q-stat">
              <span>{getUI("financialRisk", lang, "Financial Risk")}</span>
              <strong className={finRisk === "Low" ? "text-green" : "text-amber"}>
                {translateRisk(finRisk, lang)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Practical tip for rural entrepreneurs */}
      <div className="village-tip-banner">
        <div>
          <h4>{getUI("practicalTipTitle", lang, "Practical Money Tip:")}</h4>
          <p>
            {getUI("practicalTipDesc", lang)}
          </p>
        </div>
      </div>
    </div>
  );
}

