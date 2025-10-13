// utils/paystack.js
import axios from "axios";

export const initializePaystackTransaction = async ({
  email,
  amount,
  userId,
  reference,
}) => {
  try {
    // Validate inputs
    if (!email || !amount || !userId || !reference) {
      throw new Error("Missing required fields for Paystack transaction");
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // Convert to kobo
        reference,
        metadata: {
          userId, // Attach userId for tracking
        },
        callback_url: `${process.env.BASE_URL}/api/payment/callback`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // use one consistent key
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data || !response.data.data) {
      throw new Error("Invalid response from Paystack");
    }

    return response.data.data.authorization_url;
  } catch (error) {
    console.error("Paystack Init Error:", error.response?.data || error.message);
    throw new Error("Failed to initialize Paystack transaction");
  }
};
