import React, { useState } from "react";
import "../Components/styles/Signup.css";
import { Link, useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const isTrialQuery = params.get("is_trial") === "true";
  const [formData, setFormData] = useState({
    username: "",
    email: params.get("email") || "",
    password: "",
    confirmPassword: "",
    profilePic: null,
    plan: isTrialQuery ? "pro" : "free",
    accountType: "personal",
    teamName: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleChange = (e) => {
    const { id, value, files } = e.target;
    if (id === "profilePic" && files?.[0]) {
      setFileName(files[0].name);
    }
    setFormData((prev) => ({
      ...prev,
      [id]: files ? files[0] : value,
    }));
  };

  const handlePlanChange = (e) => {
    const plan = e.target.value;
    setFormData((prev) => ({
      ...prev,
      plan,
      accountType: plan === "team" ? "team" : "personal",
      ...(plan !== "team" && { teamName: "" }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const data = new FormData();
    data.append("username", formData.username);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("plan", formData.plan);
    data.append("accountType", formData.accountType);
    if (isTrialQuery) data.append("is_trial", "true");
    if (formData.accountType === "team") {
      data.append("teamName", formData.teamName);
    }
    if (formData.profilePic) data.append("profilePic", formData.profilePic);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/register`,
        {
          method: "POST",
          body: data,
        }
      );

      const result = await res.json();
      if (!res.ok) {
        alert(result.msg || "Signup failed.");
        return;
      }

      const userId = result.user?.id || result.user?._id;

      if (formData.plan === "pro" || formData.plan === "team") {
        const amount = formData.plan === "pro" ? 499 : 3000;

        const payRes = await fetch(
          `${process.env.REACT_APP_API_URL}/api/payment/initiate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              plan: formData.plan,
              amount,
              userId,
            }),
          }
        );

        const payData = await payRes.json();
        if (payRes.ok && payData.paymentUrl) {
          window.location.href = payData.paymentUrl;
        } else {
          alert(payData.msg || "Failed to start payment.");
        }
      } else {
        alert("Account created! You can now log in.");
        navigate("/login");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  return (
    <div className="Container">
      <div className="signup-container">
        <form
          className="signup-form"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
        >
          <h2>Sign Up</h2>
          <div className="inputs">
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrap">
                <input
                  type={showPw ? "text" : "password"}
                  id="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowPw(!showPw)}
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-wrap">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  tabIndex={-1}
                  aria-label={showConfirmPw ? "Hide password" : "Show password"}
                >
                  {showConfirmPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="plan">Choose Plan</label>
              <select
                id="plan"
                value={formData.plan}
                onChange={handlePlanChange}
                required
              >
                <option value="free">Free (KES 0)</option>
                <option value="pro">Pro (KES 499/month)</option>
                <option value="team">Team (KES 3,000/month)</option>
              </select>
            </div>

            {formData.plan === "team" && (
              <>
                <div className="input-group">
                  <label htmlFor="teamName">Team Name</label>
                  <input
                    type="text"
                    id="teamName"
                    placeholder="e.g. SecureFix D-HuhutechLabs"
                    value={formData.teamName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <p className="input-hint">
                  You'll be the admin of this team. You can invite members after
                  registration.
                </p>
              </>
            )}

            <div className="input-group">
              <label>Profile Picture</label>
              <div className={`file-upload ${fileName ? "has-file" : ""}`}>
                <input
                  type="file"
                  id="profilePic"
                  accept="image/*"
                  onChange={handleChange}
                />
                <div className="file-upload-label">
                  <span className="upload-icon">{fileName ? "🖼" : "📁"}</span>
                  <span>{fileName || "Click to upload profile picture"}</span>
                </div>
              </div>
            </div>

            <div className="CTAs">
              <p>Already have an account?</p>
              <Link to="/login" className="goTo">
                Login here
              </Link>
            </div>

            <div className="terms-container">
              <input type="checkbox" className="check" required />
              <p className="terms">
                By signing up, you agree to our{" "}
                <Link to="/terms" className="terms-link">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="privacy-link">
                  Privacy Policy
                </Link>
              </p>
            </div>

            <button type="submit" className="signup-button">
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
