import React, { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { UserContext } from "../context/userContext";
import "./InvitePage.css";

const InvitePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  const teamId = searchParams.get("teamId");
  const teamName = searchParams.get("teamName") || "the team";

  useEffect(() => {
    if (!teamId) {
      setStatus("error");
      setMessage("Invalid invitation link. No team specified.");
      return;
    }

    if (user) {
      handleAcceptInvitation();
    } else {
      setStatus("login");
    }
  }, [user, teamId, handleAcceptInvitation]);

  const handleAcceptInvitation = async () => {
    setStatus("loading");
    setMessage("Accepting invitation...");

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/teams/accept-invitation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId, userId: user.id }),
        }
      );

      if (response.ok) {
        setStatus("success");
        setMessage(`You've joined ${teamName}!`);
      } else {
        const data = await response.json();
        setStatus("error");
        setMessage(data.error || "Failed to accept invitation.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  if (status === "loading") {
    return (
      <div className="invite-container">
        <div className="invite-card">
          <div className="spinner" />
          <p>{message || "Processing..."}</p>
        </div>
      </div>
    );
  }

  if (status === "login") {
    return (
      <div className="invite-container">
        <div className="invite-card">
          <div className="invite-icon">📨</div>
          <h1>You're Invited!</h1>
          <p className="invite-team-name">
            Join <strong>{teamName}</strong> on PhishNet Exchange
          </p>
          <p className="invite-desc">
            Sign in or create an account to accept this invitation.
          </p>
          <div className="invite-actions">
            <Link to="/login" className="invite-btn invite-btn-primary">
              Sign In
            </Link>
            <Link to="/signup" className="invite-btn invite-btn-secondary">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="invite-container">
        <div className="invite-card">
          <div className="invite-icon">✅</div>
          <h1>Welcome Aboard!</h1>
          <p className="invite-team-name">
            You're now a member of <strong>{teamName}</strong>
          </p>
          <button
            className="invite-btn invite-btn-primary"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-container">
      <div className="invite-card">
        <div className="invite-icon">❌</div>
        <h1>Invitation Error</h1>
        <p>{message}</p>
        <button
          className="invite-btn invite-btn-primary"
          onClick={() => navigate("/")}
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default InvitePage;
