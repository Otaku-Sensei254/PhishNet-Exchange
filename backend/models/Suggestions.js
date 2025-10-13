import mongoose from "mongoose";

const suggestionSchema = new mongoose.Schema({
  userId: { type: Number, required: true }, // Postgres user ID
  topic: { type: String, required: true },
  description: { type: String }, // optional from textarea
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Suggestion", suggestionSchema);
