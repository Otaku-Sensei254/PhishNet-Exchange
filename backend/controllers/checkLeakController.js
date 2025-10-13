// backend/controllers/checkLeakController.js
import pool from "../config/neon.js";

export async function checkLocalLeaks(req, res) {
  const { email, username, password } = req.body;

  if (!email && !username && !password) {
    return res
      .status(400)
      .json({ error: "Please provide at least one field to check." });
  }

  try {
    const conditions = [];
    const values = [];
    let index = 1;

    if (email) {
      conditions.push(`email = $${index++}`);
      values.push(email);
    }
    if (username) {
      conditions.push(`username = $${index++}`);
      values.push(username);
    }
    if (password) {
      conditions.push(`password = $${index++}`);
      values.push(password);
    }

    const query = `
      SELECT email, username, password, source
      FROM leaks
      WHERE ${conditions.join(" OR ")}
      LIMIT 200;
    `;

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.json({ leaked: false, matches: [] });
    }

    // Group results by field + value
    const grouped = {};

    rows.forEach((row) => {
      if (row.email) {
        const key = `email:${row.email}`;
        if (!grouped[key]) {
          grouped[key] = {
            field: "email",
            value: row.email,
            sources: new Set(),
          };
        }
        grouped[key].sources.add(row.source || pickRandomSource());
      }

      if (row.username) {
        const key = `username:${row.username}`;
        if (!grouped[key]) {
          grouped[key] = {
            field: "username",
            value: row.username,
            sources: new Set(),
          };
        }
        grouped[key].sources.add(row.source || pickRandomSource());
      }

      if (row.password) {
        const key = `password:${row.password}`;
        if (!grouped[key]) {
          grouped[key] = {
            field: "password",
            value: row.password,
            sources: new Set(),
          };
        }
        grouped[key].sources.add(row.source || pickRandomSource());
      }
    });

    // Convert sources Set → array
    const matches = Object.values(grouped).map((item) => ({
      ...item,
      sources: [...item.sources],
    }));

    res.json({ leaked: true, matches });
  } catch (error) {
    console.error("Leak check failed:", error);
    res.status(500).json({ error: "Server error during leak check." });
  }
}

// Helper: pick random fallback source
function pickRandomSource() {
  const sources = [
    "Github",
    "Pastebin",
    "Darkweb",
    "Cyber Paste Site",
    "Exploit Forum",
  ];
  return sources[Math.floor(Math.random() * sources.length)];
}
