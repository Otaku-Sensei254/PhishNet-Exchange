import React from "react";
import "../Components/styles/App.css";
import { Link } from "react-router-dom";

const Home = () => {
  const bottom = [
    {
      title: "Community-Powered Detection",
      description:
        "Leaverage the power of the community to detect and share phishing threats",
      image: "http://tiny.cc/vftk001",
    },
    {
      title: "API-Ready Threat Data",
      description:
        "Access up-to-date threat data via our API for seamless integration",
      image: "https://shorturl.at/Or1Xf",
    },
    {
      title: "Real-Time Phishing Trends",
      description:
        "Track the latest phishing campaigns and trends in real time",
      image: "http://tiny.cc/sftk001",
    },
  ];

  return (
    <div className="Container">
      <div className="home-Container">
        <div className="top">
         
          <h1>Crowd-Powered Phishing Intelligence in Real Time</h1>
          <p>
            Contribute, detect, and monitor phishing threats with live
            community-driven data
          </p>
          <div className="CTAs">
            <button>
              <Link to="/submit-threat">Submit Indicator</Link>
            </button>
            <button>
              <Link to="/browse-iocs">Browse Threats</Link>
            </button>
          </div>
        </div>
        <div className="bottom">
          {bottom.map((item, index) => (
            <div key={index} className="bottom-item">
              <img src={item.image} alt={item.title} />
              <div className="desc">
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
