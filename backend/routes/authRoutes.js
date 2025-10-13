import express from "express";
import User from "../models/User.js";
import upload from "../middlewares/upload.js";
import { register, login,getUser } from "../controllers/neonController.js";

const router = express.Router();

router.post("/register", upload.single("profilePic"), register);
router.post("/login", login);
// GET /api/auth/user/:id
router.get("/user/:id", getUser);
export default router;
