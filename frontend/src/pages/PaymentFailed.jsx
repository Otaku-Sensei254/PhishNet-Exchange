import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../Components/styles/PaymentStatus.css";
import shieldLogo from "../assets/shield.jpg"; // same as success page

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("ref");

  return (
    <div className="payment-status-container">
      <div className="payment-status-card failed">
        <img src={shieldLogo} alt="PhishNet Shield" className="status-logo failed" />
        <h1>❌ Payment Failed</h1>
        <p className="thank-you-text">
          Unfortunately, your payment could not be processed at this time.
          <br />
          Please try again or contact support if the issue persists.
        </p>

        {reference && (
          <p className="transaction-ref">
            <strong>Transaction Reference:</strong> {reference}
          </p>
        )}

        <Link to="/pricing" className="status-btn try-again">
          Try Again
        </Link>

        <div className="status-footer">
          <p>
            Need assistance?{" "}
            <a href="mailto:support@phishnetexchange.com" className="support-link">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
