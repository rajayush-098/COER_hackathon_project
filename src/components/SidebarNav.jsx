import { useEffect } from "react";
import {
  X,
  Layers,
  BarChart3,
  Wallet,
  TrendingUp,
  Landmark,
  CalendarCheck,
  Store,
  Lightbulb,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Award,
} from "lucide-react";
import { getUI, translateVerdict } from "../utils/translationHelper";

const PAGE_ICONS = {
  overview: BarChart3,
  profit: Wallet,
  projection: TrendingUp,
  loan: Landmark,
  emi: CalendarCheck,
  market: Store,
  opportunities: Lightbulb,
  swot: ShieldCheck,
  risk: AlertTriangle,
  advisor: Sparkles,
  report: Award,
};

export default function SidebarNav({
  pages,
  activePageId,
  onSelectPage,
  isOpen,
  onClose,
  result,
  lang,
  t,
  onEditDetails,
}) {
  const isHi = lang === "hi" || lang === "hinglish";

  // Listen for Escape key to close the menu
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

  return (
    <>
      {/* Smooth Backdrop with blur */}
      <div
        className={`sidebar-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`analysis-sidebar ${isOpen ? "open" : ""}`}
        aria-label="Side Pages Menu"
      >
        <div className="sidebar-header">
          {/* Top Row with Badge & Close Button */}
          <div className="sidebar-header-top-row">
            <div className="sidebar-drawer-badge">
              <Layers size={13} style={{ color: "var(--primary)" }} />
              <span>{t?.stepsMenuBtn || getUI("stepsNavigation", lang, "11 Steps Navigation")}</span>
            </div>

            <button
              type="button"
              className="sidebar-close-btn"
              onClick={onClose}
              aria-label="Close menu"
              title={`${t?.close || getUI("close", lang, "Close")} (Esc)`}
            >
              <X size={18} />
            </button>
          </div>

          <div className="sidebar-business-info">
            <div>
              <h3 className="sidebar-biz-name" title={result?.business}>
                {result?.business || getUI("businessCol", lang, "Business")}
              </h3>
              <p className="sidebar-biz-loc">
                {result?.location || "Area"}, {result?.district || "District"}
              </p>
            </div>
          </div>

          <div
            className="sidebar-feasibility-tag"
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              textAlign: "center",
              marginBottom: "8px",
            }}
          >
            {result?.feasibilityVerdict ? translateVerdict(result.feasibilityVerdict, lang) : (result?.feasibility ? translateVerdict(result.feasibility, lang) : getUI("requiresVerification", lang, "Requires Verification"))}
          </div>

          <button
            type="button"
            className="sidebar-back-btn"
            onClick={onEditDetails}
            title={getUI("editDetails", lang, "Edit Details")}
          >
            {t.editDetails || getUI("editDetails", lang, "Edit Input Numbers")}
          </button>
        </div>

        <div className="sidebar-nav-title">
          <span>{getUI("selectSidePage", lang, "Select Side Page")}</span>
          <span className="page-count-badge">
            {pages.length} {getUI("pagesCount", lang, "Pages")}
          </span>
        </div>

        <nav className="sidebar-menu" aria-label="Analysis Side Pages">
          {pages.map((p, idx) => {
            const isActive = activePageId === p.id;
            const PageIcon = PAGE_ICONS[p.id];
            return (
              <button
                key={p.id}
                type="button"
                className={`sidebar-menu-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  onSelectPage(p.id);
                  if (onClose) onClose();
                }}
              >
                <span className="menu-num" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  {PageIcon && <PageIcon size={13} style={{ opacity: 0.9 }} />}
                  <span>{String(idx + 1).padStart(2, "0")}</span>
                </span>
                <div className="menu-text-wrap">
                  <span className="menu-title">{p.title[lang] || p.title.en}</span>
                  {p.subtitle && (
                    <span className="menu-sub">{p.subtitle[lang] || p.subtitle.en}</span>
                  )}
                </div>
                {isActive && <span className="menu-active-dot" />}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "0 16px 12px 16px" }}>
          <button
            type="button"
            onClick={() => {
              onSelectPage("market");
              if (onClose) onClose();
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "10px",
              backgroundColor: "#ecfdf5",
              border: "1.5px solid #a7f3d0",
              color: "#065f46",
              cursor: "pointer",
              textAlign: "left",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ fontSize: "20px" }}>🌾</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: "13px", color: "#065f46" }}>
                {lang === "bn" ? "মান্ডি দর চেকার" : lang === "mr" ? "मंडी भाव चेकर" : isHi ? "मंडी भाव चेकर" : "Mandi Price Checker"}
              </div>
              <div style={{ fontSize: "11px", color: "#047857" }}>
                data.gov.in Agmarknet Portal
              </div>
            </div>
          </button>
        </div>

        <div className="sidebar-footer-card">
          <p className="sidebar-tip-title">
            {getUI("needHelp", lang, "Need Help?")}
          </p>
          <p className="sidebar-tip-desc">
            {getUI("sidebarHelpDesc", lang, "Click 'Listen in Voice' to hear explanations in simple speech.")}
          </p>
        </div>
      </aside>
    </>
  );
}
