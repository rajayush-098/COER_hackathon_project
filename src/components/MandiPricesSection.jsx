import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Tag,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
} from "lucide-react";
import { API_ROUTES } from "../apiRoutes";

const MANDI_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";

const DEFAULT_POPULAR_COMMODITIES = [
  "Potato",
  "Onion",
  "Tomato",
  "Wheat",
  "Rice",
  "Mustard",
  "Gram",
  "Maize",
  "Soyabean",
  "Cotton",
  "Garlic",
  "Ginger",
  "Turmeric",
  "Apple",
  "Banana",
  "Cauliflower",
  "Cabbage",
  "Green Chilli",
  "Groundnut",
  "Arhar (Tur)",
  "Moong (Green Gram)",
];

const ALL_INDIAN_STATES = [
  "Uttar Pradesh",
  "Maharashtra",
  "Punjab",
  "Haryana",
  "Rajasthan",
  "Madhya Pradesh",
  "Gujarat",
  "West Bengal",
  "Bihar",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
  "Tamil Nadu",
  "Odisha",
  "Kerala",
  "Assam",
  "Jharkhand",
  "Chhattisgarh",
  "Himachal Pradesh",
  "Uttarakhand",
  "Jammu and Kashmir",
  "Delhi",
  "Goa",
  "Tripura",
];

export default function MandiPricesSection({
  defaultState = "",
  defaultDistrict = "",
  category = "",
  lang = "hi",
}) {
  const isHi = lang === "hi" || lang === "hinglish";

  // Filter States - user can change every single filter freely
  const [commodity, setCommodity] = useState("");
  const [state, setState] = useState(defaultState || "");
  const [district, setDistrict] = useState(defaultDistrict || "");
  const [market, setMarket] = useState("");
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);

  // Data & Network States
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [configured, setConfigured] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [lastUpdatedDate, setLastUpdatedDate] = useState("");
  const [reportingDateFound, setReportingDateFound] = useState("");
  const [suggestions, setSuggestions] = useState(DEFAULT_POPULAR_COMMODITIES.slice(0, 8));
  const [availableCommodities, setAvailableCommodities] = useState(DEFAULT_POPULAR_COMMODITIES);
  const [availableStates, setAvailableStates] = useState(ALL_INDIAN_STATES);

  // Load official metadata (commodities & states list) from backend
  useEffect(() => {
    let active = true;
    fetch(API_ROUTES.MANDI_META || "/api/mandi/meta")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (Array.isArray(data.commodities) && data.commodities.length > 0) {
          setAvailableCommodities(data.commodities);
        }
        if (Array.isArray(data.states) && data.states.length > 0) {
          setAvailableStates(data.states);
        }
        if (data.configured !== undefined) {
          setConfigured(Boolean(data.configured));
        }
      })
      .catch(() => {
        // Fallback to defaults
      });

    return () => {
      active = false;
    };
  }, []);

  // Fetch commodity suggestions for the active business category
  useEffect(() => {
    let active = true;
    if (!category) return;
    fetch(
      `${API_ROUTES.MANDI_SUGGESTIONS || "/api/mandi/suggestions"}?category=${encodeURIComponent(category)}`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [category]);

  // Main Mandi Data Fetcher
  const fetchPrices = useCallback(
    async (paramsOverride = {}) => {
      setLoading(true);
      setErrorMsg("");
      setErrorCode("");

      const qCommodity = paramsOverride.commodity !== undefined ? paramsOverride.commodity : commodity;
      const qState = paramsOverride.state !== undefined ? paramsOverride.state : state;
      const qDistrict = paramsOverride.district !== undefined ? paramsOverride.district : district;
      const qMarket = paramsOverride.market !== undefined ? paramsOverride.market : market;
      const qLimit = paramsOverride.limit !== undefined ? paramsOverride.limit : limit;
      const qOffset = paramsOverride.offset !== undefined ? paramsOverride.offset : offset;

      const params = new URLSearchParams();
      if (qCommodity && qCommodity.trim()) params.append("commodity", qCommodity.trim());
      if (qState && qState.trim()) params.append("state", qState.trim());
      if (qDistrict && qDistrict.trim()) params.append("district", qDistrict.trim());
      if (qMarket && qMarket.trim()) params.append("market", qMarket.trim());
      params.append("limit", String(qLimit));
      params.append("offset", String(qOffset));

      try {
        const res = await fetch(`${API_ROUTES.MANDI_PRICES}?${params.toString()}`);
        const data = await res.json();

        setConfigured(data.configured !== false);

        if (!res.ok || data.success === false) {
          setErrorMsg(data.error || "Failed to fetch Mandi commodity prices.");
          setErrorCode(data.error_code || "");
          setRecords([]);
          setTotalCount(0);
        } else {
          const recs = Array.isArray(data.records) ? data.records : [];
          setRecords(recs);
          setTotalCount(data.total || recs.length);
          setLastUpdatedDate(data.updated_date || "");

          // Find the most recent arrival date from the returned records
          if (recs.length > 0 && recs[0].arrival_date) {
            setReportingDateFound(recs[0].arrival_date);
          } else {
            setReportingDateFound("");
          }
        }
      } catch (err) {
        console.error("Mandi price fetch error:", err);
        setErrorMsg("Network error: Unable to contact server for Mandi prices.");
        setRecords([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [commodity, state, district, market, limit, offset]
  );

  // Initial fetch on mount
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (defaultState && defaultState.trim()) params.append("state", defaultState.trim());
    if (defaultDistrict && defaultDistrict.trim()) params.append("district", defaultDistrict.trim());
    params.append("limit", "25");
    params.append("offset", "0");

    fetch(`${API_ROUTES.MANDI_PRICES}?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setConfigured(data.configured !== false);
        if (data.success === false) {
          setErrorMsg(data.error || "Failed to fetch Mandi commodity prices.");
          setErrorCode(data.error_code || "");
          setRecords([]);
          setTotalCount(0);
        } else {
          const recs = Array.isArray(data.records) ? data.records : [];
          setRecords(recs);
          setTotalCount(data.total || recs.length);
          setLastUpdatedDate(data.updated_date || "");
          if (recs.length > 0 && recs[0].arrival_date) {
            setReportingDateFound(recs[0].arrival_date);
          }
        }
      })
      .catch((err) => {
        if (!active) return;
        console.error("Mandi initial fetch error:", err);
        setErrorMsg("Network error: Unable to contact server for Mandi prices.");
        setRecords([]);
        setTotalCount(0);
      });

    return () => {
      active = false;
    };
  }, [defaultState, defaultDistrict]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setOffset(0);
    fetchPrices({ offset: 0 });
  };

  const handleQuickCommodityClick = (com) => {
    setCommodity(com);
    setOffset(0);
    fetchPrices({ commodity: com, offset: 0 });
  };

  const handleResetFilters = () => {
    setCommodity("");
    setState("");
    setDistrict("");
    setMarket("");
    setOffset(0);
    fetchPrices({ commodity: "", state: "", district: "", market: "", offset: 0 });
  };

  const handleNextPage = () => {
    const nextOffset = offset + limit;
    if (nextOffset < totalCount) {
      setOffset(nextOffset);
      fetchPrices({ offset: nextOffset });
    }
  };

  const handlePrevPage = () => {
    const prevOffset = Math.max(0, offset - limit);
    setOffset(prevOffset);
    fetchPrices({ offset: prevOffset });
  };

  // Translations
  const t = {
    title: {
      bn: "মান্ডি দর চেকার (Mandi Price Checker)",
      mr: "बाजार समिती (मंडी) भाव चेकर",
      te: "మండీ ధరల శోధన (Mandi Price Checker)",
      ta: "மண்டி விலை சரிபார்ப்பு (Mandi Price Checker)",
      hi: "मंडी भाव चेकर (Mandi Price Checker)",
      hinglish: "Mandi Price Checker",
      en: "Mandi Price Checker",
    }[lang] || "Mandi Price Checker",

    sub: {
      bn: "ভারত সরকারের data.gov.in (Agmarknet) পোর্টাল থেকে বিভিন্ন রাজ্যের দৈনিক পাইকারি কৃষি পণ্যের দর যাচাই করুন।",
      mr: "भारत सरकारच्या data.gov.in (Agmarknet) पोर्टलवरून संपूर्ण भारतातील बाजार समित्यांचे अधिकृत दैनिक भाव तपासा.",
      te: "భారత ప్రభుత్వ data.gov.in (Agmarknet) పోర్టల్ నుండి దేశవ్యాప్తంగా అధికారిక మార్కెట్ ధరలను తనిఖీ చేయండి.",
      ta: "இந்திய அரசின் data.gov.in (Agmarknet) போர்டல் மூலமாக அதிகாரப்பூர்வ தினசரி மண்டி மொத்த விற்பனை விலைகளை அறியுங்கள்.",
      hi: "भारत सरकार के data.gov.in (Agmarknet) पोर्टल से पूरे भारत की कृषि उपज मंडियों के आधिकारिक दैनिक थोक भाव जांचें।",
      hinglish: "Check official daily wholesale Mandi benchmark prices across India from data.gov.in.",
      en: "Explore and verify official daily agricultural wholesale commodity prices across Indian APMC mandis via data.gov.in.",
    }[lang] || "Explore and verify official daily agricultural wholesale commodity prices across Indian APMC mandis via data.gov.in.",

    checkPricesBtn: {
      bn: "দর দেখুন",
      mr: "भाव तपासा",
      te: "ధరలు చూడండి",
      ta: "விலை காண்க",
      hi: "भाव देखें",
      hinglish: "Check Prices",
      en: "Check Prices",
    }[lang] || "Check Prices",

    checkingPrices: {
      bn: "অনুসন্ধান হচ্ছে...",
      mr: "शोधत आहे...",
      te: "శోధిస్తోంది...",
      ta: "தேடுகிறது...",
      hi: "खोज रहे हैं...",
      hinglish: "Fetching...",
      en: "Checking...",
    }[lang] || "Checking...",

    commodityLabel: {
      bn: "পণ্য / ফসল (Commodity)",
      mr: "कृषी माल / वस्तू (Commodity)",
      te: "సరుకు (Commodity)",
      ta: "பொருள் (Commodity)",
      hi: "फसल / जींस (Commodity)",
      hinglish: "Commodity (Crop)",
      en: "Commodity",
    }[lang] || "Commodity",

    stateLabel: {
      bn: "রাজ্য (State)",
      mr: "राज्य (State)",
      te: "రాష్ట్రం (State)",
      ta: "மாநிலம் (State)",
      hi: "राज्य (State)",
      hinglish: "State",
      en: "State",
    }[lang] || "State",

    districtLabel: {
      bn: "জেলা (District)",
      mr: "जिल्हा (District)",
      te: "జిల్లా (District)",
      ta: "மாவட்டம் (District)",
      hi: "ज़िला (District)",
      hinglish: "District",
      en: "District",
    }[lang] || "District",

    marketLabel: {
      bn: "নির্দিষ্ট মান্ডি (Mandi / Market - ঐচ্ছিক)",
      mr: "बाजार समिती / मंडी (पर्यायी)",
      te: "నిర్దిష్ట మార్కెట్ / మండీ (ఐచ్ఛికం)",
      ta: "குறிப்பிட்ட மண்டி (விருப்பத்தேர்வு)",
      hi: "विशिष्ट मंडी / बाज़ार (वैकल्पिक)",
      hinglish: "Specific Mandi / Market (Optional)",
      en: "Specific Mandi / Market (Optional)",
    }[lang] || "Specific Mandi / Market (Optional)",

    clearBtn: {
      bn: "রিসেট করুন",
      mr: "साफ़ करा",
      te: "రీసెట్",
      ta: "அழிக்கவும்",
      hi: "साफ़ करें",
      hinglish: "Reset Filters",
      en: "Reset Filters",
    }[lang] || "Reset Filters",

    unitBadge: {
      bn: "ইকাই: ₹/কুইন্টাল (১০০ কেজি)",
      mr: "प्रमाण: ₹/क्विंटल (१०० किलो)",
      te: "ప్రమాణం: ₹/క్వింటాల్ (100 కిలోలు)",
      ta: "அலகு: ₹/குவிண்டால் (100 கிலோ)",
      hi: "मानक इकाई: ₹/क्विंटल (100 किग्रा)",
      hinglish: "Unit: ₹/Quintal (100 kg)",
      en: "Official Unit: ₹/Quintal (100 kg)",
    }[lang] || "Official Unit: ₹/Quintal (100 kg)",
  };

  const currentPageNum = Math.floor(offset / limit) + 1;
  const totalPagesNum = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div
      className="mandi-price-checker-wrapper"
      id="mandi-price-checker"
      style={{
        marginTop: "20px",
        marginBottom: "28px",
        background: "#ffffff",
        borderRadius: "16px",
        border: "1.5px solid #cbd5e1",
        boxShadow: "0 4px 18px rgba(15, 23, 42, 0.06)",
        overflow: "hidden",
      }}
    >
      {/* Mandi Price Checker Top Header Banner */}
      <div
        style={{
          padding: "20px 24px",
          background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f8fafc 100%)",
          borderBottom: "1.5px solid #d1fae5",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ flex: "1 1 360px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#059669",
                color: "#ffffff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px rgba(5, 150, 105, 0.25)",
              }}
            >
              <TrendingUp size={20} />
            </span>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "19px",
                  fontWeight: "800",
                  color: "#064e3b",
                  letterSpacing: "-0.01em",
                }}
              >
                {t.title}
              </h3>
              <span
                style={{
                  fontSize: "11.5px",
                  fontWeight: "700",
                  color: "#047857",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>National Open Government Data (data.gov.in)</span>
                <span>•</span>
                <span>Resource ID: {MANDI_RESOURCE_ID}</span>
              </span>
            </div>
          </div>
          <p
            style={{
              margin: "8px 0 0 0",
              fontSize: "13px",
              color: "#475569",
              lineHeight: 1.5,
              maxWidth: "680px",
            }}
          >
            {t.sub}
          </p>
        </div>

        {/* Header Right Badges & Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: "700",
              padding: "5px 11px",
              borderRadius: "8px",
              backgroundColor: "#fef3c7",
              color: "#92400e",
              border: "1px solid #fde68a",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <Tag size={13} />
            <span>{t.unitBadge}</span>
          </span>

          <button
            type="button"
            onClick={() => fetchPrices()}
            disabled={loading}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1.5px solid #059669",
              backgroundColor: "#ffffff",
              color: "#059669",
              fontSize: "13px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: loading ? "wait" : "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
            title="Refresh current search"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>{loading ? t.checkingPrices : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Interactive Search & Filter Dashboard */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          padding: "20px 24px 18px",
          backgroundColor: "#f8fafc",
          borderBottom: "1.5px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "14px",
            alignItems: "flex-end",
          }}
        >
          {/* 1. Commodity Selector / Input */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 800,
                color: "#1e293b",
                marginBottom: "6px",
              }}
            >
              🌾 {t.commodityLabel}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                list="mandi-commodities-list"
                placeholder="e.g. Potato, Wheat, Onion, Rice..."
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  outline: "none",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              />
              <datalist id="mandi-commodities-list">
                {availableCommodities.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>
          </div>

          {/* 2. State Selector */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 800,
                color: "#1e293b",
                marginBottom: "6px",
              }}
            >
              📍 {t.stateLabel}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                list="mandi-states-list"
                placeholder="e.g. Uttar Pradesh, Maharashtra..."
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  outline: "none",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              />
              <datalist id="mandi-states-list">
                {availableStates.map((st) => (
                  <option key={st} value={st} />
                ))}
              </datalist>
            </div>
          </div>

          {/* 3. District Selector */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 800,
                color: "#1e293b",
                marginBottom: "6px",
              }}
            >
              🏛️ {t.districtLabel}
            </label>
            <input
              type="text"
              placeholder="e.g. Meerut, Agra, Pune, Nashik..."
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: "13.5px",
                fontWeight: 600,
                borderRadius: "8px",
                border: "1.5px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                outline: "none",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            />
          </div>

          {/* 4. Mandi / Market Name (Optional) */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 800,
                color: "#1e293b",
                marginBottom: "6px",
              }}
            >
              🏪 {t.marketLabel}
            </label>
            <input
              type="text"
              placeholder="e.g. Meerut, Mawana, Vashi..."
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: "13.5px",
                fontWeight: 600,
                borderRadius: "8px",
                border: "1.5px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                outline: "none",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            />
          </div>
        </div>

        {/* Action Controls & Quick Commodities Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
            marginTop: "16px",
            paddingTop: "14px",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          {/* Quick Commodity Suggestion Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#64748b" }}>
              Quick Commodities:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {suggestions.map((item) => {
                const isSelected = commodity.toLowerCase() === item.toLowerCase();
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleQuickCommodityClick(item)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "16px",
                      border: isSelected ? "1.5px solid #059669" : "1px solid #cbd5e1",
                      backgroundColor: isSelected ? "#ecfdf5" : "#ffffff",
                      color: isSelected ? "#065f46" : "#334155",
                      fontSize: "12px",
                      fontWeight: isSelected ? 800 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons: Check Prices & Clear */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              value={limit}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                setLimit(newLimit);
                setOffset(0);
                fetchPrices({ limit: newLimit, offset: 0 });
              }}
              style={{
                padding: "8px 10px",
                fontSize: "12.5px",
                fontWeight: 600,
                borderRadius: "8px",
                border: "1.5px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#334155",
                cursor: "pointer",
              }}
              title="Result limit per page"
            >
              <option value={10}>10 records</option>
              <option value={25}>25 records</option>
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
            </select>

            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                padding: "9px 14px",
                borderRadius: "8px",
                border: "1.5px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#475569",
                fontSize: "13px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={14} />
              <span>{t.clearBtn}</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 22px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#059669",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: loading ? "wait" : "pointer",
                boxShadow: "0 2px 8px rgba(5, 150, 105, 0.35)",
                transition: "all 0.15s ease",
              }}
            >
              <Search size={16} />
              <span>{loading ? t.checkingPrices : t.checkPricesBtn}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Main Results / State Presentation Area */}
      <div style={{ padding: "20px 24px" }}>
        {/* Unconfigured API Key Notice */}
        {!configured && (
          <div
            style={{
              backgroundColor: "#fffbeb",
              border: "1.5px solid #fde68a",
              borderRadius: "10px",
              padding: "14px 18px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <AlertCircle size={20} style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong style={{ color: "#92400e", fontSize: "14px" }}>
                {isHi ? "data.gov.in API Key सर्वर पर सेट नहीं है" : "data.gov.in API Key Required in .env"}
              </strong>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#b45309", lineHeight: 1.5 }}>
                {isHi
                  ? "वास्तविक सरकारी मंडी भाव प्राप्त करने के लिए अपनी सर्वर .env फ़ाइल में DATA_GOV_IN_API_KEY जोड़ें।"
                  : "To query live Government Mandi prices from data.gov.in, ensure DATA_GOV_IN_API_KEY is configured in your root .env file."}
              </p>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1.5px solid #fecaca",
              borderRadius: "10px",
              padding: "14px 18px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <AlertCircle size={20} style={{ color: "#dc2626", flexShrink: 0, marginTop: "2px" }} />
            <div style={{ flex: 1 }}>
              <strong style={{ color: "#991b1b", fontSize: "14px" }}>
                {errorCode === "CONNECTION_REFUSED_BY_NIC"
                  ? (isHi ? "NIC सरकारी पोर्टल कनेक्टिविटी सूचना" : "Government Portal (NIC) Network Notice")
                  : (isHi ? "मंडी भाव सेवा सूचना" : "Mandi Service Notice")}
              </strong>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#b91c1c", lineHeight: 1.5 }}>
                {errorMsg}
              </p>
              {errorCode === "CONNECTION_REFUSED_BY_NIC" && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #fca5a5",
                    fontSize: "12px",
                    color: "#7f1d1d",
                  }}
                >
                  <strong>Local Verification Tip:</strong> The backend integration and API key validation are complete. Because data.gov.in (NIC, India) firewalls block non-Indian datacenter IPs, executing the app on your local machine in India (<code>npm run dev</code> at <code>localhost:3000</code>) connects directly.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div
            style={{
              padding: "44px 20px",
              textAlign: "center",
              color: "#64748b",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <RefreshCw size={28} className="animate-spin text-emerald-600" />
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
              {isHi
                ? "data.gov.in से आधिकारिक मंडी भाव प्राप्त किए जा रहे हैं..."
                : "Fetching official Mandi commodity prices from data.gov.in..."}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Querying Agmarknet Daily Wholesale Prices Dataset ({MANDI_RESOURCE_ID})
            </span>
          </div>
        )}

        {/* Empty State: Zero records returned */}
        {!loading && records.length === 0 && !errorMsg && (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              backgroundColor: "#f8fafc",
              borderRadius: "12px",
              border: "1.5px dashed #cbd5e1",
            }}
          >
            <p style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 800, color: "#1e293b" }}>
              {isHi
                ? "इस खोज के लिए कोई सरकारी मंडी भाव उपलब्ध नहीं है"
                : "No Mandi price records found matching your filters"}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#64748b",
                maxWidth: "560px",
                marginLeft: "auto",
                marginRight: "auto",
                lineHeight: 1.5,
              }}
            >
              {isHi
                ? "व्यापार AI केवल data.gov.in के सत्यापित सरकारी रिकॉर्ड प्रदर्शित करता है। जब किसी मंडी से भाव प्राप्त नहीं होते, तो कोई नकली आंकड़े नहीं गढ़े जाते। कृपया ज़िला या जींस बदलकर पुनः खोजें।"
                : "Vyapaar AI displays authentic Government Agmarknet records only and does not invent synthetic prices. Try broadening your search or resetting filters to see available market arrivals."}
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                marginTop: "16px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#059669",
                backgroundColor: "#ecfdf5",
                border: "1.5px solid #a7f3d0",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              {isHi ? "फ़िल्टर हटाएं व सभी भाव देखें" : "Reset Filters & View All Available Mandis"}
            </button>
          </div>
        )}

        {/* Authentic Returned Records Table */}
        {!loading && records.length > 0 && (
          <div>
            {/* Table Meta Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: "14px",
                padding: "10px 14px",
                backgroundColor: "#f1f5f9",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px", color: "#334155" }}>
                  <span>Matching Records:</span>{" "}
                  <strong style={{ color: "#0f172a", fontSize: "14px" }}>{records.length}</strong>
                  {totalCount > records.length ? (
                    <span style={{ color: "#64748b" }}> of {totalCount} total</span>
                  ) : null}
                </span>

                {reportingDateFound && (
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      backgroundColor: "#e0f2fe",
                      color: "#0369a1",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Calendar size={13} />
                    <span>Arrival Date: {reportingDateFound}</span>
                  </span>
                )}
              </div>

              {/* Pagination indicators */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                  Page {currentPageNum} of {totalPagesNum}
                </span>
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={offset <= 0}
                  style={{
                    padding: "5px 9px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: offset <= 0 ? "#f1f5f9" : "#ffffff",
                    color: offset <= 0 ? "#94a3b8" : "#334155",
                    cursor: offset <= 0 ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                  title="Previous Page"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={offset + limit >= totalCount}
                  style={{
                    padding: "5px 9px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: offset + limit >= totalCount ? "#f1f5f9" : "#ffffff",
                    color: offset + limit >= totalCount ? "#94a3b8" : "#334155",
                    cursor: offset + limit >= totalCount ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                  title="Next Page"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Responsive Table */}
            <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                  textAlign: "left",
                  minWidth: "720px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#f8fafc",
                      borderBottom: "1.5px solid #cbd5e1",
                      color: "#334155",
                      fontWeight: 800,
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    <th style={{ padding: "12px 14px" }}>Commodity & Variety</th>
                    <th style={{ padding: "12px 14px" }}>State & District</th>
                    <th style={{ padding: "12px 14px" }}>Mandi / Market</th>
                    <th style={{ padding: "12px 14px" }}>Reporting Date</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Min Price</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Max Price</th>
                    <th style={{ padding: "12px 14px", textAlign: "right", backgroundColor: "#ecfdf5" }}>
                      <span style={{ color: "#065f46", fontWeight: 800 }}>Modal Price (₹/Q)</span>
                    </th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>
                      <span style={{ color: "#0284c7", fontWeight: 700 }}>Per Kg (₹)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, idx) => (
                    <tr
                      key={`${rec.market}-${rec.commodity}-${rec.arrival_date}-${idx}`}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fcfcfc",
                      }}
                    >
                      {/* Commodity & Variety */}
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>{rec.commodity}</div>
                        {rec.variety && rec.variety !== "General" && (
                          <div style={{ fontSize: "11.5px", color: "#64748b" }}>{rec.variety}</div>
                        )}
                      </td>

                      {/* State & District */}
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ fontWeight: 700, color: "#334155" }}>{rec.district}</div>
                        <div style={{ fontSize: "11.5px", color: "#64748b" }}>{rec.state}</div>
                      </td>

                      {/* Market Name */}
                      <td style={{ padding: "11px 14px" }}>
                        <strong style={{ color: "#0f172a" }}>{rec.market}</strong>
                      </td>

                      {/* Reporting Date */}
                      <td style={{ padding: "11px 14px" }}>
                        <span
                          style={{
                            fontSize: "12px",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            backgroundColor: "#f1f5f9",
                            color: "#475569",
                            fontFamily: "monospace",
                          }}
                        >
                          {rec.arrival_date || "Today"}
                        </span>
                      </td>

                      {/* Min Price */}
                      <td style={{ padding: "11px 14px", textAlign: "right", color: "#475569" }}>
                        {rec.min_price != null ? `₹${rec.min_price.toLocaleString("en-IN")}` : "—"}
                      </td>

                      {/* Max Price */}
                      <td style={{ padding: "11px 14px", textAlign: "right", color: "#475569" }}>
                        {rec.max_price != null ? `₹${rec.max_price.toLocaleString("en-IN")}` : "—"}
                      </td>

                      {/* Modal Price */}
                      <td
                        style={{
                          padding: "11px 14px",
                          textAlign: "right",
                          backgroundColor: "#f0fdf4",
                        }}
                      >
                        {rec.modal_price != null ? (
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 800,
                              color: "#059669",
                            }}
                          >
                            ₹{rec.modal_price.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Per Kg */}
                      <td style={{ padding: "11px 14px", textAlign: "right" }}>
                        {rec.price_per_kg != null ? (
                          <span
                            style={{
                              fontWeight: 700,
                              color: "#0284c7",
                            }}
                          >
                            ₹{rec.price_per_kg.toFixed(2)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Attribution & Data Nature Disclaimer */}
            <div
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#64748b",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              <Info size={16} style={{ color: "#0284c7", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ color: "#1e293b" }}>Official Market Reporting Notice:</strong>{" "}
                Prices displayed above reflect daily wholesale APMC mandi arrivals recorded through the Ministry of Agriculture's Agmarknet portal. These represent official periodic batch filings rather than tick-by-tick real-time stock ticker data.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
