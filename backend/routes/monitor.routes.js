import express from "express";
import User from "../models/User.js";
import verifyToken from "../middlewares/auth.middleware.js";

const router = express.Router();

// Utility: Count how many monitored items a user has
const countMonitoredItems = (user) => {
  const emails = user.monitoredEmails?.length || 0;
  const phones = user.monitoredPhones?.length || 0;
  return emails + phones;
};

// POST /api/monitor/add
router.post("/add", verifyToken, async (req, res) => {
  const { email, phone } = req.body;
  const userId = req.user.id;

  if (!email && !phone) {
    return res.status(400).json({ msg: "Email or phone must be provided." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found." });

    const total = countMonitoredItems(user);

    // Handle plan limits
    if (user.plan === "free" && total >= 2) {
      return res
        .status(403)
        .json({ msg: "Free plan allows only 1 email and 1 phone." });
    }
    if (user.plan === "pro" && total >= 5) {
      return res
        .status(403)
        .json({ msg: "Pro plan allows up to 5 monitored items." });
    }
    if (user.plan === "team" && total >= 25) {
      return res
        .status(403)
        .json({ msg: "Team plan allows up to 25 items per account." });
    }

    if (email && !user.monitoredEmails.includes(email)) {
      user.monitoredEmails.push(email);
    }
    if (phone && !user.monitoredPhones.includes(phone)) {
      user.monitoredPhones.push(phone);
    }

    await user.save();
    res.json({ success: true, updatedUser: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error." });
  }
});

export default router;
