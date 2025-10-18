import React, { useEffect, useState, useContext } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { UserContext } from "../context/userContext";
import "../Components/styles/PaymentStatus.css";
import shieldLogo from "../assets/shield.jpg";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const reference =
    searchParams.get("reference") ||
    searchParams.get("trxref") ||
    searchParams.get("ref");

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);

  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) return;

      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/payment/verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference }),
          }
        );

        const data = await res.json();

        if (res.ok && data.success) {
          console.log("✅ Payment verified successfully");
          setVerified(true);

          // ✅ Refresh user data in context
          const token = localStorage.getItem("token");
          if (token) {
            const decoded = JSON.parse(atob(token.split(".")[1]));
            const userRes = await fetch(
              `${process.env.REACT_APP_API_URL}/api/auth/user/${decoded.id}`
            );
            const userData = await userRes.json();
            setUser(userData.user);
          }
        } else {
          console.warn("⚠️ Payment verification failed:", data.msg);
          setError(data.msg || "Verification failed");
        }
      } catch (err) {
        console.error("❌ Verification error:", err);
        setError("Something went wrong verifying your payment");
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [reference, setUser]);

  return (
    <div className="payment-status-container">
      <div className="payment-status-card success">
        <img src={shieldLogo} alt="PhishNet Shield" className="status-logo" />

        {verifying ? (
          <>
            <h2>⏳ Verifying your payment...</h2>
            <p>Please wait while we confirm your transaction.</p>
          </>
        ) : error ? (
          <>
            <h1>❌ Verification Failed</h1>
            <p>{error}</p>
            <Link to="/pricing" className="status-btn">
              Try Again
            </Link>
          </>
        ) : verified ? (
          <>
            <h1>✅ Payment Successful!</h1>
            <p className="thank-you-text">
              Thank you for upgrading to <strong>PhishNet Exchange Pro</strong>!
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
          </>
        ) : null}

        <div className="status-footer">
          <p>
            Need help?{" "}
            <a
              href="mailto:support@phishnetexchange.com"
              className="support-link"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
