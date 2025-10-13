import whois from "whois-node-json";
import sslChecker from "ssl-checker";
import stringSimilarity from "string-similarity";
import { extractDomain } from "./extractDomain.js";

const legitSites = [
  "google.com",
  "facebook.com",
  "twitter.com",
  "microsoft.com",
  "paypal.com",
  "amazon.com",
  "linkedin.com",
];

export async function analyzeRisk(url) {
  const domain = extractDomain(url);
  let creationDate = null,
    sslValid = false,
    whoisData = null;

  try {
    whoisData = await whois(domain);
  } catch {}
  creationDate = whoisData?.createdDate || null;

  const domainAgeDays = creationDate
    ? (Date.now() - new Date(creationDate).getTime()) / (1000 * 3600 * 24)
    : null;

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
  let riskLevel = "low";
  const riskReasons = [];

  if (!sslValid) {
    riskLevel = "high";
    riskReasons.push("No valid SSL certificate");
  }

  if (domainAgeDays !== null && domainAgeDays < 30) {
    riskLevel = "high";
    riskReasons.push("Domain is very new (less than 30 days old)");
  }

  if (highestSimilarity.similarity > 0.7 && highestSimilarity.site !== domain) {
    riskLevel = "medium";
    riskReasons.push(`Similar to legit site: ${highestSimilarity.site}`);
  }

  return {
    domain,
    domainAgeDays: domainAgeDays ? domainAgeDays.toFixed(0) : "unknown",
    sslValid,
    highestSimilarity,
    riskLevel,
    riskReasons,
  };
}
