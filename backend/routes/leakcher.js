import express from "express";
//import { checkLeaks } from "../controllers/leakcheck.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/check-leaks", verifyToken);

export default router;
