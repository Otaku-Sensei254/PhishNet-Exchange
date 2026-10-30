import dotenv from "dotenv";
dotenv.config();

import pool from "../config/neon.js";

const demoLeaks = [
  { email: "test@example.com", source: "Adobe, LinkedIn" },
  { email: "admin@company.co.ke", source: "Facebook, MySpace" },
  { email: "info@securefix.ke", source: "LinkedIn, Dropbox" },
  { email: "user@gmail.com", source: "Collection #1, LinkedIn" },
];

async function seed() {
  console.log("Seeding demo leak data...");

  for (const row of demoLeaks) {
    try {
      await pool.query(
        `INSERT INTO leaks (email, source) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [row.email, row.source]
      );
      console.log(`  ✓ ${row.email} → ${row.source}`);
    } catch (err) {
      console.error(`  ✗ ${row.email}: ${err.message}`);
    }
  }

  console.log("Done.");
  process.exit(0);
}

seed();
