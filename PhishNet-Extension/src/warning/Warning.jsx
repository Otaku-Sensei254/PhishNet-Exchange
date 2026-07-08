import React from "react";

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#fff",
    fontFamily: "'Inter', -apple-system, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    margin: 0,
  },
  card: {
    maxWidth: 560,
    width: "100%",
    background: "#111",
    border: "1px solid #222",
    borderRadius: 16,
    padding: 40,
    textAlign: "center",
  },
  badge: {
    display: "inline-block",
    background: "#8b1a1a",
    color: "#ff6b6b",
    padding: "6px 16px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 20,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: 800,
    color: "#d4a017",
    margin: "0 0 8px",
  },
  subheading: {
    fontSize: 14,
    color: "#888",
    margin: "0 0 24px",
  },
  detailBox: {
    background: "#181818",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    textAlign: "left",
  },
  label: {
    fontSize: 11,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: "#ccc",
    wordBreak: "break-all",
  },
  actions: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    marginTop: 28,
  },
  btnPrimary: {
    background: "#d4a017",
    color: "#0a0a0a",
    border: "none",
    padding: "12px 28px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnSecondary: {
    background: "transparent",
    color: "#fff",
    border: "1px solid #333",
    padding: "12px 28px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  footer: {
    marginTop: 32,
    fontSize: 11,
    color: "#444",
  },
};

const Warning = () => {
  const params = new URLSearchParams(window.location.search);
  const blockedUrl = params.get("blocked") || "Unknown";
  const threatType = params.get("threat") || "Unknown";
  const source = params.get("source") || "Unknown";
  let scamBuster = null;
  try {
    const raw = params.get("scambuster");
    if (raw) scamBuster = JSON.parse(raw);
  } catch {}

  const handleGoBack = () => {
    window.history.back();
  };

  const handleProceed = () => {
    chrome.storage.local.get(["overrides"], (res) => {
      const overrides = res.overrides || [];
      overrides.push({ url: blockedUrl, timestamp: Date.now() });
      chrome.storage.local.set({ overrides });
    });
    window.location.href = blockedUrl;
  };

  const formatAmount = (amount) => {
    if (!amount) return null;
    return "KSh " + Number(amount).toLocaleString();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.badge}>Threat Blocked</div>
        <div style={styles.icon}>&#9888;</div>
        <h1 style={styles.heading}>Navigation Blocked</h1>
        <p style={styles.subheading}>
          PhishNet Exchange detected a known threat and prevented navigation.
        </p>

        <div style={styles.detailBox}>
          <div style={styles.label}>Threat Type</div>
          <div style={styles.value}>{threatType}</div>
        </div>

        <div style={styles.detailBox}>
          <div style={styles.label}>Blocked URL</div>
          <div style={styles.value}>{blockedUrl}</div>
        </div>

        <div style={styles.detailBox}>
          <div style={styles.label}>Flagged By</div>
          <div style={styles.value}>{source}</div>
        </div>

        {scamBuster && (
          <div style={{
            ...styles.detailBox,
            border: "1px solid #a16207",
            background: "#1a1500",
          }}>
            <div style={styles.label}>Also Reported on ScamBuster.co.ke</div>
            <div style={{ ...styles.value, color: "#f5b342" }}>
              "{scamBuster.matched}" &mdash; {scamBuster.type}
            </div>
            {scamBuster.amountLost > 0 && (
              <div style={{ ...styles.value, color: "#f87171", marginTop: 4 }}>
                {formatAmount(scamBuster.amountLost)} reported lost
              </div>
            )}
            {scamBuster.date && (
              <div style={{ ...styles.value, color: "#888", marginTop: 2, fontSize: 12 }}>
                Reported: {new Date(scamBuster.date).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        <div style={styles.actions}>
          <button style={styles.btnSecondary} onClick={handleGoBack}>
            Go Back
          </button>
          <button style={styles.btnPrimary} onClick={handleProceed}>
            Proceed Anyway
          </button>
        </div>
      </div>
      <div style={styles.footer}>PhishNet Exchange &mdash; Real-Time Threat Protection</div>
    </div>
  );
};

export default Warning;
