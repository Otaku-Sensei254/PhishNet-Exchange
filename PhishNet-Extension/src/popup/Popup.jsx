import React, { useEffect, useState } from "react";

const styles = {
  container: {
    width: 300,
    padding: 20,
    background: "#0a0a0a",
    color: "#fff",
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  logo: {
    width: 32,
    height: 32,
    background: "#d4a017",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 16,
    color: "#0a0a0a",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#d4a017",
    margin: 0,
  },
  subtitle: {
    fontSize: 11,
    color: "#888",
    margin: 0,
  },
  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderTop: "1px solid #222",
    borderBottom: "1px solid #222",
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: 600,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    position: "relative",
    transition: "background 0.2s",
  },
  toggleOn: {
    background: "#d4a017",
  },
  toggleOff: {
    background: "#333",
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#fff",
    position: "absolute",
    top: 3,
    transition: "left 0.2s",
  },
  stats: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "16px 0",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
  },
  statValue: {
    color: "#d4a017",
    fontWeight: 700,
  },
  footer: {
    fontSize: 10,
    color: "#555",
    textAlign: "center",
    paddingTop: 12,
    borderTop: "1px solid #222",
  },
};

const Popup = () => {
  const [enabled, setEnabled] = useState(true);
  const [blockedCount, setBlockedCount] = useState(0);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_STATUS" }, (res) => {
      if (res) setEnabled(res.enabled);
    });
    chrome.runtime.sendMessage({ type: "GET_BLOCKED_COUNT" }, (res) => {
      if (res) setBlockedCount(res.blockedCount);
    });
  }, []);

  const toggleEnabled = () => {
    const next = !enabled;
    chrome.runtime.sendMessage({ type: "SET_ENABLED", value: next }, (res) => {
      if (res) setEnabled(res.enabled);
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>P</div>
        <div>
          <p style={styles.title}>PhishNet Exchange</p>
          <p style={styles.subtitle}>Real-time threat protection</p>
        </div>
      </div>

      <div style={styles.toggleRow}>
        <span style={styles.toggleLabel}>Protection</span>
        <button
          onClick={toggleEnabled}
          style={{ ...styles.toggle, ...(enabled ? styles.toggleOn : styles.toggleOff) }}
        >
          <div
            style={{
              ...styles.toggleKnob,
              left: enabled ? 23 : 3,
            }}
          />
        </button>
      </div>

      <div style={styles.stats}>
        <div style={styles.statRow}>
          <span>Threats Blocked</span>
          <span style={styles.statValue}>{blockedCount}</span>
        </div>
        <div style={styles.statRow}>
          <span>Status</span>
          <span style={{ ...styles.statValue, color: enabled ? "#4caf50" : "#888" }}>
            {enabled ? "Active" : "Disabled"}
          </span>
        </div>
      </div>

      <div style={styles.footer}>
        Powered by PhishNet Exchange
      </div>
    </div>
  );
};

export default Popup;
