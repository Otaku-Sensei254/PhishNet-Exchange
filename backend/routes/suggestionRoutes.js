import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { saveSuggestion, getSuggestions } from "../controllers/suggestionsController.js";

const router = express.Router();

// POST: save suggestion
router.post("/suggestion", verifyToken, saveSuggestion);

// GET: list all suggestions
router.get("/", verifyToken, getSuggestions);

export default router;
