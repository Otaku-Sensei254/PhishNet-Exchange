// services/leakLookupService.js
import axios from "axios";

export const checkLeakWithLeakLookup = async (email) => {
  try {
    const response = await axios.get("https://api.leak-lookup.com/", {
      params: {
        key: process.env.LEAK_LOOKUP_API_KEY,
        email: email,
        type: "email", // Can also use `username`, `domain`, `password` depending on plan
      },
    });

    return response.data;
  } catch (error) {
    console.error("LeakLookup error:", error.response?.data || error.message);
    return { error: true, message: "LeakLookup request failed" };
  }
};
