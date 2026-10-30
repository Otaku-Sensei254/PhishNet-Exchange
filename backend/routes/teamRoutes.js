import express from "express";
import {
  checkUserExists,
  createTeam,
  addMemberToTeam,
  acceptTeamInvitation,
  rejectTeamInvitation,
  removeMemberFromTeam,
  updateMemberRole,
  getUserTeam,
  getTeamDetails,
  getPendingInvitations,
  getTeamStats,
} from "../controllers/teamController.js";

const router = express.Router();

router.get("/check-user", checkUserExists);
router.post("/create", createTeam);
router.post("/add-member", addMemberToTeam);
router.post("/accept-invitation", acceptTeamInvitation);
router.post("/reject-invitation", rejectTeamInvitation);
router.post("/remove-member", removeMemberFromTeam);
router.post("/update-role", updateMemberRole);
router.get("/stats/:teamId", getTeamStats);
router.get("/user/:userId", getUserTeam);
router.get("/pending/:userId", getPendingInvitations);
router.get("/:teamId", getTeamDetails);

export default router;
