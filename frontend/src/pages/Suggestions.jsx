import React, { useState } from "react";
import "../Components/styles/Suggestions.css";
import { useNavigate } from "react-router-dom";
const SuggestTopic = () => {
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to submit a suggestion.");
      return;
    }
    try {
      const res = await fetch("http://192.168.56.1:5000/api/suggestions/suggestion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic, description }),
      });

      const data = await res.json();
      console.log("Suggestion sent:", data);
      setTopic("");
      setDescription("");
      alert("Thank you for your suggestion!");
      navigate("/community");
    } catch (error) {
      console.error("Error submitting topic:", error);
    }
  };

  return (
    <div className="suggest-container">
      <form onSubmit={handleSubmit} className="suggest-form">
        <h2>Suggest a Topic</h2>
        <input
          type="text"
          placeholder="e.g. How AI is reshaping cybersecurity"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="suggest-input"
        />
        <textarea
          placeholder="Why do you think this topic is important?"
          className="suggest-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button type="submit" className="suggest-btn">
          Submit
        </button>
      </form>
    </div>
  );
};

export default SuggestTopic;
