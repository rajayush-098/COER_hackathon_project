import "dotenv/config";
import { db } from "./db";

async function verifyDatabase() {
  try {
    const [profiles] = await db.query(
      "SELECT * FROM business_profiles ORDER BY id DESC LIMIT 5"
    );

    console.log("\n--- Latest Business Profiles ---");
    console.table(profiles);

    const [financialRecords] = await db.query(
      "SELECT * FROM business_financial_records ORDER BY id DESC LIMIT 5"
    );

    console.log("\n--- Latest Financial Records ---");
    console.table(financialRecords);

    const [reports] = await db.query(
      "SELECT id, report_code, business_id, business_name, created_at FROM saved_reports ORDER BY id DESC LIMIT 5"
    );

    console.log("\n--- Latest Saved Reports ---");
    console.table(reports);
  } catch (error) {
    console.error("Database verification failed:", error);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

verifyDatabase();