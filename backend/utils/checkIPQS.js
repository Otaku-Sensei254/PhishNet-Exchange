import axios from "axios";

const IPQS_KEY = process.env.IPQS_KEY;

export async function checkUrlWithIPQS(urlToCheck, strictness = 0) {
  try {
    const queryParams = new URLSearchParams({ strictness }).toString();
    const encodedUrl = encodeURIComponent(urlToCheck);

    const res = await axios.get(
      `https://www.ipqualityscore.com/api/json/url/${IPQS_KEY}/${encodedUrl}?${queryParams}`
    );

    const data = res.data;

    if (!data.success) {
      return { success: false, message: "IPQS API failed", raw: data };
    }

    const isMalicious =
      data.phishing === true ||
      data.malware === true ||
      data.risk_score > 85 ||
      data.suspicious === true;

    return {
      success: true,
      url: data.url,
      domain: data.domain,
      riskScore: data.risk_score,
      suspicious: data.suspicious,
      phishing: data.phishing,
      malware: data.malware,
      parking: data.parking,
      unsafe: isMalicious,
      raw: data,
    };
  } catch (err) {
    console.error("IPQS error:", err.message);
    return { success: false, error: err.message };
  }
}
