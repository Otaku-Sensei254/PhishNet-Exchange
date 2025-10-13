import fs from "fs";
import path from "path";
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables
// 📍 Postgres connection setup (Neon)
const client = new Client({
  connectionString: process.env.POSTGRES_URL, // e.g. from Neon
});
await client.connect();

// 👇 Utility: Check if string is email
const isEmail = (str) => /\S+@\S+\.\S+/.test(str);

// 👇 Parse a single line into credentials
const parseLine = (line) => {
  const separators = [":", ";"];
  for (const sep of separators) {
    if (line.includes(sep)) {
      const [first, second] = line.split(sep);
      if (isEmail(first)) return { email: first, password: second };
      else return { username: first, password: second };
    }
  }
  return null; // No match
};

// 👇 Process a single file
const processFile = async (filePath) => {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  for (const line of lines) {
    const parsed = parseLine(line.trim());
    if (parsed && parsed.password) {
      await client.query(
        `INSERT INTO leaked_credentials (email, username, password, source_file)
         VALUES ($1, $2, $3, $4)`,
        [
          parsed.email || null,
          parsed.username || null,
          parsed.password,
          path.basename(filePath),
        ]
      );
    }
  }
};

// 👇 Recursively walk through folders and process .txt files
const walkDirectory = async (dirPath) => {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      await walkDirectory(fullPath);
    } else if (file.endsWith(".txt")) {
      console.log("📄 Processing:", fullPath);
      await processFile(fullPath);
    }
  }
};

// Start the import
await walkDirectory("./collection"); // Replace with your root folder
console.log("✅ Data import complete.");
await client.end();
