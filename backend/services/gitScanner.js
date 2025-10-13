// services/gitScanner.js
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  userAgent: "PhishNetLeaker/1.0",
  // Optional: Add a GitHub token to increase rate limits
  // auth: process.env.GITHUB_TOKEN
});

const patterns = {
  email: /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g,
  phone: /(?:\+?\d{1,3})?[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  ip: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  nationalID: /\b\d{6,}\b/g,
};

const IGNORED_FILE_NAMES = [
  "README.md",
  "log.txt",
  "output.txt",
  "output_log.txt",
  "testdata.txt",
];

const scanContentForLeaks = (content, formData) => {
  const matched = [];

  // Exact string match
  for (const [key, value] of Object.entries(formData)) {
    if (value && content.includes(value)) {
      matched.push({ type: key, value });
    }
  }

  // Regex match (only if user's value is defined)
  for (const [type, regex] of Object.entries(patterns)) {
    if (formData[type]) {
      const found = content.match(regex);
      if (found?.includes(formData[type])) {
        matched.push({ type, value: formData[type] });
      }
    }
  }

  return matched;
};

export const runGistScanner = async (formData) => {
  const leaks = [];

  try {
    for (let page = 1; page <= 3; page++) {
      const { data: gists } = await octokit.request("GET /gists/public", {
        per_page: 100,
        page,
      });

      for (const gist of gists) {
        for (const file of Object.values(gist.files)) {
          const fileName = file.filename.toLowerCase();
          if (IGNORED_FILE_NAMES.includes(fileName)) continue;

          try {
            const { data: content } = await octokit.request(
              `GET ${file.raw_url}`,
              {
                headers: { accept: "application/vnd.github.v3.raw" },
              }
            );

            const matches = scanContentForLeaks(content, formData);
            if (matches.length > 0) {
              leaks.push({
                url: file.raw_url,
                matches,
                source: "gist",
              });
            }
          } catch (err) {
            console.warn(`Error fetching gist: ${file.raw_url}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("GitHub Gist scanning failed:", err.message);
  }

  return leaks;
};
