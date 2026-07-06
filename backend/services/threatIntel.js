import axios from "axios";
import { partial_ratio } from "fuzzball";
import net from "node:net";
import sslChecker from "ssl-checker";
import { extractDomain } from "../utils/extractDomain.js";
import * as cache from "./cache.js";
import * as scamBuster from "./scamBuster.js";

const brands = [];
const whitelist = new Set();
const signalStore = new Map();
const blocklist = new Set();
let blocklistVersion = 0;

// VT rate limiter — 4 req/min max = 1 per 15s
let lastVTCall = 0;
function canCallVT() {
  return Date.now() - lastVTCall >= 15000;
}
const SUSPICIOUS_TLDS = new Set([
  "tk", "ml", "ga", "cf", "gq", "top", "xyz", "club", "work",
  "click", "download", "review", "bid", "win", "men", "loan",
  "date", "racing", "accountant", "science", "gdn", "mom",
  "lol", "kim", "c0m", "/", "wang", "在线", "网红",
]);

const HEURISTIC_WEIGHTS = {
  brandSimilarity: 30,
  domainAge: 25,
  domainEntropy: 15,
  tldReputation: 10,
  urlStructure: 10,
  sslValidity: 10,
  total: 100,
};

async function loadBrands() {
  if (brands.length > 0) return;
  try {
    const { default: list } = await import("../data/brands.json", {
      with: { type: "json" },
    });
    brands.push(...list.map((b) => b.replace(/^www\./, "").toLowerCase()));
  } catch {
    brands.push("google.com", "facebook.com", "paypal.com", "microsoft.com", "amazon.com");
  }
}

async function loadWhitelist() {
  if (whitelist.size > 0) return;
  try {
    const { default: list } = await import("../data/whitelist.json", {
      with: { type: "json" },
    });
    for (const entry of list) {
      whitelist.add(entry.replace(/^www\./, "").toLowerCase());
    }
  } catch {}
}

function computeEntropy(domain) {
  const main = domain.split(".").slice(0, -1).join(".");
  if (!main || main.length < 4) return 0;
  const letters = (main.match(/[a-z]/g) || []).length;
  const digits = (main.match(/[0-9]/g) || []).length;
  const hyphens = (main.match(/-/g) || []).length;
  const ratio = digits / main.length;
  const hyphenRatio = hyphens / main.length;
  let score = 0;
  if (ratio > 0.5) score += 10;
  else if (ratio > 0.3) score += 6;
  else if (ratio > 0.15) score += 4;
  if (hyphenRatio > 0.3) score += 5;
  else if (hyphenRatio > 0.1) score += 3;
  if (main.length > 20) score += 3;
  return Math.min(score, 15);
}

function checkTLR(domain) {
  const parts = domain.split(".");
  const tld = parts[parts.length - 1];
  return SUSPICIOUS_TLDS.has(tld) ? 10 : 0;
}

function checkURLStructure(url) {
  let score = 0;
  try {
    const parsed = new URL(url);
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(parsed.hostname)) score += 15;
    if (url.includes("@")) score += 15;
    const subdomainCount = parsed.hostname.split(".").length - 2;
    if (subdomainCount > 4) score += 5;
    const path = parsed.pathname + parsed.search;
    if (/[0-9a-f]{16,}/i.test(path)) score += 5;
  } catch {
    score += 5;
  }
  return Math.min(score, 20);
}

async function checkBrandSimilarity(domain) {
  await loadBrands();
  await loadWhitelist();
  const main = domain.split(".").slice(0, -1).join(".");
  if (!main) return { score: 0, matched: null, isLeet: false, isSuspiciousSubdomain: false };

  // Whitelist check: skip brand match for exact known-clean domains (not subdomains)
  if (whitelist.has(domain) || whitelist.has(domain.replace(/^www\./, ""))) {
    return { score: 0, matched: null, isLeet: false, isSuspiciousSubdomain: false };
  }

  // Decode punycode for IDN homograph detection
  let decoded = main;
  try {
    if (main.startsWith("xn--")) {
      decoded = new URL(`http://${domain}`).hostname.replace(/^www\./, "");
      decoded = decoded.split(".").slice(0, -1).join(".");
    }
  } catch {}

  const leetMap = { "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s" };
  const normalized = decoded.replace(/[0134578@$]/g, (c) => leetMap[c] || c);

  let bestScore = 0;
  let bestBrand = null;
  let isLeet = false;
  let isSuspiciousSubdomain = false;
  for (const brand of brands) {
    const brandMain = brand.split(".")[0];

    // Check original + leet-normalized for substring match
    const matchStr = decoded.includes(brandMain) ? decoded : (normalized.includes(brandMain) ? normalized : null);
    if (matchStr) {
      if (decoded === brandMain || domain === brand) continue;
      // Don't skip subdomains that look suspicious (hyphens, digits, or very long)
      if (domain.endsWith("." + brand)) {
        const subPart = domain.slice(0, domain.indexOf("." + brand));
        if (!subPart.includes("-") && !/\d/.test(subPart) && subPart.length < 20) continue;
        isSuspiciousSubdomain = true;
      }
      const ratio = brandMain.length / matchStr.length;
      if (ratio > 0.3 && ratio < 0.95) {
        const score = Math.min(ratio * 35, 30);
        if (score > bestScore) { bestScore = score; bestBrand = brand + (matchStr === normalized ? " (leet)" : ""); }
      }
    }

    const fuzzy = partial_ratio(decoded, brandMain);
    if (fuzzy > 75) {
      const score = Math.min((fuzzy / 100) * 35, 30);
      if (score > bestScore) { bestScore = score; bestBrand = brand; isLeet = false; }
    }

    if (normalized !== decoded) {
      const normFuzzy = partial_ratio(normalized, brandMain);
      if (normFuzzy > 75 && normFuzzy > fuzzy) {
        const score = Math.min((normFuzzy / 100) * 35, 30);
        if (score > bestScore) { bestScore = score; bestBrand = brand + " (leet)"; isLeet = true; }
      }
    }
  }
  return { score: Math.round(bestScore), matched: bestBrand, isLeet, isSuspiciousSubdomain };
}

function whoisQuery(server, query, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let buf = Buffer.alloc(0);
    let done = false;
    const finish = (err, result) => {
      if (done) return;
      done = true;
      socket.removeAllListeners();
      socket.destroy();
      if (err) reject(err);
      else resolve(result);
    };
    socket.setTimeout(timeout);
    socket.connect(43, server);
    socket.on("connect", () => socket.write(query + "\r\n"));
    socket.on("data", (c) => { buf = Buffer.concat([buf, c]); });
    socket.on("end", () => finish(null, buf.toString()));
    socket.on("timeout", () => finish(new Error("timeout")));
    socket.on("error", (e) => finish(e));
  });
}

function extractWhoisDate(raw) {
  const patterns = [
    /creation\s*date:\s*(.+)/im,
    /created(?:on)?:\s*(.+)/im,
    /created:\s*(.+)/im,
    /domain\s*date:\s*(.+)/im,
    /registration\s*date:\s*(.+)/im,
  ];
  for (const p of patterns) {
    const m = raw.match(p);
    if (m) {
      const cleaned = m[1].trim().replace(/\s*\(.*?\)\s*$/, "").trim();
      const d = new Date(cleaned);
      if (!isNaN(d.getTime()) && d.getFullYear() > 1990) return d.toISOString();
    }
  }
  return null;
}

async function getWhoisServer(tld) {
  try {
    const raw = await whoisQuery("whois.iana.org", tld);
    const m = raw.match(/whois:\s*(\S+)/im);
    return m ? m[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

async function queryWhoisCreationDate(domain) {
  try {
    const tld = domain.split(".").pop();
    const server = await getWhoisServer(tld);
    if (!server) return null;
    const raw = await whoisQuery(server, domain);
    return extractWhoisDate(raw);
  } catch {
    return null;
  }
}

async function heuristicScore(url) {
  const domain = extractDomain(url);
  const results = { brand: null, ageDays: null, sslValid: false };
  const signals = [];

  const [brandResult, tldScore, entropyScore, structScore] = await Promise.all([
    checkBrandSimilarity(domain),
    checkTLR(domain),
    computeEntropy(domain),
    checkURLStructure(url),
  ]);

  let total = 0;
  let matchedBrandIsLeet = false;
  let matchedBrandSuspiciousSub = false;

  if (brandResult.score > 0) {
    total += brandResult.score;
    signals.push(`Brand similarity: ${brandResult.matched} (${brandResult.score}pts)`);
    results.brand = brandResult.matched;
    matchedBrandIsLeet = brandResult.isLeet;
    matchedBrandSuspiciousSub = brandResult.isSuspiciousSubdomain;

    // Leet-speak bonus: extra 10pts when brand matched via leet normalization
    if (matchedBrandIsLeet) {
      total += 10;
      signals.push("Leet-speak brand impersonation (10pts)");
    }

    // Suspicious subdomain bonus: extra 10pts when brand matched via subdomain with hyphens/digits
    if (matchedBrandSuspiciousSub) {
      total += 10;
      signals.push("Suspicious brand subdomain prefix (10pts)");
    }
  }

  total += tldScore;
  if (tldScore > 0) signals.push(`Suspicious TLD (${tldScore}pts)`);

  total += entropyScore;
  if (entropyScore > 0) signals.push(`Suspicious domain pattern (${entropyScore}pts)`);

  total += structScore;
  if (structScore > 0) signals.push(`Suspicious URL structure (${structScore}pts)`);

  let creationDate;
  try {
    creationDate = await queryWhoisCreationDate(domain);
  } catch {}
  if (creationDate) {
    const ageDays = (Date.now() - new Date(creationDate).getTime()) / 86400000;
    results.ageDays = Math.round(ageDays);
    let ageScore = 0;
    if (ageDays < 7) ageScore = 25;
    else if (ageDays < 30) ageScore = 15;
    else if (ageDays < 90) ageScore = 10;
    else if (ageDays < 365) ageScore = 5;
    total += ageScore;
    if (ageScore > 0) signals.push(`Domain age: ${ageDays.toFixed(0)} days (${ageScore}pts)`);
  }

  let sslData;
  try {
    sslData = await Promise.race([
      sslChecker(domain, { method: "GET" }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("ssl timeout")), 5000)),
    ]);
    results.sslValid = sslData.valid;
  } catch {}
  if (!results.sslValid) {
    total += 20;
    signals.push("Invalid/missing SSL (20pts)");
  }

  // Brand-in-subdomain detection: brand name appears in hostname but not in root domain
  const kenyanBrandNames = [
    "safaricom", "mpesa", "equity", "kcb", "ncba",
    "cooperative", "dtb", "absa", "stanbic", "ecitizen",
    "kra", "jumia", "copia", "airtel", "telkom",
    "helb", "nssf", "nhif", "pesalink", "familybank",
    "iandm", "diamondtrust", "postbank", "coopbank",
  ];
  const hostParts = domain.split(".");
  const rootDomain = hostParts.slice(-2).join(".");
  for (const brand of kenyanBrandNames) {
    if (domain.includes(brand) && !rootDomain.includes(brand)) {
      total += 15;
      signals.push(`Brand in subdomain: ${brand} (15pts)`);
      break;
    }
  }

  // Combined-signal bonus: brand + suspicious TLD = strong phishing indicator
  if (signals.some((s) => s.startsWith("Brand")) && signals.some((s) => s.startsWith("Suspicious TLD"))) {
    total += 10;
    signals.push("Brand + suspicious TLD combo (10pts)");
  }

  return { total: Math.min(total, 100), signals, heuristic: results };
}

async function checkGSB(url) {
  const key = process.env.GSB_API_KEY;
  if (!key) return null;
  try {
    const { data } = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`,
      {
        client: { clientId: "phishnet-exchange", clientVersion: "1.0.0" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      }
    );
    if (data.matches?.length > 0) {
      return { isThreat: true, source: "Google Safe Browsing", threatType: data.matches[0].threatType };
    }
    return { isThreat: false, source: "Google Safe Browsing" };
  } catch {
    return null;
  }
}

async function checkVirusTotal(url) {
  const key = process.env.VIRUSTOTAL_API_KEY;
  if (!key || !canCallVT()) return null;
  lastVTCall = Date.now();
  try {
    const encodedUrl = Buffer.from(url).toString("base64").replace(/=+$/, "");
    const { data } = await axios.get(
      `https://www.virustotal.com/api/v3/urls/${encodedUrl}`,
      { headers: { "x-apikey": key } }
    );
    const stats = data.data.attributes.last_analysis_stats;
    const malicious = stats.malicious + stats.suspicious;
    const total = malicious + stats.harmless + stats.undetected;
    return {
      isThreat: malicious > 0,
      source: "VirusTotal",
      maliciousCount: malicious,
      totalScanners: total,
      threatType: malicious > 0 ? "MALWARE" : null,
    };
  } catch {
    return null;
  }
}

async function checkPhishDestroy(domain) {
  try {
    const { data } = await axios.get(
      `https://api.destroy.tools/v1/domain/${encodeURIComponent(domain)}`,
      { timeout: 5000 }
    );
    if (data?.risk_score !== undefined && data.risk_score >= 70) {
      return { isThreat: true, source: "PhishDestroy", riskScore: data.risk_score, threatType: "PHISHING" };
    }
    if (data?.detected === true) {
      return { isThreat: true, source: "PhishDestroy", threatType: "PHISHING" };
    }
    return { isThreat: false, source: "PhishDestroy", riskScore: data?.risk_score || 0 };
  } catch (err) {
    if (err.response?.status === 404) {
      return { isThreat: false, source: "PhishDestroy", notFound: true };
    }
    return null;
  }
}

async function checkURLhaus(url) {
  try {
    const { data } = await axios.post(
      "https://urlhaus-api.abuse.ch/v1/url/",
      new URLSearchParams({ url }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 5000 }
    );
    if (data.query_status === "ok") {
      return { isThreat: true, source: "URLhaus", threatType: data.threat || "MALWARE" };
    }
    return { isThreat: false, source: "URLhaus" };
  } catch {
    return null;
  }
}

async function checkPhishTank(url) {
  try {
    const { data } = await axios.post(
      "https://checkurl.phishtank.com/checkurl/",
      new URLSearchParams({ url, format: "json" }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "phishtank/phishnet-exchange",
        },
        timeout: 5000,
      }
    );
    if (data.phish_id && data.in_database && data.verified) {
      return { isThreat: true, source: "PhishTank", threatType: "PHISHING" };
    }
    return { isThreat: false, source: "PhishTank" };
  } catch {
    return null;
  }
}

async function checkScamBuster(domain) {
  await scamBuster.scrapeReports();
  const result = scamBuster.checkDomain(domain);
  if (result.found) {
    return {
      isThreat: result.matchType !== "description",
      source: "ScamBuster.co.ke",
      scamBusterMatch: result.report.identifier,
      scamBusterMatchType: result.matchType,
      scamBusterType: result.report.scam_type,
      scamBusterAmount: result.report.amount_lost,
      scamBusterDate: result.report.created_at,
      threatType: "REPORTED_SCAM",
    };
  }
  return null;
}

// Scrape ScamBuster on first load
scamBuster.scrapeReports().catch(() => {});

export async function analyzeURL(url) {
  const cacheKey = `analyze:${url}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const domain = extractDomain(url);
  const heuristic = await heuristicScore(url);
  const verdict = { url, domain, riskScore: heuristic.total, riskLevel: "low", sources: [], signals: heuristic.signals, isThreat: false, heuristicDetails: heuristic.heuristic };

  if (heuristic.total >= 70) {
    verdict.isThreat = true;
    verdict.riskLevel = "high";
    verdict.sources.push({ name: "Heuristic Engine", isThreat: true, score: heuristic.total });
  } else if (heuristic.total >= 50) {
    verdict.riskLevel = "medium";
    verdict.isThreat = false;
    verdict.sources.push({ name: "Heuristic Engine", isThreat: false, score: heuristic.total });
  } else {
    verdict.sources.push({ name: "Heuristic Engine", isThreat: false, score: heuristic.total });
  }

  const apiCalls = [
    checkGSB(url).catch(() => null),
    checkPhishDestroy(domain).catch(() => null),
    checkURLhaus(url).catch(() => null),
    checkPhishTank(url).catch(() => null),
    checkScamBuster(domain).catch(() => null),
  ];
  // Only call VT if heuristic is ambigous (30-69) to save quota
  if (heuristic.total >= 30 && heuristic.total < 70) {
    apiCalls.push(checkVirusTotal(url).catch(() => null));
  }

  const apiResults = await Promise.allSettled(apiCalls);

  let maxRiskFromAPIs = 0;
  for (const result of apiResults) {
    const apiResult = result.status === "fulfilled" ? result.value : null;
    if (!apiResult) continue;
    verdict.sources.push({ name: apiResult.source, isThreat: apiResult.isThreat, threatType: apiResult.threatType });
    if (apiResult.isThreat) {
      verdict.isThreat = true;
      maxRiskFromAPIs = Math.max(maxRiskFromAPIs, 80);
    }
    // ScamBuster match adds significant risk boost + context
    if (apiResult?.scamBusterMatch) {
      verdict.scamBuster = {
        matched: apiResult.scamBusterMatch,
        type: apiResult.scamBusterType,
        amountLost: apiResult.scamBusterAmount,
        date: apiResult.scamBusterDate,
      };
      // Domain matches a reported scam company → moderate signal
      if (apiResult.scamBusterMatchType !== "description") {
        verdict.riskScore += 30;
        verdict.signals.push(`ScamBuster.co.ke: "${apiResult.scamBusterMatch}" reported for ${apiResult.scamBusterType || "scam"} (30pts)`);
      }
    }
  }

  if (maxRiskFromAPIs > 0) {
    verdict.riskScore = Math.max(verdict.riskScore, maxRiskFromAPIs);
  }
  if (verdict.riskScore >= 70) { verdict.riskLevel = "high"; verdict.isThreat = true; }
  else if (verdict.riskScore >= 50) { verdict.riskLevel = "medium"; verdict.isThreat = true; }
  else if (verdict.riskScore >= 30) verdict.riskLevel = "low";
  else verdict.riskLevel = "safe";

  if (verdict.isThreat || verdict.riskScore >= 50) {
    blocklist.add(domain);
    blocklistVersion++;
  }

  const ttl = verdict.isThreat ? 3600000 : 600000;
  cache.set(cacheKey, verdict, ttl);
  return verdict;
}

// --- Signal Correlation Engine ---

const SIGNAL_THRESHOLD = 3; // 3+ unique sensors = confirmed
const SIGNAL_WINDOW = 600000; // 10 min window

export function reportSignal(url, signal) {
  const domain = extractDomain(url);
  if (!domain) return;
  if (!signalStore.has(domain)) {
    signalStore.set(domain, { sensors: new Set(), firstSeen: Date.now(), signals: [] });
  }
  const entry = signalStore.get(domain);
  entry.sensors.add(signal.source || "unknown");
  entry.signals.push({ ...signal, timestamp: Date.now() });

  // Clean old entries
  const cutoff = Date.now() - SIGNAL_WINDOW;
  entry.signals = entry.signals.filter((s) => s.timestamp > cutoff);

  return {
    domain,
    uniqueSensors: entry.sensors.size,
    totalSignals: entry.signals.length,
    escalated: entry.sensors.size >= SIGNAL_THRESHOLD,
  };
}

export function getBlocklist() {
  return { version: blocklistVersion, domains: [...blocklist] };
}

export function getSignalStats() {
  const stats = [];
  for (const [domain, entry] of signalStore) {
    if (entry.sensors.size >= SIGNAL_THRESHOLD) {
      stats.push({
        domain,
        uniqueSensors: entry.sensors.size,
        totalSignals: entry.signals.length,
        firstSeen: new Date(entry.firstSeen).toISOString(),
      });
    }
  }
  return stats;
}
