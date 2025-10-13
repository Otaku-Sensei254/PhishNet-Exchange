import IOC from "../models/IOCs.js";

// Submit a new IOC
export const submitIOC = async (req, res) => {
  try {
    const userId = req.user?.id; // Postgres user ID from JWT
    const { indicatorType, ioc, sourceCountry, tags } = req.body;

    if (!indicatorType || !ioc || !sourceCountry) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const parsedTags = Array.isArray(tags)
      ? tags.map((t) => (t.startsWith("#") ? t : `#${t}`))
      : [];

    const newIOC = await IOC.create({
      indicatorType,
      ioc,
      sourceCountry:
        typeof sourceCountry === "string"
          ? JSON.parse(sourceCountry)
          : sourceCountry,
      tags: parsedTags,
      submittedBy: userId,
    });

    res.status(201).json({ success: true, ioc: newIOC });
  } catch (err) {
    console.error("Error submitting IOC:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to submit IOC" });
  }
};

// Fetch all IOCs
export const getIOCs = async (req, res) => {
  try {
    const iocs = await IOC.find().sort({ createdAt: -1 }).limit(50);

    const normalized = iocs.map((doc) => {
      const obj = doc.toObject();
      obj.votes = {
        up: obj.upvoters?.length || 0,
        down: obj.downvoters?.length || 0,
      };
      return obj;
    });

    res.json({ success: true, iocs: normalized });
  } catch (err) {
    console.error("Error fetching IOCs:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch IOCs" });
  }
};

// Vote on IOC
export const voteIOC = async (req, res) => {
  try {
    const { id } = req.params;       // IOC id
    const { type } = req.body;       // "up" or "down"
    const userId = req.user?.id;     // Postgres user ID from JWT

    if (!["up", "down"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid vote type" });
    }

    const ioc = await IOC.findById(id);
    if (!ioc) {
      return res.status(404).json({ success: false, message: "IOC not found" });
    }

    let hasChanged = false;

    // If voting "up"
    if (type === "up") {
      if (!ioc.upvoters.includes(userId)) {
        // remove from downvoters if switching
        if (ioc.downvoters.includes(userId)) {
          ioc.downvoters = ioc.downvoters.filter(u => u !== userId);
          ioc.votes.down = Math.max(0, ioc.votes.down - 1);
        }
        ioc.upvoters.push(userId);
        ioc.votes.up += 1;
        hasChanged = true;
      } else {
        // already upvoted → toggle off
        ioc.upvoters = ioc.upvoters.filter(u => u !== userId);
        ioc.votes.up = Math.max(0, ioc.votes.up - 1);
        hasChanged = true;
      }
    }

    // If voting "down"
    if (type === "down") {
      if (!ioc.downvoters.includes(userId)) {
        // remove from upvoters if switching
        if (ioc.upvoters.includes(userId)) {
          ioc.upvoters = ioc.upvoters.filter(u => u !== userId);
          ioc.votes.up = Math.max(0, ioc.votes.up - 1);
        }
        ioc.downvoters.push(userId);
        ioc.votes.down += 1;
        hasChanged = true;
      } else {
        // already downvoted → toggle off
        ioc.downvoters = ioc.downvoters.filter(u => u !== userId);
        ioc.votes.down = Math.max(0, ioc.votes.down - 1);
        hasChanged = true;
      }
    }

    if (hasChanged) await ioc.save();

    res.json({ success: true, ioc });
  } catch (err) {
    console.error("Error voting IOC:", err.message);
    res.status(500).json({ success: false, message: "Failed to vote IOC" });
  }
};


