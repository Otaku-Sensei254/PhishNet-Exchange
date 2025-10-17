import React, { useState, useContext } from "react";
import "../Components/styles/Login.css";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/userContext";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { setUser } = useContext(UserContext); // ✅ Pull context

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Login successful!");

        localStorage.setItem("token", result.token);

        // Decode the token to get user ID
        const decoded = JSON.parse(atob(result.token.split(".")[1]));

        // Fetch user details
        const userRes = await fetch(
          `${process.env.REACT_APP_API_URL}/api/auth/user/${decoded.id}`
        );
        const userData = await userRes.json();

        if (userData.user) {
          setUser(userData.user); // ✅ update context
          navigate("/dashboard");
        } else {
          alert("Failed to fetch user data");
        }
      } else {
        alert(result.msg || "Invalid credentials");
      }
    } catch (err) {
      alert("Something went wrong.");
      console.error(err);
    }
  };

  return (
    <div className="Container">
      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Login</h2>
          <div className="inputs">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <div className="CTAs">
              <p>Don't have an account?</p>
              <Link to="/signup" className="goTo">
                Join Us today
              </Link>
            </div>

            <button type="submit" className="login-button">
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
