import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import "../Components/styles/PaymentStatus.css";
import shieldLogo from "../assets/shield.jpg"; // optional: your logo

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("ref");

  return (
    <div className="payment-status-container">
      <div className="payment-status-card success">
        <img src={shieldLogo} alt="PhishNet Shield" className="status-logo" />
        <h1>✅ Payment Successful!</h1>
        <p className="thank-you-text">
          Thank you for upgrading to <strong>PhishNet Exchange Pro</strong>.
          <br /> Your subscription is now active for the next <b>30 days</b>.
        </p>

        {reference && (
          <p className="transaction-ref">
            <strong>Transaction Reference:</strong> {reference}
          </p>
        )}

        <Link to="/dashboard" className="status-btn">
          Go to Dashboard
        </Link>

        <div className="status-footer">
          <p>
            Need help?{" "}
            <a href="mailto:support@phishnetexchange.com" className="support-link">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
