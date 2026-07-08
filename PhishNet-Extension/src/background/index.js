import ThreatChecker from "../modules/ThreatChecker.js";

const checker = new ThreatChecker();
let enabled = true;

// Derive base API URL from keys.js (remove trailing /analyze)
const API_BASE = "http://localhost:5000/api/link";

chrome.storage.local.get(["enabled"], (result) => {
  if (result.enabled !== undefined) {
    enabled = result.enabled;
  }
});

async function syncBlocklist() {
  try {
    const res = await fetch(`${API_BASE}/blocklist`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      if (data.domains) {
        chrome.storage.local.set({ phishnetBlocklist: data.domains, blocklistVersion: data.version });
      }
    }
  } catch {}
}
syncBlocklist();
setInterval(syncBlocklist, 300000);

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (!enabled) return;
  if (details.frameId !== 0) return;

  const url = details.url;
  if (url.startsWith("chrome://") || url.startsWith("about:") || url.startsWith("chrome-extension://")) {
    return;
  }

  try {
    const result = await checker.check(url);
    if (!result) return;

    // Send signal for suspicious-but-not-confirmed URLs
    if (result.riskScore >= 30 && result.riskScore < 45 && !result.isThreat) {
      fetch(`${API_BASE}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          source: result.source || "extension",
          riskScore: result.riskScore,
          signals: result.signals,
        }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {});
    }

    if (result.isThreat) {
      const params = new URLSearchParams({
        blocked: url,
        threat: result.threatType || "SUSPICIOUS",
        source: result.source || "PhishNet Exchange",
        score: String(result.riskScore || 0),
        signals: JSON.stringify(result.signals || []),
      });

      if (result.scamBuster) {
        params.set("scambuster", JSON.stringify(result.scamBuster));
      }

      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL(`src/warning/index.html?${params.toString()}`),
      });

      chrome.storage.session.get(["blockedCount"], (res) => {
        chrome.storage.session.set({ blockedCount: (res.blockedCount || 0) + 1 });
      });
    }
  } catch {
    // fail open
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_STATUS") {
    sendResponse({ enabled });
    return true;
  }

  if (message.type === "SET_ENABLED") {
    enabled = message.value;
    chrome.storage.local.set({ enabled });
    sendResponse({ enabled });
    return true;
  }

  if (message.type === "GET_BLOCKED_COUNT") {
    chrome.storage.session.get(["blockedCount"], (res) => {
      sendResponse({ blockedCount: res.blockedCount || 0 });
    });
    return true;
  }
});
