import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { saveScanHistory, getUserScanHistories } from "../controllers/scanHistoryController.js";

const router = express.Router();

// Save scan history (POST)
router.post("/save", verifyToken, saveScanHistory);

// Get scan history (GET)
router.get("/history", verifyToken, getUserScanHistories);

export default router;
