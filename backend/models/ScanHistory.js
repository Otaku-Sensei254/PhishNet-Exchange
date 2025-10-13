import mongoose from "mongoose";

const scanHistorySchema = new mongoose.Schema({
  userId: { type: Number, required: true }, // 🔑 Postgres user ID
  timestamp: { type: Date, default: Date.now },
  input: {
    email: String,
    username: String,
    password: String, // consider masking later
  },
  matches: [
    {
      field: String,
      value: String,
      sources: [String],  // ✅ fixed (plural)
      firstSeen: mongoose.Schema.Types.Mixed,
      lastSeen: mongoose.Schema.Types.Mixed,
    },
  ],
});

export default mongoose.model("ScanHistory", scanHistorySchema);
