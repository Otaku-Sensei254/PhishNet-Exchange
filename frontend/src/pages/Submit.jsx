import React, { useState } from "react";
import countries from "../Components/utils/countries";
import "../Components/styles/Submit.css";

function SubmitPage({ onNewThreat }) {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [hashtags, setHashtags] = useState("");
  const [indicator, setIndicator] = useState("");
  const [validationInput, setValidationInput] = useState("");
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateIndicator = async (input) => {
    if (!input) {
      setValidationResult(null);
      setError("Please enter a URL, IP, or email to validate.");
      return;
    }
    if (!/^https?:\/\/.+\..+/.test(input)) {
      setValidationResult(null);
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setLoading(true);
    setError("");
    setValidationResult(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/link/analyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: input }),
        }
      );

      if (!response.ok) throw new Error("Validation request failed.");
      const data = await response.json();
      setValidationResult(data);
    } catch {
      setError("Error validating URL. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCountry) return alert("Please select a country!");
    if (!indicator) return alert("Indicator is required!");

    const token = localStorage.getItem("token");
    if (!token) return alert("You must be logged in!");

    const formData = new FormData();
    formData.append("indicator", indicator);
    formData.append("type", document.getElementById("type").value);
    formData.append(
      "hashtags",
      hashtags.split(" ").filter((t) => t.startsWith("#"))
    );
    formData.append("country", JSON.stringify(selectedCountry));

    const imageFile = document.getElementById("image").files[0];
    if (imageFile) formData.append("image", imageFile);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/threats/submit`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setIndicator("");
        setHashtags("");
        setSelectedCountry(null);
        document.getElementById("image").value = "";
        if (onNewThreat) onNewThreat(data.threat);
      } else {
        alert("Failed to submit threat.");
      }
    } catch {
      alert("Error submitting threat.");
    }
  };

  const renderRiskReasons = (reasons) =>
    !reasons || reasons.length === 0 ? (
      <p>No suspicious indicators detected.</p>
    ) : (
      <ul>
        {reasons.map((reason, i) => (
          <li key={i}>{reason}</li>
        ))}
      </ul>
    );

  return (
    <div className="Container">
      <div className="threatBox">
        {/* Validator */}
        <div className="validator-box">
          <h2>🔍 Validate a Suspected Link</h2>
          <div className="validator-inputs">
            <input
              type="text"
              placeholder="Paste suspected link, IP, or email"
              value={validationInput}
              onChange={(e) => setValidationInput(e.target.value)}
            />
            <button onClick={() => validateIndicator(validationInput)}>
              Validate
            </button>
          </div>
          {loading && <p>Checking link...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
          {validationResult && (
            <div className="validator-result">
              <p>
                <strong>Domain:</strong> {validationResult.domain || "N/A"}
              </p>
              <p>
                <strong>Risk Level:</strong>{" "}
                <span
                  style={{
                    color:
                      validationResult.riskLevel === "high"
                        ? "red"
                        : validationResult.riskLevel === "medium"
                        ? "orange"
                        : "green",
                  }}
                >
                  {validationResult.riskLevel?.toUpperCase() || "UNKNOWN"}
                </span>
              </p>
              <p>
                <strong>SSL Valid:</strong>{" "}
                {validationResult.sslValid ? "✅ Yes" : "❌ No"}
              </p>
              <p>
                <strong>Domain Age:</strong>{" "}
                {validationResult.domainAgeDays ?? "N/A"}
              </p>
              <p>
                <strong>Similarity:</strong>{" "}
                {validationResult.similarity
                  ? `${validationResult.similarity.site} (${(
                      validationResult.similarity.similarity * 100
                    ).toFixed(1)}%)`
                  : "N/A"}
              </p>
              <p>
                <strong>IPQS Risk Score:</strong>{" "}
                {validationResult.ipqs?.riskScore ?? "N/A"}
              </p>
              <p>
                <strong>Reasons:</strong>
                {renderRiskReasons(validationResult.riskReasons)}
              </p>
            </div>
          )}
        </div>

        {/* Submission Form */}
        <div className="submit-container">
          <form onSubmit={handleSubmit} className="submit-form">
            <h2>📤 Submit Threat Indicator</h2>

            <label>URL, IP, or Email:</label>
            <input
              type="text"
              value={indicator}
              onChange={(e) => setIndicator(e.target.value)}
              placeholder="http://malicious.com"
            />

            <label>Type:</label>
            <select id="type">
              <option value="">-- Select Type --</option>
              <option value="PHISHING_URL">Phishing URL</option>
              <option value="FAKE_LOGIN_PAGE">Fake Login Page</option>
              <option value="EMAIL_PHISHING">Email Phishing</option>
              <option value="FAKE_WEBSITE">Fake Website</option>
            </select>

            <label>Hashtags:</label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#banking #fraud"
            />

            <label>Country:</label>
            <select
              value={selectedCountry?.name || ""}
              onChange={(e) =>
                setSelectedCountry(
                  countries.find((c) => c.name === e.target.value)
                )
              }
            >
              <option value="">-- Select a country --</option>
              {countries.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>

            <input type="file" id="image" />
            <button type="submit">Submit</button>
            {submitted && (
              <p style={{ color: "green", marginTop: "1em" }}>
                Threat submitted successfully!
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default SubmitPage;
