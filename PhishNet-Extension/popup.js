document.getElementById("checkBtn").addEventListener("click", async () => {
  const url = document.getElementById("urlInput").value;
  if (!url) return alert("Enter a URL to scan.");

  const resultDiv = document.getElementById("result");
  resultDiv.innerText = "Checking...";

  try {
    const response = await fetch("https://api.phishnet.exchange/v1/check-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    const data = await response.json();

    resultDiv.innerText = `Result: ${data.verdict.toUpperCase()} \nReason: ${data.reason}`;
    resultDiv.style.color =
      data.verdict === "malicious" ? "red" :
      data.verdict === "suspicious" ? "orange" :
      "green";
  } catch (error) {
    resultDiv.innerText = "Error connecting to PhishNet API.";
  }
});
