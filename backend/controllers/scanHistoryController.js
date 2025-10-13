import ScanHistory from "../models/ScanHistory.js";
import pool from "../config/neon.js"; // PostgreSQL connection

// Helper: lookup sources in Postgres
const findSources = async (value, field) => {
  try {
    let query = "";
    if (field === "email") query = "SELECT source FROM leaks WHERE email = $1";
    else if (field === "username") query = "SELECT source FROM leaks WHERE username = $1";
    else if (field === "password") query = "SELECT source FROM leaks WHERE password = $1";
    else {
      query = `
        SELECT source FROM leaks
        WHERE email = $1 OR username = $1 OR password = $1
      `;
    }

    const result = await pool.query(query, [value]);
    return result.rows.map((row) => row.source);
  } catch (err) {
    console.error("Postgres lookup error:", err.message);
    return [];
  }
};

// Save scan history (with permanent sources)
export const saveScanHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { input, matches } = req.body;

    // Enrich matches with Postgres sources
    const enrichedMatches = await Promise.all(
      matches.map(async (m) => {
        const sources = await findSources(m.value, m.field);
        return { ...m, sources }; // permanently stored in Mongo
      })
    );

    // Save enriched history into MongoDB
    const history = await ScanHistory.create({
      userId,
      input,
      matches: enrichedMatches,
    });

    res.status(201).json({ success: true, history });
  } catch (err) {
    console.error("Error saving scan history:", err.message);
    res.status(500).json({ success: false, error: "Error saving scan history" });
  }
};

// Get scan histories (just return Mongo, no Postgres lookup anymore)
export const getUserScanHistories = async (req, res) => {
  try {
    const histories = await ScanHistory.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.json({ success: true, histories });
  } catch (err) {
    console.error("Error fetching scan histories:", err.message);
    res.status(500).json({ success: false, error: "Error fetching scan histories" });
  }
};
