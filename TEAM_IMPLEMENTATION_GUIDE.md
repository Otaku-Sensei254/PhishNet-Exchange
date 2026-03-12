# PhishNet Exchange - Team Management System Implementation Guide

## ✅ Completed Setup

### Backend Changes

#### 1. **Prisma Schema Updated** (`backend/prisma/schema.prisma`)
- Added `Team` model with fields: `id`, `teamName`, `adminId`, `members`, `createdAt`, `updatedAt`
- Added `TeamMember` model for tracking team membership with status (pending/accepted/rejected)
- Updated `User` model with `teamsAdministered` relationship

**Run this command to apply the schema:**
```bash
npx prisma migrate dev --name add_team_model
```

#### 2. **Team Controller Created** (`backend/controllers/teamController.js`)
Uses **PostgreSQL/Prisma** (not MongoDB) with endpoints:
- `checkUserExists` - Verify if user exists in PhishNet DB
- `createTeam` - Create new team (admin only)
- `addMemberToTeam` - Invite user to team (admin only)
- `acceptTeamInvitation` - Accept team invitation
- `rejectTeamInvitation` - Reject team invitation
- `removeMemberFromTeam` - Remove member (admin only)
- `getUserTeam` - Get user's team
- `getTeamDetails` - Get team details
- `getPendingInvitations` - Get pending invitations

#### 3. **Team Routes Created** (`backend/routes/teamRoutes.js`)
```
GET  /api/teams/check-user?email=user@example.com
POST /api/teams/create
POST /api/teams/add-member
POST /api/teams/accept-invitation
POST /api/teams/reject-invitation
POST /api/teams/remove-member
GET  /api/teams/user/:userId
GET  /api/teams/:teamId
GET  /api/teams/pending/:userId
```

#### 4. **Server Updated** (`backend/server.js`)
Added team routes to the Express app.

---

### Frontend Changes

#### 1. **TeamDashboard Component Updated** (`frontend/src/Components/Dashboard/TeamDashboard.jsx`)
- Shows create team form for admins (if no team exists)
- Display team name and admin
- Add members by email (with PostgreSQL user verification)
- Remove members (admin only)
- Team analytics chart
- Activity feed
- All members show with status (pending/accepted)

#### 2. **TeamInvitationModal Component** (`frontend/src/Components/TeamInvitationModal.jsx`)
- Beautiful modal that pops up when user receives team invitation
- Shows team name and admin email
- Accept/Reject buttons
- Real-time updates

#### 3. **useTeamInvitations Hook** (`frontend/src/hooks/useTeamInvitations.js`)
- Polls backend every 30 seconds for pending invitations
- Handles accept/reject logic
- Returns invitations and helper functions

#### 4. **DashboardWithTeamCheck Wrapper** (`frontend/src/Components/Dashboard/DashboardWithTeamCheck.jsx`)
- Wraps the dashboard to check if user is in a team
- Shows TeamDashboard if user is admin
- Shows regular Dashboard if user is member or not in team
- Shows invitation modal with real-time notifications

#### 5. **TeamDashboard Styles** (`frontend/src/Components/styles/TeamDashboard.css`)
- Complete styling for team dashboard
- Responsive design
- Alert messages
- Member list styling

---

## 📋 Next Steps to Complete

### 1. **Update Routes** (Frontend)
In your main routing file (likely `src/App.js` or `src/index.js`), replace:
```jsx
// OLD: <Route path="/dashboard" element={<Dashboard />} />

// NEW:
import DashboardWithTeamCheck from "./Components/Dashboard/DashboardWithTeamCheck";
<Route path="/dashboard" element={<DashboardWithTeamCheck />} />
```

### 2. **Add Team Button to Dashboard** (All Dashboards)
In `frontend/src/Components/Dashboard/Dashboard.jsx`, add a button near the top:
```jsx
{userTeam && isTeamMember && (
  <button 
    onClick={() => navigate("/dashboard")} 
    className="btn btn-team"
  >
    📊 View Team Dashboard
  </button>
)}
```

### 3. **Run Prisma Migration**
```bash
cd backend
npx prisma migrate dev --name add_team_model
```

### 4. **Test the Flow**

**Test Flow 1: Admin Creates Team**
1. Admin (User A) logs in
2. Goes to dashboard
3. Sees "Create Team" form
4. Creates team "Dev Team"
5. Admin is automatically added as accepted member

**Test Flow 2: Admin Adds Member**
1. Admin enters member's email (User B's email)
2. System checks if User B exists in PostgreSQL
3. If exists → sends invitation (status: pending)
4. If not exists → shows error

**Test Flow 3: Member Receives Invitation**
1. User B logs in
2. Modal pops up automatically (or on refresh)
3. User B sees invitation to join "Dev Team"
4. User B clicks Accept → status changes to accepted
5. User B can now see Team Dashboard

**Test Flow 4: Member Joins Team**
1. After acceptance, User B sees their team info
2. Can see all team members and their statuses
3. Non-admin member can view but cannot manage

---

## 🔧 Important Database Details

Your PostgreSQL schema now has:

```sql
-- Team table
CREATE TABLE "Team" (
  id UUID PRIMARY KEY,
  teamName VARCHAR NOT NULL,
  adminId UUID NOT NULL REFERENCES "User"(id),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TeamMember join table
CREATE TABLE "TeamMember" (
  id UUID PRIMARY KEY,
  teamId UUID NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
  userId UUID NOT NULL,
  email VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending', -- pending, accepted, rejected
  joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(teamId, userId)
);
```

---

## 🎯 API Examples

### Create Team
```bash
curl -X POST http://localhost:5000/api/teams/create \
  -H "Content-Type: application/json" \
  -d '{
    "teamName": "Security Team",
    "adminId": "user-uuid-here"
  }'
```

### Add Member
```bash
curl -X POST http://localhost:5000/api/teams/add-member \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "team-uuid",
    "memberEmail": "user@example.com",
    "adminId": "admin-uuid"
  }'
```

### Accept Invitation
```bash
curl -X POST http://localhost:5000/api/teams/accept-invitation \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "team-uuid",
    "userId": "user-uuid"
  }'
```

### Check User Exists
```bash
curl http://localhost:5000/api/teams/check-user?email=user@example.com
```

---

## 🚀 Summary of Features

✅ Teams are **PostgreSQL-backed** (not MongoDB)
✅ Only users in the PhishNet database can be added
✅ Admin creates teams and manages members
✅ Real-time invitation notifications (polling every 30s)
✅ Beautiful invitation modal
✅ Team dashboard for analytics
✅ Member status tracking (pending/accepted)
✅ Responsive design
✅ Error handling for missing users

---

## ⚠️ Important Notes

1. **Run migration first**: `npx prisma migrate dev --name add_team_model`
2. **User ID format**: The system now uses UUID strings (PostgreSQL format) instead of MongoDB ObjectIds
3. **Email verification**: System automatically checks if email exists in PostgreSQL before inviting
4. **Polling**: Frontend polls every 30 seconds - consider WebSocket for real-time in future
5. **Admin only**: Only team admin can create, add, or remove members

