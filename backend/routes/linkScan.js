import express from "express";
import { analyzeRisk } from "../controllers/linkScanner.controller.js";

const router = express.Router();

router.post("/analyze", analyzeRisk);

export default router;
