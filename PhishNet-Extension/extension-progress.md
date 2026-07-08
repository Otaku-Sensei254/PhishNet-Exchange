# PhishNet Exchange — Extension Progress

## Build Setup
- [x] `package.json` — React 18, Vite 6, `vite-plugin-web-extension` v4.5.1
- [x] `vite.config.js` — 3 entry points (popup, warning, background) via `additionalInputs`
- [x] Build verified: `npm install` + `vite build` produce working `dist/`

## File Structure
```
phishnet-extension/
├── manifest.json
├── package.json
├── vite.config.js
├── .gitignore
├── extension-progress.md
├── public/icons/        ← Gold (#d4a017) solid PNGs (16, 48, 128)
├── src/
│   ├── background/index.js         ← Service worker (plain JS)
│   ├── modules/ThreatChecker.js    ← Threat detection class
│   ├── config/keys.js              ← API keys (gitignored)
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.jsx
│   │   └── Popup.jsx
│   └── warning/
│       ├── index.html
│       ├── main.jsx
│       └── Warning.jsx
└── dist/                ← Build output (load into Chrome as unpacked)
```

## Implemented

### manifest.json
- [x] MV3, permissions: `webNavigation`, `tabs`, `storage`
- [x] `host_permissions: <all_urls>`
- [x] Background service worker: `src/background/index.js`
- [x] Default popup: `src/popup/index.html`
- [x] Web accessible resource: `src/warning/index.html`
- [x] Icon paths: `icons/icon{16,48,128}.png`

### src/background/index.js
- [x] Listens on `chrome.webNavigation.onBeforeNavigate` (frame 0 only)
- [x] Skips `chrome://`, `about:`, `chrome-extension://` URLs
- [x] Runs URL through `ThreatChecker.check()` before allowing navigation
- [x] Redirects to `warning/index.html?blocked=URL&threat=TYPE&source=SOURCE` on threat
- [x] Increments `blockedCount` in `chrome.storage.session`
- [x] Message handlers: `GET_STATUS`, `SET_ENABLED`, `GET_BLOCKED_COUNT`
- [x] Fail-open: navigation allowed on any error

### src/modules/ThreatChecker.js
- [x] Class with in-memory `Map` cache (per session)
- [x] Single public method: `async check(url)` → `{ isThreat, source, threatType }` or `null`
- [x] Layered checks (short-circuit on first hit):
  1. **In-memory cache** — skip repeat checks
  2. **Google Safe Browsing v4** — `threatMatches:find` endpoint
  3. **PhishTank** — `checkurl.php`
  4. **URLhaus (abuse.ch)** — `/v1/url/`
  5. **PhishNet own DB** — `POST /api/link/analyze` (existing backend endpoint)
- [x] Every external call wrapped in try/catch — fail open on API errors

### src/config/keys.js
- [x] Stubs for `GOOGLE_SAFE_BROWSING_API_KEY`, `PHISHTANK_API_KEY`, `PHISHNET_API_URL`
- [x] Listed in `.gitignore`

### src/popup/ — React UI
- [x] Protection toggle (on/off), persisted via `chrome.storage.local`
- [x] Threats blocked count from `chrome.storage.session`
- [x] Status indicator (Active/Disabled)
- [x] Brand colors: black (`#0a0a0a`), white, gold (`#d4a017`)

### src/warning/ — React UI
- [x] Reads `blocked`, `threat`, `source` from URL query params
- [x] Displays threat type, blocked URL, flagging source
- [x] **Go Back** button → `window.history.back()`
- [x] **Proceed Anyway** button → logs override to `chrome.storage.local`, navigates to URL
- [x] Brand colors: black, white, gold

### Placeholder Icons
- [x] 16×16, 48×48, 128×128 solid gold PNGs in `public/icons/`

## Still To Do

### API Keys & Configuration
- [ ] Set real values in `src/config/keys.js`:
  - Google Safe Browsing API key
  - PhishTank API key
  - PhishNet backend API URL (production)
- [ ] Consider moving keys to env vars / `.env` if needed

### Backend: `/api/check-url` Endpoint
- [ ] The extension hits `POST /api/link/analyze` (existing). Confirm this endpoint returns fields the extension expects (`riskLevel`, `ipqs.unsafe`).
- [ ] Optionally create a dedicated `/api/check-url` endpoint for the extension that:
  - Queries Neon PostgreSQL for scraped paste-site intel
  - Returns a simpler response shape: `{ isThreat, threatType }`

### Testing & QA
- [ ] Load `dist/` as unpacked extension in Chrome and verify:
  - Popup opens and shows status/count
  - Toggle persists across browser restarts
  - Warning page renders with correct params
- [ ] Test with known malicious URLs (e.g. from PhishTank test feed)
- [ ] Test fail-open behavior by disconnecting network mid-check
- [ ] Test on internal/admin pages (should be skipped)

### Polish
- [ ] Add loading/empty states to popup
- [ ] Add "clear cache" button or session reset in popup
- [ ] Add content script to scan links on hover (future enhancement)
- [ ] Add right-click "Check with PhishNet" context menu
- [ ] Add notification badge on extension icon showing blocked count

### Deployment
- [ ] Create Chrome Web Store listing assets (screenshots, description, promo tiles)
- [ ] Set up CI/CD for auto-building on tag
- [ ] Sign extension for Chrome Web Store submission
