import { analyzeURL, reportSignal, getBlocklist, getSignalStats } from "../services/threatIntel.js";
import * as scamBuster from "../services/scamBuster.js";

export async function analyzeRisk(req, res) {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    const result = await analyzeURL(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function reportURL(req, res) {
  const { url, source, riskScore, signals } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    const result = reportSignal(url, { source, riskScore, signals });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function fetchBlocklist(req, res) {
  try {
    res.json(getBlocklist());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function fetchSignalStats(req, res) {
  try {
    res.json(getSignalStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function fetchScamBusterReports(req, res) {
  try {
    const reports = await scamBuster.scrapeReports();
    res.json({ total: reports.length, reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
