import { Router } from "express";
import TrialRequest from "../models/TrialRequest.js";
import MagicToken from "../models/MagicToken.js";
import crypto from "crypto";
import { sendTrialConfirmationEmail } from "../utils/sendEmails.js";

const router = Router();

router.post("/request", async (req, res) => {
  try {
    const { name, email, phone, company, size, tier, message, agreed } = req.body;

    if (!name || !email || !company || !agreed) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const trial = await TrialRequest.create({
      name,
      email,
      phone,
      company,
      size,
      tier: tier || "sentry",
      message,
      agreed,
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await MagicToken.create({
      email,
      token,
      isTrial: true,
      tier: tier || "sentry",
      expiresAt,
    });

    const magicUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/magic?token=${token}&is_trial=true`;

    try {
      await sendTrialConfirmationEmail({ name, email, company, tier: tier || "sentry", magicUrl });
    } catch (emailErr) {
      console.warn("Trial confirmation email failed:", emailErr.message);
    }

    res.status(201).json({ success: true, message: "Trial request received" });
  } catch (err) {
    console.error("Trial request error:", err);
    res.status(500).json({ error: "Failed to submit trial request" });
  }
});

export default router;
