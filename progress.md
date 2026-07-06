# PhishNet Exchange — Progress Log

**Saved:** 2026-07-06

---

## Latest Session: Kenyan Market Heuristic Upgrade

### Files Changed

| File | Change |
|---|---|
| `backend/data/whitelist.json` | **New** — 51 known-clean Kenyan corporate domains (exact + www match only) |
| `backend/services/threatIntel.js` | Whitelist, brand-in-subdomain detection, SSL 20pts, ScamBuster 30pts flat + isThreat fix, WHOIS referral chain fix |
| `PhishNet-Extension/src/modules/ThreatChecker.js` | Added 23 Kenyan brand names, whitelist, brand-in-subdomain detection |

### Issues Fixed

1. **False positive on legitimate subdomains** — Whitelist now matches exact domain + www only, not parent-domain loop. `ke.kcbgroup.com` is no longer whitelisted when `kcbgroup.com` is.
2. **Brand-in-subdomain phishing** — New detection (+15pts) when brand name appears in hostname but not in the root domain (e.g. `mpesa.send.money.confirm.xyz`)
3. **SSL undervalued** — Missing/invalid SSL penalty raised from 10pts to 20pts
4. **ScamBuster too aggressive** — Boost reduced from 50/35pts split to flat 30pts
5. **ScamBuster shown as "Clean"** — `isThreat` was hardcoded `false` even on domain match. Now returns `true` for company/keyword/phone matches, so it appears as a real threat source.
6. **WHOIS showing TLD date instead of domain date** — Raw socket to `whois.iana.org` was parsing the TLD registry creation date (e.g. 15161 days). Now follows the IANA referral chain: IANA → authoritative server (e.g. KENIC for `.co.ke`) → domain WHOIS → parse creation date.

### Extension Beef-Up

- 23 Kenyan brand names added to `BRANDS` array in `ThreatChecker.js`
- Whitelist support (exact + www match)
- Brand-in-subdomain detection works offline in the extension

### Scoring Impact

| Domain | Before | After | Notes |
|---|---|---|---|
| `ke.kcbgroup.com` | 80pts (HIGH) | Flags correctly | Whitelist no longer protects subdomains |
| `kcb-secure-login.xyz` | ~40pts (medium) | ~55pts (medium) | Brand + subdomain + TLD + SSL |
| `mpesa.send.money.confirm.xyz` | ~20pts (low) | ~45pts (medium) | New brand-in-subdomain + TLD + SSL |

### Known Issues

- WHOIS queries add ~2-8s latency per scan. Consider caching domain age separately from scan results
- KENIC (.co.ke) WHOIS sometimes rate-limits after multiple queries
- Extension's fuzzy match for Kenyan brand names is character-by-character (no fuzzball) — good enough for leet but may miss some variants

---

### Files Changed

| File | Change |
|---|---|
| `backend/data/brands.json` | Added 48 Kenyan entities (NHIF, KRA, eCitizen, Safaricom, Equity, KCB, M-Pesa, etc.) |
| `backend/services/threatIntel.js` | Fixed subdomain skip, added leet bonus (+10pts), added suspicious subdomain bonus (+10pts) |
| `frontend/src/pages/Submit.jsx` | Fixed "undefined days" display, fixed "Clean +Npts" confusion |

### Issues Fixed

1. **Kenyan brand coverage** — Added NHIF, KRA, Safaricom, Equity Bank, KCB, and 43 more Kenyan-targeted brands to `brands.json`
2. **Subdomain false-negative** — `domain.endsWith("." + brand)` no longer skips subdomains with hyphens/digits (e.g. `selfcare-ecitizen.nhif.or.ke` now scores ~53pts instead of 13)
3. **Leet-speak bonus** — +10pts when brand matched via leet normalization (e.g. `faceb00k.com` now scores ~44pts instead of 34)
4. **Suspicious subdomain bonus** — +10pts when brand matched via a subdomain containing hyphens
5. **"undefined days" display** — Frontend now uses loose equality (`!=`) to catch both `null` and `undefined`
6. **"Clean +Npts" confusion** — Score only shown alongside `"THREAT"`, never alongside `"Clean"`

### Scoring Impact

| Domain | Before | After | Threshold Crossed? |
|---|---|---|---|
| `faceb00k.com` | 34pts | **44pts** | No (still < 50, VT catches it) |
| `selfcare-ecitizen.nhif.or.ke` | 13pts | **~53pts** | **Yes** — now reaches "medium" risk |

### Known Issues

- WHOIS domain age uses `whois.iana.org` (referral server) — nearly always returns `null` for non-`.org` domains. Consider switching to a proper WHOIS client library
- SSL `sslValid` shows "Unchecked" if there's a stale cache entry from before the field was added. Restart fixes it
- VirusTotal only called in the 30–69 gray zone (quota conservation). Some threats may bypass VT if heuristic is too low

---

## Project State

### Working Features
- Heuristic engine (brand similarity, entropy, TLD, URL structure, WHOIS, SSL)
- Threat feeds: GSB, VirusTotal, PhishTank, URLhaus, PhishDestroy, ScamBuster.co.ke
- Extension sensor network with local heuristic fallback
- Correlation engine (3+ sensors = auto-escalate)
- ScamBuster widget on Community (right sidebar) and Browse IOCs page
- 3-column Community page layout (left sidebar, posts middle, ScamBuster right)

### Next Steps
- Phase 3: CT log monitoring, automated takedown pipeline
- Consider switching URLhaus from `/v1/url/` to `/v1/host/` for higher catch rate
- Consider adding OpenPhish and Phishing.army feeds
- Build frontend dev server for full integration testing

### Running the Project
```bash
# Backend
cd backend && npm start

# Extension (after changes)
cd PhishNet-Extension && npm run build
# then reload at chrome://extensions

# Frontend
cd frontend && npm start
```
