import React, { useState, useEffect } from "react";
import "../Components/styles/BrowseIOCs.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function BrowseIOCs() {
  const [iocs, setIocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/iocs/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setIocs(data.iocs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="iocs-page">
      <div className="iocs-header">
        <h1 className="iocs-title">
          IOC <span className="iocs-accent">Database</span>
        </h1>
        <p className="iocs-desc">
          Browse the latest indicators of compromise submitted by our community
          and security researchers.
        </p>
      </div>

      <div className="iocs-content">
        {loading ? (
          <div className="iocs-empty">Loading indicators...</div>
        ) : iocs.length === 0 ? (
          <div className="iocs-empty">No IOCs found.</div>
        ) : (
          <div className="iocs-table-wrap">
            <table className="iocs-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Indicator</th>
                  <th>Tags</th>
                  <th>Country</th>
                  <th className="th-right">Votes</th>
                </tr>
              </thead>
              <tbody>
                {iocs.map((ioc) => (
                  <tr key={ioc._id}>
                    <td>
                      <span className="ioc-type">{ioc.indicatorType}</span>
                    </td>
                    <td className="ioc-indicator">{ioc.ioc}</td>
                    <td>
                      <div className="ioc-tags">
                        {(ioc.tags || []).map((tag, i) => (
                          <span key={i} className="ioc-tag">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="ioc-country">{ioc.sourceCountry?.flag ? `${ioc.sourceCountry.flag} ${ioc.sourceCountry.name}` : ioc.sourceCountry || "—"}</td>
                    <td className="ioc-votes">
                      <span className="upvote">▲ {ioc.upvotes || 0}</span>
                      <span className="downvote">▼ {ioc.downvotes || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
