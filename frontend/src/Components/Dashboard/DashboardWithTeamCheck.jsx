// Components/DashboardWithTeamCheck.jsx
import React, { useEffect, useState, useContext } from "react";
import Dashboard from "./Dashboard";
import TeamDashboard from "./TeamDashboard";
import TeamInvitationModal from "../TeamInvitationModal";
import useTeamInvitations from "../../hooks/useTeamInvitations";
import { UserContext } from "../../context/userContext";

const DashboardWithTeamCheck = () => {
  const { user } = useContext(UserContext);
  const [userTeam, setUserTeam] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [currentInvitation, setCurrentInvitation] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const { invitations, acceptInvitation, rejectInvitation } = useTeamInvitations(user?.id);

  // Check if user belongs to a team
  useEffect(() => {
    const checkUserTeam = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`${API_URL}/teams/user/${user.id}`);
        const data = await response.json();

        if (data.userInTeam) {
          setUserTeam(data.team);
          setIsAdmin(data.team.adminId === user.id);
        }
      } catch (error) {
        console.error("Error checking user team:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserTeam();
  }, [user?.id, API_URL]);

  // Show invitation modal when new invitation arrives
  useEffect(() => {
    if (invitations.length > 0 && !showInvitationModal) {
      const firstInvitation = invitations[0];
      setCurrentInvitation({
        teamName: firstInvitation.teamName,
        adminEmail: firstInvitation.adminId?.email || "Admin",
        teamId: firstInvitation.id,
        invitedAt: firstInvitation.createdAt,
      });
      setShowInvitationModal(true);
    }
  }, [invitations, showInvitationModal]);

  const handleAcceptInvitation = async () => {
    if (currentInvitation) {
      const success = await acceptInvitation(currentInvitation.teamId, user.id);
      if (success) {
        setShowInvitationModal(false);
        setCurrentInvitation(null);
        // Refresh team data
        const response = await fetch(`${API_URL}/teams/user/${user.id}`);
        const data = await response.json();
        if (data.userInTeam) {
          setUserTeam(data.team);
        }
      }
    }
  };

  const handleRejectInvitation = async () => {
    if (currentInvitation) {
      await rejectInvitation(currentInvitation.teamId, user.id);
      setShowInvitationModal(false);
      setCurrentInvitation(null);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  // If user is in a team and is admin, show Team Dashboard
  if (userTeam && isAdmin) {
    return (
      <>
        <TeamDashboard user={user} isAdmin={true} teamData={userTeam} />
        <TeamInvitationModal
          invitation={currentInvitation}
          onAccept={handleAcceptInvitation}
          onReject={handleRejectInvitation}
          isOpen={showInvitationModal}
        />
      </>
    );
  }

  // If user is in a team but not admin, still show regular dashboard with team info
  // They can view their team from a button in the dashboard
  return (
    <>
      <Dashboard user={user} userTeam={userTeam} isTeamMember={!!userTeam} />
      <TeamInvitationModal
        invitation={currentInvitation}
        onAccept={handleAcceptInvitation}
        onReject={handleRejectInvitation}
        isOpen={showInvitationModal}
      />
    </>
  );
};

export default DashboardWithTeamCheck;
