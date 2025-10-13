import whois from "whois-node-json";
import sslChecker from "ssl-checker";
import stringSimilarity from "string-similarity";

import { extractDomain } from "../utils/extractDomain.js";
import { checkUrlWithIPQS } from "../utils/checkIPQS.js";

const legitSites = [
  "google.com",
  "facebook.com",
  "twitter.com",
  "microsoft.com",
  "paypal.com",
  "amazon.com",
  "linkedin.com",
];

export async function analyzeRisk(req, res) {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  const domain = extractDomain(url);
  let sslValid = false;
  let domainAgeDays = null;
  let whoisData = null;

  try {
    whoisData = await whois(domain);
  } catch {}

  const creationDate = whoisData?.createdDate || null;

  if (creationDate) {
    domainAgeDays =
      (Date.now() - new Date(creationDate).getTime()) / (1000 * 3600 * 24);
  }

  try {
    const sslData = await sslChecker(domain, { method: "GET" });
    sslValid = sslData.valid;
  } catch {}

  const similarityResults = legitSites
    .map((site) => ({
      site,
      similarity: stringSimilarity.compareTwoStrings(domain, site),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const highestSimilarity = similarityResults[0];

  // ✅ IPQS analysis
  const ipqs = await checkUrlWithIPQS(url);

  // 🧠 Risk logic
  const levels = { low: 1, medium: 2, high: 3 };
  let score = 1;
  const reasons = [];

  if (!sslValid) {
    reasons.push("No valid SSL certificate");
    score = Math.max(score, levels.high);
  }

  if (domainAgeDays !== null && domainAgeDays < 30) {
    reasons.push("Domain is very new (< 30 days)");
    score = Math.max(score, levels.high);
  }

  if (highestSimilarity.similarity > 0.7) {
    reasons.push(`Looks like: ${highestSimilarity.site}`);
    score = Math.max(score, levels.medium);
  }

  if (ipqs.unsafe) {
    reasons.push("IPQS flagged this URL");
    score = Math.max(score, levels.high);
  }

  const riskLevel = Object.keys(levels).find((key) => levels[key] === score);

  res.json({
    domain,
    domainAgeDays: domainAgeDays ? domainAgeDays.toFixed(0) : "unknown",
    sslValid,
    similarity: highestSimilarity,
    ipqs,
    riskLevel,
    riskReasons: reasons,
  });
}
