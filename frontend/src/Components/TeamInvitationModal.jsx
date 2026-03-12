// Components/TeamInvitationModal.jsx
import React, { useState } from "react";
import "./styles/TeamInvitationModal.css";

const TeamInvitationModal = ({ invitation, onAccept, onReject, isOpen }) => {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    await onAccept(invitation);
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    await onReject(invitation);
    setLoading(false);
  };

  if (!isOpen || !invitation) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content team-invitation-modal">
        <div className="modal-header">
          <h2>🎉 Team Invitation</h2>
          <button className="close-btn" onClick={handleReject}>&times;</button>
        </div>

        <div className="modal-body">
          <p className="invitation-message">
            You've been invited to join the team <strong>{invitation.teamName}</strong>
          </p>

          <div className="invitation-details">
            <p><strong>Admin:</strong> {invitation.adminEmail}</p>
            <p><strong>Invitation Sent:</strong> {new Date(invitation.invitedAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-reject"
            onClick={handleReject}
            disabled={loading}
          >
            {loading ? "Rejecting..." : "Reject"}
          </button>
          <button
            className="btn btn-accept"
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? "Accepting..." : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamInvitationModal;
