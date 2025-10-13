import Suggestions from "../models/Suggestions.js";
// Save suggestion
export const saveSuggestion = async (req, res) => {
  try {
    const userId = req.user.id; // Postgres ID from JWT
    const { topic, description } = req.body;

    if (!topic) {
      return res.status(400).json({ success: false, msg: "Topic is required" });
    }

    const suggestion = await Suggestions.create({
      userId,
      topic,
      description: description || "",
    });

    res.status(201).json({ success: true, suggestion });
  } catch (err) {
    console.error("Error saving suggestion:", err.message);
    res.status(500).json({ success: false, error: "Failed to save suggestion" });
  }
};

// Get all suggestions (optional, for admin or community view)
export const getSuggestions = async (req, res) => {
  try {
    const suggestions = await Suggestions.find().sort({ timestamp: -1 });
    res.json({ success: true, suggestions });
  } catch (err) {
    console.error("Error fetching suggestions:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch suggestions" });
  }
};
