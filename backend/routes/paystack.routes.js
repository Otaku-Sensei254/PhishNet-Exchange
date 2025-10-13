import express from "express";
import { handlePaystackWebhook } from "../controllers/paystack.controller.js";
import { verifypaystackSignature } from "../middlewares/verifypaystackSignature.js";

const router = express.Router();
router.post(
  "/webhook",
  express.json({ type: "*/*" }),
  verifypaystackSignature,
  handlePaystackWebhook
);

export default router;
