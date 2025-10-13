import express from "express"
import axios from "axios";

const app = express();
app.use(express.json());

// memory for conversation
let conversation = [];

//  Ask endpoint (chat)
app.post("/ask", async (req, res) => {
  const question = req.body.question;
  conversation.push({ role: "user", content: question });

  try {
    const response = await axios.post("http://localhost:11434/api/chat", {
      model: "mistral", // or "llama2:7b" if lighter
      messages: [
        { role: "system", content: "You are Leak Advisor, an AI security assistant. Detect threats in user questions and give practical, step-by-step solutions." },
        ...conversation,
      ],
      stream: false
    });

    const answer = response.data.message?.content || "No response received.";
    conversation.push({ role: "assistant", content: answer });

    res.json({ answer });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Failed to talk to Ollama" });
  }
});

//  Function to simulate a system scan
async function runSecurityScan() {
  try {
    const response = await axios.post("http://localhost:11434/api/chat", {
      model: "mistral",
      messages: [
        { role: "system", content: "You are Leak Advisor. Pretend to scan the system for malware, suspicious processes, and vulnerabilities. Report findings clearly, and give step-by-step fixes." },
        { role: "user", content: "Perform a full security scan of my system." }
      ],
      stream: false
    });

    const scanResult = response.data.message?.content || "No scan results.";
    console.log(" Security Scan Result:\n", scanResult);

    return scanResult;
  } catch (error) {
    console.error("Scan error:", error.message);
    return "Security scan failed.";
  }
}

//  Manual scan endpoint
app.get("/scan", async (req, res) => {
  const results = await runSecurityScan();
  res.json({ scan: results });
});

// Auto-scan every 12 hours (12 * 60 * 60 * 1000 ms)
setInterval(async () => {
  console.log(" Running scheduled security scan...");
  await runSecurityScan();
}, 12 * 60 * 60 * 1000);

// Start server
app.listen(3000, () => {
  console.log(" Leak Advisor AI running at http://localhost:3000");
});