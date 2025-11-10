import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./LeakChecker.css";

function LeakCheckForm() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResults([]);
    setError(null);
    setLoading(true);

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/check/leak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");

      setResults(data.matches || []);

      await fetch(`${process.env.REACT_APP_API_URL}/api/scan/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          input: formData,
          matches: data.matches || [],
        }),
      });

      toast.success("✅ Scan completed and saved to history!");
    } catch (err) {
      setError(err.message || "Something went wrong.");
      toast.error("❌ Scan failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leak-container">
      <h2 className="leak-title">Leak Checker</h2>

      <form className="leak-form" onSubmit={handleSubmit}>
        <input className="leak-input" type="email" name="email" placeholder="Email" onChange={handleChange} />
        <input className="leak-input" type="text" name="username" placeholder="Username" onChange={handleChange} />
        <input className="leak-input" type="password" name="password" placeholder="Password" onChange={handleChange} />

        <button className="leak-btn" type="submit" disabled={loading}>
          {loading ? "Checking..." : "Check for Leaks"}
        </button>
      </form>

      {loading && <p className="status">🔍 Checking for leaks...</p>}
      {error && <p className="error">❌ {error}</p>}

      <div className="results">
        {results.length > 0 ? (
          <div className="leak-alert">
            <h3>⚠️ Leak Detected!</h3>
            <p className="leak-warning">
              One or more of your credentials have been found in public data breaches.
              <br />
              <strong>Please update your credentials immediately.</strong>
            </p>

            <ul className="leak-list">
              {results.map((match, i) => (
                <li key={i} className="leak-item">
                  <strong>{match.field}</strong>:{" "}
                  <code className="leaked-value">{match.value}</code>
                  <br />
                  <span>
                    <strong>Sources:</strong> <em>{match.sources?.join(", ")}</em>
                  </span>
                  <br />
                  <span>
                    <strong>First Seen:</strong> {match.firstSeen}
                  </span>
                  <br />
                  <span>
                    <strong>Last Seen:</strong> {match.lastSeen || "N/A"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          !loading &&
          !error && (
            <p className="safe-message">✅ No matches found — you're safe for now!</p>
          )
        )}
      </div>
    </div>
  );
}

export default LeakCheckForm;
