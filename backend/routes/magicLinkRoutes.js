import { Router } from "express";
import crypto from "crypto";
import MagicToken from "../models/MagicToken.js";

const router = Router();

router.post("/generate", async (req, res) => {
  try {
    const { email, isTrial, tier } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await MagicToken.create({ email, token, isTrial: !!isTrial, tier: tier || "sentry", expiresAt });

    const magicUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/magic?token=${token}&is_trial=${!!isTrial}`;

    res.json({ success: true, magicUrl, token });
  } catch (err) {
    console.error("Magic link generate error:", err);
    res.status(500).json({ error: "Failed to generate magic link" });
  }
});

router.get("/verify", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Token is required" });

    const doc = await MagicToken.findOne({ token, used: false, expiresAt: { $gt: new Date() } });
    if (!doc) return res.status(404).json({ error: "Invalid or expired token" });

    res.json({ success: true, email: doc.email, isTrial: doc.isTrial, tier: doc.tier });
  } catch (err) {
    console.error("Magic link verify error:", err);
    res.status(500).json({ error: "Failed to verify token" });
  }
});

router.post("/claim", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token is required" });

    const doc = await MagicToken.findOneAndUpdate(
      { token, used: false, expiresAt: { $gt: new Date() } },
      { used: true },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Invalid or expired token" });

    res.json({ success: true, email: doc.email, isTrial: doc.isTrial, tier: doc.tier });
  } catch (err) {
    console.error("Magic link claim error:", err);
    res.status(500).json({ error: "Failed to claim token" });
  }
});

export default router;
