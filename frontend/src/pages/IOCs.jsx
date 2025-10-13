import React, { useState } from "react";
import countries from "../Components/utils/countries";
import "../Components/styles/SubmitIoc.css";
import { useNavigate } from "react-router-dom";
function IOC({ onNewIOC }) {
  const [indicatorType, setIndicatorType] = useState("");
  const [ioc, setIoc] = useState("");
  const [sourceCountry, setSourceCountry] = useState(null);
  const [tags, setTags] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // Convert user input into array of normalized tags
  const parseTags = (input) => {
    if (!input) return [];
    return input
      .split(/[\s,]+/) // split by spaces or commas
      .filter((t) => t.trim() !== "")
      .map((t) => (t.startsWith("#") ? t : `#${t.toLowerCase()}`));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!indicatorType || !ioc || !sourceCountry)
      return alert("Required fields missing");

    const token = localStorage.getItem("token");
    if (!token) return alert("Login required");

    setLoading(true);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/iocs/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          indicatorType,
          ioc,
          sourceCountry: JSON.stringify(sourceCountry),
          tags: parseTags(tags),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setIndicatorType("");
        setIoc("");
        setSourceCountry(null);
        setTags("");
        if (onNewIOC) onNewIOC(data.ioc);
        navigate("/browse-iocs", { replace: true });
      } else {
        alert("Failed to submit IOC");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit IOC");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="submit-form">
      <h2>Submit IOC</h2>

      <label>Indicator Type</label>
      <select
        value={indicatorType}
        onChange={(e) => setIndicatorType(e.target.value)}
        required
      >
        <option value="">-- Select Type --</option>
        <option value="🌐Phishing Url">Phishing URL</option>
        <option value="📱Fake Login Page">Fake Login Page</option>
        <option value="📧Email Phishing">Email Phishing</option>
        <option value="☣️Malware">Malware</option>
      </select>

      <label>IOC</label>
      <input
        type="text"
        value={ioc}
        onChange={(e) => setIoc(e.target.value)}
        placeholder="http://malicious.com"
        required
      />

      <label>Source Country</label>
      <select
        value={sourceCountry?.name || ""}
        onChange={(e) =>
          setSourceCountry(countries.find((c) => c.name === e.target.value))
        }
        required
      >
        <option value="">-- Select Country --</option>
        {countries.map((c) => (
          <option key={c.name} value={c.name}>
            {c.flag} {c.name}
          </option>
        ))}
      </select>

      <label>Tags (multiple allowed, space or comma separated)</label>
      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="BankingScam, CredentialTheft, FraudAlert"
      />

      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit IOC"}
      </button>

      {submitted && (
        <p className="success-msg">✅ IOC submitted successfully!</p>
      )}
    </form>
  );
}

export default IOC;
