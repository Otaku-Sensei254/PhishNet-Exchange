// controllers/teamController.js
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

// ✅ CHECK IF USER EXISTS IN DATABASE (PostgreSQL)
export const checkUserExists = async (req, res) => {
  try {
    const { email } = req.query;
    
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (user) {
      return res.status(200).json({
        exists: true,
        userId: user.id,
        email: user.email,
      });
    }
    
    return res.status(404).json({
      exists: false,
      message: "User not found in database",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ CREATE TEAM (Admin creates team)
export const createTeam = async (req, res) => {
  try {
    const { teamName, adminId } = req.body;

    if (!teamName || !adminId) {
      return res.status(400).json({ error: "Team name and admin ID are required" });
    }

    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    // Create team
    const newTeam = await prisma.team.create({
      data: {
        teamName,
        adminId,
        members: {
          create: {
            userId: adminId,
            email: admin.email,
            status: "accepted",
          },
        },
      },
      include: {
        members: true,
        admin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Team created successfully",
      team: newTeam,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ ADD MEMBER TO TEAM
export const addMemberToTeam = async (req, res) => {
  try {
    const { teamId, memberEmail, adminId } = req.body;

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Verify admin
    if (team.adminId !== adminId) {
      return res.status(403).json({ error: "Only admin can add members" });
    }

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { email: memberEmail },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found in PhishNet Exchange database",
        userExists: false,
      });
    }

    // Check if already a member
    const isMember = team.members.some((m) => m.userId === user.id);
    if (isMember) {
      return res.status(400).json({ error: "User is already a member of this team" });
    }

    // Add member with pending status
    await prisma.teamMember.create({
      data: {
        teamId,
        userId: user.id,
        email: user.email,
        status: "pending",
      },
    });

    // Fetch updated team
    const updatedTeam = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        admin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Member invitation sent",
      team: updatedTeam,
      userExists: true,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ ACCEPT TEAM INVITATION
export const acceptTeamInvitation = async (req, res) => {
  try {
    const { teamId, userId } = req.body;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Update member status
    await prisma.teamMember.updateMany({
      where: {
        teamId,
        userId,
      },
      data: {
        status: "accepted",
      },
    });

    // Fetch updated team
    const updatedTeam = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        admin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Invitation accepted",
      team: updatedTeam,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ REJECT TEAM INVITATION
export const rejectTeamInvitation = async (req, res) => {
  try {
    const { teamId, userId } = req.body;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Delete member
    await prisma.teamMember.deleteMany({
      where: {
        teamId,
        userId,
      },
    });

    res.status(200).json({
      message: "Invitation rejected",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ REMOVE MEMBER FROM TEAM (Admin only)
export const removeMemberFromTeam = async (req, res) => {
  try {
    const { teamId, memberId, adminId } = req.body;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    if (team.adminId !== adminId) {
      return res.status(403).json({ error: "Only admin can remove members" });
    }

    // Delete member
    await prisma.teamMember.deleteMany({
      where: {
        teamId,
        userId: memberId,
      },
    });

    // Fetch updated team
    const updatedTeam = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        admin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Member removed from team",
      team: updatedTeam,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ GET USER'S TEAM
export const getUserTeam = async (req, res) => {
  try {
    const { userId } = req.params;

    const teamMember = await prisma.teamMember.findFirst({
      where: { userId },
      include: {
        team: {
          include: {
            members: true,
            admin: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!teamMember) {
      return res.status(404).json({
        userInTeam: false,
        message: "User is not in any team",
      });
    }

    res.status(200).json({
      userInTeam: true,
      team: teamMember.team,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ GET TEAM DETAILS
export const getTeamDetails = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        admin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ GET PENDING INVITATIONS FOR USER
export const getPendingInvitations = async (req, res) => {
  try {
    const { userId } = req.params;

    const pendingMembers = await prisma.teamMember.findMany({
      where: {
        userId,
        status: "pending",
      },
      include: {
        team: {
          include: {
            admin: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const teams = pendingMembers.map((member) => member.team);

    res.status(200).json({
      pendingInvitations: teams,
      count: teams.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
