import React from "react";
import { Link } from "react-router-dom";
import "../Components/styles/App.css";

const features = [
  {
    icon: "🔍",
    title: "URL Scanner",
    desc: "Real-time URL analysis against 6 threat intelligence feeds. Detect phishing, malware, and malicious domains instantly.",
  },
  {
    icon: "📧",
    title: "Leak Detection",
    desc: "Check emails and credentials against breach databases. Get alerted when your data appears in known leaks.",
  },
  {
    icon: "🧠",
    title: "Threat Intelligence",
    desc: "MITRE ATT&CK mapping, ScamBuster integration, and heuristic analysis powered by multiple threat feed aggregators.",
  },
  {
    icon: "🌐",
    title: "Browser Extension",
    desc: "Real-time protection as you browse. Automatic URL scanning before pages load, with visual risk indicators.",
  },
  {
    icon: "📊",
    title: "SOC Dashboard",
    desc: "War-room style command center with live incident feed, team management, and drill-down threat analysis.",
  },
  {
    icon: "👥",
    title: "Team Collaboration",
    desc: "Invite team members with role-based access. Share threat intelligence and coordinate incident response.",
  },
];

export default function Home() {
  return (
    <div className="app-container">
      <div className="hero">
        <div className="scan-line" />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Enterprise Threat Intelligence Platform
          </div>
          <h1 className="hero-title">
            PhishNet <span className="hero-accent">Exchange</span>
          </h1>
          <p className="hero-subtitle">
            Real-time phishing detection, credential leak monitoring, and
            collaborative threat intelligence — built for security teams.
          </p>
          <div className="hero-stats">
            {[
              { value: "50K+", label: "Threats Blocked" },
              { value: "1.2K+", label: "Organizations" },
              { value: "99.9%", label: "Detection Rate" },
              { value: "24/7", label: "Monitoring" },
            ].map((s) => (
              <div key={s.label} className="hero-stat">
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="hero-actions">
            <Link to="/login" className="hero-btn hero-btn-primary">
              Sign In
            </Link>
            <Link to="/signup" className="hero-btn hero-btn-secondary">
              Create Account
            </Link>
          </div>
          <div className="hero-links">
            <a
              href="http://localhost:3001"
              className="hero-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              SecureFix.KE →
            </a>
          </div>
        </div>
      </div>

      <div className="Bottom">
        {features.map((f, i) => (
          <div key={i} className="feature-card">
            <div className="card-header">
              <span className="card-icon">{f.icon}</span>
              <span className="card-dot" />
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="home-cta">
        <h2>Ready to secure your organization?</h2>
        <p>
          Join thousands of security professionals using PhishNet Exchange to
          detect, analyze, and respond to threats in real time.
        </p>
        <div className="home-cta-actions">
          <Link to="/signup" className="hero-btn hero-btn-primary">
            Get Started Free
          </Link>
          <a
            href="http://localhost:3001/trial"
            className="hero-btn hero-btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Start 15-Day Trial
          </a>
        </div>
      </div>
    </div>
  );
}
