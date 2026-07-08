import axios from "axios";
import * as cache from "./cache.js";

const BROWSE_URL = "https://scambuster.co.ke/browse";
const SCRAPE_INTERVAL = 6 * 60 * 60 * 1000;

let reports = [];
let lastScrape = 0;

function extractReportsFromHTML(html) {
  // Next.js embeds report data with escaped quotes: \"initialReports\":[
  const marker = '\\"initialReports\\":[';
  const start = html.indexOf(marker);
  if (start === -1) return [];

  const arrStart = start + marker.length - 1;
  if (html[arrStart] !== "[") return [];

  // Track bracket depth in the raw HTML, treating \" as string delimiters
  let inStr = false;
  let depth = 0;
  let i = arrStart;
  while (i < html.length) {
    const c = html[i];
    const next = html[i + 1];
    // \" toggles string state in the JS string context
    if (c === "\\" && next === '"') {
      inStr = !inStr;
      i += 2;
      continue;
    }
    if (!inStr) {
      if (c === "[") depth++;
      else if (c === "]") {
        depth--;
        if (depth === 0) break;
      }
    }
    i++;
  }

  const raw = html.slice(arrStart, i + 1);
  const clean = raw.replace(/\\"/g, '"').replace(/\\\\/g, "\\");

  // Find the first top-level array in the cleaned JSON
  depth = 0;
  let end = 0;
  for (let pos = 0; pos < clean.length; pos++) {
    const c = clean[pos];
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) { end = pos + 1; break; }
    }
  }
  if (!end) return [];

  try {
    return JSON.parse(clean.slice(0, end));
  } catch {
    return [];
  }
}

export async function scrapeReports() {
  if (Date.now() - lastScrape < SCRAPE_INTERVAL && reports.length > 0) return reports;

  try {
    const { data } = await axios.get(BROWSE_URL, {
      timeout: 15000,
      headers: { "User-Agent": "PhishNet-Exchange/1.0" },
    });
    const parsed = extractReportsFromHTML(data);
    if (parsed.length > 0) {
      reports = parsed;
      lastScrape = Date.now();
    }
  } catch (err) {
    console.error("[ScamBuster] scrape failed:", err.message);
  }
  return reports;
}

export function checkDomain(domain) {
  const lower = domain.toLowerCase();
  const domainMain = lower.replace(/^www\./, "").split(".")[0];
  const domainKeywords = domainMain.split(/[-_]/);

  for (const r of reports) {
    const name = r.identifier.toLowerCase();
    const desc = (r.description || "").toLowerCase();

    // Direct company name match
    if (r.identifier_type === "company") {
      if (lower.includes(name) || name.includes(domainMain)) {
        return { found: true, report: r, matchType: "company_name" };
      }
      // Keyword match in company name only (not description — too noisy)
      for (const kw of domainKeywords) {
        if (kw.length >= 4 && name.includes(kw)) {
          return { found: true, report: r, matchType: "keyword" };
        }
      }
    }

    // Domain explicitly mentioned in description (full domain or main part)
    if (desc.includes(lower) || desc.includes(domainMain + ".")) {
      return { found: true, report: r, matchType: "description" };
    }

    // Phone number in URL matches a phone report
    if (r.identifier_type === "phone" && lower.includes(r.identifier)) {
      return { found: true, report: r, matchType: "phone" };
    }
  }
  return { found: false };
}

export function checkText(text) {
  const lower = text.toLowerCase();
  for (const r of reports) {
    const name = r.identifier.toLowerCase();
    const desc = r.description?.toLowerCase() || "";
    if (lower.includes(name) || lower.includes(desc.slice(0, 30))) {
      return { found: true, report: r };
    }
  }
  return { found: false };
}

export function getReports() {
  return reports;
}
