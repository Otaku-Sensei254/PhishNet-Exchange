import axios from "axios";
import * as cheerio from "cheerio";
import * as fuzz from "fuzzball";

// Utility: detect patterns (email, phone, etc.)
const patterns = {
  email: /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g,
  phone: /(?:\+?\d{1,3})?[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  ip: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  nationalID: /\b\d{6,}\b/g,
};

export const scanContentForLeaks = (content, formData) => {
  const matched = [];

  // Match input values (fuzzy + exact)
  for (const [key, value] of Object.entries(formData)) {
    if (!value) continue;

    const fuzzyMatch = fuzz.partial_ratio(
      content.toLowerCase(),
      value.toLowerCase()
    );
    if (content.includes(value) || fuzzyMatch > 85) {
      matched.push({ type: key, value });
    }
  }

  // Match common leak patterns
  for (const [type, regex] of Object.entries(patterns)) {
    const found = content.match(regex);
    if (found && found.length > 0) {
      matched.push({ type, value: found });
    }
  }

  return matched;
};

export const runScraper = async (formData) => {
  try {
    const baseURL = "https://pastebin.com";
    const archiveURL = `${baseURL}/archive`;

    const { data: archiveHTML } = await axios.get(archiveURL);
    const $ = cheerio.load(archiveHTML);

    const pasteLinks = [];
    $("table.maintable tr td:nth-child(1) a").each((i, el) => {
      const link = $(el).attr("href");
      // Only allow valid paste IDs: /abc12345 (8-char alphanumeric)
      if (link && /^\/[A-Za-z0-9]{8}$/.test(link)) {
        pasteLinks.push(`${baseURL}${link}`);
      }
    });

    const limitedLinks = pasteLinks.slice(0, 10);
    const leaks = [];

    await Promise.all(
      limitedLinks.map(async (url) => {
        try {
          const pasteId = url.split("/").pop();
          if (!/^[A-Za-z0-9]{8}$/.test(pasteId)) return;

          const rawUrl = `${baseURL}/raw/${pasteId}`;
          const { data: content } = await axios.get(rawUrl);

          const matches = scanContentForLeaks(content, formData);
          if (matches.length > 0) {
            leaks.push({ url, matches });
          }
        } catch (err) {
          if (err.response?.status === 404) {
            console.warn(`404 Not Found: ${url}`);
          } else if (err.response?.status === 429) {
            console.warn(`Rate limited (429): ${url}`);
          } else {
            console.warn(`Failed to fetch: ${url} -`, err.message);
          }
        }
      })
    );

    return leaks;
  } catch (err) {
    console.error("Scraper failed:", err.message);
    return [];
  }
};
