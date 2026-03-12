// hooks/useTeamInvitations.js
import { useEffect, useState, useCallback } from "react";

const useTeamInvitations = (userId) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // Fetch pending invitations
  const fetchInvitations = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/teams/pending/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setInvitations(data.pendingInvitations || []);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
    }
    setLoading(false);
  }, [userId, API_URL]);

  // Fetch invitations on mount and periodically
  useEffect(() => {
    if (userId) {
      fetchInvitations();
      // Poll every 30 seconds for new invitations
      const interval = setInterval(fetchInvitations, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, fetchInvitations]);

  // Accept invitation
  const acceptInvitation = async (teamId, userId) => {
    try {
      const response = await fetch(`${API_URL}/teams/accept-invitation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, userId }),
      });

      if (response.ok) {
        setInvitations(invitations.filter((inv) => inv._id !== teamId));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error accepting invitation:", error);
      return false;
    }
  };

  // Reject invitation
  const rejectInvitation = async (teamId, userId) => {
    try {
      const response = await fetch(`${API_URL}/teams/reject-invitation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, userId }),
      });

      if (response.ok) {
        setInvitations(invitations.filter((inv) => inv._id !== teamId));
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
