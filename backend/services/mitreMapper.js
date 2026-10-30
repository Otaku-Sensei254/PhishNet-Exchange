const SIGNAL_TO_TECHNIQUE = [
  {
    patterns: [/Brand similarity/i, /Leet-speak brand/i, /Brand in subdomain/i],
    techniqueId: "T1566.002",
    techniqueName: "Spearphishing Link",
    tactic: "Initial Access",
  },
  {
    patterns: [/PhishTank/i],
    techniqueId: "T1566.002",
    techniqueName: "Spearphishing Link",
    tactic: "Initial Access",
  },
  {
    patterns: [/Google Safe Browsing.*SOCIAL_ENGINEERING/i],
    techniqueId: "T1566",
    techniqueName: "Phishing",
    tactic: "Initial Access",
  },
  {
    patterns: [/Suspicious TLD/i],
    techniqueId: "T1583.001",
    techniqueName: "Acquire Infrastructure",
    tactic: "Resource Development",
  },
  {
    patterns: [/Domain age/i],
    techniqueId: "T1583.001",
    techniqueName: "Acquire Infrastructure",
    tactic: "Resource Development",
  },
  {
    patterns: [/URLhaus/i],
    techniqueId: "T1204",
    techniqueName: "User Execution",
    tactic: "Execution",
  },
  {
    patterns: [/Google Safe Browsing.*MALWARE/i],
    techniqueId: "T1204",
    techniqueName: "User Execution",
    tactic: "Execution",
  },
  {
    patterns: [/Invalid\/missing SSL/i],
    techniqueId: "T1573.001",
    techniqueName: "Symmetric Cryptography",
    tactic: "Command and Control",
  },
  {
    patterns: [/IP-based URL/i, /External Proxy/i],
    techniqueId: "T1090.002",
    techniqueName: "External Proxy",
    tactic: "Command and Control",
  },
  {
    patterns: [/ScamBuster/i],
    techniqueId: "T1566",
    techniqueName: "Phishing",
    tactic: "Initial Access",
  },
  {
    patterns: [/VirusTotal/i],
    techniqueId: "T1566",
    techniqueName: "Phishing",
    tactic: "Initial Access",
  },
  {
    patterns: [/Suspicious domain pattern/i],
    techniqueId: "T1566.002",
    techniqueName: "Spearphishing Link",
    tactic: "Initial Access",
  },
  {
    patterns: [/Suspicious URL structure/i],
    techniqueId: "T1566.002",
    techniqueName: "Spearphishing Link",
    tactic: "Initial Access",
  },
  {
    patterns: [/Brand \+ suspicious TLD combo/i],
    techniqueId: "T1566.002",
    techniqueName: "Spearphishing Link",
    tactic: "Initial Access",
  },
];

const SCORE_TO_TECHNIQUE = [
  { minScore: 70, techniqueId: "T1566", techniqueName: "Phishing", tactic: "Initial Access", label: "Confirmed Threat" },
  { minScore: 50, techniqueId: "T1566", techniqueName: "Phishing", tactic: "Initial Access", label: "Suspicious Activity" },
  { minScore: 30, techniqueId: "T1566", techniqueName: "Phishing", tactic: "Initial Access", label: "Anomalous Activity" },
];

export function mapSignalsToMitre(signals = [], sources = [], riskScore = 0) {
  const matched = new Map();

  const allText = [...signals, ...sources.map((s) => (typeof s === "string" ? s : s.name || ""))];

  for (const entry of SIGNAL_TO_TECHNIQUE) {
    const matchedSignal = allText.find((text) => entry.patterns.some((p) => p.test(text)));
    if (matchedSignal && !matched.has(entry.techniqueId)) {
      matched.set(entry.techniqueId, {
        techniqueId: entry.techniqueId,
        techniqueName: entry.techniqueName,
        tactic: entry.tactic,
        matchedOn: entry.patterns.find((p) => p.test(matchedSignal))?.source || matchedSignal,
      });
    }
  }

  if (matched.size === 0) {
    for (const entry of SCORE_TO_TECHNIQUE) {
      if (riskScore >= entry.minScore) {
        matched.set(entry.techniqueId, {
          techniqueId: entry.techniqueId,
          techniqueName: entry.techniqueName,
          tactic: entry.tactic,
          matchedOn: entry.label,
        });
        break;
      }
    }
  }

  return {
    techniques: [...matched.values()],
    tactics: [...new Set([...matched.values()].map((t) => t.tactic))],
  };
}
