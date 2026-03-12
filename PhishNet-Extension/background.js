chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "CHECK_URL") {
    const url = message.url;
    try {
      const response = await fetch("https://api.phishnet.exchange/v1/check-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await response.json();
      sendResponse({ result: data });
    } catch (error) {
      console.error("PhishNet API Error:", error);
      sendResponse({ error: "Failed to connect to PhishNet API." });
    }
  }
  return true; // keeps the message channel open for async sendResponse
});
