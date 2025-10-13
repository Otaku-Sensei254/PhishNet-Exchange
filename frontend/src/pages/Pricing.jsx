import React from "react";
import "../Components/styles/Pricing.css"; // Import your CSS styles

const Pricing = () => {
  return (
    <div className="pricing-page">
      <h1 className="pricing-title">Choose Your Plan</h1>
      <p className="pricing-subtitle">Upgrade to protect your data smarter.</p>
      <div className="pricing-cards">
        {/* Free Plan */}
        <div className="pricing-card">
          <h2>Free</h2>
          <p className="price">KES 0</p>
          <ul>
            <li>🔍 Monitor 1 email & phone</li>
            <li>📩 Email breach alerts</li>
            <li>🧠 Basic AI summaries</li>
            <li>🔖 Access community</li>
          </ul>
          <button className="select-btn">Get Started</button>
        </div>

        {/* Pro Plan */}
        <div className="pricing-card highlighted">
          <h2>Pro</h2>
          <p className="price">KES 499/month</p>
          <ul>
            <li>🔍 Monitor 5 accounts</li>
            <li>🔔 SMS & Email alerts</li>
            <li>🧠 Full GPT Explainer</li>
            <li>📊 Analytics Dashboard</li>
            <li>🎨 Pro User Badge</li>
          </ul>
          <button className="select-btn">Upgrade Now</button>
        </div>

        {/* Team Plan */}
        <div className="pricing-card">
          <h2>Team</h2>
          <p className="price">KES 3,000/month</p>
          <ul>
            <li>👥 Up to 5 members</li>
            <li>🔐 Monitor 25+ emails</li>
            <li>📄 PDF Threat Reports</li>
            <li>🧰 API Access</li>
            <li>💼 Company dashboard</li>
          </ul>
          <button className="select-btn">Contact Sales</button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
