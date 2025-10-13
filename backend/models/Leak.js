// models/LeakedCredential.js
import mongoose from "mongoose";

const LeakedCredentialSchema = new mongoose.Schema({
  email: { type: String, index: true, sparse: true },
  username: { type: String, index: true, sparse: true },
  phone: { type: String, index: true, sparse: true },
  password: { type: String, index: true }, // plaintext or hashed
  hashType: {
    type: String,
    enum: ["plaintext", "md5", "sha1", "sha256"],
    default: "plaintext",
  },
  source: { type: String, default: "rockyou.txt" },
  tags: { type: [String], default: [] },
  firstSeen: { type: Date, default: Date.now },
});

// Optional: Unique compound index to prevent duplicates
LeakedCredentialSchema.index(
  { email: 1, password: 1 },
  { unique: true, sparse: true }
);
LeakedCredentialSchema.index(
  { username: 1, password: 1 },
  { unique: true, sparse: true }
);

export default mongoose.model("LeakedCredential", LeakedCredentialSchema);
