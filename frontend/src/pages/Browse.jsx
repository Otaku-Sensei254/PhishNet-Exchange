import React, { useState, useEffect } from "react";
import "../Components/styles/Browse.css";
import countries from "../Components/utils/countries";
import { Link } from "react-router-dom";

function BrowseIOCs() {
  const [iocs, setIocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searchTag, setSearchTag] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState("all");

  const fetchIOCs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/iocs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setIocs(data.iocs);
    } catch (err) {
      console.error("Error fetching IOCs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIOCs();
  }, []);

  const filterByDate = (iocDate) => {
    const today = new Date();
    const date = new Date(iocDate);
    const diffDays = (today - date) / (1000 * 60 * 60 * 24);

    switch (selectedDateRange) {
      case "24h":
        return diffDays <= 1;
      case "7d":
        return diffDays <= 7;
      case "30d":
        return diffDays <= 30;
      default:
        return true;
    }
  };

  const filteredIOCs = iocs.filter((ioc) => {
    const countryMatch = selectedCountry
      ? ioc.sourceCountry?.name === selectedCountry.name
      : true;

    // Normalize searchTag (remove # and lowercase)
    const normalizedSearchTag = searchTag.replace("#", "").toLowerCase();

    const tagMatch =
      normalizedSearchTag.length === 0
        ? true
        : ioc.tags?.some((t) =>
            t.replace("#", "").toLowerCase().includes(normalizedSearchTag)
          );

    const typeMatch = selectedType
      ? ioc.indicatorType.toLowerCase() === selectedType.toLowerCase()
      : true;

    const dateMatch = filterByDate(ioc.createdAt);

    return countryMatch && tagMatch && typeMatch && dateMatch;
  });

  const handleVote = async (id, type) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/iocs/vote/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) {
        setIocs((prev) =>
          prev.map((ioc) => (ioc._id === id ? data.ioc : ioc))
        );
      }
    } catch (err) {
      console.error("Error voting:", err);
    }
  };

  return (
    <div className="browse-container">
      <h1>Browse IOCs</h1>

      <div className="filters">
        <select
          value={selectedDateRange}
          onChange={(e) => setSelectedDateRange(e.target.value)}
        >
          <option value="all">Date: All time</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="">Type: All</option>
          <option value="🌐Phishing Url">Phishing URL</option>
        <option value="📱Fake Login Page">Fake Login Page</option>
        <option value="📧Email Phishing">Email Phishing</option>
        <option value="☣️Malware">Malware</option>
        </select>

        <select
          value={selectedCountry?.name || ""}
          onChange={(e) =>
            setSelectedCountry(countries.find((c) => c.name === e.target.value))
          }
        >
          <option value="">-- Select a country --</option>
          {countries.map((c) => (
            <option key={c.name} value={c.name}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by tag (e.g., fraud or #fraud)"
          value={searchTag}
          onChange={(e) => setSearchTag(e.target.value)}
        />

        <button className="sub-ioc">
          <Link to="/submit-ioc">Submit IOC</Link>
        </button>
      </div>

      {loading ? (
        <p>Loading IOCs...</p>
      ) : (
        <div className="table-wrapper">
          <table className="threats-table">
            <thead>
              <tr>
                <th>Indicator Type</th>
                <th>IOC</th>
                <th>Source Country</th>
                <th>Tags</th>
                <th>Date</th>
                <th>Votes</th>
              </tr>
            </thead>
            <tbody>
              {filteredIOCs.length > 0 ? (
                filteredIOCs.map((ioc) => (
                  <tr key={ioc._id}>
                    <td data-label="Indicator Type">{ioc.indicatorType}</td>
                    <td data-label="IOC">{ioc.ioc}</td>
                    <td data-label="Source Country">
                      {ioc.sourceCountry?.flag} {ioc.sourceCountry?.name}
                    </td>
                    <td data-label="Tags">
                      {ioc.tags.map((tag, idx) => (
                        <span key={idx} className="tag">
                          {tag.startsWith("#") ? tag : `#${tag}`}
                        </span>
                      ))}
                    </td>
                    <td data-label="Date">
                      {new Date(ioc.createdAt).toLocaleDateString()}
                    </td>
                    <td data-label="Votes">
                      {ioc.votes.up}{" "}
                      <span
                        className="up"
                        onClick={() => handleVote(ioc._id, "up")}
                      >
                        ↑
                      </span>{" "}
                      / {ioc.votes.down}{" "}
                      <span
                        className="down"
                        onClick={() => handleVote(ioc._id, "down")}
                      >
                        ↓
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No IOCs found matching the filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BrowseIOCs;
