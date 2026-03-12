// routes/teamRoutes.js
import express from "express";
import {
  checkUserExists,
  createTeam,
  addMemberToTeam,
  acceptTeamInvitation,
  rejectTeamInvitation,
  removeMemberFromTeam,
  getUserTeam,
  getTeamDetails,
  getPendingInvitations,
} from "../controllers/teamController.js";

const router = express.Router();

// ✅ Check if user exists in database
router.get("/check-user", checkUserExists);

// ✅ Create team (admin)
router.post("/create", createTeam);

// ✅ Add member to team (admin)
router.post("/add-member", addMemberToTeam);

// ✅ Accept invitation
router.post("/accept-invitation", acceptTeamInvitation);

// ✅ Reject invitation
router.post("/reject-invitation", rejectTeamInvitation);

// ✅ Remove member (admin)
router.post("/remove-member", removeMemberFromTeam);

// ✅ Get user's team
router.get("/user/:userId", getUserTeam);

// ✅ Get team details
router.get("/:teamId", getTeamDetails);

// ✅ Get pending invitations for user
router.get("/pending/:userId", getPendingInvitations);

export default router;
