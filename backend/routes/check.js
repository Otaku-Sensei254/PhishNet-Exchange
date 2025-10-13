import express from "express";
import { searchLeaks } from "../controllers/leakcheck.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/search", authMiddleware, searchLeaks);

export default router;
