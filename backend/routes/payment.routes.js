// payment.routes.js
import express from "express";
import {
  initializePayment,
  handlePaystackCallback,
} from "../controllers/payment.controller.js";
import bodyParser from "body-parser";

const router = express.Router();

router.post("/initiate", initializePayment);

// ⚠️ Use raw body for Paystack webhook to validate signature later if needed
router.post(
  "/callback",
  bodyParser.raw({ type: "application/json" }),
  (req, res, next) => {
    try {
      req.body = JSON.parse(req.body.toString()); // manually parse JSON
    } catch (err) {
      console.error("Error parsing Paystack webhook body", err);
    }
    next();
  },
  handlePaystackCallback
);

export default router;
