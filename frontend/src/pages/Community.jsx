import React, { useState, useEffect } from "react";
import {
  posts,
  suggestedDiscussions,
  topContributors,
} from "../Components/utils/community";
import "../Components/styles/Community.css";
import { Link } from "react-router-dom";
import { FaSignsPost } from "react-icons/fa6";

const CommunityPage = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/suggestions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    };

    fetchSuggestions();
  }, []);

  // Close sidebar when clicking on overlay
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('sidebar-overlay')) {
      setShowSidebar(false);
    }
  };

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (showSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSidebar]);

  const filteredPosts = posts.filter((post) => {
    const term = search.toLowerCase();
    return (
      post.username.toLowerCase().includes(term) ||
      post.content.toLowerCase().includes(term) ||
      post.tags.some((tag) => tag.toLowerCase().includes(term))
    );
  });

  const getPopularTags = () => {
    const tagCount = {};
    posts.forEach((post) =>
      post.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      })
    );
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  };

  return (
    <div className="community-wrapper">
      <button
        className="toggle-sidebar"
        onClick={() => setShowSidebar(!showSidebar)}
      >
        ☰
      </button>

      {/* Overlay for mobile */}
      {showSidebar && (
        <div 
          className="sidebar-overlay" 
          onClick={handleOverlayClick}
        ></div>
      )}

      <div className="community-main">
        <div className="top">
          <input
            className="search-bar"
            placeholder="Search by user, tags, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Link to="/submit-threat" className="post-button">
            Post Threat <FaSignsPost/>
          </Link>
        </div>
        {filteredPosts.map((post) => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <img src={post.avatar} alt="avatar" className="avatar" />
              <div className="user-info">
                <strong>{post.username}</strong>
                <span className="timestamp">
                  {new Date(post.timestamp).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="content">{post.content}</p>

            {post.image && (
              <img src={post.image} alt="post" className="post-image" />
            )}
            {post.file && (
              <a href={post.file} download className="download-link">
                📄 Download Attachment
              </a>
            )}

            <div className="tags">
              {post.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>

            <div className="interaction-bar">
              <button>👍 {post.likes}</button>
              <button>💬 {post.commentCount} Comments</button>
              <button>🔁 Share</button>
            </div>
          </div>
        ))}
      </div>

      <div className={`sidebar ${showSidebar ? "show" : ""}`}>
        <button 
          className="close-sidebar"
          onClick={() => setShowSidebar(false)}
        >
          ✕
        </button>
        
        <div className="sidebar-section">
          <h3>🏷️ Popular Tags</h3>
          {getPopularTags().map((tag, i) => (
            <div key={i} className="sidebar-tag">
              {tag}
            </div>
          ))}
        </div>

        <div className="sidebar-section">
          <h3>🧠 Suggested Discussions</h3>
          {suggestedDiscussions.map((text, i) => (
            <p key={i} className="sidebar-link">
              {text}
            </p>
          ))}
        </div>

        <div className="sidebar-section">
          <h3>🧑‍💻 Top Contributors</h3>
          {topContributors.map((user, i) => (
            <div key={i} className="contributor">
              <img src={user.avatar} alt="avatar" className="avatar small" />
              <span>{user.username}</span>
            </div>
          ))}
        </div>
        
        <div className="sidebar-section">
          <h3>📈 Community Stats</h3>
          <p>Total Posts: {posts.length}</p>
          <p>Total Contributors: {topContributors.length}</p>
          <p>Active Discussions: {suggestedDiscussions.length}</p>
        </div>
        
        <div className="sidebar-section">
          <h3>💬 Join Community Talks</h3>
          <div className="talks">
            <Link to="/suggest" onClick={() => setShowSidebar(false)}>
              <button className="suggest">Suggest Topic</button>
            </Link>
            <Link to="/discussions" onClick={() => setShowSidebar(false)}>
              <button className="suggest">Discussions</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;