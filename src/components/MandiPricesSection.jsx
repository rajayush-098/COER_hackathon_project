import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Tag,
  SlidersHorizontal,
} from "lucide-react";
import { API_ROUTES } from "../apiRoutes";

const MANDI_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";

export default function MandiPricesSection({
  defaultState = "",
  defaultDistrict = "",
  category = "",
  lang = "hi",
}) {
  const isHi = lang === "hi" || lang === "hinglish";

  // Filter States initialized with defaults
  const [state, setState] = useState(defaultState || "");
  const [district, setDistrict] = useState(defaultDistrict || "");
  const [market, setMarket] = useState("");
  const [commodity, setCommodity] = useState("");

  // Data & Network States
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [configured, setConfigured] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastUpdatedDate, setLastUpdatedDate] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch commodity suggestions for the active business category
  useEffect(() => {
    let active = true;
    fetch(
      `${API_ROUTES.MANDI_PRICES.replace("/prices", "/suggestions")}?category=${encodeURIComponent(category || "")}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load suggestions");
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        }
      })
      .catch(() => {
        if (!active) return;
        setSuggestions(["Potato", "Onion", "Tomato", "Wheat", "Mustard", "Rice", "Gram"]);
      });

    return () => {
      active = false;
    };
  }, [category]);

  // Main Mandi Data Fetcher for manual searches/refresh
  const fetchPrices = useCallback(
    async (overrideParams = {}) => {
      setLoading(true);
      setErrorMsg("");

      const qState = overrideParams.state !== undefined ? overrideParams.state : state;
      const qDistrict = overrideParams.district !== undefined ? overrideParams.district : district;
      const qMarket = overrideParams.market !== undefined ? overrideParams.market : market;
      const qCommodity = overrideParams.commodity !== undefined ? overrideParams.commodity : commodity;

      const params = new URLSearchParams();
      if (qState && qState.trim()) params.append("state", qState.trim());
      if (qDistrict && qDistrict.trim()) params.append("district", qDistrict.trim());
      if (qMarket && qMarket.trim()) params.append("market", qMarket.trim());
      if (qCommodity && qCommodity.trim()) params.append("commodity", qCommodity.trim());
      params.append("limit", "25");

      try {
        const res = await fetch(`${API_ROUTES.MANDI_PRICES}?${params.toString()}`);
        const data = await res.json();

        setConfigured(data.configured !== false);

        if (!res.ok || data.success === false) {
          setErrorMsg(data.error || "Failed to fetch Mandi commodity prices.");
          setRecords([]);
          setTotalCount(0);
        } else {
          setRecords(Array.isArray(data.records) ? data.records : []);
          setTotalCount(data.total || (data.records ? data.records.length : 0));
          setLastUpdatedDate(data.updated_date || "");
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
    [state, district, market, commodity]
  );

  // Initial fetch on mount or when default district/state changes
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (defaultState && defaultState.trim()) params.append("state", defaultState.trim());
    if (defaultDistrict && defaultDistrict.trim()) params.append("district", defaultDistrict.trim());
    params.append("limit", "25");

    fetch(`${API_ROUTES.MANDI_PRICES}?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setConfigured(data.configured !== false);
        if (data.success === false) {
          setErrorMsg(data.error || "Failed to fetch Mandi commodity prices.");
          setRecords([]);
          setTotalCount(0);
        } else {
          setRecords(Array.isArray(data.records) ? data.records : []);
          setTotalCount(data.total || (data.records ? data.records.length : 0));
          setLastUpdatedDate(data.updated_date || "");
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

  const handleQuickCommodityClick = (com) => {
    setCommodity(com);
    fetchPrices({ commodity: com });
  };

  const handleResetFilters = () => {
    setState("");
    setDistrict("");
    setMarket("");
    setCommodity("");
    fetchPrices({ state: "", district: "", market: "", commodity: "" });
  };

  const getSectionTitle = () => {
    switch (lang) {
      case "bn":
        return "লাইভ মান্ডি পণ্যের বাজার দর (data.gov.in)";
      case "mr":
        return "थेट बाजार समिती (मंडी) दर (data.gov.in)";
      case "te":
        return "లైవ్ మార్కెట్ (మండీ) సరుకుల ధరలు (data.gov.in)";
      case "ta":
        return "நேரலை மண்டி வேளாண் பொருட்கள் விலை (data.gov.in)";
      case "hi":
      case "hinglish":
        return "लाइव मंडी कृषि जींस भाव (data.gov.in)";
      default:
        return "Live Mandi Commodity Benchmark Prices (data.gov.in)";
    }
  };

  const getSectionSub = () => {
    switch (lang) {
      case "bn":
        return "ভারত সরকারের data.gov.in (Agmarknet) পোর্টাল থেকে প্রাপ্ত দৈনিক পাইকারি বাজার দর।";
      case "mr":
        return "भारत सरकारच्या data.gov.in (Agmarknet) पोर्टलवरून थेट दररोजचे घाऊक बाजार भाव.";
      case "te":
        return "భారత ప్రభుత్వ data.gov.in (Agmarknet) పోర్టల్ నుండి నేరుగా రోజువారీ మార్కెట్ ధరలు.";
      case "ta":
        return "இந்திய அரசின் data.gov.in (Agmarknet) போர்டல் மூலமான நேரலை தினசரி மொத்த விற்பனை விலைகள்.";
      case "hi":
      case "hinglish":
        return "भारत सरकार के data.gov.in (Agmarknet) पोर्टल से प्राप्त वास्तविक दैनिक थोक मंडी भाव।";
      default:
        return "Official daily wholesale market benchmark prices sourced from Ministry of Agriculture via data.gov.in.";
    }
  };

  return (
    <div
      className="mandi-section-card"
      style={{
        marginTop: "24px",
        padding: "20px 22px",
        background: "#ffffff",
        borderRadius: "14px",
        border: "1.5px solid #cbd5e1",
        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "12px",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "14px",
          marginBottom: "16px",
        }}
      >
        <div style={{ flex: "1 1 320px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                backgroundColor: "#ecfdf5",
                color: "#059669",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={16} />
            </span>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
              {getSectionTitle()}
            </h3>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "6px",
                backgroundColor: "#e0f2fe",
                color: "#0284c7",
                border: "1px solid #bae6fd",
              }}
            >
              Dataset: 9ef84268-d588-465a-a308-a864a43d0070
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "6px",
                backgroundColor: "#fef3c7",
                color: "#92400e",
                border: "1px solid #fde68a",
              }}
            >
              {lang === "bn" ? "ইউনিট: ₹/কুইন্টাল (১০০ কেজি)" : isHi ? "इकाई: ₹/क्विंटल (100 किग्रा)" : "Unit: ₹/Quintal (100 kg)"}
            </span>
          </div>
          <p style={{ margin: "4px 0 0 36px", fontSize: "12.5px", color: "#64748b" }}>
            {getSectionSub()}
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: showFilters ? "#f1f5f9" : "#ffffff",
              color: "#334155",
              fontSize: "12.5px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <SlidersHorizontal size={14} />
            <span>
              {showFilters
                ? (lang === "bn" ? "ফিল্টার লুকান" : isHi ? "फ़िल्टर छिपाएं" : "Hide Filters")
                : (lang === "bn" ? "ফিল্টার নির্বাচন" : isHi ? "फ़िल्टर बदलें" : "Filter Mandis")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => fetchPrices()}
            disabled={loading}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "1px solid #10b981",
              backgroundColor: "#10b981",
              color: "#ffffff",
              fontSize: "12.5px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: loading ? "wait" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>
              {loading
                ? (lang === "bn" ? "লোড হচ্ছে..." : isHi ? "लोड हो रहा है..." : "Fetching...")
                : (lang === "bn" ? "তাজা দর দেখুন" : isHi ? "ताज़ा भाव देखें" : "Refresh")}
            </span>
          </button>
        </div>
      </div>

      {/* Unconfigured API Key Notice */}
      {!configured && (
        <div
          style={{
            backgroundColor: "#fffbeb",
            border: "1.5px solid #fde68a",
            borderRadius: "10px",
            padding: "14px 16px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <AlertCircle size={20} style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ color: "#92400e", fontSize: "14px" }}>
              {lang === "bn"
                ? "data.gov.in API Key কনফিগার করা নেই"
                : isHi
                ? "data.gov.in API Key सर्वर पर सेट नहीं है"
                : "data.gov.in API Key Required"}
            </strong>
            <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#b45309", lineHeight: 1.5 }}>
              {lang === "bn"
                ? "বাস্তব মান্ডি দর দেখতে আপনার .env ফাইলে DATA_GOV_IN_API_KEY যোগ করুন।"
                : isHi
                ? "वास्तविक मंडी भाव प्राप्त करने के लिए अपनी सर्वर .env फ़ाइल में DATA_GOV_IN_API_KEY जोड़ें।"
                : "To access live Government Mandi prices, set DATA_GOV_IN_API_KEY in your server's .env file."}
            </p>
          </div>
        </div>
      )}

      {/* Suggested Quick Commodities */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "12px", fontWeight: 700, color: "#475569" }}>
            <Tag size={13} style={{ color: "#059669" }} />
            <span>
              {lang === "bn"
                ? "দ্রুত পণ্য নির্বাচন করুন:"
                : lang === "mr"
                ? "महत्त्वाच्या वस्तू निवडा:"
                : lang === "te"
                ? "సరుకును ఎంచుకోండి:"
                : lang === "ta"
                ? "பொருளைத் தேர்ந்தெடுக்கவும்:"
                : isHi
                ? "अनुशंसित प्रमुख कृषि जींस (एक क्लिक में भाव देखें):"
                : "Suggested Commodities (Click to check price):"}
            </span>
          </div>
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
                    borderRadius: "20px",
                    border: isSelected ? "1.5px solid #059669" : "1px solid #cbd5e1",
                    backgroundColor: isSelected ? "#ecfdf5" : "#f8fafc",
                    color: isSelected ? "#065f46" : "#334155",
                    fontSize: "12px",
                    fontWeight: isSelected ? 700 : 500,
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
      )}

      {/* Expandable Search / Filter Panel */}
      {showFilters && (
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "14px 16px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                {lang === "bn" ? "পণ্য (Commodity)" : isHi ? "जींस / उत्पाद (Commodity)" : "Commodity"}
              </label>
              <input
                type="text"
                placeholder="e.g. Potato, Wheat, Mustard..."
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  fontSize: "12.5px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                {lang === "bn" ? "রাজ্য (State)" : isHi ? "राज्य (State)" : "State"}
              </label>
              <input
                type="text"
                placeholder="e.g. Uttar Pradesh, Punjab..."
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  fontSize: "12.5px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                {lang === "bn" ? "জেলা (District)" : isHi ? "जिला (District)" : "District"}
              </label>
              <input
                type="text"
                placeholder="e.g. Meerut, Agra..."
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  fontSize: "12.5px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                {lang === "bn" ? "নির্দিষ্ট মান্ডি / বাজার" : isHi ? "मंडी / बाज़ार (Market)" : "Market / Mandi"}
              </label>
              <input
                type="text"
                placeholder="e.g. Meerut, Mawana..."
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  fontSize: "12.5px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#64748b",
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {lang === "bn" ? "ফিল্টার মুছুন" : isHi ? "फ़िल्टर हटाएं" : "Clear All"}
            </button>
            <button
              type="button"
              onClick={() => fetchPrices()}
              disabled={loading}
              style={{
                padding: "6px 16px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#ffffff",
                backgroundColor: "#2563eb",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "wait" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Search size={13} />
              <span>{lang === "bn" ? "অনুসন্ধান করুন" : isHi ? "खोजें" : "Apply Filters"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "14px",
            color: "#991b1b",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div
          style={{
            padding: "36px 16px",
            textAlign: "center",
            color: "#64748b",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <RefreshCw size={24} className="animate-spin text-emerald-600" />
          <span style={{ fontSize: "13.5px", fontWeight: 600 }}>
            {lang === "bn"
              ? "data.gov.in থেকে লাইভ মান্ডি দর সংগ্রহ করা হচ্ছে..."
              : isHi
              ? "data.gov.in से लाइव मंडी भाव लोड किए जा रहे हैं..."
              : "Querying official Mandi commodity prices from data.gov.in..."}
          </span>
        </div>
      )}

      {/* Empty State: Zero Records */}
      {!loading && records.length === 0 && !errorMsg && (
        <div
          style={{
            padding: "32px 16px",
            textAlign: "center",
            backgroundColor: "#f8fafc",
            borderRadius: "10px",
            border: "1px dashed #cbd5e1",
          }}
        >
          <p style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 700, color: "#334155" }}>
            {lang === "bn"
              ? "এই ফিল্টারের জন্য কোন মান্ডি দর রেকর্ড পাওয়া যায়নি"
              : isHi
              ? "इस फ़िल्टर के लिए कोई सरकारी मंडी भाव उपलब्ध नहीं है"
              : "No Mandi price records found for this query"}
          </p>
          <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b", maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}>
            {lang === "bn"
              ? "কৃষি মন্ত্রণালয় কেবল আসল ডাটা প্রদর্শন করে। অনুগ্রহ করে জেলা বা পণ্যের নাম পরিবর্তন করে পুনরায় চেষ্টা করুন।"
              : isHi
              ? "व्यापार AI केवल data.gov.in के सत्यापित रिकॉर्ड प्रदर्शित करता है। कृपया फ़िल्टर बदलकर दोबारा खोजें।"
              : "Vyapaar AI displays authentic prices only and does not synthesize fake numbers. Try clearing the market/commodity filter."}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              marginTop: "12px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#2563eb",
              backgroundColor: "#ffffff",
              border: "1px solid #bfdbfe",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {lang === "bn" ? "ফিল্টার রিসেট করুন" : isHi ? "फ़िल्टर साफ़ करें" : "Reset & View All"}
          </button>
        </div>
      )}

      {/* Actual Returned Prices Grid / Table */}
      {!loading && records.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            <span>
              {lang === "bn" ? "মোট রেকর্ড:" : isHi ? "कुल प्राप्त रिकॉर्ड:" : "Showing records:"}{" "}
              <strong style={{ color: "#0f172a" }}>{records.length}</strong>
              {totalCount > records.length ? ` of ${totalCount}` : ""}
            </span>
            {lastUpdatedDate && (
              <span>
                {lang === "bn" ? "সর্বশেষ আপডেট:" : isHi ? "अंतिम अपडेट:" : "Last updated:"}{" "}
                <strong>{lastUpdatedDate}</strong>
              </span>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                textAlign: "left",
                minWidth: "680px",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f1f5f9",
                    borderBottom: "1.5px solid #cbd5e1",
                    color: "#334155",
                    fontWeight: 700,
                    fontSize: "12px",
                  }}
                >
                  <th style={{ padding: "10px 12px" }}>
                    {lang === "bn" ? "পণ্য ও জাত" : isHi ? "जींस व किस्म" : "Commodity & Variety"}
                  </th>
                  <th style={{ padding: "10px 12px" }}>
                    {lang === "bn" ? "মান্ডি ও অবস্থান" : isHi ? "मंडी व स्थान" : "Market (Mandi)"}
                  </th>
                  <th style={{ padding: "10px 12px" }}>
                    {lang === "bn" ? "তারিখ" : isHi ? "दिनांक" : "Report Date"}
                  </th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>
                    {lang === "bn" ? "সর্বনিম্ন দর" : isHi ? "न्यूनतम भाव" : "Min Price"}
                  </th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>
                    {lang === "bn" ? "সর্বোচ্চ দর" : isHi ? "अधिकतम भाव" : "Max Price"}
                  </th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>
                    <span style={{ color: "#047857", fontWeight: 800 }}>
                      {lang === "bn" ? "মডেল দর (Modal)" : isHi ? "मॉडल भाव (Modal)" : "Modal Price"}
                    </span>
                  </th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>
                    <span style={{ color: "#0369a1", fontWeight: 700 }}>
                      {lang === "bn" ? "খুচরা সমতুল্য" : isHi ? "प्रति किग्रा" : "Per Kg"}
                    </span>
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
                    <td style={{ padding: "10px 12px" }}>
                      <strong style={{ color: "#0f172a" }}>{rec.commodity}</strong>
                      {rec.variety && rec.variety !== "General" && (
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          {rec.variety}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{rec.market}</div>
                      <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                        {rec.district ? `${rec.district}, ` : ""}{rec.state}
                      </div>
                    </td>

                    <td style={{ padding: "10px 12px", color: "#475569", fontSize: "12px" }}>
                      {rec.arrival_date || "—"}
                    </td>

                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#64748b" }}>
                      {rec.min_price != null ? `₹${rec.min_price.toLocaleString("en-IN")}` : "—"}
                    </td>

                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#64748b" }}>
                      {rec.max_price != null ? `₹${rec.max_price.toLocaleString("en-IN")}` : "—"}
                    </td>

                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      {rec.modal_price != null ? (
                        <div>
                          <strong style={{ color: "#047857", fontSize: "13.5px" }}>
                            ₹{rec.modal_price.toLocaleString("en-IN")}
                          </strong>
                          <span style={{ fontSize: "10.5px", color: "#64748b", display: "block" }}>
                            /Quintal
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      {rec.price_per_kg != null ? (
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#0284c7",
                            backgroundColor: "#f0f9ff",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            border: "1px solid #bae6fd",
                            fontSize: "12px",
                          }}
                        >
                          ₹{rec.price_per_kg.toFixed(2)}/kg
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

          {/* Footer Transparency Badge */}
          <div
            style={{
              marginTop: "12px",
              padding: "8px 12px",
              backgroundColor: "#f8fafc",
              borderRadius: "6px",
              fontSize: "11px",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={13} style={{ color: "#10b981" }} />
              <span>
                {lang === "bn"
                  ? "সরাসরি ভারত সরকারের এগম্যার্কনেট ডেটাসেট (data.gov.in) দ্বারা যাচাইকৃত।"
                  : isHi
                  ? "कृषि मंत्रालय के आधिकारिक Agmarknet डेटाबेस (data.gov.in) से सत्यापित।"
                  : "Verified authentic market arrival data via Agmarknet Open Data (data.gov.in)."}
              </span>
            </div>
            <span>Resource UUID: {MANDI_RESOURCE_ID}</span>
          </div>
        </div>
      )}
    </div>
  );
}
