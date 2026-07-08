# PhishNet Exchange — Strategic Vision & Architecture

## Core Differentiator

PhishNet Exchange is a **decentralized phishing defense mesh** where every extension
user is a sensor, every detection instantly protects everyone, and confirmed threats
get automatically taken down.

No other platform combines browser protection + crowd-sourced sensors + zero-day
detection + automated takedowns in a single free/open platform.

## The Gap

| Platform | Browser Ext. | Crowd Sensors | Zero-Day CT | Auto Takedown | Free |
|----------|-------------|---------------|-------------|---------------|------|
| PhishNet Exchange | ✅ | ✅ | ✅ | ✅ | ✅ |
| PhishDestroy | ❌ | ❌ | ✅ | ✅ | ✅ |
| CrowdSec | ❌ | ✅ (IP only) | ❌ | ❌ | ✅ |
| IRONSCALES | ❌ | ✅ | ❌ | ❌ | ❌ |
| Nehboro | ✅ | ❌ | ❌ | ❌ | ✅ |
| VirusTotal | ❌ | ❌ | ❌ | ❌ | ❌ |
| Google Safe Browsing | ❌ | ❌ | ❌ | ❌ | ✅ |

## Architecture

```
┌──────────────────────────────┐
│     Browser Extension (Sensor)│
│  ├── On-device heuristics     │
│  ├── Local threat cache       │
│  ├── Signal reporter          │
│  └── Block/Warn UI            │
└──────────┬───────────────────┘
           │ webNavigation / API calls
           ▼
┌──────────────────────────────┐
│     PhishNet Backend API      │
├──────────────────────────────┤
│  URL Analysis Pipeline        │
│  ├── In-memory cache          │
│  ├── Heuristic Engine         │
│  ├── GSB + VirusTotal         │
│  ├── PhishTank + PhishDestroy │
│  ├── URLhaus + abuse.ch       │
│  └── Local threat DB          │
│                               │
│  Signal Correlation Engine    │
│  ├── Cross-user aggregator    │
│  ├── Campaign mapper          │
│  └── Threat escalator         │
│                               │
│  CT Log Monitor (certstream)  │
│  ├── Brand matcher            │
│  └── Pre-emptive blocklist    │
│                               │
│  Takedown Pipeline            │
│  ├── Evidence packager        │
│  ├── Abuse reporter           │
│  └── Status tracker           │
│                               │
│  Breach Monitor               │
│  ├── HIBP k-anonymity         │
│  ├── LeakRadar/Leak-Lookup    │
│  └── Telegram channel monitor │
└──────────────────────────────┘
```

## Detection Layers (Stacked Scoring)

| Layer | Check | Weight |
|-------|-------|--------|
| 1 | Domain age (< 7 days) | 25 |
| 2 | Brand similarity (1000 brands, fuzzy match) | 30 |
| 3 | Domain entropy (random chars, subdomain abuse) | 15 |
| 4 | Suspicious TLD (.tk, .ml, .top, .xyz) | 10 |
| 5 | URL structure (@, IP in host, encoding abuse) | 10 |
| 6 | Login form detection on page | 20 |
| 7 | Redirect chain / cloaking analysis | 15 |
| 8 | Community sensor signal correlation | 25 |

**Score > 50: warn, > 70: block, > 90: auto-submit for takedown**

## Extension Sensor Network Flow

```
User visits unknown URL
    → Extension runs on-device heuristics (< 100ms, no network)
        → Brand impersonation check
        → Domain entropy/age analysis
        → Login form detection
    → If suspicious → send anonymized signal to backend
        → Backend correlates across users
        → If 3+ users from different IPs hit same suspicious domain
            → Auto-elevate to confirmed threat
            → Push block rule to ALL extensions instantly
```

## Automated Takedown Pipeline

```
1. Screenshot capture (Playwright)
2. Evidence package (WHOIS, DNS, SSL, redirect chain, HTML)
3. Auto-submit to:
    → Google Safe Browsing
    → Microsoft SmartScreen
    → PhishTank
    → Registrar abuse contact
    → Hosting provider abuse contact
4. Track status, re-check after 48h, escalate if still live
```

## CT Log Zero-Day Detection

```
Stream Certificate Transparency logs (certstream)
    → Brand similarity check on new domains
    → WHOIS cross-ref (age, registrar)
    → Pre-emptive watch list to all extensions
    → Block on first user encounter
```

## Revenue Model

| Feature | Target |
|---------|--------|
| Phishing simulations for teams | KnowBe4 competitor ($15/user/yr vs $30) |
| Team advanced analytics | SMB/Enterprise SOC |
| Priority API access | Developers/Integrators |
| Brand monitoring | Enterprise brand protection |

## Implementation Phases

### Phase 1 (Current)
- Wire up GSB + VirusTotal + PhishDestroy feeds
- Build heuristic engine (brand similarity, domain entropy, TLD rep)
- In-memory caching
- Extension calls backend API (keys stay server-side)

### Phase 2
- Extension sensor network (anonymized signal reporting)
- Signal correlation engine
- Real-time blocklist push to extensions

### Phase 3
- CT log monitoring (certstream)
- Automated takedown pipeline
- Campaign tracking dashboard
- Enhanced breach checking

### Phase 4
- Phishing simulation module
- Gamification (reputation, leaderboards)
- Open API for third-party developers
- WebSocket for instant extension updates
