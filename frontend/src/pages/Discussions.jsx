import React from "react";
import '../Components/styles/discussions.css';
import vid from '../assets/vid.mp4'
const Discussions = () => {
  const handleVideoError = (e) => {
    console.error("Video failed to load:", e);
    // You could set a fallback background here
  };

  return (
    <div className="container">
      <video 
        autoPlay 
        muted 
        loop 
        playsInline
        id="bg-video"
        className="bg-video"
        onError={handleVideoError}
        onCanPlayThrough={() => console.log("Video can play through")}
      >
        <source src={vid} type="video/mp4" />
        {/* Fallback sources if needed */}
        <source src={vid} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="content-overlay">
        <h1 className="page-title">Discussions Page under development</h1>
        <p className="page-subtitle">Coming soon with exciting features!</p>
      </div>
    </div>
  );
};

export default Discussions;