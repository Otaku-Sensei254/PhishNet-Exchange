import Threat from "../models/threat.js";
import { v2 as cloudinary } from "cloudinary";

// Submit a new threat
export const submitThreat = async (req, res) => {
  try {
    const userId = req.user?.id; // Postgres user ID from JWT
    const { indicator, type, hashtags, country } = req.body;

    if (!indicator || !type || !country) {
      return res.status(400).json({
        success: false,
        message: "Indicator, type, and country are required",
      });
    }

    // Upload screenshot to Cloudinary if provided
    let screenshotUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "threat_screenshots",
      });
      screenshotUrl = result.secure_url;
    }

    const threat = await Threat.create({
      indicator,
      type,
      hashtags: hashtags || [],
      country: JSON.parse(country),
      screenshotUrl,
      submittedBy: userId,
    });

    res.status(201).json({ success: true, threat });
  } catch (err) {
    console.error("Error submitting threat:", err.message);
    res.status(500).json({ success: false, message: "Failed to submit threat" });
  }
};

// Fetch all threats (latest 50)
export const getThreats = async (req, res) => {
  try {
    const threats = await Threat.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, threats });
  } catch (err) {
    console.error("Error fetching threats:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch threats" });
  }
};
