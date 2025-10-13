import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import { initializePaystackTransaction } from "../../utils/paystack.js";

const JWT_SECRET = process.env.JWT_SECRET;

// ================= REGISTER =================
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, plan } = req.body;

    if (!username || !email || !password || !plan) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let profilePic = null;
    if (req.file) {
      profilePic = req.file.path;
    }

    const userData = {
      username,
      email,
      password: hashedPassword,
      profilePic,
      plan,
      planPaid: plan === "free",
    };

    const newUser = await User.create(userData);

    // Handle paid plan: initialize payment
    if (plan !== "free") {
      const payInit = await initializePaystackTransaction(newUser);
      return res.status(201).json({
        message: "Account created. Complete payment to activate.",
        paymentLink: payInit.data.authorization_url,
        userId: newUser._id,
      });
    }

    // Free plan: auto-login
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "Registration successful",
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
    console.error("Register Error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
};

// ================= LOGIN =================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    if (
      (user.plan === "pro" || user.plan === "team") &&
      user.planPaid === false
    ) {
      return res.status(403).json({
        error: "Payment required to access this plan",
        paymentPending: true,
      });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      message: "Login successful",
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
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
};

// ================= GET USER =================
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
