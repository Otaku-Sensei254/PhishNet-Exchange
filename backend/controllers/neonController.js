// controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/neon.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req, res) => {
  try {
    const { username, email, password, plan } = req.body;

    if (!username || !email || !password || !plan) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // Check if user exists
    const existing = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ msg: "Email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profilePic = null;
    if (req.file) {
      profilePic = req.file.path;
    }

  const result = await pool.query(
  `INSERT INTO users 
  (username, email, password, profile_pic, plan, plan_paid, monitored_emails, monitored_phones, auto_scan_enabled, scan_frequency) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
  RETURNING id, username, email, plan, plan_paid, monitored_emails, monitored_phones, auto_scan_enabled, scan_frequency`,
  [
    username,
    email,
    hashedPassword,
    profilePic,
    plan,
    plan === "free",
    [], // default empty monitored emails
    [], // default empty monitored phones
    false, // autoScan default
    "daily", // scanFrequency default
  ]
);

    const newUser = result.rows[0];

    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({
      msg: "User registered successfully.",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during registration" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    if ((user.plan === "pro" || user.plan === "team") && !user.plan_paid) {
      return res.status(403).json({
        msg: "Payment required to access this plan.",
        paymentRequired: true,
      });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        plan: user.plan,
        planPaid: user.plan_paid,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during login" });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10); // ✅ Ensure integer ID

    if (isNaN(userId)) {
      return res.status(400).json({ msg: "Invalid user ID" });
    }

    // ✅ Select only guaranteed columns first
    let query = `
      SELECT id, username, email, plan, plan_paid, profile_pic
      FROM users
      WHERE id = $1
    `;
    let result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    let user = result.rows[0];

    // ✅ Try to fetch optional columns if they exist
    try {
      const optional = await pool.query(
        `SELECT is_verified, subscription_expires 
         FROM users WHERE id = $1`,
        [userId]
      );
      if (optional.rows.length > 0) {
        user = { ...user, ...optional.rows[0] };
      }
    } catch (err) {
      console.warn("Optional columns missing (is_verified / subscription_expires). Skipping.");
    }

    return res.json({ user });
  } catch (err) {
    console.error("GetUser error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
