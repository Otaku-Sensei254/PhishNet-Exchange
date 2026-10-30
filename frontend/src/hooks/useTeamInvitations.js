import { useEffect, useState, useCallback } from "react";

const useTeamInvitations = (userId) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const fetchInvitations = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/teams/pending/${userId}`);
      const data = await response.json();

      if (response.ok) {
        const formatted = (data.pendingInvitations || []).map((inv) => ({
          id: inv.id || inv._id,
          teamId: inv.id || inv.teamId || inv._id,
          teamName: inv.teamName,
          adminEmail: inv.adminEmail || inv.admin?.email || "Admin",
          createdAt: inv.createdAt,
        }));
        setInvitations(formatted);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
    }
    setLoading(false);
  }, [userId, API_URL]);

  useEffect(() => {
    if (userId) {
      fetchInvitations();
      const interval = setInterval(fetchInvitations, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, fetchInvitations]);

  const acceptInvitation = async (teamId, userId) => {
    try {
      const response = await fetch(`${API_URL}/api/teams/accept-invitation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, userId }),
      });

      if (response.ok) {
        setInvitations(invitations.filter((inv) => inv.teamId !== teamId));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error accepting invitation:", error);
      return false;
    }
  };

  const rejectInvitation = async (teamId, userId) => {
    try {
      const response = await fetch(`${API_URL}/api/teams/reject-invitation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, userId }),
      });

      if (response.ok) {
        setInvitations(invitations.filter((inv) => inv.teamId !== teamId));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      return false;
    }
  };

  return {
    invitations,
    loading,
    acceptInvitation,
    rejectInvitation,
    refetch: fetchInvitations,
  };
};

export default useTeamInvitations;
