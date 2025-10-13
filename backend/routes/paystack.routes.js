import express from "express";
import { handlePaystackWebhook } from "../controllers/paystack.controller.js";
import { verifyPaystackSignature } from "../middlewares/verifypaystackSignature.js";

const router = express.Router();
router.post(
  "/webhook",
  express.json({ type: "*/*" }),
  verifyPaystackSignature,
  handlePaystackWebhook
);

export default router;
