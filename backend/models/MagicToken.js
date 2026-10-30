import mongoose from "mongoose";

const magicTokenSchema = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  isTrial: { type: Boolean, default: false },
  tier: { type: String, default: "sentry" },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

magicTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("MagicToken", magicTokenSchema);
