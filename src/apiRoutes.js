/**
 * Vyapaar AI - Centralized Canonical API Routes
 * Single source of truth for all frontend and backend endpoints
 */

export const API_ROUTES = {
  HEALTH: "/api/health",
  STATUS: "/api/status",
  ANALYZE: "/api/analyze",
  ADVISOR: "/api/advisor",
  SAHYOGI: "/api/sahyogi",
  MARKET_REACH: "/api/market-reach",
  TEHSILS: "/api/locations/tehsils",
  VERIFY_UDYAM: "/api/verify-udyam",
  // MySQL Database endpoints
  SAVE_BUSINESS: "/api/business/save",
  GET_BUSINESS: "/api/business",
  BUSINESS_HISTORY: "/api/business/history",
  GET_REPORT: "/api/reports",
  ADVISORY_HISTORY: "/api/advisory/history",
  MARKET_SCAN_LOG: "/api/market/scan-log",
  // data.gov.in Mandi Commodity Prices
  MANDI_PRICES: "/api/mandi/prices",
  MANDI_SUGGESTIONS: "/api/mandi/suggestions",
  MANDI_META: "/api/mandi/meta",
};

export default API_ROUTES;
