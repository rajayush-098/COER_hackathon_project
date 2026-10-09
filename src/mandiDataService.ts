/**
 * data.gov.in Mandi Commodity Prices Data Service
 * Resource ID: 9ef84268-d588-465a-a308-a864a43d0070
 * Current Daily Price of Various Commodities from Various Markets (Mandi)
 * 
 * Secure backend-only integration reading process.env.DATA_GOV_IN_API_KEY.
 * Never exposes the API key to client responses or frontend code.
 */

export const MANDI_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const DATA_GOV_IN_BASE_URL = `https://api.data.gov.in/resource/${MANDI_RESOURCE_ID}`;

export interface MandiQueryFilters {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  limit?: number;
  offset?: number;
}

export interface MandiPriceRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: number | null;
  max_price: number | null;
  modal_price: number | null;
  unit: string; // Official unit: ₹/Quintal
  price_per_kg: number | null; // Calculated modal_price / 100
}

export interface MandiApiResponse {
  success: boolean;
  configured: boolean;
  resource_id: string;
  total: number;
  count: number;
  limit: number;
  offset: number;
  unit: string;
  records: MandiPriceRecord[];
  updated_date?: string;
  title?: string;
  source?: string;
  error?: string;
  message?: string;
  filters_applied?: {
    state?: string;
    district?: string;
    market?: string;
    commodity?: string;
  };
}

/**
 * Normalizes title case for state/district names if needed
 */
function cleanFilterValue(val?: string): string | undefined {
  if (!val || typeof val !== "string") return undefined;
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  if (trimmed === trimmed.toLowerCase() || trimmed === trimmed.toUpperCase()) {
    return trimmed
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
  return trimmed;
}

/**
 * Safely parses numeric price strings from data.gov.in (e.g. "1550" -> 1550)
 */
function parsePrice(val: any): number | null {
  if (val == null) return null;
  const num = Number(String(val).replace(/,/g, "").trim());
  return isNaN(num) ? null : Math.round(num * 100) / 100;
}

/**
 * Fetch Mandi Commodity Prices directly from data.gov.in
 */
export async function fetchMandiCommodityPrices(
  filters: MandiQueryFilters = {}
): Promise<MandiApiResponse> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    return {
      success: false,
      configured: false,
      resource_id: MANDI_RESOURCE_ID,
      total: 0,
      count: 0,
      limit: filters.limit || 20,
      offset: filters.offset || 0,
      unit: "₹/Quintal",
      records: [],
      error: "data.gov.in API key is not configured. Please add DATA_GOV_IN_API_KEY to your .env file.",
      message: "API key unconfigured. Real-time mandi prices require a valid data.gov.in key.",
    };
  }

  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
  const offset = Math.max(0, Number(filters.offset) || 0);

  const cleanState = cleanFilterValue(filters.state);
  const cleanDistrict = cleanFilterValue(filters.district);
  const cleanMarket = cleanFilterValue(filters.market);
  const cleanCommodity = cleanFilterValue(filters.commodity);

  const params = new URLSearchParams();
  params.append("api-key", apiKey.trim());
  params.append("format", "json");
  params.append("offset", String(offset));
  params.append("limit", String(limit));

  if (cleanState) {
    params.append("filters[state]", cleanState);
  }
  if (cleanDistrict) {
    params.append("filters[district]", cleanDistrict);
  }
  if (cleanMarket) {
    params.append("filters[market]", cleanMarket);
  }
  if (cleanCommodity) {
    params.append("filters[commodity]", cleanCommodity);
  }

  const requestUrl = `${DATA_GOV_IN_BASE_URL}?${params.toString()}`;
  const sanitizedUrl = requestUrl.replace(/api-key=[^&]+/i, "api-key=***");

  const controller = new AbortController();
  const timeoutMs = 9000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "VyapaarAI-MandiClient/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (response.status === 429) {
      return {
        success: false,
        configured: true,
        resource_id: MANDI_RESOURCE_ID,
        total: 0,
        count: 0,
        limit,
        offset,
        unit: "₹/Quintal",
        records: [],
        error: "data.gov.in rate limit reached (HTTP 429). Please wait a moment before trying again.",
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        configured: true,
        resource_id: MANDI_RESOURCE_ID,
        total: 0,
        count: 0,
        limit,
        offset,
        unit: "₹/Quintal",
        records: [],
        error: "Invalid or unauthorized data.gov.in API key. Please verify DATA_GOV_IN_API_KEY in your .env file.",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        configured: true,
        resource_id: MANDI_RESOURCE_ID,
        total: 0,
        count: 0,
        limit,
        offset,
        unit: "₹/Quintal",
        records: [],
        error: `data.gov.in server returned error status HTTP ${response.status} (${response.statusText}).`,
      };
    }

    const data: any = await response.json();

    if (!data) {
      return {
        success: false,
        configured: true,
        resource_id: MANDI_RESOURCE_ID,
        total: 0,
        count: 0,
        limit,
        offset,
        unit: "₹/Quintal",
        records: [],
        error: "Empty payload returned from data.gov.in.",
      };
    }

    if (data.status === "failed" || data.status === "error" || data.error_code) {
      return {
        success: false,
        configured: true,
        resource_id: MANDI_RESOURCE_ID,
        total: 0,
        count: 0,
        limit,
        offset,
        unit: "₹/Quintal",
        records: [],
        error: data.message || data.error_description || "data.gov.in API returned an error message.",
      };
    }

    const rawRecords = Array.isArray(data.records) ? data.records : [];
    const totalCount = Number(data.total) || rawRecords.length;

    const parsedRecords: MandiPriceRecord[] = rawRecords.map((r: any) => {
      const modalPrice = parsePrice(r.modal_price);
      return {
        state: String(r.state || "").trim(),
        district: String(r.district || "").trim(),
        market: String(r.market || "").trim(),
        commodity: String(r.commodity || "").trim(),
        variety: String(r.variety || "General").trim(),
        arrival_date: String(r.arrival_date || "").trim(),
        min_price: parsePrice(r.min_price),
        max_price: parsePrice(r.max_price),
        modal_price: modalPrice,
        unit: "₹/Quintal",
        price_per_kg: modalPrice != null ? Math.round((modalPrice / 100) * 100) / 100 : null,
      };
    });

    return {
      success: true,
      configured: true,
      resource_id: MANDI_RESOURCE_ID,
      title: data.title || "Current Daily Price of Various Commodities from Various Markets (Mandi)",
      source: "data.gov.in (Agmarknet / Ministry of Agriculture & Farmers Welfare)",
      total: totalCount,
      count: parsedRecords.length,
      limit,
      offset,
      unit: "₹/Quintal",
      updated_date: data.updated_date || data.updated || undefined,
      records: parsedRecords,
      filters_applied: {
        state: cleanState,
        district: cleanDistrict,
        market: cleanMarket,
        commodity: cleanCommodity,
      },
      message:
        parsedRecords.length === 0
          ? "No mandi price records found matching the specified filters."
          : undefined,
    };
  } catch (err: any) {
    clearTimeout(timer);

    if (err.name === "AbortError") {
      return {
        success: false,
        configured: true,
        resource_id: MANDI_RESOURCE_ID,
        total: 0,
        count: 0,
        limit,
        offset,
        unit: "₹/Quintal",
        records: [],
        error: "Request to data.gov.in Mandi API timed out. Please try again shortly.",
      };
    }

    console.error("[Mandi API Error]:", sanitizedUrl, err?.message || err);
    return {
      success: false,
      configured: true,
      resource_id: MANDI_RESOURCE_ID,
      total: 0,
      count: 0,
      limit,
      offset,
      unit: "₹/Quintal",
      records: [],
      error: `Failed to connect to data.gov.in: ${err?.message || "Network error"}`,
    };
  }
}

/**
 * Returns suggested search commodities based on selected business category
 */
export function getSuggestedCommoditiesForCategory(category?: string): string[] {
  const cat = (category || "").toLowerCase();

  if (cat.includes("dairy") || cat.includes("milk") || cat.includes("पशु") || cat.includes("दूध")) {
    return ["Milk", "Ghee", "Butter", "Mustard", "Wheat", "Maize", "Soyabean", "Gram"];
  }

  if (cat.includes("retail") || cat.includes("kirana") || cat.includes("किराना") || cat.includes("दुकान")) {
    return ["Potato", "Onion", "Tomato", "Wheat", "Rice", "Sugar", "Mustard Oil", "Gram", "Garlic"];
  }

  if (cat.includes("agro") || cat.includes("food") || cat.includes("processing") || cat.includes("खाद्य")) {
    return ["Wheat", "Mustard", "Potato", "Tomato", "Rice", "Sugarcane", "Gram", "Maize", "Chilli"];
  }

  if (cat.includes("cloth") || cat.includes("textile") || cat.includes("कपड़ा")) {
    return ["Cotton", "Jute"];
  }

  return ["Potato", "Onion", "Tomato", "Wheat", "Rice", "Mustard", "Gram", "Soyabean", "Maize"];
}
