import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import pool from "../config/neon.js";

const JWT_SECRET = process.env.JWT_SECRET;

async function ensureIsTrialColumn() {
  try {
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false;
    `);
  } catch (err) {
    console.warn("Could not add is_trial column (may already exist):", err.message);
  }
}

async function ensureTeamTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_name VARCHAR(255) NOT NULL,
        admin_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'member',
        status VARCHAR(50) DEFAULT 'pending',
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(team_id, user_id)
      );
    `);
  } catch (err) {
    console.warn("Could not ensure team tables:", err.message);
  }
}

export const register = async (req, res) => {
  try {
    const { username, email, password, plan, accountType, teamName, is_trial } = req.body;

    if (!username || !email || !password || !plan) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (accountType === "team" && !teamName) {
      return res.status(400).json({ msg: "Team name is required for team accounts" });
    }

    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ msg: "Email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profilePic = null;
    if (req.file) {
      profilePic = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    await ensureIsTrialColumn();

    const result = await pool.query(
      `INSERT INTO users 
      (username, email, password, profile_pic, plan, plan_paid, monitored_emails, monitored_phones, auto_scan_enabled, scan_frequency, is_trial) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING id, username, email, plan, plan_paid, monitored_emails, monitored_phones, auto_scan_enabled, scan_frequency, is_trial`,
      [
        username,
        email,
        hashedPassword,
        profilePic,
        plan,
        plan === "free",
        [],
        [],
        false,
        "daily",
        is_trial === true || is_trial === "true",
      ]
    );

    const newUser = result.rows[0];

    if (accountType === "team" && teamName) {
      try {
        await ensureTeamTables();
        const teamRes = await pool.query(
          `INSERT INTO teams (team_name, admin_id) VALUES ($1, $2) RETURNING id`,
          [teamName, String(newUser.id)]
        );
        const teamId = teamRes.rows[0].id;
        await pool.query(
          `INSERT INTO team_members (team_id, user_id, email, role, status) VALUES ($1, $2, $3, $4, $5)`,
          [teamId, String(newUser.id), newUser.email, "admin", "accepted"]
        );
        console.log(`Team "${teamName}" created for user ${newUser.email}`);
      } catch (teamErr) {
        console.error("Team creation failed:", teamErr.message);
      }
    }

    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({
      msg: "User registered successfully.",
      token,
      user: { ...newUser, accountType: accountType || "personal", is_trial: newUser.is_trial || false },
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
