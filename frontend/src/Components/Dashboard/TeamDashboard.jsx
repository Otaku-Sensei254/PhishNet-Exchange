import React, { useState, useEffect, useRef } from "react";
import "../styles/TeamDashboard.css";
import { FiUsers, FiMail, FiShield, FiUserCheck, FiUserX } from "react-icons/fi";

const mockStats = {
  activeIncidents: { total: 12, unassigned: 3 },
  blocked24h: 47,
  assets: { online: 8, total: 10 },
  integrity: 94,
};

const mockFindings = [
  { id: 1, severity: "CRIT", operation: "Ransomware signature match — LockBit 3.0 variant", mitre: "T1486" },
  { id: 2, severity: "HIGH", operation: "auth.api — 47 failed login attempts in 5m", mitre: "T1110" },
  { id: 3, severity: "MED", operation: "Port scan detected — 22/tcp, 443/tcp sweep", mitre: "T1046" },
  { id: 4, severity: "LOW", operation: "DNS query — known C2 domain staging", mitre: "T1071.004" },
  { id: 5, severity: "OK", operation: "Vault-primary // key rotation completed", mitre: null },
  { id: 6, severity: "INFO", operation: "Node us-east-2b — SSL cert expires in 14d", mitre: null },
  { id: 7, severity: "CRIT", operation: "Unauthorized SSH access — root@bastion-01", mitre: "T1078" },
  { id: 8, severity: "HIGH", operation: "DDoS detection — inbound traffic spike 3400%", mitre: "T1498" },
];

const mockLogs = [
  { time: "12:34:22", severity: "WARN", msg: "db-primary — replication lag 2.4s" },
  { time: "12:28:10", severity: "CRIT", msg: "auth-api — 5xx rate 12% above threshold" },
  { time: "12:15:44", severity: "INFO", msg: "vault-primary — key rotation completed successfully" },
  { time: "12:08:31", severity: "LOW", msg: "dns-secondary — zone transfer took 3.2s" },
  { time: "11:55:18", severity: "MED", msg: "web-03 — connection pool 87% utilized" },
  { time: "11:42:03", severity: "WARN", msg: "cache-cluster — eviction rate climbing 0.4/s" },
  { time: "11:30:57", severity: "INFO", msg: "monitoring — heartbeat check passed all nodes" },
  { time: "11:22:09", severity: "HIGH", msg: "ids-sensor — 12 blocked inbound attempts from RU" },
  { time: "11:10:33", severity: "MED", msg: "app-log — stack trace: NullPointerException /api/check" },
  { time: "10:58:46", severity: "WARN", msg: "disk — /var/log 82% capacity on log-01" },
  { time: "10:45:12", severity: "INFO", msg: "backup — nightly snapshot completed (847GB)" },
  { time: "10:32:28", severity: "CRIT", msg: "cert — api.acme.io expires in 48h" },
];

const mockOps = {
  apiUsage: { current: 84721, limit: 100000 },
  cacheHitRate: 87,
  nodes: { total: 3, online: 3 },
  uptime: "14d 6h 32m",
  assetHealth: [
    { name: "DB", up: 3, total: 3, uptime: "99.97%" },
    { name: "Web", up: 3, total: 3, uptime: "99.95%" },
    { name: "DNS", up: 2, total: 2, uptime: "99.99%" },
  ],
};

const mockIncidents = [
  { id: "INC-001", severity: "CRIT", signature: "Ransomware Payload — LockBit 3.0", source: "185.220.101.204", geo: "DE", asset: "db-primary", time: Date.now() - 120000 },
  { id: "INC-002", severity: "HIGH", signature: "Credential Stuffing — 412 attempts", source: "45.33.32.18", geo: "RU", asset: "auth-api", time: Date.now() - 300000 },
  { id: "INC-003", severity: "MED", signature: "SQL Injection Attempt — UNION based", source: "103.235.46.92", geo: "CN", asset: "web-frontend", time: Date.now() - 600000 },
  { id: "INC-004", severity: "HIGH", signature: "Anomalous Egress Traffic — 2.1GB out", source: "10.0.1.45", geo: "—", asset: "app-server-03", time: Date.now() - 1800000 },
  { id: "INC-005", severity: "MED", signature: "TLS Downgrade Attempt — TLS 1.0 to SSLv3", source: "192.168.1.100", geo: "—", asset: "load-balancer", time: Date.now() - 3600000 },
  { id: "INC-006", severity: "LOW", signature: "Port Scan — 22,443,8080,8443 sweep", source: "89.45.67.0/24", geo: "NL", asset: "edge-router", time: Date.now() - 7200000 },
  { id: "INC-007", severity: "INFO", signature: "Expired Cert Warning — api.acme.io", source: "monitoring-system", geo: "—", asset: "cert-manager", time: Date.now() - 14400000 },
  { id: "INC-008", severity: "CRIT", signature: "Data Exfiltration — 3.4GB to unknown external", source: "10.0.1.45", geo: "—", asset: "app-server-03", time: Date.now() - 180000 },
  { id: "INC-009", severity: "LOW", signature: "Failed Login — root account from new IP", source: "203.0.113.42", geo: "VN", asset: "bastion-01", time: Date.now() - 5400000 },
  { id: "INC-010", severity: "MED", signature: "Suspicious Cron — unknown binary /tmp/.x", source: "10.0.2.12", geo: "—", asset: "worker-02", time: Date.now() - 9000000 },
];

const mockConnections = [
  { proto: "TCP", src: "10.0.1.10:443", dst: "203.0.113.50:80", state: "ESTABLISHED" },
  { proto: "TCP", src: "10.0.1.11:22", dst: "198.51.100.22:443", state: "ESTABLISHED" },
  { proto: "UDP", src: "10.0.1.5:53", dst: "8.8.8.8:53", state: "ACTIVE" },
  { proto: "TCP", src: "10.0.1.20:3306", dst: "10.0.2.5:3306", state: "ESTABLISHED" },
  { proto: "TCP", src: "185.220.101.204:443", dst: "10.0.1.5:80", state: "TIME_WAIT" },
  { proto: "TCP", src: "45.33.32.18:8080", dst: "10.0.1.5:443", state: "SYN_SENT" },
];

const mockBandwidth = [
  { iface: "eth0", in: 847, out: 213, unit: "Mbps" },
  { iface: "eth1", in: 12, out: 45, unit: "Mbps" },
  { iface: "tun0", in: 340, out: 890, unit: "Mbps" },
  { iface: "lo", in: 2, out: 2, unit: "Mbps" },
];

const mockDnsLogs = [
  { query: "evil-payload-stage.example.com", type: "A", src: "10.0.1.45", action: "BLOCKED" },
  { query: "api.acme.io", type: "A", src: "10.0.1.10", action: "ALLOWED" },
  { query: "phish-tracker.ru", type: "AAAA", src: "10.0.2.12", action: "BLOCKED" },
  { query: "vault.acme.io", type: "A", src: "10.0.1.5", action: "ALLOWED" },
  { query: "c2-server-update.net", type: "TXT", src: "10.0.1.45", action: "BLOCKED" },
];

const mockFirewallRules = [
  { rule: "ALLOW", proto: "TCP", src: "10.0.0.0/8", dst: "any", port: "443", hits: 84721 },
  { rule: "ALLOW", proto: "TCP", src: "10.0.0.0/8", dst: "any", port: "80", hits: 33412 },
  { rule: "DENY", proto: "TCP", src: "any", dst: "10.0.1.0/24", port: "22", hits: 12890 },
  { rule: "DENY", proto: "TCP", src: "any", dst: "10.0.1.0/24", port: "3306", hits: 4451 },
  { rule: "ALLOW", proto: "TCP", src: "10.0.0.0/8", dst: "10.0.1.0/24", port: "22", hits: 3421 },
  { rule: "DENY", proto: "UDP", src: "any", dst: "10.0.1.0/24", port: "53", hits: 871 },
];

const mockServers = [
  { hostname: "db-primary", status: "online", cpu: 34, mem: 62, disk: 71, uptime: "87d 4h", reboot: "2026-04-17" },
  { hostname: "db-replica-01", status: "online", cpu: 22, mem: 45, disk: 68, uptime: "87d 4h", reboot: "2026-04-17" },
  { hostname: "db-replica-02", status: "online", cpu: 19, mem: 41, disk: 65, uptime: "87d 4h", reboot: "2026-04-17" },
  { hostname: "web-01", status: "online", cpu: 71, mem: 83, disk: 54, uptime: "34d 12h", reboot: "2026-06-09" },
  { hostname: "web-02", status: "online", cpu: 68, mem: 79, disk: 52, uptime: "34d 12h", reboot: "2026-06-09" },
  { hostname: "web-03", status: "online", cpu: 82, mem: 91, disk: 56, uptime: "34d 12h", reboot: "2026-06-09" },
  { hostname: "cache-01", status: "online", cpu: 12, mem: 38, disk: 22, uptime: "14d 6h", reboot: "2026-06-29" },
  { hostname: "log-01", status: "online", cpu: 8, mem: 24, disk: 82, uptime: "120d 3h", reboot: "2026-03-15" },
  { hostname: "bastion-01", status: "online", cpu: 5, mem: 18, disk: 33, uptime: "92d 8h", reboot: "2026-04-12" },
  { hostname: "worker-02", status: "offline", cpu: 0, mem: 0, disk: 0, uptime: "0d", reboot: "—" },
];

const mockForensicsCases = [
  { id: "CASE-001", title: "Ransomware LockBit — db-primary compromise", status: "open", opened: "2026-07-10", severity: "CRIT", evidence: 12 },
  { id: "CASE-002", title: "Credential stuffing — auth-api anomaly", status: "open", opened: "2026-07-11", severity: "HIGH", evidence: 8 },
  { id: "CASE-003", title: "Suspicious egress — app-server-03", status: "open", opened: "2026-07-12", severity: "HIGH", evidence: 5 },
  { id: "CASE-004", title: "Phishing campaign — internal spearphish", status: "closed", opened: "2026-06-28", closed: "2026-07-05", severity: "MED", evidence: 24 },
  { id: "CASE-005", title: "Port sweep / reconnaissance", status: "closed", opened: "2026-06-20", closed: "2026-06-25", severity: "LOW", evidence: 3 },
];

const mockEvidence = [
  { hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", type: "SHA256", source: "db-primary", collected: "2026-07-10 14:32", handler: "Alice" },
  { hash: "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592", type: "SHA256", source: "auth-api", collected: "2026-07-11 09:15", handler: "Bob" },
  { hash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6", type: "MD5", source: "app-server-03", collected: "2026-07-12 11:00", handler: "Alice" },
];

const relativeTime = (ts) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const severityClass = (sev) => {
  const map = { CRIT: "severity-crit", HIGH: "severity-high", MED: "severity-med", LOW: "severity-low", OK: "severity-ok", INFO: "severity-info", WARN: "severity-warn" };
  return map[sev] || "";
};

const geoFlag = (code) => {
  const flags = { DE: "🇩🇪", RU: "🇷🇺", CN: "🇨🇳", NL: "🇳🇱", VN: "🇻🇳", "—": "" };
  return flags[code] || code;
};

const SEVERITY_ORDER = ["CRIT", "HIGH", "MED", "LOW", "INFO"];

const StatusCircle = ({ pct }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 90 ? "var(--safe)" : pct >= 70 ? "var(--amber)" : "var(--danger)";
  return (
    <svg width={72} height={72} viewBox="0 0 72 72">
      <circle cx={36} cy={36} r={r} fill="none" stroke="var(--border)" strokeWidth={5} />
      <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 36 36)" style={{ transition: "stroke-dashoffset 0.5s, stroke 0.3s" }} />
      <text x={36} y={36} textAnchor="middle" dominantBaseline="central" fill="var(--foreground)" fontFamily="var(--font-mono)" fontSize={16} fontWeight={700}>{pct}%</text>
    </svg>
  );
};

const TeamDashboard = ({ user, userRole = "member", teamData: initialTeamData = null }) => {
  const [teamData, setTeamData] = useState(initialTeamData);
  const [role, setRole] = useState(userRole);
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activeTab, setActiveTab] = useState("overview");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [carouselPaused, setCarouselPaused] = useState(false);
  const carouselRef = useRef(null);

  const isAdmin = role === "admin";
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (teamData) {
      setMembers(teamData.members || []);
    }
  }, [teamData]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/teams/add-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: teamData.id, memberEmail: newMemberEmail, adminId: user.id }),
      });
      const data = await response.json();
      if (response.ok) {
        setTeamData(data.team);
        setMembers(data.team.members);
        setNewMemberEmail("");
        setSuccess(`Invitation sent to ${newMemberEmail}!`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to add member");
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this member from the team?")) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/teams/remove-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: teamData.id, memberId, adminId: user.id }),
      });
      const data = await response.json();
      if (response.ok) {
        setTeamData(data.team);
        setMembers(data.team.members);
        setSuccess("Member removed");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to remove member");
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleUpdateRole = async (memberId, newRole) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/teams/update-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: teamData.id, memberId, adminId: user.id, newRole }),
      });
      const data = await response.json();
      if (response.ok) {
        setTeamData(data.team);
        setMembers(data.team.members);
        setSuccess(`Role updated to ${newRole}`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to update role");
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const acceptedMembers = members.filter((m) => m.status === "accepted");
  const pendingMembers = members.filter((m) => m.status === "pending");

  useEffect(() => {
    if (carouselPaused || !carouselRef.current) return;
    const interval = setInterval(() => {
      const el = carouselRef.current;
      if (!el) return;
      if (el.scrollLeft >= el.scrollWidth / 2) {
        el.scrollLeft = 0;
      } else {
        el.scrollLeft += 1;
      }
    }, 30);
    return () => clearInterval(interval);
  }, [carouselPaused]);

  const filteredIncidents = severityFilter === "ALL" ? mockIncidents : mockIncidents.filter((i) => i.severity === severityFilter);

  const renderCarousel = () => (
    <div className="td-carousel" onMouseEnter={() => setCarouselPaused(true)} onMouseLeave={() => setCarouselPaused(false)}>
      <div className="td-carousel-track" ref={carouselRef}>
        {[...mockFindings, ...mockFindings].map((f, i) => (
          <div key={`${f.id}-${i}`} className={`td-carousel-item ${severityClass(f.severity)}`}>
            <span className="td-carousel-sev">{f.severity}</span>
            <span className="td-carousel-op">{f.operation}</span>
            {f.mitre && <span className="td-carousel-mitre">{f.mitre}</span>}
          </div>
        ))}
      </div>
    </div>
  );

  const renderSubNav = () => (
    <div className="td-subnav">
      {["overview", "network", "assets", "forensics"].map((tab) => (
        <button key={tab} className={`td-subnav-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
          {tab}
        </button>
      ))}
    </div>
  );

  const renderOverview = () => (
    <>
      <div className="td-stats-row">
        <div className="td-stat-card">
          <span className="td-stat-value">{mockStats.activeIncidents.total}</span>
          <span className="td-stat-label">Active Incidents</span>
          <span className="td-stat-secondary">{mockStats.activeIncidents.unassigned} unassigned</span>
        </div>
        <div className="td-stat-card">
          <span className="td-stat-value">{mockStats.blocked24h}</span>
          <span className="td-stat-label">Blocked / 24H</span>
        </div>
        <div className="td-stat-card">
          <span className="td-stat-value">{mockStats.assets.online}/{mockStats.assets.total}</span>
          <span className="td-stat-label">Assets Online</span>
          <span className="td-stat-secondary">offline: {mockStats.assets.total - mockStats.assets.online}</span>
        </div>
        <div className="td-stat-card td-stat-integrity">
          <StatusCircle pct={mockStats.integrity} />
          <span className="td-stat-label">System Integrity</span>
          <span className="td-integrity-status" style={{ color: mockStats.integrity >= 90 ? "var(--safe)" : mockStats.integrity >= 70 ? "var(--amber)" : "var(--danger)" }}>
            {mockStats.integrity >= 90 ? "Normal" : mockStats.integrity >= 70 ? "Degraded" : "Critical"}
          </span>
        </div>
      </div>

      <div className="td-three-col">
        <div className="td-panel td-panel-members">
          <div className="td-panel-header">
            <h3>Team Members</h3>
            <span className="td-panel-badge">{acceptedMembers.length + pendingMembers.length} total</span>
          </div>
          {isAdmin && (
            <form className="td-invite-form" onSubmit={handleAddMember}>
              <div className="td-invite-group">
                <FiMail size={14} color="var(--muted-foreground)" />
                <input type="email" placeholder="Enter email to invite..." value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} required />
              </div>
              <button type="submit" className="td-btn td-btn-primary" disabled={loading}>{loading ? "..." : "Invite"}</button>
            </form>
          )}
          <div className="td-member-list">
            {members.map((m) => (
              <div key={m.id || m.userId} className="td-member-row">
                <div className="td-member-avatar">{m.email.charAt(0).toUpperCase()}</div>
                <div className="td-member-info">
                  <span className="td-member-email">{m.email}</span>
                  <span className={`td-member-role role-${m.role}`}>{m.role}</span>
                </div>
                <span className={`td-member-status ${m.status}`} />
                {m.userId === user?.id && <span className="td-member-you">You</span>}
                {isAdmin && m.userId !== user?.id && (
                  <div className="td-member-actions">
                    {m.role === "member" && m.status === "accepted" && (
                      <button className="td-btn td-btn-xs" title="Promote" onClick={() => handleUpdateRole(m.userId, "admin")}><FiShield size={12} /></button>
                    )}
                    {m.role === "admin" && (
                      <button className="td-btn td-btn-xs" title="Demote" onClick={() => handleUpdateRole(m.userId, "member")}><FiUserCheck size={12} /></button>
                    )}
                    <button className="td-btn td-btn-xs td-btn-danger" title="Remove" onClick={() => handleRemoveMember(m.userId)}><FiUserX size={12} /></button>
                  </div>
                )}
              </div>
            ))}
            {members.length === 0 && <div className="td-empty">No members yet.</div>}
          </div>
        </div>
        <div className="td-panel td-panel-logs">
          <div className="td-panel-header">
            <h3>Monitor Logs</h3>
            <span className="td-panel-badge">recent</span>
          </div>
          <div className="td-log-list">
            {mockLogs.map((log, i) => (
              <div key={i} className="td-log-line">
                <span className="td-log-time">{log.time}</span>
                <span className={`td-log-sev ${severityClass(log.severity)}`}>{log.severity}</span>
                <span className="td-log-msg">{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="td-panel td-panel-ops">
          <div className="td-panel-header">
            <h3>System Operations</h3>
            <span className="td-panel-badge">live</span>
          </div>
          <div className="td-ops-content">
            <div className="td-ops-item">
              <span className="td-ops-label">API Usage</span>
              <span className="td-ops-value">{mockOps.apiUsage.current.toLocaleString()} / {mockOps.apiUsage.limit.toLocaleString()}</span>
              <div className="td-ops-bar"><div className="td-ops-bar-fill" style={{ width: `${(mockOps.apiUsage.current / mockOps.apiUsage.limit) * 100}%` }} /></div>
            </div>
            <div className="td-ops-item">
              <span className="td-ops-label">Cache Hit Rate</span>
              <span className="td-ops-value">{mockOps.cacheHitRate}%</span>
              <div className="td-ops-bar"><div className="td-ops-bar-fill" style={{ width: `${mockOps.cacheHitRate}%`, background: "var(--safe)" }} /></div>
            </div>
            <div className="td-ops-item">
              <span className="td-ops-label">Node Status</span>
              <div className="td-ops-nodes">
                {[...Array(mockOps.nodes.total)].map((_, i) => (
                  <span key={i} className={`td-ops-node ${i < mockOps.nodes.online ? "online" : "offline"}`} title={`Node ${i + 1}`} />
                ))}
                <span className="td-ops-node-count">{mockOps.nodes.online}/{mockOps.nodes.total} online</span>
              </div>
            </div>
            <div className="td-ops-item">
              <span className="td-ops-label">Uptime</span>
              <span className="td-ops-value">{mockOps.uptime}</span>
            </div>
            <div className="td-ops-divider" />
            <div className="td-ops-item">
              <span className="td-ops-label">Asset Health</span>
              {mockOps.assetHealth.map((a) => (
                <div key={a.name} className="td-ops-health-row">
                  <span className="td-ops-health-name">{a.name}</span>
                  <div className="td-ops-health-dots">
                    {[...Array(a.total)].map((_, i) => (
                      <span key={i} className={`td-ops-dot ${i < a.up ? "up" : "down"}`} />
                    ))}
                  </div>
                  <span className="td-ops-health-pct">{a.uptime}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="td-bottom-row">
        <div className="td-panel td-panel-incidents">
          <div className="td-panel-header">
            <h3>Incident Feed</h3>
            <div className="td-filter-group">
              {["ALL", ...SEVERITY_ORDER].map((s) => (
                <button key={s} className={`td-filter-btn ${severityFilter === s ? "active" : ""}`} onClick={() => setSeverityFilter(s)}>{s}</button>
              ))}
            </div>
          </div>
          <div className="td-incident-list">
            {filteredIncidents.map((inc) => (
              <div key={inc.id} className={`td-incident-card ${severityClass(inc.severity)}`}>
                <div className="td-incident-top">
                  <span className="td-incident-id">{inc.id}</span>
                  <span className={`td-severity-tag ${severityClass(inc.severity)}`}>{inc.severity}</span>
                  <span className="td-incident-sig">{inc.signature}</span>
                  <span className="td-incident-time">{relativeTime(inc.time)}</span>
                </div>
                <div className="td-incident-meta">
                  <span className="td-incident-src">{geoFlag(inc.geo)} {inc.source}</span>
                  <span className="td-incident-asset">→ {inc.asset}</span>
                </div>
              </div>
            ))}
            {filteredIncidents.length === 0 && <div className="td-empty">No incidents match this filter.</div>}
          </div>
        </div>
        <div className="td-panel td-panel-chat">
          <div className="td-panel-header"><h3>Team Chat</h3></div>
          <div className="td-chat-placeholder">
            <div className="td-chat-icon">💬</div>
            <p>Team Chat</p>
            <p className="td-chat-sub">Coming soon</p>
          </div>
        </div>
      </div>
    </>
  );

  const renderNetwork = () => (
    <div className="td-three-col">
      <div className="td-panel">
        <div className="td-panel-header"><h3>Active Connections</h3><span className="td-panel-badge">{mockConnections.length} entries</span></div>
        <div className="td-table-wrap">
          <table className="td-table">
            <thead><tr><th>Proto</th><th>Source</th><th>Destination</th><th>State</th></tr></thead>
            <tbody>
              {mockConnections.map((c, i) => (
                <tr key={i}><td>{c.proto}</td><td className="td-cell-mono">{c.src}</td><td className="td-cell-mono">{c.dst}</td><td><span className={`td-conn-state ${c.state === "ESTABLISHED" ? "safe" : c.state === "ACTIVE" ? "info" : c.state === "TIME_WAIT" ? "muted" : "warn"}`}>{c.state}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="td-panel">
        <div className="td-panel-header"><h3>Bandwidth</h3></div>
        {mockBandwidth.map((b, i) => (
          <div key={i} className="td-ops-item">
            <span className="td-ops-label">{b.iface}</span>
            <div className="td-bw-row">
              <span className="td-bw-label">In</span>
              <div className="td-ops-bar td-bw-in"><div className="td-ops-bar-fill" style={{ width: `${Math.min((b.in / 1000) * 100, 100)}%` }} /></div>
              <span className="td-bw-val">{b.in} {b.unit}</span>
            </div>
            <div className="td-bw-row">
              <span className="td-bw-label">Out</span>
              <div className="td-ops-bar td-bw-out"><div className="td-ops-bar-fill" style={{ width: `${Math.min((b.out / 1000) * 100, 100)}%` }} /></div>
              <span className="td-bw-val">{b.out} {b.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="td-panel">
        <div className="td-panel-header"><h3>Firewall Rules</h3></div>
        <div className="td-table-wrap">
          <table className="td-table td-table-sm">
            <thead><tr><th>Action</th><th>Proto</th><th>Source</th><th>Dest</th><th>Port</th><th>Hits</th></tr></thead>
            <tbody>
              {mockFirewallRules.map((r, i) => (
                <tr key={i}><td><span className={`td-fw-action ${r.rule === "ALLOW" ? "safe" : "danger"}`}>{r.rule}</span></td><td>{r.proto}</td><td className="td-cell-mono">{r.src}</td><td className="td-cell-mono">{r.dst}</td><td>{r.port}</td><td className="td-cell-mono">{r.hits.toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="td-panel-header" style={{ marginTop: 16 }}><h3>DNS Queries</h3></div>
        <div className="td-table-wrap">
          <table className="td-table td-table-sm">
            <thead><tr><th>Query</th><th>Type</th><th>Source</th><th>Action</th></tr></thead>
            <tbody>
              {mockDnsLogs.map((d, i) => (
                <tr key={i}><td className="td-cell-mono">{d.query}</td><td>{d.type}</td><td className="td-cell-mono">{d.src}</td><td><span className={`td-fw-action ${d.action === "ALLOWED" ? "safe" : "danger"}`}>{d.action}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAssets = () => (
    <div className="td-assets-grid">
      {mockServers.map((s) => (
        <div key={s.hostname} className={`td-asset-card ${s.status === "offline" ? "offline" : ""}`}>
          <div className="td-asset-header">
            <span className={`td-asset-dot ${s.status}`} />
            <span className="td-asset-name">{s.hostname}</span>
            <span className="td-asset-status">{s.status}</span>
          </div>
          <div className="td-asset-metrics">
            <div className="td-asset-metric"><span className="td-asset-metric-label">CPU</span><div className="td-ops-bar"><div className="td-ops-bar-fill" style={{ width: `${s.cpu}%`, background: s.cpu > 80 ? "var(--danger)" : s.cpu > 60 ? "var(--amber)" : "var(--info)" }} /></div><span className="td-asset-metric-val">{s.cpu}%</span></div>
            <div className="td-asset-metric"><span className="td-asset-metric-label">MEM</span><div className="td-ops-bar"><div className="td-ops-bar-fill" style={{ width: `${s.mem}%`, background: s.mem > 80 ? "var(--danger)" : s.mem > 60 ? "var(--amber)" : "var(--safe)" }} /></div><span className="td-asset-metric-val">{s.mem}%</span></div>
            <div className="td-asset-metric"><span className="td-asset-metric-label">DISK</span><div className="td-ops-bar"><div className="td-ops-bar-fill" style={{ width: `${s.disk}%`, background: s.disk > 80 ? "var(--danger)" : s.disk > 60 ? "var(--amber)" : "var(--info)" }} /></div><span className="td-asset-metric-val">{s.disk}%</span></div>
          </div>
          <div className="td-asset-footer">
            <span>Uptime: {s.uptime}</span>
            <span>Reboot: {s.reboot}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderForensics = () => (
    <div className="td-three-col">
      <div className="td-panel">
        <div className="td-panel-header"><h3>Open Cases</h3></div>
        {mockForensicsCases.filter((c) => c.status === "open").map((c) => (
          <div key={c.id} className="td-incident-card">
            <div className="td-incident-top">
              <span className="td-incident-id">{c.id}</span>
              <span className={`td-severity-tag ${severityClass(c.severity)}`}>{c.severity}</span>
              <span className="td-incident-sig">{c.title}</span>
            </div>
            <div className="td-incident-meta">
              <span>Opened: {c.opened}</span>
              <span>Evidence: {c.evidence} items</span>
            </div>
          </div>
        ))}
        <div className="td-panel-header" style={{ marginTop: 16 }}><h3>Closed Cases</h3></div>
        {mockForensicsCases.filter((c) => c.status === "closed").map((c) => (
          <div key={c.id} className="td-incident-card">
            <div className="td-incident-top">
              <span className="td-incident-id">{c.id}</span>
              <span className={`td-severity-tag ${severityClass(c.severity)}`}>{c.severity}</span>
              <span className="td-incident-sig">{c.title}</span>
            </div>
            <div className="td-incident-meta">
              <span>Closed: {c.closed}</span>
              <span>Evidence: {c.evidence} items</span>
            </div>
          </div>
        ))}
      </div>
      <div className="td-panel">
        <div className="td-panel-header"><h3>Evidence Locker</h3></div>
        <div className="td-table-wrap">
          <table className="td-table td-table-sm">
            <thead><tr><th>Hash</th><th>Type</th><th>Source</th><th>Collected</th><th>Handler</th></tr></thead>
            <tbody>
              {mockEvidence.map((e, i) => (
                <tr key={i}><td className="td-cell-mono" style={{ fontSize: "0.5rem" }}>{e.hash.slice(0, 24)}...</td><td>{e.type}</td><td className="td-cell-mono">{e.source}</td><td>{e.collected}</td><td>{e.handler}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="td-panel">
        <div className="td-panel-header"><h3>Chain of Custody</h3></div>
        <div className="td-log-list">
          {mockEvidence.map((e, i) => (
            <div key={i} className="td-log-line" style={{ padding: "6px 0" }}>
              <span className="td-log-time">{e.collected}</span>
              <span className="td-log-msg">{e.handler} collected <span className="td-cell-mono">{e.type}</span> from <span className="td-cell-mono">{e.source}</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="td-dashboard">
      <div className="td-header">
        <div className="td-header-left">
          <FiShield className="td-header-icon" size={24} />
          <h1>{teamData?.teamName || "Team Dashboard"}</h1>
        </div>
        <span className="td-role-badge">{isAdmin ? "Admin" : "Member"}</span>
      </div>

      {error && <div className="td-alert td-alert-error">{error}</div>}
      {success && <div className="td-alert td-alert-success">{success}</div>}

      {renderSubNav()}
      {renderCarousel()}

      {activeTab === "overview" && renderOverview()}
      {activeTab === "network" && renderNetwork()}
      {activeTab === "assets" && renderAssets()}
      {activeTab === "forensics" && renderForensics()}
    </div>
  );
};

export default TeamDashboard;
