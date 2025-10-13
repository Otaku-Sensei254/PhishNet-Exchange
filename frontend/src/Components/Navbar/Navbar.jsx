import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "../../assets/hook3.jpeg";
import { UserContext } from "../../context/userContext"; // ✅ Import context
import "./navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, setUser } = useContext(UserContext); // ✅ Use context

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null); // ✅ Clear context user
    window.location.href = "/"; // Optional: Redirect to home
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchUser = async () => {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const res = await fetch(
           `${process.env.REACT_APP_API_URL}/api/auth/user/${decoded.id}`
        );
        const data = await res.json();
        setUser(data.user); // ✅ Update global user
      } catch (err) {
        console.error("Navbar: error loading user", err);
      }
    };

    fetchUser();
  }, [setUser]);

  return (
    <motion.nav
      className="new-navbar"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="navbar-container">
        <div className="logo-container">
          <img src={Logo} alt="PhishNet Logo" className="logo-img" />
          <span className="brand-name">PhishNet Exchange</span>
        </div>

        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link to="/browse-iocs" onClick={() => setMenuOpen(false)}>
            IOCs
          </Link>
          <Link to="/submit-ioc" onClick={() => setMenuOpen(false)}>
            Submit Indicator
          </Link>
          <Link to="/community" onClick={() => setMenuOpen(false)}>
            Community
          </Link>
          <Link to="/pricing" onClick={() => setMenuOpen(false)}>
            Packages
          </Link>

          {user ? (
            <div className="user-info">
              <Link to="/dashboard" className="me-info">
                <img
                  src={user.profile_pic}
                  alt={user.username}
                  className="navbar-profile-pic"
                />
                <span className="navbar-username">{user.username}</span>
              </Link>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              <button className="login-btn">Login</button>
            </Link>
          )}
        </div>

        <div
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={toggleMenu}
        >
          <span />
          <span />
          <span />
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
