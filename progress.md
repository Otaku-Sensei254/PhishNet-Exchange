# Progress

## Done
- **Feature cards redesigned** — HUD corner brackets, icon boxes with glow, green status dot, gradient backgrounds, cubic-bezier hover transitions
- **Upload middleware fixed** — Switched from Cloudinary (broken) to local disk storage; files stored in `backend/uploads/` and served via `express.static`
- **Team signup flow fixed** — Rewrote `neonController.js` team creation from Prisma to raw SQL with `CREATE TABLE IF NOT EXISTS teams/team_members`; removed Prisma dependency
- **Team controller rewritten** — All 12 endpoints in `teamController.js` converted from Prisma to raw SQL
- **JWT_SECRET loading fixed** — Added `dotenv.config()` inside `neonController.js` to fix ES module hoisting issue (env vars were undefined at import time)
- **Services dropdown (Next.js Platform)** — Added 7-service dropdown to navbar: Managed Endpoint Protection, Phishing Protection, Breach Leak Monitoring, Infrastructure Monitoring, Email Security, Cloud Firewall Management, Security Awareness Training
- **Service pages created** — Dynamic `[slug]` route under `/services/` with individual pages for all 7 services (icons, features, CTAs)
- **Services listing page updated** — `/services` page now shows all 7 with hover-linked cards
- **Footer updated** — Infrastructure Monitoring moved from Solutions to Services column; all 7 service links listed
- **Solutions nav cleaned** — Infrastructure Monitoring removed from Solutions dropdown (now lives under Services)

## Next Steps
1. **Wazuh + Grafana + Prometheus** — Research and plan integration with SecureFix.KE/PhishNet Exchange
2. **Next.js services pages** — Further polish and content for the 7 service detail pages
3. **Paystack webhook fix** — Currently writes to MongoDB instead of Neon; paid team users get 403 at login
4. **Prisma cleanup** — `services/prisma.js` is orphaned after the raw SQL migration
