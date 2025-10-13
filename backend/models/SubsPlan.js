const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ["free", "pro", "team"],
    required: true,
    unique: true,
  },
  priceMonthly: { type: Number, default: 0 }, // 0 for free
  features: [String], // e.g. ['email safeguard', 'priority support']
});

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
