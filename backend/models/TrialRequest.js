import mongoose from "mongoose";

const trialRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    company: { type: String, required: true },
    size: { type: String, default: "" },
    tier: { type: String, enum: ["sentry", "sentinel", "citadel"], default: "sentry" },
    message: { type: String, default: "" },
    agreed: { type: Boolean, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("TrialRequest", trialRequestSchema);
