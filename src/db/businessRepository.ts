import { query, withTransaction, execute, getDbPool } from "../../db";
import type { PoolConnection } from "mysql2/promise";

export interface BusinessProfileInput {
  business_name: string;
  category: string;
  state: string;
  district: string;
  block?: string | null;
  village_location?: string | null;
  pincode?: string | null;
  experience_level?: string | null;
  udyam_number?: string | null;
}

export interface FinancialRecordInput {
  project_cost: number;
  margin_capital: number;
  eligible_loan: number;
  monthly_revenue: number;
  monthly_expenses: number;
  monthly_profit: number;
  yearly_profit: number;
  monthly_emi: number;
  matched_scheme_name?: string | null;
  interest_rate?: number | null;
  tenure_months?: number | null;
  moratorium_months?: number | null;
  affordability_status?: string | null;
  feasibility_verdict?: string | null;
}

export interface SaveBusinessCompleteResult {
  businessId: number;
  financialRecordId: number;
  reportCode: string;
}

/**
 * Generate a deterministic or randomized official Report Code (VAI-XXXXXX)
 */
export function generateReportCode(businessName: string): string {
  const seed = Math.abs(
    (businessName || "ENTERPRISE")
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 1234) * 53
  ) % 900000 + 100000;
  return `VAI-${seed}`;
}

// ================= IN-MEMORY MOCK STORE FOR AI STUDIO =================
// Active when external MySQL database is not configured or unreachable.
interface MockBusinessProfile {
  id: number;
  business_name: string;
  category: string;
  state: string;
  district: string;
  block: string | null;
  village_location: string | null;
  pincode: string | null;
  experience_level: string;
  udyam_number: string | null;
  created_at: string;
}

interface MockFinancialRecord {
  id: number;
  business_id: number;
  project_cost: number;
  margin_capital: number;
  eligible_loan: number;
  monthly_revenue: number;
  monthly_expenses: number;
  monthly_profit: number;
  yearly_profit: number;
  monthly_emi: number;
  matched_scheme_name: string | null;
  interest_rate: number | null;
  tenure_months: number | null;
  moratorium_months: number | null;
  affordability_status: string | null;
  feasibility_verdict: string | null;
  created_at: string;
}

interface MockSavedReport {
  id: number;
  report_code: string;
  business_id: number;
  business_name: string;
  category: string;
  district: string;
  state: string;
  summary_verdict: string;
  report_payload: any;
  created_at: string;
}

interface MockAdvisoryMessage {
  id: number;
  business_id: number | null;
  session_token: string;
  user_query: string;
  ai_response: string;
  language: string;
  model_source: string;
  created_at: string;
}

interface MockMarketScan {
  id: number;
  business_id: number | null;
  district: string;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number;
  competitor_count: number;
  bank_count: number;
  mandi_count: number;
  created_at: string;
}

const mockBusinessProfiles: MockBusinessProfile[] = [
  {
    id: 1,
    business_name: "Sharma Dairy Farm",
    category: "Dairy & Milk Products",
    state: "Uttar Pradesh",
    district: "Meerut",
    block: "Mawana",
    village_location: "Mawana Kalan",
    pincode: "250401",
    experience_level: "Intermediate",
    udyam_number: "UDYAM-UP-28-0019284",
    created_at: "2026-10-01T10:00:00.000Z",
  },
  {
    id: 2,
    business_name: "Kisan Agro Processing",
    category: "Agro & Food Processing",
    state: "Uttar Pradesh",
    district: "Barabanki",
    block: "Fatehpur",
    village_location: "Fatehpur Mandi",
    pincode: "225305",
    experience_level: "Beginner",
    udyam_number: "UDYAM-UP-12-0044810",
    created_at: "2026-10-05T14:30:00.000Z",
  },
];

const mockFinancialRecords: MockFinancialRecord[] = [
  {
    id: 1,
    business_id: 1,
    project_cost: 500000,
    margin_capital: 50000,
    eligible_loan: 450000,
    monthly_revenue: 85000,
    monthly_expenses: 42000,
    monthly_profit: 43000,
    yearly_profit: 516000,
    monthly_emi: 9550,
    matched_scheme_name: "PMEGP (Prime Minister's Employment Generation Programme)",
    interest_rate: 9.5,
    tenure_months: 60,
    moratorium_months: 6,
    affordability_status: "Affordable & Sustainable",
    feasibility_verdict: "Highly Feasible",
    created_at: "2026-10-01T10:00:00.000Z",
  },
  {
    id: 2,
    business_id: 2,
    project_cost: 350000,
    margin_capital: 35000,
    eligible_loan: 315000,
    monthly_revenue: 60000,
    monthly_expenses: 31000,
    monthly_profit: 29000,
    yearly_profit: 348000,
    monthly_emi: 6685,
    matched_scheme_name: "PM Mudra Yojana (Kishore)",
    interest_rate: 10.0,
    tenure_months: 60,
    moratorium_months: 3,
    affordability_status: "Affordable",
    feasibility_verdict: "Feasible",
    created_at: "2026-10-05T14:30:00.000Z",
  },
];

const mockSavedReports: MockSavedReport[] = [
  {
    id: 1,
    report_code: "VAI-782104",
    business_id: 1,
    business_name: "Sharma Dairy Farm",
    category: "Dairy & Milk Products",
    district: "Meerut",
    state: "Uttar Pradesh",
    summary_verdict: "Highly Feasible",
    report_payload: {
      business: "Sharma Dairy Farm",
      category: "Dairy & Milk Products",
      district: "Meerut",
      state: "Uttar Pradesh",
      block: "Mawana",
      investment: "50000",
      monthly_revenue: "85000",
      monthly_expenses: "42000",
      feasibilityVerdict: "Highly Feasible",
    },
    created_at: "2026-10-01T10:00:00.000Z",
  },
  {
    id: 2,
    report_code: "VAI-419082",
    business_id: 2,
    business_name: "Kisan Agro Processing",
    category: "Agro & Food Processing",
    district: "Barabanki",
    state: "Uttar Pradesh",
    block: "Fatehpur",
    investment: "35000",
    summary_verdict: "Feasible",
    report_payload: {
      business: "Kisan Agro Processing",
      category: "Agro & Food Processing",
      district: "Barabanki",
      state: "Uttar Pradesh",
      block: "Fatehpur",
      investment: "35000",
      monthly_revenue: "60000",
      monthly_expenses: "31000",
      feasibilityVerdict: "Feasible",
    },
    created_at: "2026-10-05T14:30:00.000Z",
  },
];

const mockAdvisoryHistory: MockAdvisoryMessage[] = [];
const mockMarketScans: MockMarketScan[] = [];

let nextBusinessId = 3;
let nextFinancialId = 3;
let nextReportId = 3;
let nextAdvisoryId = 1;
let nextScanId = 1;

function saveBusinessInMemory(
  profile: BusinessProfileInput,
  financials: FinancialRecordInput,
  reportPayload?: any
): SaveBusinessCompleteResult {
  const trimmedName = profile.business_name.trim();
  const trimmedDist = profile.district.trim();
  const now = new Date().toISOString();

  let existing = mockBusinessProfiles.find(
    (bp) => bp.business_name.toLowerCase() === trimmedName.toLowerCase() &&
            bp.district.toLowerCase() === trimmedDist.toLowerCase()
  );

  let businessId: number;
  if (existing) {
    businessId = existing.id;
    existing.category = profile.category.trim();
    existing.state = profile.state.trim();
    if (profile.block) existing.block = profile.block.trim();
    if (profile.village_location) existing.village_location = profile.village_location.trim();
    if (profile.pincode) existing.pincode = profile.pincode.trim();
    existing.experience_level = profile.experience_level?.trim() || "Beginner";
    if (profile.udyam_number) existing.udyam_number = profile.udyam_number.trim();
  } else {
    businessId = nextBusinessId++;
    mockBusinessProfiles.push({
      id: businessId,
      business_name: trimmedName,
      category: profile.category.trim(),
      state: profile.state.trim(),
      district: trimmedDist,
      block: profile.block?.trim() || null,
      village_location: profile.village_location?.trim() || null,
      pincode: profile.pincode?.trim() || null,
      experience_level: profile.experience_level?.trim() || "Beginner",
      udyam_number: profile.udyam_number?.trim() || null,
      created_at: now,
    });
  }

  const financialRecordId = nextFinancialId++;
  mockFinancialRecords.unshift({
    id: financialRecordId,
    business_id: businessId,
    project_cost: financials.project_cost,
    margin_capital: financials.margin_capital,
    eligible_loan: financials.eligible_loan,
    monthly_revenue: financials.monthly_revenue,
    monthly_expenses: financials.monthly_expenses,
    monthly_profit: financials.monthly_profit,
    yearly_profit: financials.yearly_profit,
    monthly_emi: financials.monthly_emi,
    matched_scheme_name: financials.matched_scheme_name || null,
    interest_rate: financials.interest_rate ?? null,
    tenure_months: financials.tenure_months ?? null,
    moratorium_months: financials.moratorium_months ?? null,
    affordability_status: financials.affordability_status || null,
    feasibility_verdict: financials.feasibility_verdict || null,
    created_at: now,
  });

  const reportCode = generateReportCode(profile.business_name);
  const summaryVerdict = financials.feasibility_verdict || "Evaluated by Vyapaar AI";
  const payloadJson = reportPayload || { profile, financials, reportCode };

  const existingReport = mockSavedReports.find((r) => r.report_code === reportCode);
  if (existingReport) {
    existingReport.business_id = businessId;
    existingReport.summary_verdict = summaryVerdict;
    existingReport.report_payload = payloadJson;
  } else {
    mockSavedReports.unshift({
      id: nextReportId++,
      report_code: reportCode,
      business_id: businessId,
      business_name: trimmedName,
      category: profile.category.trim(),
      district: trimmedDist,
      state: profile.state.trim(),
      summary_verdict: summaryVerdict,
      report_payload: payloadJson,
      created_at: now,
    });
  }

  return {
    businessId,
    financialRecordId,
    reportCode,
  };
}

function getBusinessHistoryFromMemory(filters?: {
  businessName?: string;
  businessId?: number;
  district?: string;
}): any[] {
  let list = mockFinancialRecords.map((bfr) => {
    const bp = mockBusinessProfiles.find((p) => p.id === bfr.business_id);
    const sr = mockSavedReports.find((r) => r.business_id === bfr.business_id);
    return {
      evaluation_id: bfr.id,
      business_id: bfr.business_id,
      business_name: bp?.business_name || "Enterprise",
      category: bp?.category || "General",
      state: bp?.state || "Uttar Pradesh",
      district: bp?.district || "Meerut",
      block: bp?.block || null,
      village_location: bp?.village_location || null,
      pincode: bp?.pincode || null,
      experience_level: bp?.experience_level || "Beginner",
      udyam_number: bp?.udyam_number || null,
      project_cost: bfr.project_cost,
      margin_capital: bfr.margin_capital,
      eligible_loan: bfr.eligible_loan,
      monthly_revenue: bfr.monthly_revenue,
      monthly_expenses: bfr.monthly_expenses,
      monthly_profit: bfr.monthly_profit,
      yearly_profit: bfr.yearly_profit,
      monthly_emi: bfr.monthly_emi,
      matched_scheme_name: bfr.matched_scheme_name,
      interest_rate: bfr.interest_rate,
      tenure_months: bfr.tenure_months,
      moratorium_months: bfr.moratorium_months,
      affordability_status: bfr.affordability_status,
      feasibility_verdict: bfr.feasibility_verdict,
      evaluated_at: bfr.created_at,
      report_code: sr?.report_code || generateReportCode(bp?.business_name || "ENT"),
      report_payload: sr?.report_payload || null,
    };
  });

  if (filters?.businessId) {
    list = list.filter((r) => r.business_id === filters.businessId);
  } else if (filters?.businessName && filters.businessName.trim()) {
    const term = filters.businessName.trim().toLowerCase();
    list = list.filter((r) => r.business_name.toLowerCase().includes(term));
  }

  if (filters?.district && filters.district.trim()) {
    const dist = filters.district.trim().toLowerCase();
    list = list.filter((r) => r.district.toLowerCase() === dist);
  }

  return list.slice(0, 100);
}

/**
 * Atomically save business profile, financial record, and report card dossier in MySQL,
 * with automatic in-memory fallback if MySQL is unconfigured or unavailable.
 */
export async function saveBusinessComplete(
  profile: BusinessProfileInput,
  financials: FinancialRecordInput,
  reportPayload?: any
): Promise<SaveBusinessCompleteResult> {
  const activePool = getDbPool();
  if (!activePool) {
    return saveBusinessInMemory(profile, financials, reportPayload);
  }

  try {
    return await withTransaction<SaveBusinessCompleteResult>(async (conn: PoolConnection) => {
      let businessId: number;

      // 1. Check if business profile already exists by name and district
      const [existing]: any = await conn.execute(
        `SELECT id FROM business_profiles WHERE LOWER(business_name) = LOWER(?) AND LOWER(district) = LOWER(?) LIMIT 1`,
        [profile.business_name.trim(), profile.district.trim()]
      );

      if (existing && existing.length > 0) {
        businessId = existing[0].id;
        await conn.execute(
          `UPDATE business_profiles 
           SET category = ?, state = ?, block = COALESCE(?, block), village_location = COALESCE(?, village_location), 
               pincode = COALESCE(?, pincode), experience_level = ?, udyam_number = COALESCE(?, udyam_number)
           WHERE id = ?`,
          [
            profile.category.trim(),
            profile.state.trim(),
            profile.block?.trim() || null,
            profile.village_location?.trim() || null,
            profile.pincode?.trim() || null,
            profile.experience_level?.trim() || "Beginner",
            profile.udyam_number?.trim() || null,
            businessId,
          ]
        );
      } else {
        const [profileRes]: any = await conn.execute(
          `INSERT INTO business_profiles 
            (business_name, category, state, district, block, village_location, pincode, experience_level, udyam_number)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            profile.business_name.trim(),
            profile.category.trim(),
            profile.state.trim(),
            profile.district.trim(),
            profile.block?.trim() || null,
            profile.village_location?.trim() || null,
            profile.pincode?.trim() || null,
            profile.experience_level?.trim() || "Beginner",
            profile.udyam_number?.trim() || null,
          ]
        );
        businessId = profileRes.insertId;
      }

      // 2. Insert new financial evaluation record
      const [finRes]: any = await conn.execute(
        `INSERT INTO business_financial_records
          (business_id, project_cost, margin_capital, eligible_loan, monthly_revenue, 
           monthly_expenses, monthly_profit, yearly_profit, monthly_emi, 
           matched_scheme_name, interest_rate, tenure_months, moratorium_months, 
           affordability_status, feasibility_verdict)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          businessId,
          financials.project_cost,
          financials.margin_capital,
          financials.eligible_loan,
          financials.monthly_revenue,
          financials.monthly_expenses,
          financials.monthly_profit,
          financials.yearly_profit,
          financials.monthly_emi,
          financials.matched_scheme_name || null,
          financials.interest_rate ?? null,
          financials.tenure_months ?? null,
          financials.moratorium_months ?? null,
          financials.affordability_status || null,
          financials.feasibility_verdict || null,
        ]
      );

      const financialRecordId = finRes.insertId;

      // 3. Insert or update saved_reports dossier
      const reportCode = generateReportCode(profile.business_name);
      const summaryVerdict = financials.feasibility_verdict || "Evaluated by Vyapaar AI";
      const payloadJson = JSON.stringify(reportPayload || { profile, financials, reportCode });

      await conn.execute(
        `INSERT INTO saved_reports 
          (report_code, business_id, business_name, category, district, state, summary_verdict, report_payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           business_id = VALUES(business_id),
           summary_verdict = VALUES(summary_verdict),
           report_payload = VALUES(report_payload)`,
        [
          reportCode,
          businessId,
          profile.business_name.trim(),
          profile.category.trim(),
          profile.district.trim(),
          profile.state.trim(),
          summaryVerdict,
          payloadJson,
        ]
      );

      return {
        businessId,
        financialRecordId,
        reportCode,
      };
    });
  } catch (err) {
    console.warn("[Vyapaar AI DB] MySQL save failed, using in-memory mock store:", err);
    return saveBusinessInMemory(profile, financials, reportPayload);
  }
}

/**
 * Retrieve comprehensive business history with all evaluations in chronological order (newest first).
 */
export async function getBusinessHistory(filters?: {
  businessName?: string;
  businessId?: number;
  district?: string;
}): Promise<any[]> {
  const activePool = getDbPool();
  if (!activePool) {
    return getBusinessHistoryFromMemory(filters);
  }

  try {
    let sql = `
      SELECT 
        bfr.id AS evaluation_id,
        bfr.business_id,
        bp.business_name,
        bp.category,
        bp.state,
        bp.district,
        bp.block,
        bp.village_location,
        bp.pincode,
        bp.experience_level,
        bp.udyam_number,
        bfr.project_cost,
        bfr.margin_capital,
        bfr.eligible_loan,
        bfr.monthly_revenue,
        bfr.monthly_expenses,
        bfr.monthly_profit,
        bfr.yearly_profit,
        bfr.monthly_emi,
        bfr.matched_scheme_name,
        bfr.interest_rate,
        bfr.tenure_months,
        bfr.moratorium_months,
        bfr.affordability_status,
        bfr.feasibility_verdict,
        bfr.created_at AS evaluated_at,
        sr.report_code,
        sr.report_payload
      FROM business_financial_records bfr
      JOIN business_profiles bp ON bfr.business_id = bp.id
      LEFT JOIN saved_reports sr ON sr.business_id = bp.id
    `;

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (filters?.businessId) {
      whereClauses.push("bp.id = ?");
      params.push(filters.businessId);
    } else if (filters?.businessName && filters.businessName.trim()) {
      whereClauses.push("LOWER(bp.business_name) LIKE ?");
      params.push(`%${filters.businessName.trim().toLowerCase()}%`);
    }

    if (filters?.district && filters.district.trim()) {
      whereClauses.push("LOWER(bp.district) = ?");
      params.push(filters.district.trim().toLowerCase());
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ` + whereClauses.join(" AND ");
    }

    sql += ` ORDER BY bfr.created_at DESC LIMIT 100`;

    const rows: any[] = await query(sql, params);
    return rows.map((r: any) => {
      if (typeof r.report_payload === "string") {
        try {
          r.report_payload = JSON.parse(r.report_payload);
        } catch {
          // Keep string if parse fails
        }
      }
      return r;
    });
  } catch (err) {
    console.warn("[Vyapaar AI DB] MySQL history fetch failed, using in-memory mock store:", err);
    return getBusinessHistoryFromMemory(filters);
  }
}

/**
 * Retrieve business profile along with its latest financial record by primary key
 */
export async function getBusinessProfileById(businessId: number): Promise<any | null> {
  const activePool = getDbPool();
  if (!activePool) {
    const bp = mockBusinessProfiles.find((p) => p.id === businessId);
    if (!bp) return null;
    const bfr = mockFinancialRecords.find((r) => r.business_id === businessId);
    return {
      ...bp,
      project_cost: bfr?.project_cost ?? null,
      margin_capital: bfr?.margin_capital ?? null,
      eligible_loan: bfr?.eligible_loan ?? null,
      monthly_revenue: bfr?.monthly_revenue ?? null,
      monthly_expenses: bfr?.monthly_expenses ?? null,
      monthly_profit: bfr?.monthly_profit ?? null,
      yearly_profit: bfr?.yearly_profit ?? null,
      monthly_emi: bfr?.monthly_emi ?? null,
      matched_scheme_name: bfr?.matched_scheme_name ?? null,
      interest_rate: bfr?.interest_rate ?? null,
      tenure_months: bfr?.tenure_months ?? null,
      moratorium_months: bfr?.moratorium_months ?? null,
      affordability_status: bfr?.affordability_status ?? null,
      feasibility_verdict: bfr?.feasibility_verdict ?? null,
      financials_created_at: bfr?.created_at ?? null,
    };
  }

  try {
    const rows: any[] = await query(
      `SELECT bp.*, 
              bfr.project_cost, bfr.margin_capital, bfr.eligible_loan, 
              bfr.monthly_revenue, bfr.monthly_expenses, bfr.monthly_profit, 
              bfr.yearly_profit, bfr.monthly_emi, bfr.matched_scheme_name, 
              bfr.interest_rate, bfr.tenure_months, bfr.moratorium_months, 
              bfr.affordability_status, bfr.feasibility_verdict,
              bfr.created_at AS financials_created_at
       FROM business_profiles bp
       LEFT JOIN business_financial_records bfr ON bp.id = bfr.business_id
       WHERE bp.id = ?
       ORDER BY bfr.id DESC
       LIMIT 1`,
      [businessId]
    );

    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.warn("[Vyapaar AI DB] MySQL getBusinessProfileById failed:", err);
    return null;
  }
}

/**
 * Retrieve a saved report card dossier by its unique report code (VAI-XXXXXX)
 */
export async function getSavedReportByCode(reportCode: string): Promise<any | null> {
  const cleanCode = reportCode.trim().toUpperCase();

  const activePool = getDbPool();
  if (!activePool) {
    const r = mockSavedReports.find((sr) => sr.report_code.toUpperCase() === cleanCode);
    return r || null;
  }

  try {
    const rows: any[] = await query(
      `SELECT id, report_code, business_id, business_name, category, 
              district, state, summary_verdict, report_payload, created_at
       FROM saved_reports
       WHERE report_code = ?
       LIMIT 1`,
      [cleanCode]
    );

    if (rows.length === 0) return null;
    const row = rows[0];
    try {
      if (typeof row.report_payload === "string") {
        row.report_payload = JSON.parse(row.report_payload);
      }
    } catch {
      // Keep as is
    }
    return row;
  } catch (err) {
    console.warn("[Vyapaar AI DB] MySQL getSavedReportByCode failed, falling back to mock:", err);
    const r = mockSavedReports.find((sr) => sr.report_code.toUpperCase() === cleanCode);
    return r || null;
  }
}

/**
 * Save an advisory Q&A interaction
 */
export async function saveAdvisoryMessage(
  sessionToken: string,
  userQuery: string,
  aiResponse: string,
  businessId: number | null = null,
  language: string = "hi",
  modelSource: string = "gemini"
): Promise<number> {
  const activePool = getDbPool();
  if (!activePool) {
    const id = nextAdvisoryId++;
    mockAdvisoryHistory.push({
      id,
      business_id: businessId,
      session_token: sessionToken,
      user_query: userQuery.trim(),
      ai_response: aiResponse.trim(),
      language,
      model_source: modelSource,
      created_at: new Date().toISOString(),
    });
    return id;
  }

  try {
    const res: any = await execute(
      `INSERT INTO advisory_history 
        (business_id, session_token, user_query, ai_response, language, model_source)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        businessId || null,
        sessionToken,
        userQuery.trim(),
        aiResponse.trim(),
        language,
        modelSource,
      ]
    );
    return res.insertId;
  } catch (err) {
    console.warn("[Vyapaar AI DB] MySQL saveAdvisoryMessage failed, using mock:", err);
    const id = nextAdvisoryId++;
    mockAdvisoryHistory.push({
      id,
      business_id: businessId,
      session_token: sessionToken,
      user_query: userQuery.trim(),
      ai_response: aiResponse.trim(),
      language,
      model_source: modelSource,
      created_at: new Date().toISOString(),
    });
    return id;
  }
}

/**
 * Retrieve recent advisory dialogue for a session or business
 */
export async function getAdvisoryHistoryBySession(
  sessionToken: string,
  limit: number = 20
): Promise<any[]> {
  const activePool = getDbPool();
  if (!activePool) {
    return mockAdvisoryHistory
      .filter((m) => m.session_token === sessionToken)
      .slice(-limit);
  }

  try {
    const rows: any[] = await query(
      `SELECT id, business_id, session_token, user_query, ai_response, language, model_source, created_at
       FROM advisory_history
       WHERE session_token = ?
       ORDER BY created_at ASC
       LIMIT ?`,
      [sessionToken, limit]
    );
    return rows;
  } catch (err) {
    console.warn("[Vyapaar AI DB] MySQL getAdvisoryHistoryBySession failed, using mock:", err);
    return mockAdvisoryHistory
      .filter((m) => m.session_token === sessionToken)
      .slice(-limit);
  }
}

/**
 * Record a high-level summary of an OSM market scan
 */
export async function logMarketScan(
  district: string,
  radiusMeters: number,
  competitorCount: number,
  bankCount: number,
  mandiCount: number,
  businessId: number | null = null,
  latitude: number | null = null,
  longitude: number | null = null
): Promise<number> {
  const activePool = getDbPool();
  if (!activePool) {
    const id = nextScanId++;
    mockMarketScans.push({
      id,
      business_id: businessId,
      district: district.trim(),
      latitude,
      longitude,
      radius_meters: radiusMeters,
      competitor_count: competitorCount,
      bank_count: bankCount,
      mandi_count: mandiCount,
      created_at: new Date().toISOString(),
    });
    return id;
  }

  try {
    const res: any = await execute(
      `INSERT INTO market_scans 
        (business_id, district, latitude, longitude, radius_meters, competitor_count, bank_count, mandi_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        businessId || null,
        district.trim(),
        latitude,
        longitude,
        radiusMeters,
        competitorCount,
        bankCount,
        mandiCount,
      ]
    );
    return res.insertId;
  } catch (err) {
    console.warn("[Vyapaar AI DB] MySQL logMarketScan failed, using mock:", err);
    const id = nextScanId++;
    mockMarketScans.push({
      id,
      business_id: businessId,
      district: district.trim(),
      latitude,
      longitude,
      radius_meters: radiusMeters,
      competitor_count: competitorCount,
      bank_count: bankCount,
      mandi_count: mandiCount,
      created_at: new Date().toISOString(),
    });
    return id;
  }
}
