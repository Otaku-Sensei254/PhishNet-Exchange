// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String },
  verificationToken: { type: String },
  isVerified: { type: Boolean, default: false },

  // ✅ Subscription Plan
  plan: {
    type: String,
    enum: ["free", "pro", "team"],
    default: "free",
  },
  planPaid: {
    type: Boolean,
    default: false,
  },
  paymentReference: { type: String },
  subscriptionExpires: { type: Date },

  // ✅ NEW Monitoring Fields
  monitoredEmails: {
    type: [String],
    default: [],
  },
  monitoredPhones: {
    type: [String],
    default: [],
  },

  // ✅ Auto Scan Configuration
  autoScanEnabled: {
    type: Boolean,
    default: false,
  },
  scanFrequency: {
    type: String,
    enum: ["hourly", "daily", "weekly"],
    default: "daily",
  },
});

export default mongoose.model("User", userSchema);
