import { useState } from "react";
import axios from "axios";
import "./LeakCheckWidget.css";

export default function LeakCheckWidget({ onComplete }) {
  const [form, setForm] = useState({
    email: "",
    username: "",
    phone: "",
    password: "",
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRunCheck = async () => {
    setLoading(true);
    setResults(null);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/check-leaks`, form);
      setResults(res.data.matches || []);
      if (onComplete) onComplete(res.data.matches);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leak-widget">
      <h3>Dark Web Leak Checker</h3>
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
        type="text"
        name="phone"
        placeholder="Phone"
        onChange={handleChange}
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        onChange={handleChange}
      />
      <button onClick={handleRunCheck} disabled={loading}>
        {loading ? "Checking..." : "Run Dark Web Check"}
      </button>

      {results && (
        <div className="results">
          {results.length > 0 ? (
            <ul>
              {results.map((r, i) => (
                <li key={i}>
                  <strong>{r.field}</strong> matched on dark web leak.
                </li>
              ))}
            </ul>
          ) : (
            <p>No leaks found.</p>
          )}
        </div>
      )}
    </div>
  );
}
