document.addEventListener("click", async (event) => {
  const target = event.target.closest("a");
  if (!target || !target.href) return;

  event.preventDefault();
  const url = target.href;

  // Notify background for analysis
  chrome.runtime.sendMessage({ type: "CHECK_URL", url }, (response) => {
    if (response.error) {
      alert("PhishNet: Could not verify link. Proceed with caution.");
      window.open(url, "_blank");
      return;
    }

    const result = response.result;
    const verdict = result.verdict || "unknown";

    if (verdict === "malicious") {
      showModal(`⚠️ Blocked! This link is identified as malicious.\nReason: ${result.reason}`);
    } else if (verdict === "suspicious") {
      showModal(`⚠️ Warning! Suspicious link.\nReason: ${result.reason}`, url);
    } else {
      window.open(url, "_blank");
    }
  });
});

function showModal(message, url) {
  const modal = document.createElement("div");
  modal.innerHTML = `
    <div style="
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.8); z-index:999999; display:flex;
      justify-content:center; align-items:center; color:#fff;
      font-family:sans-serif; flex-direction:column;
    ">
      <div style="background:#121212; padding:20px; border-radius:12px; max-width:400px; text-align:center;">
        <h3>PhishNet Exchange Warning</h3>
        <p>${message}</p>
        ${url ? `<button id="openAnyway" style="margin:10px; padding:8px 12px;">Open Anyway</button>` : ""}
        <button id="closeModal" style="padding:8px 12px;">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  if (url) modal.querySelector("#openAnyway").onclick = () => { window.open(url, "_blank"); modal.remove(); };
  modal.querySelector("#closeModal").onclick = () => modal.remove();
}
