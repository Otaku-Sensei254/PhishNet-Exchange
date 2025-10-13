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
      // 1️⃣ Run leak check
      const res = await fetch("http://localhost:5000/api/check/leak", {
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

      // 2️⃣ Save scan history to MongoDB
      await fetch("http://localhost:5000/api/scan/save", {
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

      // 3️⃣ Show toast notification
      toast.success("✅ Scan completed and saved to history!");
    } catch (err) {
      setError(err.message || "Something went wrong.");
      toast.error("❌ Scan failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Leak Checker</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
        />
        <button type="submit" disabled={loading}>
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
              One or more of your credentials have been found in public data
              breaches.
              <br />
              <strong>
                Please consider changing your credentials immediately.
              </strong>
            </p>
            <ul>
              {results.map((match, i) => (
                <li key={i}>
                  <strong>{match.field}</strong>:{" "}
                  <code className="leaked-value">{match.value}</code>
                  <br />
                  <span>
                    <strong>Sources:</strong>{" "}
                    <em>{match.sources?.join(", ")}</em>
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
            <p className="safe-message">
              ✅ No matches found — you’re safe for now!
            </p>
          )
        )}
      </div>
    </div>
  );
}

export default LeakCheckForm;
