import axios from "axios";

export const initializePaystackTransaction = async ({
  email,
  amount,
  userId,
  reference,
  callback_url, // 👈 now dynamic
}) => {
  try {
    if (!email || !amount || !userId || !reference) {
      throw new Error("Missing required fields for Paystack transaction");
    }

    const payload = {
      email,
      amount: amount * 100, // Convert KES → Kobo (Paystack expects in kobo)
      reference,
      metadata: {
        userId,
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: userId,
          },
        ],
      },
      callback_url:
        callback_url || `${process.env.BASE_URL}/api/payment/callback`, // fallback
      currency: "KES", // ✅ Paystack supports KES now (if account is configured)
    };

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data?.data?.authorization_url) {
      console.error("Paystack Init Error: Invalid API response", response.data);
      throw new Error("Invalid response from Paystack");
    }

    return response.data.data.authorization_url;
  } catch (error) {
    console.error(
      "💥 Paystack Init Error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to initialize Paystack transaction");
  }
};
