import React, { useState } from "react";
import "../styles/TeamDashboard.css";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const TeamDashboard = ({ user, isAdmin = false, teamData: initialTeamData = null }) => {
  const [showCreateTeam, setShowCreateTeam] = useState(!initialTeamData);
  const [teamName, setTeamName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [teamData, setTeamData] = useState(initialTeamData);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // ✅ CREATE TEAM (Admin only)
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/teams/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          adminId: user.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTeamData(data.team);
        setMembers([
          {
            userId: user.id,
            email: user.email,
            status: "accepted",
          },
        ]);
        setShowCreateTeam(false);
        setTeamName("");
        setSuccess("Team created successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to create team");
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ✅ ADD MEMBER TO TEAM (Admin only)
  const handleAddMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // First check if user exists in database
      const checkResponse = await fetch(
        `${API_URL}/teams/check-user?email=${encodeURIComponent(newMemberEmail)}`
      );

      if (checkResponse.status === 404) {
        setError("User not found in PhishNet Exchange database");
        setLoading(false);
        return;
      }

      // Add member to team
      const response = await fetch(`${API_URL}/teams/add-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: teamData.id,
          memberEmail: newMemberEmail,
          adminId: user.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTeamData(data.team);
        setMembers(data.team.members);
        setNewMemberEmail("");
        setSuccess(`Invitation sent to ${newMemberEmail}!`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to add member");
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ✅ REMOVE MEMBER (Admin only)
  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/teams/remove-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: teamData.id,
          memberId,
          adminId: user.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTeamData(data.team);
        setMembers(data.team.members);
        setSuccess("Member removed successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to remove member");
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const chartData = [
    { name: "Leaks", count: 14 },
    { name: "Members", count: members.filter(m => m.status === "accepted").length || 1 },
    { name: "Monitored", count: user.monitoredEmails?.length || 0 }
  ];

  return (
    <div className="team-dashboard">
      {/* ERROR & SUCCESS MESSAGES */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* CREATE TEAM FORM (Admin Only) */}
      {showCreateTeam && isAdmin && (
        <div className="team-create-form">
          <h2>Create a New Team</h2>
          <form onSubmit={handleCreateTeam}>
            <input
              type="text"
              placeholder="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Creating..." : "Create Team"}
            </button>
          </form>
        </div>
      )}

      {/* TEAM DASHBOARD (After creation) */}
      {teamData && !showCreateTeam && (
        <div className="team-grid">
          {/* LEFT PANEL */}
          <div className="team-left">
            <h2>Team Settings</h2>

            <p>
              <strong>Team Name:</strong> {teamData.teamName}
            </p>
            <p>
              <strong>Team Admin:</strong> {user.email}
            </p>

            {isAdmin && (
              <>
                <h3>Add Member to Team</h3>
                <form onSubmit={handleAddMember}>
                  <input
                    type="email"
                    placeholder="member email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? "Adding..." : "Add Member"}
                  </button>
                </form>
              </>
            )}

            <h3>Team Members</h3>
            <ul className="members-list">
              {members.map((member) => (
                <li key={member.userId}>
                  <div className="member-info">
                    <span className="member-email">{member.email}</span>
                    <span className={`status ${member.status}`}>
                      {member.status === "pending" ? "⏳ Pending" : "✓ Accepted"}
                    </span>
                  </div>
                  {isAdmin && member.userId !== user.id && (
                    <button
                      className="btn btn-remove"
                      onClick={() => handleRemoveMember(member.userId)}
                      disabled={loading}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <button className="btn export">Download Team PDF</button>
          </div>

          {/* CENTER PANEL */}
          <div className="team-center">
            <h2>Team Leak Analytics</h2>

            <div className="chart-box">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="team-right">
            <h2>Team Activity</h2>

            <ul className="activity-list">
              <li>User A scanned email abc@example.com</li>
              <li>User B added a monitored phone</li>
              <li>User C downloaded PDF report</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDashboard;
