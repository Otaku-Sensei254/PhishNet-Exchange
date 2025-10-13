import crypto from "crypto";

export const verifypaystackSignature = (req, res, next) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers["x-paystack-signature"];
  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");
  if (hash !== signature)
    return res.status(400).json({ msg: "Invalid signature" });
  next();
};
