import pool from "../config/neon.js";

const XON_API = "https://api.xposedornot.com/v1/check-email";

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

    let { rows } = await pool.query(query, values);

    // If local cache has results, return them immediately
    if (rows.length > 0) {
      return res.json({
        leaked: true,
        matches: groupMatches(rows),
      });
    }

    // Cache miss — try XposedOrNot API (email only)
    if (email) {
      try {
        const xonRes = await fetch(`${XON_API}/${encodeURIComponent(email)}`, {
          signal: AbortSignal.timeout(5000),
        });
        const xonData = await xonRes.json();

        if (xonData.status === "success" && xonData.breaches?.length > 0) {
          const breachNames = xonData.breaches.flat();
          const sourceStr = breachNames.join(", ");

          // Cache result in local DB
          try {
            await pool.query(
              `INSERT INTO leaks (email, source) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [email, sourceStr]
            );
          } catch (cacheErr) {
            console.warn("Failed to cache leak result:", cacheErr.message);
          }

          return res.json({
            leaked: true,
            matches: [{
              field: "email",
              value: email,
              sources: breachNames,
            }],
          });
        }
      } catch (xonErr) {
        console.warn("XposedOrNot API error:", xonErr.message);
      }
    }

    return res.json({ leaked: false, matches: [] });
  } catch (error) {
    console.error("Leak check failed:", error);
    res.status(500).json({ error: "Server error during leak check." });
  }
}

function groupMatches(rows) {
  const grouped = {};

  rows.forEach((row) => {
    if (row.email) {
      const key = `email:${row.email}`;
      if (!grouped[key]) {
        grouped[key] = { field: "email", value: row.email, sources: new Set() };
      }
      if (row.source) grouped[key].sources.add(row.source);
    }

    if (row.username) {
      const key = `username:${row.username}`;
      if (!grouped[key]) {
        grouped[key] = { field: "username", value: row.username, sources: new Set() };
      }
      if (row.source) grouped[key].sources.add(row.source);
    }

    if (row.password) {
      const key = `password:${row.password}`;
      if (!grouped[key]) {
        grouped[key] = { field: "password", value: row.password, sources: new Set() };
      }
      if (row.source) grouped[key].sources.add(row.source);
    }
  });

  return Object.values(grouped).map((item) => ({
    ...item,
    sources: [...item.sources],
  }));
}
