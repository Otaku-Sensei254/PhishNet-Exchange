// backend/scripts/fillSources.js
import pool from "../config/neon.js";

const sources = ["Github", "Pastebin", "Darkweb", "Cyber Paste Site", "Exploit Forum"];

async function fillRandomSources() {
  try {
    console.log("🔄 Updating missing sources...");

    // Update rows with missing sources
    const query = `
      UPDATE leaks
      SET source = $1
      WHERE id IN (
        SELECT id FROM leaks
        WHERE source IS NULL OR source = 'N/A'
        ORDER BY RANDOM()
        LIMIT 1000
      )
    `;

    // Loop to update in batches
    for (let i = 0; i < 1500; i++) {  // 20 * 1000 = 20k per run
      const randomSource = sources[Math.floor(Math.random() * sources.length)];
      await pool.query(query, [randomSource]);
      console.log(`✅ Batch ${i + 1} filled with: ${randomSource}`);
    }

    console.log("🎉 Sources filled successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error updating sources:", err);
    process.exit(1);
  }
}

fillRandomSources();
