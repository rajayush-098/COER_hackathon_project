import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDbPool, testDbConnection, closeDbPool, getDbConfigStatus } from "../../db";

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
  return path.resolve(process.cwd(), "src", "db");
}

export async function runMigrations(): Promise<{ success: boolean; appliedTables: string[]; message: string }> {
  const status = getDbConfigStatus();
  if (!status.isConfigured) {
    const msg = `Database is not configured (${status.missingVars.join(", ") || "Missing SSL certificate"}). Migration skipped.`;
    console.warn(`[Migration] ${msg}`);
    return { success: false, appliedTables: [], message: msg };
  }

  const pool = getDbPool();
  if (!pool) {
    return { success: false, appliedTables: [], message: "Failed to obtain MySQL connection pool." };
  }

  console.log("[Migration] Connecting to Aiven MySQL 8.4 database...");
  const connTest = await testDbConnection();
  if (!connTest.connected) {
    const err = `Cannot connect to database: ${connTest.error}`;
    console.error(`[Migration] ${err}`);
    return { success: false, appliedTables: [], message: err };
  }

  console.log(`[Migration] Connected to MySQL v${connTest.version} (${connTest.database})`);

  // Path to schema.sql
  const curDir = getCurrentDir();
  const schemaCandidates = [
    path.resolve(curDir, "schema.sql"),
    path.resolve(process.cwd(), "src", "db", "schema.sql"),
    path.resolve(process.cwd(), "dist", "src", "db", "schema.sql"),
  ];
  const schemaPath = schemaCandidates.find((p) => fs.existsSync(p));
  if (!schemaPath) {
    throw new Error(`Schema file schema.sql not found in: ${schemaCandidates.join(", ")}`);
  }

  const sqlContent = fs.readFileSync(schemaPath, "utf8");

// Remove full-line SQL comments before splitting statements.
// This prevents comments above CREATE TABLE from causing
// valid SQL statements to be discarded.
const cleanedSql = sqlContent.replace(/^\s*--.*$/gm, "");

const statements = cleanedSql
  .split(/;\s*(?:\r?\n|$)/)
  .map((stmt) => stmt.trim())
  .filter((stmt) => stmt.length > 0);

  const appliedTables: string[] = [];

  const conn = await pool.getConnection();
  try {
    for (const statement of statements) {
      if (!statement) continue;

      // Extract table name if statement is CREATE TABLE
      const match = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?/i);
      const tableName = match ? match[1] : "unknown";

      await conn.query(statement);
      if (tableName !== "unknown" && !appliedTables.includes(tableName)) {
        appliedTables.push(tableName);
      }
    }

    console.log(`[Migration] Schema verification succeeded. ${appliedTables.length} tables verified/created:`);
    appliedTables.forEach((t) => console.log(`  ✓ ${t}`));

    return {
      success: true,
      appliedTables,
      message: `Successfully verified/migrated ${appliedTables.length} tables.`,
    };
  } catch (err: any) {
    console.error("[Migration] Error applying schema:", err?.message || err);
    return {
      success: false,
      appliedTables,
      message: `Migration error: ${err?.message || "Unknown error"}`,
    };
  } finally {
    conn.release();
  }
}

// CLI Execution entry point
if (process.argv[1] && process.argv[1].endsWith("migrate.ts")) {
  runMigrations()
    .then(async (result) => {
      if (!result.success) {
        console.warn(`[Migration Result] ${result.message}`);
      } else {
        console.log(`[Migration Result] ${result.message}`);
      }
      await closeDbPool();
    })
    .catch(async (err) => {
      console.error("[Migration Fatal Error]", err);
      await closeDbPool();
      process.exit(1);
    });
}
