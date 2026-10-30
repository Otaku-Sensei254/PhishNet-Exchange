import pool from "../config/neon.js";
import { sendTeamInvitationEmail } from "../utils/sendEmails.js";

async function ensureTeamTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_name VARCHAR(255) NOT NULL,
        admin_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'member',
        status VARCHAR(50) DEFAULT 'pending',
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(team_id, user_id)
      );
    `);
  } catch (err) {
    console.warn("Could not ensure team tables:", err.message);
  }
}

async function isAdmin(teamId, userId) {
  const res = await pool.query(
    `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = 'admin' AND status = 'accepted'`,
    [teamId, userId]
  );
  return res.rows.length > 0;
}

async function getTeamWithMembers(teamId) {
  const teamRes = await pool.query(`SELECT * FROM teams WHERE id = $1`, [teamId]);
  if (teamRes.rows.length === 0) return null;
  const membersRes = await pool.query(
    `SELECT * FROM team_members WHERE team_id = $1 ORDER BY joined_at DESC`,
    [teamId]
  );
  return { ...teamRes.rows[0], members: membersRes.rows };
}

export const checkUserExists = async (req, res) => {
  try {
    const { email } = req.query;
    const result = await pool.query("SELECT id, email FROM users WHERE email = $1", [email]);
    if (result.rows.length > 0) {
      return res.status(200).json({ exists: true, userId: result.rows[0].id, email: result.rows[0].email });
    }
    return res.status(404).json({ exists: false, message: "User not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTeam = async (req, res) => {
  try {
    const { teamName, adminId } = req.body;

    if (!teamName || !adminId) {
      return res.status(400).json({ error: "Team name and admin ID are required" });
    }

    const adminResult = await pool.query("SELECT id, email FROM users WHERE id = $1", [adminId]);
    if (adminResult.rows.length === 0) {
      return res.status(404).json({ error: "Admin user not found" });
    }
    const admin = adminResult.rows[0];

    const existingRes = await pool.query("SELECT id FROM teams WHERE admin_id = $1", [adminId]);
    if (existingRes.rows.length > 0) {
      return res.status(400).json({ error: "User already owns a team" });
    }

    await ensureTeamTables();

    const teamRes = await pool.query(
      `INSERT INTO teams (team_name, admin_id) VALUES ($1, $2) RETURNING *`,
      [teamName, adminId]
    );
    const team = teamRes.rows[0];

    await pool.query(
      `INSERT INTO team_members (team_id, user_id, email, role, status) VALUES ($1, $2, $3, $4, $5)`,
      [team.id, String(admin.id), admin.email, "admin", "accepted"]
    );

    const fullTeam = await getTeamWithMembers(team.id);
    res.status(201).json({ message: "Team created successfully", team: fullTeam });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addMemberToTeam = async (req, res) => {
  try {
    const { teamId, memberEmail, adminId } = req.body;

    const teamRes = await pool.query("SELECT * FROM teams WHERE id = $1", [teamId]);
    if (teamRes.rows.length === 0) return res.status(404).json({ error: "Team not found" });
    const team = teamRes.rows[0];

    if (!(await isAdmin(teamId, adminId))) {
      return res.status(403).json({ error: "Only admins can add members" });
    }

    const userResult = await pool.query("SELECT id, email FROM users WHERE email = $1", [memberEmail]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found in PhishNet Exchange" });
    }
    const user = userResult.rows[0];

    const existingRes = await pool.query(
      `SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, String(user.id)]
    );
    if (existingRes.rows.length > 0) {
      const member = existingRes.rows[0];
      if (member.status === "accepted") {
        return res.status(400).json({ error: "User is already a team member" });
      }
      if (member.status === "pending") {
        return res.status(400).json({ error: "Invitation already sent to this user" });
      }
    }

    await pool.query(
      `INSERT INTO team_members (team_id, user_id, email, role, status) VALUES ($1, $2, $3, $4, $5)`,
      [teamId, String(user.id), user.email, "member", "pending"]
    );

    const inviteUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/invite?teamId=${teamId}&teamName=${encodeURIComponent(team.team_name)}&email=${encodeURIComponent(user.email)}`;

    try {
      await sendTeamInvitationEmail(user.email, team.team_name, inviteUrl);
    } catch (emailErr) {
      console.warn("Email send failed (non-blocking):", emailErr.message);
    }

    const updatedTeam = await getTeamWithMembers(teamId);
    res.status(200).json({ message: "Invitation sent", team: updatedTeam });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const acceptTeamInvitation = async (req, res) => {
  try {
    const { teamId, userId } = req.body;

    await pool.query(
      `UPDATE team_members SET status = 'accepted' WHERE team_id = $1 AND user_id = $2`,
      [teamId, String(userId)]
    );

    const updatedTeam = await getTeamWithMembers(teamId);
    res.status(200).json({ message: "Invitation accepted", team: updatedTeam });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectTeamInvitation = async (req, res) => {
  try {
    const { teamId, userId } = req.body;

    await pool.query(
      `DELETE FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, String(userId)]
    );

    res.status(200).json({ message: "Invitation rejected" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeMemberFromTeam = async (req, res) => {
  try {
    const { teamId, memberId, adminId } = req.body;

    if (!(await isAdmin(teamId, adminId))) {
      return res.status(403).json({ error: "Only admins can remove members" });
    }

    const targetRes = await pool.query(
      `SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, String(memberId)]
    );
    if (targetRes.rows.length === 0) return res.status(404).json({ error: "Member not found" });
    if (targetRes.rows[0].role === "admin") {
      return res.status(403).json({ error: "Cannot remove the team admin" });
    }

    await pool.query(
      `DELETE FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, String(memberId)]
    );

    const updatedTeam = await getTeamWithMembers(teamId);
    res.status(200).json({ message: "Member removed", team: updatedTeam });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMemberRole = async (req, res) => {
  try {
    const { teamId, memberId, adminId, newRole } = req.body;

    if (!["admin", "member"].includes(newRole)) {
      return res.status(400).json({ error: "Role must be 'admin' or 'member'" });
    }

    if (!(await isAdmin(teamId, adminId))) {
      return res.status(403).json({ error: "Only admins can change roles" });
    }

    const targetRes = await pool.query(
      `SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, String(memberId)]
    );
    if (targetRes.rows.length === 0) return res.status(404).json({ error: "Member not found" });
    if (targetRes.rows[0].role === "admin" && newRole !== "admin") {
      return res.status(403).json({ error: "Cannot demote the team admin" });
    }

    await pool.query(
      `UPDATE team_members SET role = $1 WHERE team_id = $2 AND user_id = $3`,
      [newRole, teamId, String(memberId)]
    );

    const updatedTeam = await getTeamWithMembers(teamId);
    res.status(200).json({ message: `Role updated to ${newRole}`, team: updatedTeam });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserTeam = async (req, res) => {
  try {
    const { userId } = req.params;

    const memberRes = await pool.query(
      `SELECT tm.*, t.* FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE tm.user_id = $1 AND tm.status = 'accepted'`,
      [String(userId)]
    );

    if (memberRes.rows.length === 0) {
      return res.status(404).json({ userInTeam: false, message: "User is not in any team" });
    }

    const row = memberRes.rows[0];
    const team = {
      id: row.id,
      team_name: row.team_name,
      admin_id: row.admin_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
    const fullTeam = await getTeamWithMembers(row.id);

    res.status(200).json({
      userInTeam: true,
      team: fullTeam,
      role: row.role,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeamDetails = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await getTeamWithMembers(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPendingInvitations = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT tm.*, t.team_name, t.admin_id FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE tm.user_id = $1 AND tm.status = 'pending'`,
      [String(userId)]
    );

    const invitations = result.rows.map((r) => ({
      id: r.team_id,
      teamName: r.team_name,
      adminId: r.admin_id,
      createdAt: r.joined_at,
    }));

    res.status(200).json({ pendingInvitations: invitations, count: invitations.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeamStats = async (req, res) => {
  try {
    const { teamId } = req.params;

    const teamRes = await pool.query("SELECT * FROM teams WHERE id = $1", [teamId]);
    if (teamRes.rows.length === 0) return res.status(404).json({ error: "Team not found" });

    const membersRes = await pool.query("SELECT * FROM team_members WHERE team_id = $1", [teamId]);

    const members = membersRes.rows;
    const totalMembers = members.filter((m) => m.status === "accepted").length;
    const pendingInvites = members.filter((m) => m.status === "pending").length;
    const adminCount = members.filter((m) => m.role === "admin" && m.status === "accepted").length;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const newMembers = members.filter(
      (m) => m.status === "accepted" && new Date(m.joined_at) > thirtyDaysAgo
    ).length;

    res.status(200).json({ totalMembers, pendingInvites, adminCount, newMembers30d: newMembers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
