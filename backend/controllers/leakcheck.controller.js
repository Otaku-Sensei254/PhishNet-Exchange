import pool from "../config/neon.js";   // PostgreSQL connection
import Leak from "../models/Leak.js";       // Leak model

export const searchLeaks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query } = req.body; // e.g. "password123"

    // 1️⃣ Get user plan from Postgres
    const userResult = await pool.query(
      "SELECT subscription_plan FROM users WHERE id = $1",
      [userId]
    );
    const subscriptionPlan = userResult.rows[0].subscription_plan;

    // 2️⃣ Apply search limits
    let limit = 5; // default for free
    if (subscriptionPlan === "basic") limit = 20;
    if (subscriptionPlan === "pro") limit = 100;

    // 3️⃣ Run leak search (Mongo example — replace with Postgres if needed)
    const leaks = await Leak.find({
      $or: [
        { email: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
        { password: { $regex: query, $options: "i" } },
      ],
    }).limit(limit);

    res.json({
      plan: subscriptionPlan,
      resultsReturned: leaks.length,
      leaks,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
