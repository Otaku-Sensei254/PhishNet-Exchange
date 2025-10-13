import express from "express";
import { submitThreat, getThreats } from "../controllers/threat.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

// Submit a threat (with optional screenshot)
router.post("/submit", verifyToken, upload.single("image"), submitThreat);

// Fetch threats
router.get("/", verifyToken, getThreats);

export default router;
