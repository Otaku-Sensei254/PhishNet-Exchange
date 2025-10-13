import mongoose from "mongoose";

const threatSchema = new mongoose.Schema(
  {
    indicator: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: [
        "PHISHING_URL",
        "FAKE_LOGIN_PAGE",
        "EMAIL_PHISHING",
        "FAKE_WEBSITE",
      ],
      required: true,
    },
    hashtags: [String],
    country: { name: String, code: String, flag: String },
    screenshotUrl: { type: String },
    submittedBy: { type: String, required: true }, // Postgres user ID
  },
  { timestamps: true }
);

export default mongoose.model("Threat", threatSchema);
