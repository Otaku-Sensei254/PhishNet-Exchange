// middleware/checkLimits.js
import pool from "../config/neon.js"; // your Postgres connection

const packageLimits = {
  free: 5,
  pro: 50,
  enterprise: Infinity
};

export async function checkLimits(req, res, next) {
  try {
    const userId = req.user.id; // assuming JWT or session auth
    const { rows } = await pool.query(
      "SELECT plan, searches_used, last_reset FROM users WHERE id = $1",
      [userId]
    );

    const user = rows[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    const limit = packageLimits[user.plan] || 0;

    // reset daily if last_reset < today
    const now = new Date();
    const lastReset = new Date(user.last_reset);
    if (now.toDateString() !== lastReset.toDateString()) {
      await pool.query(
        "UPDATE users SET searches_used = 0, last_reset = NOW() WHERE id = $1",
        [userId]
      );
      user.searches_used = 0;
    }

    if (user.searches_used >= limit && limit !== Infinity) {
      return res.status(403).json({ error: "Search limit reached for your plan." });
    }

    // increment usage
    await pool.query(
      "UPDATE users SET searches_used = searches_used + 1 WHERE id = $1",
      [userId]
    );

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error checking package limits" });
  }
}
