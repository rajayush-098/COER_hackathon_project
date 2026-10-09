import "dotenv/config";
import { db } from "./db";

async function testConnection() {
  try {
    const [rows] = await db.query(
      "SELECT VERSION() AS version, DATABASE() AS database_name"
    );

    console.log("Database connection successful!");
    console.log(rows);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

testConnection();