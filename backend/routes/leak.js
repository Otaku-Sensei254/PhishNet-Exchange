import express from "express";
import { checkLocalLeaks } from "../controllers/checkLeakController.js";

const router = express.Router();

router.post("/leak", checkLocalLeaks);

export default router;
