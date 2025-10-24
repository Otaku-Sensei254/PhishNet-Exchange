import React, { useEffect, useState, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation } from "react-router-dom";
import LeakCheckForm from "../LeakCheckFrm/Leakcheck";
import "./Dashboard.css";
import { UserContext } from "../../context/userContext";

const Dashboard = () => {
  const { user, setUser, fetchUser } = useContext(UserContext);
  const [history, setHistory] = useState([]);
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [scanFrequency, setScanFrequency] = useState("daily");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const location = useLocation();

  // ✅ Fetch user profile (refresh on route change or after payment)
  useEffect(() => {
    fetchUser();
  }, [location]);

  // ✅ Fetch scan history
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("token");
      fetch(`${process.env.REACT_APP_API_URL}/api/scan/history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setHistory(data.histories);
        })
        .catch(console.error);
    }
  }, [user]);

  // ✅ Auto scan toggle
  const toggleAutoScan = () => {
    if (user?.subscription === "free") {
      toast.error("Upgrade to Pro or Team to enable auto scan!");
      return;
    }
    setAutoScanEnabled(!autoScanEnabled);
    toast.info(`Auto Scan ${!autoScanEnabled ? "enabled" : "disabled"}`);
  };

  // ✅ Scan frequency change
  const handleScanFrequencyChange = (e) => {
    if (user?.subscription === "free") {
      toast.error("Only Pro & Team users can change scan frequency.");
      return;
    }
    setScanFrequency(e.target.value);
    toast.success(`Scan frequency set to ${e.target.value}`);
  };

  // ✅ Can user add more monitored items?
  const canAddMore = () => {
    if (!user) return false;
    const isFree = user.subscription?.toLowerCase() === "free";
    const emailLimit = user.monitoredEmails?.length || 0;
    const phoneLimit = user.monitoredPhones?.length || 0;
    return !isFree || (emailLimit < 1 && phoneLimit < 1);
  };

  // ✅ Add monitored email/phone
  const handleAddMonitor = async (e) => {
    e.preventDefault();
    if (!canAddMore()) {
      toast.error("Upgrade to monitor more than one email or phone number.");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/monitor/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail, phone: newPhone }),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.updatedUser);
        setNewEmail("");
        setNewPhone("");
        toast.success("Monitor added successfully!");
      } else {
        toast.error(data.msg || "Failed to add monitor.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error adding monitored data.");
    }
  };

  // ✅ Handle Upgrade Logic
  const handleUpgrade = async () => {
    if (!user) return;
    const plan = user.upgradePlan || "pro";
    const amount = plan === "pro" ? 499 : 3000;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/payment/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          userId: user.id,
          plan,
          amount,
        }),
      });

      const data = await res.json();
      if (res.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.error(data.msg || "Failed to start payment.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error initiating payment.");
    }
  };

  return (
    <div className="dashboard-grid">
      {/* LEFT PANEL */}
      <div className="dashboard-left">
        <h2>
          <img src={user?.profile_pic} alt="icon" className="left-Icon" />
          👤 Profile
        </h2>

        {user ? (
          <ul>
            <li>
              <strong>Username:</strong> {user.username}
            </li>
            <li>
              <strong>Email:</strong> {user.email}
            </li>
            <li>
              <strong>Subscription:</strong>{" "}
              <span className={`sub-tier ${user?.subscription?.toLowerCase() || "free"}`}>
                {user.subscription || "free"}
              </span>
            </li>
          </ul>
        ) : (
          <p>Loading user info...</p>
        )}

        {/* Monitored Accounts */}
        <div className="monitor-section styled-box">
          <h4>📡 Monitored Accounts</h4>
          <ul className="monitored-list">
            {user?.monitoredEmails?.map((email, i) => (
              <li key={i}>📧 <strong>{email}</strong></li>
            ))}
            {user?.monitoredPhones?.map((phone, i) => (
              <li key={i}>📱 <strong>{phone}</strong></li>
            ))}
          </ul>

          {canAddMore() && (
            <form onSubmit={handleAddMonitor} className="monitor-form">
              <input
                type="email"
                placeholder="Add email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <input
                type="text"
                placeholder="Add phone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
              <button type="submit">Monitor</button>
            </form>
          )}
        </div>

        {/* Upgrade Plan Section */}
        {user?.subscription === "free" && (
          <div className="upgrade-plan-section styled-box">
            <h4>🚀 Upgrade Your Plan</h4>
            <select
              value={user.upgradePlan || "pro"}
              onChange={(e) =>
                setUser((prev) => ({ ...prev, upgradePlan: e.target.value }))
              }
            >
              <option value="pro">Pro - KES 499/month</option>
              <option value="team">Team - KES 3,000/month</option>
            </select>
            <button onClick={handleUpgrade}>Upgrade Now</button>
          </div>
        )}
      </div>

      {/* CENTER PANEL */}
      <div className="dashboard-center">
        <LeakCheckForm />
      </div>

      {/* RIGHT PANEL */}
      <div className="dashboard-right">
        <h2>🧠 History & Automation</h2>

        {user?.subscription !== "free" ? (
          <>
            <div className="auto-scan-toggle">
              <button
                className={`animated-toggle ${autoScanEnabled ? "on" : "off"}`}
                onClick={toggleAutoScan}
              >
                {autoScanEnabled ? "🟢 Auto Scan On" : "⚪ Enable Auto Scan"}
              </button>
            </div>

            <div className="frequency-selector">
              <label>
                Frequency:
                <select
                  value={scanFrequency}
                  onChange={handleScanFrequencyChange}
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>
            </div>
          </>
        ) : (
          <div className="automation-locked">
            <p>🔒 Auto-scan is available for Pro & Team users.</p>
            <p>Upgrade your plan to unlock this feature.</p>
          </div>
        )}

        <ToastContainer position="top-right" autoClose={3000} />

        <div className="log-section">
          <h3>Search History</h3>
          <ul>
            {history.length > 0 ? (
              history.map((scan, idx) => (
                <li key={idx}>
                  <strong>{new Date(scan.timestamp).toLocaleString()}</strong>
                  {scan.matches.length > 0 ? (
                    <ul>
                      {scan.matches.map((match, i) => (
                        <li key={i}>
                          <strong>{match.field}</strong>: {match.value}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No leaks found.</p>
                  )}
                </li>
              ))
            ) : (
              <p>No history yet.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
