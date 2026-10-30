import React, { useEffect, useState, useContext } from "react";
import Dashboard from "./Dashboard";
import TeamInvitationModal from "../TeamInvitationModal";
import useTeamInvitations from "../../hooks/useTeamInvitations";
import { UserContext } from "../../context/userContext";

const DashboardWithTeamCheck = () => {
  const { user } = useContext(UserContext);
  const [userTeam, setUserTeam] = useState(null);
  const [userRole, setUserRole] = useState("member");
  const [loading, setLoading] = useState(true);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [currentInvitation, setCurrentInvitation] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const { invitations, acceptInvitation, rejectInvitation } = useTeamInvitations(user?.id);

  useEffect(() => {
    const checkUserTeam = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch(`${API_URL}/api/teams/user/${user.id}`);
        const data = await response.json();
        if (data.userInTeam) {
          setUserTeam(data.team);
          setUserRole(data.role || "member");
        }
      } catch (error) {
        console.error("Error checking user team:", error);
      } finally {
        setLoading(false);
      }
    };
    checkUserTeam();
  }, [user?.id, API_URL]);

  useEffect(() => {
    if (invitations.length > 0 && !showInvitationModal) {
      const firstInvitation = invitations[0];
      setCurrentInvitation({
        teamName: firstInvitation.teamName,
        adminEmail: firstInvitation.adminEmail || "Admin",
        teamId: firstInvitation.id || firstInvitation.teamId,
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
        const response = await fetch(`${API_URL}/api/teams/user/${user.id}`);
        const data = await response.json();
        if (data.userInTeam) {
          setUserTeam(data.team);
          setUserRole(data.role || "member");
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

  return (
    <>
      <Dashboard user={user} userTeam={userTeam} userRole={userRole} />
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
