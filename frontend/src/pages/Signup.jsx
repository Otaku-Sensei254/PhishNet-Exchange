import React, { useState } from "react";
import "../Components/styles/Signup.css";
import { Link, useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    profilePic: null,
    plan: "free",
  });

  const handleChange = (e) => {
    const { id, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: files ? files[0] : value,
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
    if (formData.profilePic) data.append("profilePic", formData.profilePic);

    try {
      // 1. Register user
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

      // Extract user ID from registration response
      const userId = result.user?.id || result.user?._id; // support both _id or id

      // 2. Handle payment if not free plan
      if (formData.plan === "pro" || formData.plan === "team") {
        // Determine amount based on plan
        const amount = formData.plan === "pro" ? 499 : 3000;

        const payRes = await fetch(
          `${process.env.REACT_APP_API_URL}/api/payment/initiate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
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
          window.location.href = payData.paymentUrl; // Redirect to Paystack
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
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={handleChange}
              required
            />

            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <label htmlFor="plan">Choose Plan:</label>
            <select
              id="plan"
              value={formData.plan}
              onChange={handleChange}
              required
            >
              <option value="free">Free (KES 0)</option>
              <option value="pro">Pro (KES 499/month)</option>
              <option value="team">Team (KES 3,000/month)</option>
            </select>

            <label htmlFor="profilePic">Profile Picture:</label>
            <input
              type="file"
              id="profilePic"
              accept="image/*"
              onChange={handleChange}
            />

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
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
