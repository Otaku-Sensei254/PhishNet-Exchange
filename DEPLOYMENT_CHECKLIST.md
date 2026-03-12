# ✅ Team Management System - Deployment Checklist

## Pre-Deployment Checks

### Backend Setup
- [ ] PostgreSQL/Neon database is running
- [ ] `.env` file has `DATABASE_URL` configured
- [ ] All backend dependencies installed (`npm install` in backend/)
- [ ] Prisma client generated (`npx prisma generate` - usually automatic)

### Frontend Setup
- [ ] `.env` file has `REACT_APP_API_URL` configured
- [ ] All frontend dependencies installed (`npm install` in frontend/)
- [ ] React Router is properly configured

---

## Database Migration

- [ ] Stop backend server
- [ ] Navigate to `backend/` directory
- [ ] Run: `npx prisma migrate dev --name add_team_model`
- [ ] Confirm migration completed without errors
- [ ] Verify tables created in database:
  - [ ] `Team` table exists
  - [ ] `TeamMember` table exists
  - [ ] `User` table has no changes
- [ ] Restart backend server

---

## Code Changes Required

### Frontend - Routing Update

- [ ] Locate your main routing file (usually `App.js` or routing config)
- [ ] Find the Dashboard route
- [ ] Import: `import DashboardWithTeamCheck from "./Components/Dashboard/DashboardWithTeamCheck";`
- [ ] Replace: `<Route path="/dashboard" element={<Dashboard />} />`
- [ ] With: `<Route path="/dashboard" element={<DashboardWithTeamCheck />} />`

### Backend - Already Done

- [ ] `backend/server.js` - Team routes imported and registered ✓
- [ ] `backend/controllers/teamController.js` - Created ✓
- [ ] `backend/routes/teamRoutes.js` - Created ✓
- [ ] `backend/prisma/schema.prisma` - Updated ✓

### Frontend - Files Ready

- [ ] `frontend/src/Components/Dashboard/TeamDashboard.jsx` - Updated ✓
- [ ] `frontend/src/Components/Dashboard/DashboardWithTeamCheck.jsx` - Created ✓
- [ ] `frontend/src/Components/TeamInvitationModal.jsx` - Created ✓
- [ ] `frontend/src/Components/styles/TeamDashboard.css` - Created ✓
- [ ] `frontend/src/Components/styles/TeamInvitationModal.css` - Created ✓
- [ ] `frontend/src/hooks/useTeamInvitations.js` - Created ✓

---

## File Verification

Run these commands to verify all files exist:

```bash
# Frontend files
ls -la frontend/src/Components/Dashboard/TeamDashboard.jsx
ls -la frontend/src/Components/Dashboard/DashboardWithTeamCheck.jsx
ls -la frontend/src/Components/TeamInvitationModal.jsx
ls -la frontend/src/Components/styles/TeamDashboard.css
ls -la frontend/src/Components/styles/TeamInvitationModal.css
ls -la frontend/src/hooks/useTeamInvitations.js

# Backend files
ls -la backend/controllers/teamController.js
ls -la backend/routes/teamRoutes.js
```

All should exist before deployment.

---

## Testing Checklist

### Basic Setup Test
- [ ] Backend server starts without errors
- [ ] Frontend builds without errors
- [ ] No console errors on page load

### User Authentication
- [ ] Can create two test users (User A and User B)
- [ ] Both can log in successfully
- [ ] User data persists in PostgreSQL

### Admin Create Team
- [ ] User A logs in
- [ ] Navigates to `/dashboard`
- [ ] Sees "Create a New Team" form
- [ ] Enters team name and submits
- [ ] Team is created in database
- [ ] User A sees team dashboard
- [ ] User A appears as member with "accepted" status

### Add Member
- [ ] User A in team dashboard
- [ ] Enters User B's email
- [ ] Clicks "Add Member"
- [ ] Backend checks if User B exists ✓
- [ ] User B added with status "pending" ✓
- [ ] Success message shown

### Member Receives Invitation
- [ ] User B logs out and back in
- [ ] Dashboard page loads
- [ ] Invitation modal appears automatically
- [ ] Modal shows correct team name
- [ ] Modal shows User A's email as admin

### Accept Invitation
- [ ] User B clicks "Accept" button
- [ ] Modal closes
- [ ] User B's status changes to "accepted"
- [ ] Refresh page: User B can see team dashboard
- [ ] User B appears in members list

### Reject Invitation
- [ ] Invite another user (User C)
- [ ] User C sees invitation modal
- [ ] User C clicks "Reject"
- [ ] Modal closes
- [ ] User C removed from team
- [ ] Can still log in normally

### Remove Member
- [ ] User A in team dashboard
- [ ] Sees User B in members list
- [ ] Clicks "Remove" next to User B
- [ ] Confirms removal
- [ ] User B removed from database
- [ ] User B can still log in
- [ ] User B no longer in team

---

## API Testing (Optional - Using cURL)

```bash
# Test 1: Check if user exists
curl "http://localhost:5000/api/teams/check-user?email=user@example.com"

# Test 2: Create team
curl -X POST http://localhost:5000/api/teams/create \
  -H "Content-Type: application/json" \
  -d '{"teamName":"Test Team","adminId":"user-id-here"}'

# Test 3: Get user's team
curl http://localhost:5000/api/teams/user/user-id-here

# Test 4: Get pending invitations
curl http://localhost:5000/api/teams/pending/user-id-here
```

---

## Common Issues & Solutions

### Issue: "Migration failed"
**Solution:** 
- Ensure `DATABASE_URL` is in `.env`
- Verify PostgreSQL is running
- Check database permissions

### Issue: "User not found error"
**Solution:**
- Verify invited user is registered in PostgreSQL
- Check email is spelled correctly
- Make sure user is in `User` table

### Issue: "Cannot find module 'useTeamInvitations'"
**Solution:**
- Verify file exists: `frontend/src/hooks/useTeamInvitations.js`
- Check import path uses correct relative path
- Restart dev server

### Issue: "Modal not showing"
**Solution:**
- Verify `DashboardWithTeamCheck` is imported correctly
- Check route uses `DashboardWithTeamCheck` not `Dashboard`
- Verify `useTeamInvitations` hook is working (check console)

### Issue: ID format errors (e.g., "_id is undefined")
**Solution:**
- Use `user.id` not `user._id` (PostgreSQL uses `id`)
- Check all components updated to use `.id` instead of `._id`
- Restart frontend server

---

## Environment Variables

### Backend `.env`
```env
DATABASE_URL=postgresql://user:password@host:port/database
MONGO_URI=... (if still needed for other features)
PORT=5000
NODE_ENV=development
```

### Frontend `.env`
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Browser DevTools Checks

### Network Tab
- [ ] POST /api/teams/create - Returns 201 ✓
- [ ] POST /api/teams/add-member - Returns 200 ✓
- [ ] GET /api/teams/pending/:userId - Returns 200 ✓
- [ ] No 404 or 500 errors

### Console Tab
- [ ] No red errors on dashboard load
- [ ] `useTeamInvitations` hook logs show polling working
- [ ] Invitation modal renders without errors

### React DevTools
- [ ] `DashboardWithTeamCheck` component renders
- [ ] State shows `userTeam`, `invitations`, `currentInvitation`
- [ ] Modal component appears in DOM when invitation arrives

---

## Performance Checks

- [ ] Polling doesn't overwhelm server (30 second interval)
- [ ] Page loads within 2 seconds
- [ ] Modal appears within 1 second of invitation
- [ ] No memory leaks (check browser memory usage)

---

## Deployment to Production

### Backend
- [ ] Update `.env` with production DATABASE_URL
- [ ] Run migration on production database
- [ ] Deploy backend code
- [ ] Verify all team endpoints respond

### Frontend
- [ ] Update `.env` with production API_URL
- [ ] Build: `npm run build`
- [ ] Deploy to Vercel/hosting
- [ ] Test team functionality on production

---

## Final Sign-Off

- [ ] All tests passed
- [ ] No console errors
- [ ] All CRUD operations work (Create, Read, Update, Delete)
- [ ] Invitations work end-to-end
- [ ] Admin controls work properly
- [ ] Database migration completed
- [ ] Routing updated correctly
- [ ] All new files in place
- [ ] Performance acceptable
- [ ] Ready for production! 🎉

---

## Rollback Plan (If Issues)

If something breaks:

1. Backend rollback:
   ```bash
   npx prisma migrate resolve --rolled-back add_team_model
   ```

2. Frontend rollback:
   - Revert route to original Dashboard
   - Remove new components
   - Restore original Dashboard.jsx

3. Database rollback:
   - Delete Team table
   - Delete TeamMember table
   - Run: `npx prisma generate`

---

**Status: ✅ Ready for Deployment**

All code is in place. Follow this checklist and you'll have a fully functional team management system!
