import { runScraper } from "../services/Scrapper.js";
import { runGistScanner } from "../services/gitScanner.js";

export const checkLeak = async (req, res) => {
  const input = req.body;
  let leaks = await runScraper(input);

  if (leaks.length === 0) {
    leaks = await runGistScanner(input);
  }

  const msg = leaks.length ? "Leaks found" : "No leaks found";
  res.status(200).json({ msg, leaks });
};
