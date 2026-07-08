# Project Modifications - March 16, 2026

## Backend Changes

### 1. Prisma Client Generation Fix (Deployment)
- **File:** `backend/package.json`
- **Change:** Added a `postinstall` script to run `npx prisma generate`.
- **Reason:** Fixed `ERR_MODULE_NOT_FOUND` on Render.com. The Prisma client was not being generated during the build process, causing the server to fail because the `generated/prisma` directory is (correctly) ignored in version control.

### 2. Team Controller Refactoring
- **File:** `backend/controllers/teamController.js`
- **Change:** Updated to import the centralized `prisma` instance from `../services/prisma.js` instead of creating a new `PrismaClient` instance.
- **Reason:** Ensures consistent database connection handling and cleaner code structure.

### 3. Public IOC Browsing Verification
- **File:** `backend/routes/iocRoutes.js`
- **Verification:** Confirmed that `router.get("/")` for IOCs does **not** use the `verifyToken` middleware, allowing even unauthenticated users to browse IOCs as requested.
- **Frontend Sync:** `frontend/src/pages/Browse.jsx` updated to conditionally send the Authorization header only if a token is present in local storage.
