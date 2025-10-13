// scripts/importRockYou.js

import fs from "fs";
import readline from "readline";
import mongoose from "mongoose";
import path from "path";
import LeakedCredential from "../models/Leak.js";
import dotenv from "dotenv";
import connectDB from "../config/db.js"; // ✅ Corrected path
dotenv.config();

// ✅ Connect to MongoDB
await connectDB();

// ✅ Correct path to rockyou.txt
const filePath = path.resolve("utils/rockyou.txt");

async function importPasswords() {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let count = 0;
  const batch = [];

  for await (const line of rl) {
    const password = line.trim();
    if (!password) continue;

    batch.push({
      password,
      hashType: "plaintext",
      source: "rockyou.txt",
    });

    // Insert in batches of 1000
    if (batch.length >= 1000) {
      await LeakedCredential.insertMany(batch, { ordered: false }).catch(
        () => {}
      );
      count += batch.length;
      console.log(`✅ Imported ${count} passwords...`);
      batch.length = 0;
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    await LeakedCredential.insertMany(batch, { ordered: false }).catch(
      () => {}
    );
    count += batch.length;
  }

  console.log(`🎉 Finished importing ${count} passwords.`);
  mongoose.connection.close();
}

importPasswords();
