// controllers/payment.controller.js
import { initializePaystackTransaction } from "../utils/paystack.js";
import pool from "../config/neon.js";

// ==================== Initialize Payment ====================
export const initializePayment = async (req, res) => {
  const { email, amount, userId, plan } = req.body;

  if (!email || !amount || !userId || !plan) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  try {
    // Generate unique payment reference
    const paymentReference = `phishnet-${userId}-${Date.now()}`;

    // Save payment reference + plan to Postgres
    await pool.query(
      `UPDATE users 
       SET payment_reference = $1, plan = $2 
       WHERE id = $3`,
      [paymentReference, plan, userId]
    );

    // Initialize Paystack transaction
    const paymentUrl = await initializePaystackTransaction({
      email,
      amount,
      userId,
      reference: paymentReference,
    });

    return res.status(200).json({ paymentUrl });
  } catch (error) {
    console.error("Payment initialization error:", error);
    return res.status(500).json({ msg: "Failed to initialize payment" });
  }
};

// ==================== Paystack Callback ====================
export const handlePaystackCallback = async (req, res) => {
  const event = req.body;

  if (event.event !== "charge.success") {
    return res.status(400).json({ msg: "Unhandled event type" });
  }

  const data = event.data;
  const reference = data.reference;

  try {
    // Find user by paymentReference in Postgres
    const result = await pool.query(
      "SELECT * FROM users WHERE payment_reference = $1",
      [reference]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "User not found for this payment reference" });
    }

    const user = result.rows[0];

    // Confirm payment
    if (data.status === "success") {
      const subscriptionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await pool.query(
        `UPDATE users 
         SET plan_paid = $1, subscription_expires = $2, payment_reference = NULL 
         WHERE id = $3`,
        [true, subscriptionExpires, user.id]
      );

      console.log(`✅ Successful payment for: ${user.email}, ref: ${reference}, amount: ${data.amount}`);

      return res.status(200).json({
        status: "success",
        message: "Subscription activated",
      });
    } else {
      return res.status(400).json({
        status: "failed",
        message: "Payment not successful",
      });
    }
  } catch (error) {
    console.error("Payment callback error:", error);
    return res.status(500).json({ msg: "Server error processing payment callback" });
  }
};
