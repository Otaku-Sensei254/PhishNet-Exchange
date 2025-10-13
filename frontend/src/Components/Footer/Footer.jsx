import React from "react";
import { motion } from "framer-motion";
import "./footer.css";

const Footer = () => {
  return (
    <motion.footer
      className="footer"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="footer-content">
        <div className="footer-section brand">
          <h2>PhishNet Exchange</h2>
          <p>Keeping your data safe, one leak at a time.</p>
        </div>

        <div className="footer-section links">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/browse-threats">Browse Threats</a>
            </li>
            <li>
              <a href="/submit-indicator">Submit Indicator</a>
            </li>
            <li>
              <a href="/community">Community</a>
            </li>
          </ul>
        </div>

        <div className="footer-section social">
          <h4>Follow Us</h4>
          <div className="social-icons">
            <a href="/twitter">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="/discord">
              <i className="fab fa-discord"></i>
            </a>
            <a href="/github">
              <i className="fab fa-github"></i>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} PhishNet Exchange. All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
};

export default Footer;
