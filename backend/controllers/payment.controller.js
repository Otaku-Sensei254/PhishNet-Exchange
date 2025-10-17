import { initializePaystackTransaction } from "../utils/paystack.js";
import pool from "../config/neon.js";

// ==================== Initialize Payment ====================
export const initializePayment = async (req, res) => {
  const { email, amount, userId, plan } = req.body;

  if (!email || !amount || !userId || !plan) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  try {
    const paymentReference = `phishnet-${userId}-${Date.now()}`;

    // Save the generated payment reference & selected plan in Postgres
    await pool.query(
      `UPDATE users 
       SET payment_reference = $1, plan = $2 
       WHERE id = $3`,
      [paymentReference, plan, userId]
    );

    // Initialize Paystack transaction
    const paymentUrl = await initializePaystackTransaction({
      userId,
      email,
      amount,
      reference: paymentReference,
      // 👇 Redirects back to frontend after Paystack checkout
      callback_url: `${process.env.FRONTEND_URL}/payment-success?ref=${paymentReference}`,
    });

    return res.status(200).json({ paymentUrl });
  } catch (error) {
    console.error("💥 Payment initialization error:", error);
    return res.status(500).json({ msg: "Failed to initialize payment" });
  }
};

// ==================== Paystack Callback (redirect after payment) ====================
export const handlePaystackCallback = async (req, res) => {
  const event = req.body;

  if (!event || !event.event) {
    return res.status(400).json({ msg: "Invalid Paystack event" });
  }

  const data = event.data;
  const reference = data?.reference;

  if (!reference) {
    return res.status(400).json({ msg: "Missing payment reference" });
  }

  try {
    // Fetch user from Postgres using the stored reference
    const result = await pool.query(
      "SELECT * FROM users WHERE payment_reference = $1",
      [reference]
    );

    if (result.rows.length === 0) {
      console.error(`⚠️ No user found for reference: ${reference}`);
      return res.status(404).json({ msg: "User not found" });
    }

    const user = result.rows[0];

    if (data.status === "success") {
      const subscriptionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await pool.query(
        `UPDATE users 
         SET plan_paid = TRUE, subscription_expires = $1, payment_reference = NULL 
         WHERE id = $2`,
        [subscriptionExpires, user.id]
      );

      console.log(`✅ Payment verified for ${user.email} (${reference})`);

      // ✅ Redirect to frontend success page
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment-success?ref=${reference}`
      );
    } else {
      console.warn(`❌ Payment failed for ${reference}`);
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment-failed?ref=${reference}`
      );
    }
  } catch (error) {
    console.error("💥 Payment callback error:", error);
    return res.status(500).json({ msg: "Error processing payment callback" });
  }
};
//=====================VERIFY PAYMENT FUNCTION======================
export const verifyPaystackPayment = async (req, res) => {
  const { reference } = req.body;

  if (!reference) {
    console.warn("⚠️ Missing payment reference in request");
    return res.status(400).json({ msg: "Missing payment reference" });
  }

  try {
    console.log("🔍 Verifying Paystack payment for reference:", reference);

    // 1️⃣ Verify payment from Paystack API
    const verify = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );

    const data = verify.data?.data;
    if (!data) {
      console.error("❌ Invalid Paystack verification response:", verify.data);
      return res.status(500).json({ msg: "Invalid response from Paystack" });
    }

    // 2️⃣ Check payment status
    if (data.status === "success") {
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const result = await pool.query(
        `UPDATE users 
         SET plan_paid = TRUE, subscription_expires = $1, payment_reference = NULL
         WHERE payment_reference = $2
         RETURNING email, plan_paid, subscription_expires`,
        [expiryDate, reference]
      );

      if (result.rows.length === 0) {
        console.warn("⚠️ No user found with that reference in DB");
        return res.status(404).json({ msg: "User not found for this reference" });
      }

      console.log(`✅ Payment verified for ${result.rows[0].email}`);
      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        user: result.rows[0],
      });
    }

    // 3️⃣ If payment was not successful
    console.warn(`❌ Payment verification failed for ${reference}`);
    return res.status(400).json({ msg: "Payment not successful" });
  } catch (error) {
    console.error(
      "💥 Payment verification error:",
      error.response?.data || error.message
    );
    return res.status(500).json({ msg: "Error verifying payment" });
  }
};
