import { useState, useEffect, useMemo, useCallback } from "react";
import {
  History,
  X,
  Search,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  BadgeAlert,
  Loader2,
  Sparkles,
} from "lucide-react";
import { API_ROUTES } from "../apiRoutes";

export default function BusinessHistoryModal({
  isOpen,
  onClose,
  currentBusiness,
  lang = "en",
  t = {},
  formatCurrency,
  onLoadEvaluation,
}) {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' or 'current'
  const [selectedEvalId, setSelectedEvalId] = useState(null);
  const [compareEvalIds, setCompareEvalIds] = useState([]); // up to 2 IDs
  const [copiedCode, setCopiedCode] = useState(null);

  const isHi = lang === "hi";

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_ROUTES.BUSINESS_HISTORY);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load business history from MySQL database.");
      }
      setEvaluations(Array.isArray(data.evaluations) ? data.evaluations : []);
    } catch (err) {
      console.warn("[BusinessHistory] Fetch error:", err);
      setError(err?.message || "Failed to connect to MySQL database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    if (!isOpen) return;

    fetch(API_ROUTES.BUSINESS_HISTORY)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          if (data?.success && Array.isArray(data.evaluations)) {
            setEvaluations(data.evaluations);
          } else {
            setError(data?.error || "Failed to load business history from MySQL database.");
          }
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err?.message || "Failed to connect to MySQL database.");
        }
      });

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Copy report code with feedback
  const handleCopyCode = (code, e) => {
    if (e) e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // Group by business name to identify latest vs older evaluations
  const businessEvaluationsMap = useMemo(() => {
    const map = new Map();
    evaluations.forEach((item) => {
      const key = (item.business_name || "").trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(item);
    });
    return map;
  }, [evaluations]);

  // Filtered evaluations
  const filteredEvaluations = useMemo(() => {
    let list = [...evaluations];

    // Filter by current business name if selected
    if (activeFilter === "current" && currentBusiness?.business) {
      const currKey = currentBusiness.business.trim().toLowerCase();
      list = list.filter(
        (e) => (e.business_name || "").trim().toLowerCase() === currKey
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter((e) => {
        const name = (e.business_name || "").toLowerCase();
        const code = (e.report_code || "").toLowerCase();
        const dist = (e.district || "").toLowerCase();
        const cat = (e.category || "").toLowerCase();
        const scheme = (e.matched_scheme_name || "").toLowerCase();
        return (
          name.includes(q) ||
          code.includes(q) ||
          dist.includes(q) ||
          cat.includes(q) ||
          scheme.includes(q)
        );
      });
    }

    return list;
  }, [evaluations, activeFilter, currentBusiness, searchTerm]);

  // Toggle comparison selection (max 2)
  const toggleCompare = (id, e) => {
    if (e) e.stopPropagation();
    setCompareEvalIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  // Currently selected full evaluation record
  const selectedRecord = useMemo(() => {
    return evaluations.find((e) => e.evaluation_id === selectedEvalId) || null;
  }, [evaluations, selectedEvalId]);

  // Comparison records
  const compareRecords = useMemo(() => {
    if (compareEvalIds.length !== 2) return null;
    const a = evaluations.find((e) => e.evaluation_id === compareEvalIds[0]);
    const b = evaluations.find((e) => e.evaluation_id === compareEvalIds[1]);
    if (!a || !b) return null;
    // Order chronologically so newer is first
    const dateA = new Date(a.evaluated_at || 0).getTime();
    const dateB = new Date(b.evaluated_at || 0).getTime();
    return dateA >= dateB ? { newer: a, older: b } : { newer: b, older: a };
  }, [evaluations, compareEvalIds]);

  const handleLoadRecord = (record) => {
    if (!onLoadEvaluation) return;

    // Use full report_payload if available, or reconstruct standard result object
    if (record.report_payload && typeof record.report_payload === "object") {
      onLoadEvaluation(record.report_payload);
    } else {
      const reconstructed = {
        business: record.business_name,
        category: record.category,
        state: record.state,
        district: record.district,
        block: record.block || record.district,
        location: record.village_location || record.district,
        pin: record.pincode || "",
        experience: record.experience_level || "Beginner",
        udyam_number: record.udyam_number || "",
        investment: record.margin_capital,
        monthly_revenue: record.monthly_revenue,
        monthly_expenses: record.monthly_expenses,
        feasibilityVerdict: record.feasibility_verdict || "Feasible & Safe",
        feasibility: record.feasibility_verdict || "Feasible & Safe",
        financial_analysis: {
          monthly_revenue: Number(record.monthly_revenue) || 0,
          monthly_expenses: Number(record.monthly_expenses) || 0,
          monthly_profit: Number(record.monthly_profit) || 0,
          yearly_profit: Number(record.yearly_profit) || 0,
        },
        scheme_analysis: {
          project_cost: Number(record.project_cost) || 0,
          margin_capital: Number(record.margin_capital) || 0,
          beneficiary_contribution: Number(record.margin_capital) || 0,
          eligible_loan: Number(record.eligible_loan) || 0,
          scheme_name: record.matched_scheme_name || "Matched Scheme",
          interest_rate: Number(record.interest_rate) || 8.5,
          loan_tenure_months: Number(record.tenure_months) || 60,
          moratorium_months: Number(record.moratorium_months) || 6,
        },
        loan_affordability: {
          monthly_emi: Number(record.monthly_emi) || 0,
          affordability_status: record.affordability_status || "Affordable",
        },
      };
      onLoadEvaluation(reconstructed);
    }

    onClose();
  };

  const formatMoney = (val) => {
    if (val == null || val === "" || isNaN(Number(val))) return "₹0";
    if (formatCurrency) return formatCurrency(Number(val));
    return `₹${Math.round(Number(val)).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isHi ? "hi-IN" : "en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateStr);
    }
  };

  const getVerdictStyle = (verdict) => {
    const v = String(verdict || "").toLowerCase();
    if (v.includes("high") || v.includes("profitable") || v.includes("बहुत")) {
      return { bg: "#dcfce7", color: "#15803d", border: "#86efac" };
    }
    if (v.includes("feasible") || v.includes("safe") || v.includes("सुरक्षित")) {
      return { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" };
    }
    if (v.includes("moderate") || v.includes("care") || v.includes("सावधानी")) {
      return { bg: "#fef3c7", color: "#92400e", border: "#fde68a" };
    }
    return { bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5" };
  };

  const getAffordStyle = (afford) => {
    const a = String(afford || "").toLowerCase();
    if (a.includes("comfortable") || a.includes("highly")) {
      return { bg: "#dcfce7", color: "#166534" };
    }
    if (a.includes("moderately") || a.includes("adequate")) {
      return { bg: "#e0f2fe", color: "#0369a1" };
    }
    if (a.includes("high repayment") || a.includes("burden") || a.includes("stretch")) {
      return { bg: "#fef3c7", color: "#b45309" };
    }
    return { bg: "#fee2e2", color: "#991b1b" };
  };

  if (!isOpen) return null;

  return (
    <div
      className="business-history-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        className="business-history-modal"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "1240px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          border: "1px solid #cbd5e1",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                backgroundColor: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #a7f3d0",
              }}
            >
              <History size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                  {t.businessHistory || (isHi ? "व्यवसाय इतिहास" : "Business History")}
                </h3>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    backgroundColor: "#065f46",
                    color: "#ffffff",
                    letterSpacing: "0.3px",
                  }}
                >
                  {t.businessHistoryBadge || (isHi ? "सहेजे गए मूल्यांकन" : "Past Evaluations")} ({evaluations.length})
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#0284c7",
                    backgroundColor: "#e0f2fe",
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  Aiven MySQL 8.4
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748b" }}>
                {t.businessHistoryDesc ||
                  (isHi
                    ? "पूर्व में सहेजे गए व्यापार देखें और वित्तीय मूल्यांकनों की तुलना करें।"
                    : "Review previously saved businesses and compare financial evaluations.")}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={fetchHistory}
              disabled={loading}
              title={t.refresh || "Refresh"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#475569",
                fontSize: "13px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>{t.refresh || (isHi ? "रिफ्रेश करें" : "Refresh")}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Filters, & Comparison trigger */}
        <div
          style={{
            padding: "12px 24px",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {/* Search Box */}
          <div
            style={{
              position: "relative",
              flex: "1 1 260px",
              maxWidth: "400px",
            }}
          >
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              type="text"
              placeholder={isHi ? "व्यापार नाम, जिला या रिपोर्ट कोड खोजें..." : "Search by name, district, or report code..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                fontSize: "13px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                outline: "none",
                backgroundColor: "#f8fafc",
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "12.5px",
                fontWeight: "600",
                border: activeFilter === "all" ? "1.5px solid #0f766e" : "1px solid #cbd5e1",
                backgroundColor: activeFilter === "all" ? "#ecfdf5" : "#ffffff",
                color: activeFilter === "all" ? "#065f46" : "#475569",
                cursor: "pointer",
              }}
            >
              {t.filterAll || (isHi ? "सभी सहेजे गए मूल्यांकन" : "All Saved Evaluations")} ({evaluations.length})
            </button>

            {currentBusiness?.business && (
              <button
                type="button"
                onClick={() => setActiveFilter("current")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  border: activeFilter === "current" ? "1.5px solid #0f766e" : "1px solid #cbd5e1",
                  backgroundColor: activeFilter === "current" ? "#ecfdf5" : "#ffffff",
                  color: activeFilter === "current" ? "#065f46" : "#475569",
                  cursor: "pointer",
                }}
              >
                {t.filterCurrent || (isHi ? "केवल वर्तमान व्यापार" : "Current Business Only")}:{" "}
                <strong>{currentBusiness.business}</strong>
              </button>
            )}

            {compareEvalIds.length > 0 && (
              <button
                type="button"
                onClick={() => setCompareEvalIds([])}
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  backgroundColor: "#fef3c7",
                  border: "1px solid #fde68a",
                  color: "#92400e",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>{isHi ? `तुलना: ${compareEvalIds.length}/2 चयनित` : `Comparing: ${compareEvalIds.length}/2`}</span>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", backgroundColor: "#f8fafc" }}>
          {/* Error Banner */}
          {error && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 16px",
                borderRadius: "8px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <BadgeAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Side-by-Side Comparison Box if 2 records are checked */}
          {compareRecords && (
            <div
              style={{
                marginBottom: "20px",
                padding: "16px 20px",
                borderRadius: "12px",
                backgroundColor: "#ffffff",
                border: "2px solid #0f766e",
                boxShadow: "0 4px 12px rgba(15, 118, 110, 0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={18} color="#0f766e" />
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                    {isHi ? "मूल्यांकन तुलना (Evaluation Comparison)" : "Evaluation Comparison"}
                  </h4>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    ({formatDate(compareRecords.newer.evaluated_at)} vs {formatDate(compareRecords.older.evaluated_at)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCompareEvalIds([])}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#64748b",
                    fontSize: "12px",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  {isHi ? "तुलना बंद करें" : "Clear comparison"}
                </button>
              </div>

              {/* Comparison Metric Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                {/* Monthly Profit comparison */}
                {(() => {
                  const newProfit = Number(compareRecords.newer.monthly_profit) || 0;
                  const oldProfit = Number(compareRecords.older.monthly_profit) || 0;
                  const diff = newProfit - oldProfit;
                  return (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      <span style={{ fontSize: "11.5px", color: "#166534", fontWeight: "600" }}>
                        {t.colProfit || "Monthly Net Profit"}
                      </span>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
                        <strong style={{ fontSize: "16px", color: "#15803d" }}>{formatMoney(newProfit)}</strong>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>vs {formatMoney(oldProfit)}</span>
                      </div>
                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "11.5px",
                          fontWeight: "700",
                          color: diff >= 0 ? "#15803d" : "#b91c1c",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        {diff >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        <span>
                          {diff >= 0 ? "+" : ""}
                          {formatMoney(diff)} ({oldProfit > 0 ? `${((diff / oldProfit) * 100).toFixed(1)}%` : "N/A"})
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Monthly Revenue comparison */}
                {(() => {
                  const newRev = Number(compareRecords.newer.monthly_revenue) || 0;
                  const oldRev = Number(compareRecords.older.monthly_revenue) || 0;
                  const diff = newRev - oldRev;
                  return (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        backgroundColor: "#eff6ff",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <span style={{ fontSize: "11.5px", color: "#1e40af", fontWeight: "600" }}>
                        {t.colRevenue || "Monthly Sales"}
                      </span>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
                        <strong style={{ fontSize: "16px", color: "#1d4ed8" }}>{formatMoney(newRev)}</strong>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>vs {formatMoney(oldRev)}</span>
                      </div>
                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "11.5px",
                          fontWeight: "700",
                          color: diff >= 0 ? "#1d4ed8" : "#b91c1c",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <span>
                          {diff >= 0 ? "+" : ""}
                          {formatMoney(diff)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Monthly EMI comparison */}
                {(() => {
                  const newEmi = Number(compareRecords.newer.monthly_emi) || 0;
                  const oldEmi = Number(compareRecords.older.monthly_emi) || 0;
                  const diff = newEmi - oldEmi;
                  return (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        backgroundColor: "#fff7ed",
                        border: "1px solid #fed7aa",
                      }}
                    >
                      <span style={{ fontSize: "11.5px", color: "#9a3412", fontWeight: "600" }}>
                        {t.colEmi || "Monthly EMI"}
                      </span>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
                        <strong style={{ fontSize: "16px", color: "#c2410c" }}>{formatMoney(newEmi)}</strong>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>vs {formatMoney(oldEmi)}</span>
                      </div>
                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "11.5px",
                          fontWeight: "600",
                          color: "#7c2d12",
                        }}
                      >
                        <span>
                          {diff >= 0 ? `+${formatMoney(diff)}` : formatMoney(diff)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Verdict & Affordability comparison */}
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <span style={{ fontSize: "11.5px", color: "#475569", fontWeight: "600" }}>
                    {t.colFeasibility || "Verdict & Affordability"}
                  </span>
                  <div style={{ marginTop: "4px", fontSize: "12.5px", fontWeight: "700", color: "#0f172a" }}>
                    {compareRecords.newer.feasibility_verdict || "Feasible"}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                    {compareRecords.newer.affordability_status || "Affordable"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && evaluations.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 20px",
                color: "#64748b",
              }}
            >
              <Loader2 size={32} className="animate-spin" color="#0f766e" />
              <p style={{ marginTop: "12px", fontSize: "14px", fontWeight: "600" }}>
                {isHi ? "डेटाबेस से रिकॉर्ड लोड हो रहे हैं..." : "Loading historical records from Aiven MySQL..."}
              </p>
            </div>
          ) : filteredEvaluations.length === 0 ? (
            /* Empty State */
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px dashed #cbd5e1",
                padding: "48px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  marginBottom: "16px",
                }}
              >
                <Building2 size={28} />
              </div>
              <h4 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                {t.emptyHistoryTitle || (isHi ? "कोई सहेजा गया मूल्यांकन नहीं मिला" : "No Saved Evaluations Found")}
              </h4>
              <p style={{ margin: "0 0 18px", fontSize: "13.5px", color: "#64748b", maxWidth: "460px" }}>
                {searchTerm
                  ? (isHi ? "आपकी खोज के अनुसार कोई रिकॉर्ड नहीं मिला। कृपया अलग नाम खोजें।" : "No saved evaluations match your search query.")
                  : (t.emptyHistoryDesc || (isHi
                    ? "अपने व्यापार को Aiven MySQL में सुरक्षित करने के लिए सारांश पेज पर 'डेटाबेस में सहेजें' बटन दबाएं।"
                    : "Click 'Save Evaluation' in Overview to securely store your business in Aiven MySQL."))
                }
              </p>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    backgroundColor: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    color: "#334155",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {isHi ? "खोज साफ़ करें" : "Clear Search Filter"}
                </button>
              )}
            </div>
          ) : (
            /* Historical Evaluations Table */
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                    textAlign: "left",
                    minWidth: "1050px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#f1f5f9",
                        borderBottom: "1.5px solid #cbd5e1",
                        color: "#334155",
                        fontWeight: "700",
                        fontSize: "12px",
                        letterSpacing: "0.2px",
                      }}
                    >
                      <th style={{ padding: "12px 14px", width: "40px", textAlign: "center" }}>
                        <span title="Select for side-by-side compare">⚖️</span>
                      </th>
                      <th style={{ padding: "12px 14px" }}>{t.colDate || (isHi ? "दिनांक व समय" : "Date & Time")}</th>
                      <th style={{ padding: "12px 14px" }}>{t.colReportCode || (isHi ? "रिपोर्ट कोड" : "Report Code")}</th>
                      <th style={{ padding: "12px 14px" }}>{t.colBusiness || (isHi ? "व्यापार व स्थान" : "Business & Location")}</th>
                      <th style={{ padding: "12px 14px" }}>{t.colCategory || (isHi ? "श्रेणी" : "Category")}</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>{t.colProjectCost || (isHi ? "कुल लागत" : "Cost")}</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>{t.colLoan || (isHi ? "बैंक लोन" : "Loan")}</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>{t.colProfit || (isHi ? "मासिक मुनाफा" : "Net Profit")}</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>{t.colEmi || (isHi ? "मासिक EMI" : "EMI")}</th>
                      <th style={{ padding: "12px 14px" }}>{t.colAffordability || (isHi ? "किश्त क्षमता" : "Affordability")}</th>
                      <th style={{ padding: "12px 14px" }}>{t.colFeasibility || (isHi ? "फैसला" : "Verdict")}</th>
                      <th style={{ padding: "12px 14px", textAlign: "center" }}>{t.colActions || (isHi ? "कार्रवाई" : "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvaluations.map((item, idx) => {
                      const bizKey = (item.business_name || "").trim().toLowerCase();
                      const group = businessEvaluationsMap.get(bizKey) || [];
                      const isLatest = group.length > 0 && group[0].evaluation_id === item.evaluation_id;
                      const hasMultiple = group.length > 1;
                      const isSelected = selectedEvalId === item.evaluation_id;
                      const isCheckedForCompare = compareEvalIds.includes(item.evaluation_id);
                      const verdictSt = getVerdictStyle(item.feasibility_verdict);
                      const affordSt = getAffordStyle(item.affordability_status);

                      return (
                        <tr
                          key={item.evaluation_id}
                          onClick={() =>
                            setSelectedEvalId(isSelected ? null : item.evaluation_id)
                          }
                          style={{
                            borderBottom: "1px solid #f1f5f9",
                            backgroundColor: isSelected
                              ? "#f0fdf4"
                              : idx % 2 === 0
                              ? "#ffffff"
                              : "#fafafa",
                            cursor: "pointer",
                            transition: "background-color 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected)
                              e.currentTarget.style.backgroundColor =
                                idx % 2 === 0 ? "#ffffff" : "#fafafa";
                          }}
                        >
                          {/* Compare Checkbox */}
                          <td
                            style={{ padding: "12px 14px", textAlign: "center" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isCheckedForCompare}
                              onChange={(e) => toggleCompare(item.evaluation_id, e)}
                              title="Select to compare side-by-side"
                              style={{ cursor: "pointer", width: "15px", height: "15px" }}
                            />
                          </td>

                          {/* Date & Chronological Tag */}
                          <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontWeight: "600", color: "#1e293b" }}>
                                {formatDate(item.evaluated_at)}
                              </span>
                              {hasMultiple && (
                                <span
                                  style={{
                                    fontSize: "10.5px",
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    fontWeight: "700",
                                    backgroundColor: isLatest ? "#dcfce7" : "#f1f5f9",
                                    color: isLatest ? "#15803d" : "#64748b",
                                    border: isLatest ? "1px solid #86efac" : "1px solid #e2e8f0",
                                  }}
                                >
                                  {isLatest
                                    ? (t.badgeLatest || (isHi ? "नवीनतम" : "Latest"))
                                    : (t.badgePrevious || (isHi ? "पिछला" : "Previous"))}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Report Code with 1-click Copy */}
                          <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <code
                                style={{
                                  backgroundColor: "#f1f5f9",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  color: "#0f766e",
                                }}
                              >
                                {item.report_code || `VAI-${item.evaluation_id}`}
                              </code>
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleCopyCode(item.report_code || `VAI-${item.evaluation_id}`, e)
                                }
                                title={isHi ? "कोड कॉपी करें" : "Copy report code"}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  cursor: "pointer",
                                  color: copiedCode === (item.report_code || `VAI-${item.evaluation_id}`) ? "#059669" : "#94a3b8",
                                  padding: "2px",
                                }}
                              >
                                {copiedCode === (item.report_code || `VAI-${item.evaluation_id}`) ? (
                                  <Check size={13} />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Business & Location */}
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ fontWeight: "700", color: "#0f172a" }}>
                              {item.business_name}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                              {item.district}, {item.state} {item.block ? `(${item.block})` : ""}
                            </div>
                          </td>

                          {/* Category */}
                          <td style={{ padding: "12px 14px", color: "#475569" }}>
                            <span
                              style={{
                                fontSize: "12px",
                                backgroundColor: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                padding: "2px 7px",
                                borderRadius: "4px",
                              }}
                            >
                              {item.category}
                            </span>
                          </td>

                          {/* Project Cost */}
                          <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "600", color: "#334155" }}>
                            {formatMoney(item.project_cost)}
                          </td>

                          {/* Eligible Loan */}
                          <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "600", color: "#2563eb" }}>
                            {formatMoney(item.eligible_loan)}
                          </td>

                          {/* Monthly Net Profit (Highlighted) */}
                          <td
                            style={{
                              padding: "12px 14px",
                              textAlign: "right",
                              fontWeight: "700",
                              color: "#059669",
                              fontSize: "13.5px",
                            }}
                          >
                            {formatMoney(item.monthly_profit)}
                          </td>

                          {/* Monthly EMI */}
                          <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "600", color: "#d97706" }}>
                            {formatMoney(item.monthly_emi)}
                          </td>

                          {/* Affordability */}
                          <td style={{ padding: "12px 14px" }}>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "700",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                backgroundColor: affordSt.bg,
                                color: affordSt.color,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.affordability_status || "Standard"}
                            </span>
                          </td>

                          {/* Feasibility Verdict */}
                          <td style={{ padding: "12px 14px" }}>
                            <span
                              style={{
                                fontSize: "11.5px",
                                fontWeight: "700",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                backgroundColor: verdictSt.bg,
                                color: verdictSt.color,
                                border: `1px solid ${verdictSt.border}`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.feasibility_verdict || "Evaluated"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td
                            style={{ padding: "12px 14px", textAlign: "center", whiteSpace: "nowrap" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => setSelectedEvalId(isSelected ? null : item.evaluation_id)}
                                style={{
                                  padding: "4px 8px",
                                  fontSize: "11.5px",
                                  fontWeight: "600",
                                  backgroundColor: isSelected ? "#0f766e" : "#f1f5f9",
                                  color: isSelected ? "#ffffff" : "#475569",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                }}
                              >
                                {isSelected
                                  ? (t.hideDetails || (isHi ? "छुपाएं" : "Hide"))
                                  : (t.viewDetails || (isHi ? "विवरण" : "Details"))}
                              </button>

                              {onLoadEvaluation && (
                                <button
                                  type="button"
                                  onClick={() => handleLoadRecord(item)}
                                  title={isHi ? "डैशबोर्ड में यह मूल्यांकन लोड करें" : "Load evaluation into dashboard"}
                                  style={{
                                    padding: "4px 9px",
                                    fontSize: "11.5px",
                                    fontWeight: "600",
                                    backgroundColor: "#059669",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px",
                                  }}
                                >
                                  <span>{isHi ? "लोड करें" : "Load"}</span>
                                  <ArrowRight size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expandable Details Drawer for Selected Record */}
          {selectedRecord && (
            <div
              style={{
                marginTop: "20px",
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                border: "1.5px solid #0f766e",
                padding: "20px 24px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
                animation: "fadeIn 0.2s ease-in-out",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  borderBottom: "1px solid #e2e8f0",
                  paddingBottom: "14px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h4 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
                      {selectedRecord.business_name}
                    </h4>
                    <span
                      style={{
                        backgroundColor: "#ecfdf5",
                        color: "#065f46",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    >
                      {selectedRecord.report_code || `VAI-${selectedRecord.evaluation_id}`}
                    </span>
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#64748b" }}>
                    {selectedRecord.category} • {selectedRecord.district}, {selectedRecord.state} •{" "}
                    {formatDate(selectedRecord.evaluated_at)}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyCode(
                        selectedRecord.report_code || `VAI-${selectedRecord.evaluation_id}`
                      )
                    }
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#334155",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {copiedCode === (selectedRecord.report_code || `VAI-${selectedRecord.evaluation_id}`) ? (
                      <>
                        <Check size={14} color="#059669" />
                        <span style={{ color: "#059669" }}>{t.copied || "Copied!"}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>{t.copyCode || (isHi ? "कोड कॉपी करें" : "Copy Report Code")}</span>
                      </>
                    )}
                  </button>

                  {onLoadEvaluation && (
                    <button
                      type="button"
                      onClick={() => handleLoadRecord(selectedRecord)}
                      style={{
                        padding: "8px 18px",
                        borderRadius: "8px",
                        backgroundColor: "#0f766e",
                        color: "#ffffff",
                        border: "none",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <ExternalLink size={15} />
                      <span>{isHi ? "इस मूल्यांकन को डैशबोर्ड में देखें" : "Load into Dashboard & Parcha"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Complete 12+ Financial Parameters Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "14px",
                }}
              >
                <div style={{ padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>
                    {t.colProjectCost || "Total Project Cost"}
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
                    {formatMoney(selectedRecord.project_cost)}
                  </div>
                </div>

                <div style={{ padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>
                    {t.colMargin || "Promoter Margin (10%)"}
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#16a34a", marginTop: "2px" }}>
                    {formatMoney(selectedRecord.margin_capital)}
                  </div>
                </div>

                <div style={{ padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>
                    {t.colLoan || "Eligible Bank Loan (90%)"}
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#2563eb", marginTop: "2px" }}>
                    {formatMoney(selectedRecord.eligible_loan)}
                  </div>
                </div>

                <div style={{ padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>
                    {t.colRevenue || "Monthly Revenue"}
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
                    {formatMoney(selectedRecord.monthly_revenue)}
                  </div>
                </div>

                <div style={{ padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>
                    {t.colExpenses || "Monthly Expenses"}
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#dc2626", marginTop: "2px" }}>
                    {formatMoney(selectedRecord.monthly_expenses)}
                  </div>
                </div>

                <div style={{ padding: "10px 14px", backgroundColor: "#ecfdf5", borderRadius: "8px", border: "1px solid #a7f3d0" }}>
                  <span style={{ fontSize: "11.5px", color: "#065f46", fontWeight: "700" }}>
                    {t.colProfit || "Net Monthly Profit"}
                  </span>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "#059669", marginTop: "2px" }}>
                    {formatMoney(selectedRecord.monthly_profit)}
                  </div>
                </div>

                <div style={{ padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>
                    {t.colYearlyProfit || "Yearly Profit"}
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#059669", marginTop: "2px" }}>
                    {formatMoney(selectedRecord.yearly_profit)}
                  </div>
                </div>

                <div style={{ padding: "10px 14px", backgroundColor: "#fff7ed", borderRadius: "8px", border: "1px solid #fed7aa" }}>
                  <span style={{ fontSize: "11.5px", color: "#9a3412", fontWeight: "600" }}>
                    {t.colEmi || "Monthly Loan EMI"}
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#c2410c", marginTop: "2px" }}>
                    {formatMoney(selectedRecord.monthly_emi)}
                  </div>
                </div>

                <div style={{ padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>
                    {t.colScheme || "Matched Govt Scheme"}
                  </span>
                  <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
                    {selectedRecord.matched_scheme_name || "General Term Loan"}
                  </div>
                </div>

                <div style={{ padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>
                    {t.colRate || "Rate"} / {t.colTenure || "Tenure"}
                  </span>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#334155", marginTop: "2px" }}>
                    {selectedRecord.interest_rate != null ? `${selectedRecord.interest_rate}%` : "8.5%"} •{" "}
                    {selectedRecord.tenure_months != null ? `${selectedRecord.tenure_months} mo` : "60 mo"}
                  </div>
                </div>

                <div style={{ padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>
                    {t.colAffordability || "Affordability Status"}
                  </span>
                  <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
                    {selectedRecord.affordability_status || "Affordable"}
                  </div>
                </div>

                <div style={{ padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>
                    {t.colFeasibility || "Feasibility Verdict"}
                  </span>
                  <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#065f46", marginTop: "2px" }}>
                    {selectedRecord.feasibility_verdict || "Feasible & Safe"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "12.5px" }}>
            <ShieldCheck size={16} color="#059669" />
            <span>
              {isHi
                ? "सभी मूल्यांकन Aiven MySQL 8.4 क्लाउड डेटाबेस में सुरक्षित और अपरिवर्तनीय हैं।"
                : "All records are securely persisted in Aiven MySQL 8.4 with chronological audit trail."}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              backgroundColor: "#f1f5f9",
              border: "1px solid #cbd5e1",
              color: "#334155",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            {t.close || (isHi ? "बंद करें" : "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
