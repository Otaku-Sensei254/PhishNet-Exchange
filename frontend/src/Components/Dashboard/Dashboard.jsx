import React, { useEffect, useState, useContext } from "react";
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
  // Set default to "pro" - the useEffect will correct it if needed
  const [upgradePlan, setUpgradePlan] = useState("pro");
  const [teamMembers, setTeamMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const location = useLocation();

  /** ✅ Re-fetch user data whenever returning from payment or navigating */
  useEffect(() => {
    if (fetchUser) fetchUser();
  }, [location, fetchUser]);

  /** ✅ Fetch scan history once user is available */
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    fetch(`${process.env.REACT_APP_API_URL}/api/scan/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setHistory(data.histories);
      })
      .catch((err) => console.error("Error fetching history:", err));
  }, [user]);

  /** ✅ Helper: detect if user is on free tier */
  const isFree = () => {
    return !user || String(user.plan || "free").toLowerCase() === "free";
  };

  /** ✅ Helper: detect if user is on Pro tier */
  const isPro = () => {
    return user && String(user.plan).toLowerCase() === "pro";
  };

  /** ✅ Helper: detect if user is on Team tier */
  const isTeam = React.useCallback(() => {
    return user && String(user.plan).toLowerCase() === "team";
  }, [user]);

  /** ✅ Fetch team members if user is on Team plan */
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (isTeam()) {
        const token = localStorage.getItem("token");
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/team/members`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          if (data.success) setTeamMembers(data.members);
        } catch (err) {
          console.error("Error fetching team members:", err);
        }
      }
    };

    fetchTeamMembers();
  }, [user, isTeam]);
  
  /** ✅ Set default upgrade plan based on user's current plan */
  useEffect(() => {
    if (isPro()) {
      setUpgradePlan("team"); // Pro users can only upgrade to Team
    } else {
      setUpgradePlan("pro"); // Free users default to Pro
    }
    // We only want to run this when 'user' is loaded or changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /** ✅ Auto Scan Toggle — only for Pro/Team users */
  const toggleAutoScan = () => {
    if (isFree()) {
      toast.error("Auto-scan is available only for Pro & Team users.");
      return;
    }
    const newState = !autoScanEnabled;
    setAutoScanEnabled(newState);
    
    const token = localStorage.getItem("token");
    fetch(`${process.env.REACT_APP_API_URL}/api/auto-scan/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ enabled: newState, frequency: scanFrequency }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          toast.info(`Auto Scan ${newState ? "enabled" : "disabled"}`);
        }
      })
      .catch((err) => {
        console.error("Error updating auto-scan:", err);
        toast.error("Failed to update auto-scan settings");
      });
  };

  /** ✅ Scan Frequency — only for Pro/Team users */
  const handleScanFrequencyChange = (e) => {
    if (isFree()) {
      toast.error("Only Pro & Team users can change scan frequency.");
      return;
    }
    setScanFrequency(e.target.value);
    
    if (autoScanEnabled) {
      const token = localStorage.getItem("token");
      fetch(`${process.env.REACT_APP_API_URL}/api/auto-scan/update-frequency`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ frequency: e.target.value }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            toast.success(`Scan frequency set to ${e.target.value}`);
          }
        })
        .catch((err) => {
          console.error("Error updating frequency:", err);
          toast.error("Failed to update frequency");
        });
    }
  };

  /** ✅ Can user add more monitored items */
  const canAddMore = () => {
    if (!user) return false;
    const free = isFree();
    const emailCount = user.monitoredEmails?.length || 0;
    const phoneCount = user.monitoredPhones?.length || 0;
    return !free || (emailCount < 1 && phoneCount < 1);
  };

  /** ✅ Add monitored email/phone */
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

  /** ✅ Add Team Member */
  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    if (!isTeam()) {
      toast.error("Only Team plan users can add members.");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/team/add-member`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newMemberEmail }),
      });
      const data = await res.json();

      if (res.ok) {
        setTeamMembers(data.updatedMembers);
        setNewMemberEmail("");
        toast.success("Team member added successfully!");
      } else {
        toast.error(data.msg || "Failed to add team member.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error adding team member.");
    }
  };

  /** ✅ Download PDF Report */
  const handleDownloadPDF = async () => {
    if (!isTeam()) {
      toast.error("Only Team plan users can download PDF reports.");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/reports/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'security-report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF report downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Error downloading PDF report.");
    }
  };

  /** ✅ Upgrade Plan (Paystack initialization) */
  const handleUpgrade = async () => {
    if (!user) {
      toast.error("Please log in first.");
      return;
    }
    
    // Use the state variable 'upgradePlan'
    const plan = upgradePlan; 
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
      <ToastContainer position="top-right" autoClose={3000} />

      {/* ================= LEFT PANEL ================= */}
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
              <strong>plan:</strong>{" "}
              <span
                className={`sub-tier ${String(user.plan || "free").toLowerCase()}`}
              >
                {user.plan || "Free"}
              </span>
            </li>
          </ul>
        ) : (
          <p>Loading user info...</p>
        )}

        {/* === Monitored Accounts === */}
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

        {/* === Team Management (Only for Team users) === */}
        {isTeam() && (
          <div className="team-management-section styled-box">
            <h4>👥 Team Management</h4>
            <div className="team-members-list">
              {teamMembers.map((member, i) => (
                <div key={i} className="team-member">
                  <span>{member.email}</span>
                  <span className={`member-status ${member.status}`}>
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddTeamMember} className="add-member-form">
              <input
                type="email"
                placeholder="Add team member email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                required
              />
              <button type="submit">Add Member</button>
            </form>
            <button onClick={handleDownloadPDF} className="download-pdf-btn">
              📄 Download PDF Report
            </button>
          </div>
        )}

        {/* === Upgrade Plan (Show for Free AND Pro users) === */}
        {(isFree() || isPro()) && (
          <div className="upgrade-plan-section styled-box">
            <h4>🚀 Upgrade Your Plan</h4>
            <select
              value={upgradePlan}
              onChange={(e) => setUpgradePlan(e.target.value)}
            >
              {/* Free users see both options */}
              {isFree() && (
                <>
                  <option value="pro">Pro - KES 499/month</option>
                  <option value="team">Team - KES 3,000/month</option>
                </>
              )}
              {/* Pro users only see the Team option */}
              {isPro() && (
                <option value="team">Team - KES 3,000/month</option>
              )}
            </select>
            <button onClick={handleUpgrade}>
              {isFree() ? "Upgrade Now" : "Upgrade to Team"}
            </button>
          </div>
        )}
      </div>

      {/* ================= CENTER PANEL ================= */}
      <div className="dashboard-center">
        <LeakCheckForm />
        
        {/* Analytics Charts for Team Users */}
        {isTeam() && (
          <div className="analytics-section">
            <h3>📊 Security Analytics</h3>
            <div className="charts-grid">
              <div className="chart-container">
                <h4>Leak Types</h4>
                <div className="chart-placeholder">
                  {/* Replace with actual chart component */}
                  Pie Chart - Leak Distribution
                </div>
              </div>
              <div className="chart-container">
                <h4>Scan Activity</h4>
                <div className="chart-placeholder">
                  {/* Replace with actual chart component */}
                  Line Chart - Weekly Scans
                </div>
              </div>
              <div className="chart-container">
                <h4>Team Activity</h4>
                <div className="chart-placeholder">
                  {/* Replace with actual chart component */}
                  Bar Chart - Member Contributions
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= RIGHT PANEL ================= */}
      <div className="dashboard-right">
        <h2>🧠 History & Automation</h2>

        {/* Auto Scan Section - Available for Pro & Team */}
        {(isPro() || isTeam()) ? (
          <div className="auto-scan-section">
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
          </div>
        ) : (
          <div className="automation-locked">
            <p>🔒 Auto-scan is available for Pro & Team users.</p>
            <p>Upgrade your plan to unlock this feature.</p>
          </div>
        )}

        {/* === History === */}
        <div className="log-section">
          <h3>Search History</h3>
          <div className="history-list">
            {history.length > 0 ? (
              history.map((scan, idx) => (
                <div key={idx} className="history-item">
                  <strong>{new Date(scan.timestamp).toLocaleString()}</strong>
                  {scan.matches?.length > 0 ? (
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
                </div>
              ))
            ) : (
              <p>No history yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;