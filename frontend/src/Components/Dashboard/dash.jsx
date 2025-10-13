import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import LeakCheckForm from "../LeakCheckFrm/Leakcheck"; // your form component
import "./Dashboard.css";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [scanFrequency, setScanFrequency] = useState("daily");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      fetch(`http://localhost:5000/api/auth/user/${decoded.id}`)
        .then((res) => res.json())
        .then((data) =>
          setUser({
            ...data.user,
            subscription: data.user?.plan || "FREE",
          })
        )
        .catch((err) => console.error("Error fetching user info:", err));
    } catch (err) {
      console.error("Token decode error:", err);
    }
  }, []);

  useEffect(() => {
    if (user?._id) {
      const token = localStorage.getItem("token");

      fetch(`http://localhost:5000/api/scan/history/${user._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setHistory(data.history);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  const toggleAutoScan = () => {
    setAutoScanEnabled(!autoScanEnabled);
  };

  const handleScanFrequencyChange = (e) => {
    setScanFrequency(e.target.value);
  };

  const canAddMore = () => {
    if (!user) return false;
    const isFree = user.subscription === "free";
    const emailLimit = user.monitoredEmails?.length || 0;
    const phoneLimit = user.monitoredPhones?.length || 0;
    return !isFree || (emailLimit < 1 && phoneLimit < 1);
  };

  const handleAddMonitor = async (e) => {
    e.preventDefault();
    if (!canAddMore()) {
      alert("Upgrade to monitor more than one email or phone number.");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/monitor/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newEmail,
          phone: newPhone,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.updatedUser);
        setNewEmail("");
        setNewPhone("");
      } else {
        alert(data.msg || "Failed to add monitor.");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding monitored data.");
    }
  };

  return (
    <div className="dashboard-grid">
      {/* LEFT PANEL */}
      <div className="dashboard-left">
        <h2>
          <img src={user?.profilePic} alt="icon" className="left-Icon" />
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
              <span className={`sub-tier ${user.subscription.toLowerCase()}`}>
                {user.subscription}
              </span>
            </li>
          </ul>
        ) : (
          <p>Loading user info...</p>
        )}

        {/* ✅ Monitoring Section */}
        <div className="monitor-section styled-box">
          <h4>📡 Monitored Accounts</h4>
          <ul className="monitored-list">
            {user?.monitoredEmails?.map((email, i) => (
              <li key={i}>
                📧 <strong>{email}</strong>
              </li>
            ))}
            {user?.monitoredPhones?.map((phone, i) => (
              <li key={i}>
                📱 <strong>{phone}</strong>
              </li>
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

        {/* ✅ Upgrade Plan Section */}
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
            <button
              onClick={async () => {
                const plan = user.upgradePlan || "pro";
                const amount = plan === "pro" ? 499 : 3000;
                try {
                  const res = await fetch(
                    "http://localhost:5000/api/payment/initiate",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        email: user.email,
                        userId: user._id || user.id,
                        plan,
                        amount,
                      }),
                    }
                  );

                  const data = await res.json();
                  if (res.ok && data.paymentUrl) {
                    window.location.href = data.paymentUrl;
                  } else {
                    alert("Failed to start payment.");
                  }
                } catch (err) {
                  console.error(err);
                  alert("Error during upgrade.");
                }
              }}
            >
              Upgrade Now
            </button>
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
              <span>Auto Leak Check</span>
              <div
                className={`switch ${autoScanEnabled ? "enabled" : ""}`}
                onClick={toggleAutoScan}
              >
                <div className="slider" />
              </div>
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
                          <strong>{match.field}</strong>: {match.value} <br />
                          Source:{" "}
                          <a
                            href={match.source}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {match.source}
                          </a>
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
