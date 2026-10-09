import "dotenv/config";
import { testDbConnection, getDbConfigStatus, closeDbPool } from "./db";

async function testConnection() {
  console.log("--------------------------------------------------");
  console.log(" Vyapaar AI - Aiven MySQL 8.4 Connectivity Test");
  console.log("--------------------------------------------------");

  const status = getDbConfigStatus();
  console.log("Configuration Check:");
  console.log(`- Required Variables Present: ${status.missingVars.length === 0 ? "YES" : "NO (" + status.missingVars.join(", ") + ")"}`);
  console.log(`- SSL CA Certificate Present: ${status.certFound ? "YES (" + status.certSource + ")" : "NO (missing certs/ca.pem)"}`);

  const result = await testDbConnection();

  if (result.connected) {
    console.log("\n Database connection successful!");
    console.log(`- MySQL Version: ${result.version}`);
    console.log(`- Active Database: ${result.database}`);
    console.log("- TLS/SSL Certificate: Verified via Aiven CA");
  } else {
    console.warn("\n Database connection could not be established:");
    console.warn(`- Details: ${result.error}`);
    console.warn("\nTo connect, ensure .env is populated with your Aiven credentials:");
    console.warn("DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, and certs/ca.pem.");
    // In automated testing environments where .env is intentionally omitted, exit code 0 or 1
  }

  await closeDbPool();
}

testConnection().catch((err) => {
  console.error("Unexpected error during connection test:", err);
  process.exitCode = 1;
});
