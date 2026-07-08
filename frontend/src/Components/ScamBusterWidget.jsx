import React, { useState, useEffect } from "react";

function relativeDate(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function ScamBusterWidget({ limit = 5 }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/link/scambuster`)
      .then((r) => r.json())
      .then((d) => setReports(d.reports?.slice(0, limit) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) return <p className="sb-loading">Loading reports...</p>;
  if (reports.length === 0) return <p className="sb-empty">No recent reports.</p>;

  return (
    <div className="sb-widget">
      <ul className="sb-list">
        {reports.map((r) => (
          <li key={r.id} className="sb-item">
            <a
              href={`https://scambuster.co.ke/check/${encodeURIComponent(r.identifier)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="sb-name"
            >
              {r.identifier}
            </a>
            <div className="sb-meta">
              <span className={`sb-type type-${r.scam_type}`}>{r.scam_type}</span>
              {r.amount_lost > 0 && (
                <span className="sb-amount">KSh {Number(r.amount_lost).toLocaleString()}</span>
              )}
              <span className="sb-date">{relativeDate(r.created_at)}</span>
            </div>
          </li>
        ))}
      </ul>
      <a
        href="https://scambuster.co.ke/browse"
        target="_blank"
        rel="noopener noreferrer"
        className="sb-link"
      >
        View all reports on ScamBuster →
      </a>
    </div>
  );
}
