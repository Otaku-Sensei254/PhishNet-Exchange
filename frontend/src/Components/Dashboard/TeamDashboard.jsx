import React, { useState } from "react";
import "../styles/TeamDashboard.css";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const TeamDashboard = ({ user }) => {
  const [newMemberEmail, setNewMemberEmail] = useState("");

  const teamData = [
    { name: "Leaks", count: 14 },
    { name: "Members", count: user.teamMembers?.length || 1 },
    { name: "Monitored", count: user.monitoredEmails?.length || 0 }
  ];

  return (
    <div className="team-grid">

      {/* LEFT PANEL */}
      <div className="team-left">
        <h2>Team Settings</h2>

        <p><strong>Team Owner:</strong> {user.email}</p>

        <h3>Add Member</h3>
        <input 
          type="email"
          placeholder="member email"
          value={newMemberEmail}
          onChange={(e) => setNewMemberEmail(e.target.value)}
        />
        <button className="btn">Add Member</button>

        <h3>Team Members</h3>
        <ul>
          {user.teamMembers?.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>

        <button className="btn export">Download Team PDF</button>
      </div>

      {/* CENTER PANEL */}
      <div className="team-center">
        <h2>Team Leak Analytics</h2>

        <div className="chart-box">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" />
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
  );
};

export default TeamDashboard;
