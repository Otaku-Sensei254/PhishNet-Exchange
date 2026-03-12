# Quick Integration Guide

## Step 1: Find Your Main Routing File

Look for where you define routes. Common locations:
- `frontend/src/App.js`
- `frontend/src/index.js`
- `frontend/src/pages/Dashboard.js`

## Step 2: Update Dashboard Route

### BEFORE (Your current code):
```jsx
import Dashboard from "./Components/Dashboard/Dashboard";

// In your routing/switch statement:
<Route path="/dashboard" element={<Dashboard />} />
```

### AFTER (Updated code):
```jsx
import DashboardWithTeamCheck from "./Components/Dashboard/DashboardWithTeamCheck";

// In your routing/switch statement:
<Route path="/dashboard" element={<DashboardWithTeamCheck />} />
```

**That's it!** The `DashboardWithTeamCheck` component automatically:
- Checks if user belongs to a team
- Shows TeamDashboard if user is admin
- Shows regular Dashboard otherwise
- Displays invitation modals automatically

---

## Step 3: Backend Migration

Run this in the `backend` directory:

```bash
# Apply database changes
npx prisma migrate dev --name add_team_model

# Restart your backend server
npm start
```

---

## Step 4: Test It

### Test User Flow:

**User A (Admin):**
1. Login
2. Go to `/dashboard`
3. Should see "Create a New Team" form
4. Enter team name "My Team"
5. Click "Create Team"
6. Should see team dashboard

**User B (Member):**
1. Login
2. Go to `/dashboard`
3. Should see regular dashboard (no team yet)
4. User A invites User B by email
5. User B refreshes dashboard
6. Should see invitation modal
7. Click "Accept"
8. User B now part of team

---

## Important Files to Understand

### Frontend
- `DashboardWithTeamCheck.jsx` - Main wrapper (does the magic)
- `TeamDashboard.jsx` - Admin/member team interface
- `useTeamInvitations.js` - Handles invitation polling
- `TeamInvitationModal.jsx` - Pretty modal that pops up

### Backend
- `teamController.js` - All the business logic
- `teamRoutes.js` - All endpoints
- `schema.prisma` - Database tables

---

## API Endpoints Reference

```
# Check if user exists
GET /api/teams/check-user?email=user@example.com

# Create team
POST /api/teams/create
{ teamName, adminId }

# Add member
POST /api/teams/add-member
{ teamId, memberEmail, adminId }

# Accept invitation
POST /api/teams/accept-invitation
{ teamId, userId }

# Reject invitation
POST /api/teams/reject-invitation
{ teamId, userId }

# Remove member
POST /api/teams/remove-member
{ teamId, memberId, adminId }

# Get my team
GET /api/teams/user/:userId

# Get pending invitations
GET /api/teams/pending/:userId
```

---

## Troubleshooting

### "Migration failed"
Make sure you're in the `backend` directory and have `.env` configured with DATABASE_URL

### "User not found error when adding member"
The email must exist in your PostgreSQL users table. Check that the user is registered.

### "Modal not showing"
Make sure you replaced the Dashboard route with DashboardWithTeamCheck

### "ID format errors"
Remember to use `user.id` not `user._id` (PostgreSQL uses `id`, MongoDB uses `_id`)

---

## Environment Variables Check

Make sure these are in your `.env` files:

**Backend `.env`:**
```
DATABASE_URL=postgresql://user:password@host/database
MONGO_URI=... (if still needed)
```

**Frontend `.env`:**
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

Done! You're all set to start using the team management system! 🎉
