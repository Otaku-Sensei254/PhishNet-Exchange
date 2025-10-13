// bulkInsertLeaksBatch.js
import fs from "fs";
import path from "path";
import pool from "../config/neon.js";

const BATCH_SIZE = 500;

// Function to insert a batch into Postgres
async function insertBatch(batch) {
  if (batch.length === 0) return;

  const values = [];
  const placeholders = [];

  batch.forEach((row, i) => {
    const idx = i * 4;
    placeholders.push(`($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4})`);
    values.push(row.username, row.password, row.email, row.raw_entry);
  });

  const query = `
    INSERT INTO leaks (username, password, email, raw_entry)
    VALUES ${placeholders.join(",")}
    ON CONFLICT DO NOTHING
  `;

  try {
    await pool.query(query, values);
  } catch (err) {
    console.error("❌ Error inserting batch:", err.message);
  }
}

// Parse a single line into {username, password, email, raw_entry}
function parseLine(line) {
  line = line.trim();
  if (!line || line.startsWith("#")) return null;

  let parts = line.includes(":") ? line.split(":") : line.split(";");
  if (parts.length < 2) return null;

  let [first, second] = parts;
  let email = first.includes("@") ? first : null;
  let username = email ? null : first;
  let password = second;

  return { username, password, email, raw_entry: line };
}

// Process a single file
async function processFile(filePath, totalInserted) {
  console.log(`📂 Processing: ${filePath}`);
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");

  let batch = [];
  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i]);
    if (parsed) batch.push(parsed);

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(batch);
      totalInserted.count += batch.length;
      console.log(`   → Inserted ${batch.length} rows (total ${totalInserted.count} so far)`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await insertBatch(batch);
    totalInserted.count += batch.length;
    console.log(`   → Inserted ${batch.length} rows (total ${totalInserted.count} so far)`);
  }
}

// Traverse folder recursively
async function traverseFolder(folderPath, totalInserted) {
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const fullPath = path.join(folderPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      await traverseFolder(fullPath, totalInserted);
    } else if (file.endsWith(".txt")) {
      await processFile(fullPath, totalInserted);
    }
  }
}

(async () => {
  const folderPath = process.argv[2];
  if (!folderPath) {
    console.error("❌ Please provide a folder path");
    process.exit(1);
  }

  let totalInserted = { count: 0 };
  console.log(`🚀 Starting import from: ${folderPath}`);

  await traverseFolder(folderPath, totalInserted);

  console.log(`✅ Done! Inserted a total of ${totalInserted.count} rows`);
  process.exit(0);
})();
