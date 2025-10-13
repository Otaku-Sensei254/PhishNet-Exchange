import crypto from "crypto";
import User from "../models/User.js";

export const handlePaystackWebhook = async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_LIVE_KEY;
  const signature = req.headers["x-paystack-signature"];
  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== signature) return res.status(400).send("Invalid signature");

  const { event, data } = req.body;
  if (event === "charge.success") {
    const email = data.customer.email;
    const amount = data.amount / 100;

    const user = await User.findOne({ email });
    if (user) {
      user.planPaid = true;
      if (amount === 5) user.plan = "pro";
      else if (amount === 3000) user.plan = "team";
      await user.save();
      console.log(`✅ Payment success: ${email} now on ${user.plan}`);
    }
  }
  res.sendStatus(200);
};
