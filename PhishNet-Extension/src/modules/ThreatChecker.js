import KEYS from "../config/keys.js";

const SUSPICIOUS_TLDS = [
  "tk", "ml", "ga", "cf", "gq", "top", "xyz", "club", "work",
  "click", "download", "review", "bid", "win", "men", "loan",
  "date", "racing", "accountant", "science", "gdn", "mom", "lol", "kim", "c0m",
];

const BRANDS = [
  "google", "gmail", "facebook", "meta", "instagram", "whatsapp",
  "twitter", "linkedin", "microsoft", "outlook", "office", "hotmail",
  "apple", "icloud", "amazon", "paypal", "ebay", "netflix", "spotify",
  "twitch", "discord", "reddit", "tiktok", "snapchat", "telegram",
  "adobe", "salesforce", "dropbox", "zoom", "chase", "bankofamerica",
  "wellsfargo", "citibank", "capitalone", "americanexpress", "discover",
  "coinbase", "binance", "metamask", "crypto", "blockchain",
  "godaddy", "cloudflare", "github", "shopify", "docusign", "protonmail",
  "steam", "epicgames", "xbox", "playstation", "nintendo",
  "hulu", "disneyplus", "hbomax", "netflix", "airbnb", "uber", "lyft",
  "walmart", "target", "bestbuy", "costco", "homedepot", "samsung",
  "dell", "hp", "lenovo", "cisco", "ibm", "oracle", "intuit",
  "canva", "figma", "slack", "trello", "asana", "notion",
  "verizon", "att", "tmobile", "fedex", "ups", "usps",
  "yahoo", "aol", "btinternet", "sky", "virginmedia",
  "orange", "sfr", "free", "vodafone", "telefonica",
  "web", "gmx", "t-online", "freenet", "seznam", "wp", "interia", "onet",

  "safaricom", "mpesa", "equity", "kcb", "ncba",
  "cooperative", "dtb", "absa", "stanbic", "ecitizen",
  "kra", "jumia", "copia", "airtel", "telkom",
  "helb", "nssf", "nhif", "pesalink", "familybank",
  "iandm", "diamondtrust", "postbank", "coopbank",
];

const WHITELIST = [
  "safaricom.com", "safaricom.co.ke",
  "mpesa.co.ke",
  "equitybank.co.ke", "equitybank.com", "equitygroup.com",
  "kcb.co.ke", "kcbgroup.com",
  "co-opbank.co.ke", "coopbank.co.ke",
  "absa.co.ke", "absabank.co.ke",
  "stanbic.co.ke",
  "ecitizen.go.ke",
  "kra.go.ke",
  "helb.co.ke",
  "nssf.or.ke", "nhif.or.ke",
  "telkom.co.ke",
  "airtel.co.ke",
  "jumia.co.ke", "jumia.com",
  "kilimall.co.ke",
  "copia.co.ke", "copiaglobal.com",
];

class ThreatChecker {
  constructor() {
    this.cache = new Map();
    this.blocklist = new Set();
    this.loadBlocklist();
  }

  loadBlocklist() {
    try {
      chrome.storage.local.get(["phishnetBlocklist"], (result) => {
        if (result.phishnetBlocklist) {
          this.blocklist = new Set(result.phishnetBlocklist);
        }
      });
    } catch {}
  }

  async check(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    // Fast blocklist check
    let domain;
    try { domain = new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch {}
    if (domain && this.blocklist.has(domain)) {
      const result = { isThreat: true, source: "PhishNet Blocklist", riskScore: 100, threatType: "BLOCKLISTED", riskLevel: "high" };
      this.cache.set(url, result);
      return result;
    }

    // Local heuristic — fast, no network
    const local = this.localHeuristicCheck(url);
    if (local.isThreat) {
      this.cache.set(url, local);
      return local;
    }

    // Remote check — fall back to local if backend unreachable
    try {
      const remote = await this.checkPhishNetAPI(url);
      if (remote) {
        this.cache.set(url, remote);
        return remote;
      }
    } catch {}

    // Backend unreachable — use local result as-is
    this.cache.set(url, local);
    return local;
  }

  localHeuristicCheck(url) {
    let score = 0;
    const signals = [];
    let domain;

    try {
      domain = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return { isThreat: false, source: "local", riskScore: 0 };
    }

    const tld = domain.split(".").pop();
    if (SUSPICIOUS_TLDS.includes(tld)) {
      score += 10;
      signals.push(`Suspicious TLD: .${tld}`);
    }

    const mainPart = domain.split(".").slice(0, -1).join(".");
    if (mainPart) {
      // Entropy checks
      const digits = (mainPart.match(/[0-9]/g) || []).length;
      const hyphens = (mainPart.match(/-/g) || []).length;
      const digitRatio = digits / mainPart.length;
      const hyphenRatio = hyphens / mainPart.length;
      if (digitRatio > 0.5) score += 8;
      else if (digitRatio > 0.3) score += 6;
      else if (digitRatio > 0.15) score += 4;
      if (hyphenRatio > 0.2) { score += 8; signals.push("Excessive hyphens in domain"); }

      // Whitelist check: skip brand match for exact known-clean domains (not subdomains)
      const isWhitelisted = WHITELIST.includes(domain) || WHITELIST.includes(domain.replace(/^www\./, ""));

      if (!isWhitelisted) {
        // Leet normalization
        const leetMap = { "0":"o", "1":"l", "3":"e", "4":"a", "5":"s", "7":"t", "8":"b", "@":"a", "$":"s" };
        const normalized = mainPart.replace(/[0134578@$]/g, (c) => leetMap[c] || c);

        for (const brand of BRANDS) {
          if (mainPart === brand || normalized === brand) break; // exact match = safe
          if (mainPart.includes(brand) || normalized.includes(brand)) {
            score += 30;
            signals.push(`Brand impersonation: ${brand}`);
            break;
          }
          // Fuzzy fallback for leet domains like faceb00k
          let matches = 0;
          for (let i = 0; i < brand.length; i++) {
            if ((mainPart[i] && mainPart[i] === brand[i]) || (normalized[i] && normalized[i] === brand[i])) matches++;
          }
          if (matches / brand.length >= 0.75) {
            score += 30;
            signals.push(`Brand impersonation: ${brand}`);
            break;
          }
        }

        // Brand-in-subdomain detection: brand in hostname but not in root domain
        const rootDomain = hostParts.slice(-2).join(".");
        for (const brand of BRANDS) {
          if (domain.includes(brand) && !rootDomain.includes(brand)) {
            score += 15;
            signals.push(`Brand in subdomain: ${brand}`);
            break;
          }
        }
      }
    }

    try {
      const parsed = new URL(url);
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(parsed.hostname)) { score += 15; signals.push("IP address in URL"); }
      if (url.includes("@")) { score += 15; signals.push("URL contains @ symbol"); }
    } catch {}

    // Combined-signal bonus: brand impresonation + suspicious TLD = definitely phishing
    if (signals.some((s) => s.startsWith("Brand")) && signals.some((s) => s.startsWith("Suspicious TLD"))) {
      score += 10;
    }

    const isThreat = score >= 40;
    return {
      isThreat,
      source: "local_heuristic",
      riskScore: Math.min(score, 100),
      signals,
      riskLevel: score >= 70 ? "high" : score >= 40 ? "medium" : "low",
    };
  }

  async checkPhishNetAPI(url) {
    const res = await fetch(KEYS.PHISHNET_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const result = {
      isThreat: data.isThreat || false,
      riskScore: data.riskScore || 0,
      riskLevel: data.riskLevel || "safe",
      threatType: data.sources?.[0]?.threatType || null,
      source: data.sources?.map((s) => s.name).join(", ") || "PhishNet API",
      signals: data.signals || [],
      scamBuster: data.scamBuster || null,
    };
    if (data.isThreat || data.riskScore >= 40) {
      result.isThreat = true;
    }
    return result;
  }
}

export default ThreatChecker;
