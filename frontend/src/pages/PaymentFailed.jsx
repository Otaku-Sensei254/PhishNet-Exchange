import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../Components/styles/PaymentStatus.css";
import shieldLogo from "../assets/shield.jpg";

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("ref");

  return (
    <div className="payment-status-container">
      <div className="payment-status-card failed">
        <img
          src={shieldLogo}
          alt="PhishNet Shield"
          className="status-logo failed"
        />

        <h1>❌ Payment Failed</h1>
        <p className="thank-you-text">
          Unfortunately, we couldn’t process your payment.
          <br />
          Don’t worry — your account remains safe and secure.
          <br />
          Please try again or reach out to our support team for help.
        </p>

        {reference && (
          <p className="transaction-ref">
            <strong>Transaction Reference:</strong> {reference}
          </p>
        )}

        <div className="status-actions">
          <Link to="/pricing" className="status-btn try-again">
            Try Again
          </Link>

          <a
            href="mailto:support@phishnetexchange.com"
            className="status-btn contact-support"
          >
            Contact Support
          </a>
        </div>

        <div className="status-footer">
          <p>
            Need help fast?{" "}
            <a
              href="mailto:support@phishnetexchange.com"
              className="support-link"
            >
              Reach out to us.
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
