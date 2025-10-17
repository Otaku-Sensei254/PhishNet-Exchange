// backend/routes/payment.routes.js
import express from "express";
import {
  initializePayment,
  handlePaystackCallback,
} from "../controllers/payment.controller.js";
import bodyParser from "body-parser";

const router = express.Router();

// Initialize user payment (called by frontend)
router.post("/initiate", initializePayment);

// Paystack callback (for frontend redirection or confirmation)
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
