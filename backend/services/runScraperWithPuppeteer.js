import puppeteer from "puppeteer";
import { runScraper } from "./Scrapper.js";

export const runScraperWithPuppeteer = async (formData) => {
  const baseURL = "https://pastebin.com";
  const archiveURL = `${baseURL}/archive`;
  const leaks = [];

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(archiveURL, { waitUntil: "networkidle2" });

    const pasteLinks = [];
    $("table.maintable tr td:nth-child(1) a").each((i, el) => {
      const link = $(el).attr("href");
      if (link && /^\/[A-Za-z0-9]+$/.test(link)) {
        pasteLinks.push(`${baseURL}${link}`);
      }
    });

    const limitedLinks = pasteLinks.slice(0, 10);

    for (const url of limitedLinks) {
      try {
        const pasteId = url.split("/").pop();
        const rawUrl = `${baseURL}/raw/${pasteId}`;

        const rawPage = await browser.newPage();
        await rawPage.goto(rawUrl, { waitUntil: "domcontentloaded" });
        const content = await rawPage.evaluate(() => document.body.innerText);
        await rawPage.close();

        const matches = scanContentForLeaks(content, formData);
        if (matches.length > 0) {
          leaks.push({ url, matches });
        }
      } catch (err) {
        console.warn(`Failed to fetch: ${url}`);
      }
    }

    await browser.close();
    return leaks;
  } catch (err) {
    console.error("Puppeteer scraper failed:", err.message);
    return [];
  }
};
