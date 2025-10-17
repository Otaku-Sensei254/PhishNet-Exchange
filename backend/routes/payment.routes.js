// backend/routes/payment.routes.js
import express from "express";
import {
  initializePayment,
  handlePaystackCallback,
} from "../controllers/payment.controller.js";
import bodyParser from "body-parser";

const router = express.Router();

// 🟢 Initialize user payment (called by frontend)
router.post("/initiate", initializePayment);

// 🟢 Paystack redirect (GET) — when user returns from checkout
router.get("/callback", async (req, res) => {
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).send("Missing payment reference");
  }

  console.log(`🔗 Paystack redirected with reference: ${reference}`);

  // Optionally, you can verify payment here (recommended)
  // Then redirect user to your frontend success page
  return res.redirect(
    `https://phishnetexchange.vercel.app/payment-success?ref=${reference}`
  );
});

// 🟢 Paystack webhook (POST) — for Paystack to send confirmation events
router.post(
  "/callback",
  bodyParser.raw({ type: "application/json" }),
  (req, res, next) => {
    try {
      req.body = JSON.parse(req.body.toString());
    } catch (err) {
      console.error("Error parsing Paystack callback:", err);
    }
    next();
  },
  handlePaystackCallback
);

export default router;
