import express from "express";
import { analyzeRisk, reportURL, fetchBlocklist, fetchSignalStats, fetchScamBusterReports } from "../controllers/linkScanner.controller.js";

const router = express.Router();

router.post("/analyze", analyzeRisk);
router.post("/report", reportURL);
router.get("/blocklist", fetchBlocklist);
router.get("/stats", fetchSignalStats);
router.get("/scambuster", fetchScamBusterReports);

export default router;
