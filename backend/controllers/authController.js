import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { initializePaystackTransaction } from "../utils/paystack.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req, res) => {
  try {
    const { username, email, password, plan } = req.body;

    if (!username || !email || !password || !plan) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profilePic = null;
    if (req.file) {
      profilePic = req.file.path;
    }

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      profilePic,
      plan,
      planPaid: plan === "free",
    });

    /* if (plan !== "free") {
      const amount = plan === "pro" ? 499 : plan === "team" ? 3000 : 0;
      const payUrl = await initializePaystackTransaction({
        email,
        amount,
        userId: newUser._id,
      });

      return res.status(201).json({
        msg: "User created. Complete payment to activate.",
        paymentUrl: payUrl,
      });
    }
*/
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      msg: "User registered successfully.",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        plan: newUser.plan,
        planPaid: newUser.planPaid,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during registration" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    if (
      (user.plan === "pro" || user.plan === "team") &&
      user.planPaid === false
    ) {
      return res.status(403).json({
        msg: "Payment required to access this plan.",
        paymentRequired: true,
      });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        plan: user.plan,
        planPaid: user.planPaid,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during login" });
  }
};

// controllers/authController.js
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10); // ✅ Ensure it's an integer

    if (isNaN(userId)) {
      return res.status(400).json({ msg: "Invalid user ID" });
    }

    // ✅ Fetch full user data including payment/subscription fields
    const query = `
      SELECT 
        id,
        username,
        email,
        plan,
        plan_paid,
        is_verified,
        subscription_expires,
        profile_pic
      FROM users
      WHERE id = $1
    `;
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    const user = result.rows[0];
    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("💥 GetUser error:", err);
    res.status(500).json({ success: false, msg: "Server error fetching user" });
  }
};

