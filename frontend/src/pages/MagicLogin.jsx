import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import "../Components/styles/Signup.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function MagicLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [step, setStep] = useState("verifying");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState("sentry");

  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!token) {
      setError("No activation link found. Please check your email or request a new trial.");
      setStep("error");
      return;
    }

    fetch(`${API}/api/magic/verify?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setEmail(data.email);
          setTier(data.tier || "sentry");
          setStep("signup");
        } else {
          setError(data.error || "This link has expired or is invalid.");
          setStep("error");
        }
      })
      .catch(() => {
        setError("Something went wrong. Please try again.");
        setStep("error");
      });
  }, [token]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const body = new FormData();
      body.append("username", form.username);
      body.append("email", email);
      body.append("password", form.password);
      body.append("plan", "pro");
      body.append("accountType", "personal");
      body.append("is_trial", "true");

      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        body,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.msg || "Account creation failed.");
        return;
      }

      localStorage.setItem("token", data.token);
      await fetch(`${API}/api/magic/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      navigate("/dashboard");
    } catch (err) {
      alert("Something went wrong.");
    }
  };

  if (step === "verifying") {
    return (
      <div className="Container">
        <div className="signup-container" style={{ textAlign: "center", padding: "48px 24px" }}>
          <h2>Verifying your link...</h2>
          <p style={{ color: "var(--muted-foreground)", marginTop: 12, fontSize: "0.8rem" }}>
            Please wait a moment.
          </p>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="Container">
        <div className="signup-container" style={{ textAlign: "center", padding: "48px 24px" }}>
          <h2>Link Expired or Invalid</h2>
          <p style={{ color: "var(--danger)", marginTop: 12, fontSize: "0.85rem" }}>{error}</p>
          <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
            <Link to="/trial" style={{ color: "var(--primary)", fontSize: "0.8rem" }}>Request a new trial</Link>
            <Link to="/signup" style={{ color: "var(--foreground)", fontSize: "0.8rem" }}>Create account instead</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="Container">
      <div className="signup-container">
        <form className="signup-form" onSubmit={handleSubmit}>
          <h2>Activate Your Trial</h2>
          <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginBottom: 16 }}>
            {tier.charAt(0).toUpperCase() + tier.slice(1)} trial for <strong style={{ color: "var(--primary)" }}>{email}</strong>
          </p>
          <div className="inputs">
            <label htmlFor="username">Choose a Username:</label>
            <input type="text" id="username" value={form.username} onChange={handleChange} required />

            <label>Email (pre-filled):</label>
            <input type="email" value={email} disabled style={{ opacity: 0.6 }} />

            <label htmlFor="password">Create Password:</label>
            <input type="password" id="password" value={form.password} onChange={handleChange} required minLength={6} />

            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input type="password" id="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />

            <p style={{ fontSize: "0.65rem", color: "var(--muted-foreground)", marginBottom: 8 }}>
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>

            <button type="submit" className="signup-button">
              Activate & Go to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
