import { query, withTransaction, execute } from "../../db";
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

/**
 * Atomically save business profile, financial record, and report card dossier in MySQL.
 * If the business already exists, links the new evaluation to the existing business profile,
 * ensuring all prior evaluations are preserved in chronological order.
 */
export async function saveBusinessComplete(
  profile: BusinessProfileInput,
  financials: FinancialRecordInput,
  reportPayload?: any
): Promise<SaveBusinessCompleteResult> {
  return await withTransaction<SaveBusinessCompleteResult>(async (conn: PoolConnection) => {
    let businessId: number;

    // 1. Check if business profile already exists by name and district
    const [existing]: any = await conn.execute(
      `SELECT id FROM business_profiles WHERE LOWER(business_name) = LOWER(?) AND LOWER(district) = LOWER(?) LIMIT 1`,
      [profile.business_name.trim(), profile.district.trim()]
    );

    if (existing && existing.length > 0) {
      businessId = existing[0].id;
      // Update profile attributes while preserving record ID
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
      // Create new business profile
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

    // 2. Insert new financial evaluation record (Preserves historical evaluations)
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
}

/**
 * Retrieve comprehensive business history with all evaluations in chronological order (newest first).
 * Allows viewing all businesses or filtering by businessName / businessId.
 */
export async function getBusinessHistory(filters?: {
  businessName?: string;
  businessId?: number;
  district?: string;
}): Promise<any[]> {
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
}

/**
 * Retrieve business profile along with its latest financial record by primary key
 */
export async function getBusinessProfileById(businessId: number): Promise<any | null> {
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
}

/**
 * Retrieve a saved report card dossier by its unique report code (VAI-XXXXXX)
 */
export async function getSavedReportByCode(reportCode: string): Promise<any | null> {
  const cleanCode = reportCode.trim().toUpperCase();
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
}

/**
 * Save an advisory Q&A interaction to MySQL
 */
export async function saveAdvisoryMessage(
  sessionToken: string,
  userQuery: string,
  aiResponse: string,
  businessId: number | null = null,
  language: string = "hi",
  modelSource: string = "gemini"
): Promise<number> {
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
}

/**
 * Retrieve recent advisory dialogue for a session or business
 */
export async function getAdvisoryHistoryBySession(
  sessionToken: string,
  limit: number = 20
): Promise<any[]> {
  const rows: any[] = await query(
    `SELECT id, business_id, session_token, user_query, ai_response, language, model_source, created_at
     FROM advisory_history
     WHERE session_token = ?
     ORDER BY created_at ASC
     LIMIT ?`,
    [sessionToken, limit]
  );
  return rows;
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
}
