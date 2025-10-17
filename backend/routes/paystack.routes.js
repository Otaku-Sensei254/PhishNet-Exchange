// backend/routes/paystack.routes.js
import express from "express";
import crypto from "crypto";
import pool from "../config/neon.js";

const router = express.Router();

// ✅ Webhook route for Paystack
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY; // or LIVE_KEY in production
  const signature = req.headers["x-paystack-signature"];

  // Verify signature
  const hash = crypto
    .createHmac("sha512", secret)
    .update(req.body)
    .digest("hex");

  if (hash !== signature) {
    console.error("❌ Invalid webhook signature");
    return res.status(400).send("Invalid signature");
  }

  // Parse the payload safely
  const payload = JSON.parse(req.body.toString());
  const { event, data } = payload;

  if (event === "charge.success") {
    const reference = data.reference;
    const email = data.customer.email;
    const amount = data.amount / 100; // convert from kobo to KES

    try {
      const result = await pool.query("SELECT * FROM users WHERE payment_reference = $1", [reference]);
      if (result.rows.length === 0) {
        console.warn(`⚠️ No user found for payment reference: ${reference}`);
        return res.sendStatus(200);
      }

      const user = result.rows[0];
      const newPlan = amount >= 2999 ? "enterprise" : "pro";
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await pool.query(
        `UPDATE users
         SET plan = $1, plan_paid = true, subscription_expires = $2, payment_reference = NULL
         WHERE id = $3`,
        [newPlan, expires, user.id]
      );

      console.log(`✅ Payment successful for ${email} (${newPlan.toUpperCase()})`);
    } catch (err) {
      console.error("⚠️ Error updating user after webhook:", err.message);
    }
  }

  res.sendStatus(200);
});

export default router;
