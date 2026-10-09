import "dotenv/config";
import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function getCurrentDir(): string {
  try {
    if (typeof __dirname !== "undefined") {
      return __dirname;
    }
    if (typeof import.meta !== "undefined" && (import.meta as any)?.url) {
      return path.dirname(fileURLToPath((import.meta as any).url));
    }
  } catch {
    // Fall back to cwd
  }
  return process.cwd();
}

export interface DbConfigStatus {
  isConfigured: boolean;
  missingVars: string[];
  certFound: boolean;
  certSource: "file" | "env_var" | "none";
}

// 1. Resolve CA Certificate
function resolveCaCertificate(): { caContent: string | null; source: "file" | "env_var" | "none"; certPath?: string } {
  // Option A: Direct PEM string in environment variable (useful for cloud platforms like Render)
  if (process.env.DB_CA_CERT && process.env.DB_CA_CERT.trim()) {
    return {
      caContent: process.env.DB_CA_CERT.trim(),
      source: "env_var",
    };
  }

  // Option B: File path candidates
  const curDir = getCurrentDir();
  const candidatePaths = [
    process.env.DB_CA_PATH,
    path.resolve(process.cwd(), "certs", "ca.pem"),
    path.resolve(curDir, "certs", "ca.pem"),
    path.resolve(curDir, "..", "certs", "ca.pem"),
    path.resolve(process.cwd(), "dist", "certs", "ca.pem"),
    path.resolve(curDir, "dist", "certs", "ca.pem"),
  ].filter(Boolean) as string[];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        const content = fs.readFileSync(candidate, "utf8");
        if (content.includes("BEGIN CERTIFICATE")) {
          return {
            caContent: content,
            source: "file",
            certPath: candidate,
          };
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  return { caContent: null, source: "none" };
}

// 2. Validate Environment Variables
export function getDbConfigStatus(): DbConfigStatus {
  const missingVars: string[] = [];
  if (!process.env.DB_HOST) missingVars.push("DB_HOST");
  if (!process.env.DB_USER) missingVars.push("DB_USER");
  if (!process.env.DB_PASSWORD) missingVars.push("DB_PASSWORD");
  if (!process.env.DB_NAME) missingVars.push("DB_NAME");

  const certInfo = resolveCaCertificate();

  return {
    isConfigured: missingVars.length === 0 && Boolean(certInfo.caContent),
    missingVars,
    certFound: Boolean(certInfo.caContent),
    certSource: certInfo.source,
  };
}

let pool: mysql.Pool | null = null;
let poolInitializationError: string | null = null;

export function getDbPool(): mysql.Pool | null {
  if (pool) return pool;

  const status = getDbConfigStatus();
  if (!status.isConfigured) {
    if (status.missingVars.length > 0) {
      poolInitializationError = `Missing required database environment variables: ${status.missingVars.join(", ")}`;
    } else if (!status.certFound) {
      poolInitializationError = "Aiven SSL CA certificate not found in certs/ca.pem or DB_CA_CERT env var.";
    }
    return null;
  }

  try {
    const certInfo = resolveCaCertificate();
    if (!certInfo.caContent) {
      throw new Error("Unable to load CA certificate content");
    }

    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "defaultdb",
      ssl: {
        ca: certInfo.caContent,
        rejectUnauthorized: true,
      },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });

    poolInitializationError = null;
    return pool;
  } catch (err: any) {
    poolInitializationError = err?.message || "Failed to initialize MySQL connection pool";
    console.error("[Vyapaar AI DB] Pool creation failed:", poolInitializationError);
    return null;
  }
}

/**
 * Lightweight check to verify database connectivity without leaking credentials
 */
export async function testDbConnection(): Promise<{
  connected: boolean;
  version?: string;
  database?: string;
  error?: string;
}> {
  const activePool = getDbPool();
  if (!activePool) {
    return {
      connected: false,
      error: poolInitializationError || "Database is not configured. Check environment variables and CA certificate.",
    };
  }

  try {
    const [rows] = await activePool.query<any[]>(
      "SELECT VERSION() AS version, DATABASE() AS database_name"
    );
    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    return {
      connected: true,
      version: row?.version || "Unknown",
      database: row?.database_name || process.env.DB_NAME || "defaultdb",
    };
  } catch (err: any) {
    const cleanError = err?.message ? String(err.message).replace(/(password=)[^&;]*/i, "$1***") : "Connection failed";
    return {
      connected: false,
      error: cleanError,
    };
  }
}

/**
 * Execute parameterized query safely using the shared connection pool
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const activePool = getDbPool();
  if (!activePool) {
    throw new Error(
      poolInitializationError || "Database connection pool is not available. Please ensure database credentials are configured."
    );
  }
  const [results] = await activePool.query(sql, params);
  return results as T;
}

/**
 * Execute parameterized statement safely
 */
export async function execute<T = any>(sql: string, params: any[] = []): Promise<T> {
  const activePool = getDbPool();
  if (!activePool) {
    throw new Error(
      poolInitializationError || "Database connection pool is not available. Please ensure database credentials are configured."
    );
  }
  const [results] = await activePool.execute(sql, params);
  return results as T;
}

/**
 * Helper to run a set of queries inside a transaction
 */
export async function withTransaction<T>(
  callback: (conn: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const activePool = getDbPool();
  if (!activePool) {
    throw new Error(
      poolInitializationError || "Database connection pool is not available. Please ensure database credentials are configured."
    );
  }

  const conn = await activePool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Gracefully close connection pool on application shutdown
 */
export async function closeDbPool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
      pool = null;
      console.log("[Vyapaar AI DB] MySQL pool gracefully closed.");
    } catch (err) {
      console.warn("[Vyapaar AI DB] Error closing MySQL pool:", err);
    }
  }
}

// Proxied db export for backward-compatibility with test-db.ts and legacy scripts
export const db = new Proxy(
  {},
  {
    get(_target, prop) {
      const activePool = getDbPool();
      if (!activePool) {
        if (prop === "query" || prop === "execute") {
          return async () => {
            throw new Error(
              poolInitializationError || "Database is not connected. Configure DB_HOST and credentials in .env."
            );
          };
        }
        if (prop === "end") {
          return async () => {};
        }
        return undefined;
      }
      const val = (activePool as any)[prop];
      if (typeof val === "function") {
        return val.bind(activePool);
      }
      return val;
    },
  }
) as unknown as mysql.Pool;

export default db;
