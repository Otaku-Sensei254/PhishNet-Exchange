# Discussion Notes

Date: 2026-03-05

## 1) What the system is about

PhishNet Exchange is a cybersecurity platform for phishing defense and leak monitoring.

Core capabilities discussed:
- User auth and subscription tiers (`free`, `pro`, `team`)
- IOC/threat submission and browsing
- Credential leak checking
- Scan history and monitored account tracking
- Team workflows (create team, invite/accept/reject members)
- Browser extension that checks clicked links before opening

## 2) How URL checking works in backend

Endpoint:
- `POST /api/link/analyze`
- Route file: `backend/routes/linkScan.js`
- Controller file: `backend/controllers/linkScanner.controller.js`

Current flow:
1. Read `url` from request body (fails only if missing).
2. Extract domain using `extractDomain(url)` from `backend/utils/extractDomain.js`.
3. Run signals:
   - WHOIS lookup for domain creation date
   - SSL validity check
   - Similarity check against a short list of known legitimate domains
   - IPQualityScore (IPQS) reputation lookup
4. Build risk output:
   - `riskLevel` (`low`, `medium`, `high`)
   - `riskReasons`
   - returns domain/age/ssl/similarity/IPQS details

## 3) External API usage

Yes, the URL checker uses an external API:
- IPQualityScore (IPQS)
- Implemented in `backend/utils/checkIPQS.js`
- Uses `IPQS_KEY` from environment

Other checks (domain parsing, SSL check, WHOIS, similarity) are done in backend code.

## 4) Improvement recommendations (for better/optimum results)

Prioritized improvements we discussed:
1. Strict URL validation + normalization (malformed URLs, punycode/IDN handling, non-HTTP schemes).
2. Add stronger lexical phishing features (entropy, subdomain depth, suspicious tokens/TLDs, `@`, hyphen abuse, shorteners).
3. Improve brand impersonation detection beyond simple similarity.
4. Use multi-source reputation (keep IPQS + add additional feeds/providers).
5. Move from hard rule overrides to weighted scoring (`0-100`) + confidence.
6. Run checks in parallel with timeouts/retries and caching.
7. Add quality evaluation dataset and metrics (precision/recall/F1 + false positives).
8. Add feedback loop from confirmed outcomes to tune thresholds/weights.

## 5) Noted architecture context

The repo currently shows a hybrid backend data approach (MongoDB + PostgreSQL + Prisma),
which can affect consistency and reliability across features if not standardized.
