import mongoose from "mongoose";

const iocSchema = new mongoose.Schema(
  {
    indicatorType: {
      type: String,
      enum: ["🌐Phishing Url", "📱Fake Login Page", "📧Email Phishing", "☣️Malware"],
      required: true,
    },
    ioc: { type: String, required: true, unique: true },
    sourceCountry: {
      name: String,
      code: String,
      flag: String,
    },
    techniqueId: { type: String },
    tactic: { type: String },
    techniqueName: { type: String },
    tags: [{ type: String }],
    votes: {
      up: { type: Number, default: 0 },
      down: { type: Number, default: 0 },
    },
    upvoters: [{ type: String }],
    downvoters: [{ type: String }],
    submittedBy: { type: String, required: true }, // Postgres user ID
  },
  { timestamps: true }
);

export default mongoose.model("IOC", iocSchema);
