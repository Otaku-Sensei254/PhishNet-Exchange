import express from "express";
import { submitIOC, getIOCs, voteIOC } from "../controllers/iocController.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Submit a new IOC
router.post("/submit", verifyToken, submitIOC);

// Fetch latest IOCs
router.get("/", verifyToken, getIOCs);

// Vote on an IOC
router.post("/vote/:id", verifyToken, voteIOC);

export default router;
