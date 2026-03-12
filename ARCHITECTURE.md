# Team System Architecture & Data Flow

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DashboardWithTeamCheck (Main Entry)                           │
│         ├── Checks if user in team                             │
│         ├── Shows invitations (useTeamInvitations hook)        │
│         ├── Polls /api/teams/pending/:userId every 30s        │
│         └── Routes to:                                         │
│             ├── TeamDashboard (if admin)                       │
│             ├── Regular Dashboard (if member/no team)          │
│             └── TeamInvitationModal (when invited)             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Requests
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express/Node.js)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /api/teams/ (teamRoutes.js)                                   │
│         ├── GET /check-user                                    │
│         ├── POST /create                                       │
│         ├── POST /add-member                                   │
│         ├── POST /remove-member                                │
│         ├── POST /accept-invitation                            │
│         ├── POST /reject-invitation                            │
│         ├── GET /user/:userId                                  │
│         ├── GET /:teamId                                       │
│         └── GET /pending/:userId                               │
│                 ↓                                               │
│         teamController.js (Business Logic)                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SQL Queries
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database (Neon)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User (existing)                                               │
│  ├── id (UUID)                                                 │
│  ├── email                                                     │
│  ├── password                                                  │
│  └── ... (other fields)                                        │
│                                                                  │
│  Team (NEW)                                                    │
│  ├── id (UUID)                                                 │
│  ├── teamName                                                  │
│  ├── adminId (FK → User.id)                                    │
│  ├── createdAt                                                 │
│  └── updatedAt                                                 │
│                                                                  │
│  TeamMember (NEW)                                              │
│  ├── id (UUID)                                                 │
│  ├── teamId (FK → Team.id)                                     │
│  ├── userId (FK → User.id)                                     │
│  ├── email                                                     │
│  ├── status ('pending'|'accepted'|'rejected')                  │
│  └── joinedAt                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: Admin Creates Team

```
Admin User Login
        ↓
    Dashboard
        ↓
   "Create Team" Form
        ↓
Admin enters "My Team" name
        ↓
POST /api/teams/create { teamName, adminId }
        ↓
Backend: Check admin exists in PostgreSQL
        ↓
Backend: Create Team record
        ↓
Backend: Create TeamMember record (admin, status=accepted)
        ↓
Return { team, members }
        ↓
Frontend: Show TeamDashboard
        ↓
Admin sees team dashboard with team name
```

---

## 🔄 Data Flow: Admin Invites Member

```
Admin in TeamDashboard
        ↓
Enters member email: "user@example.com"
        ↓
POST /api/teams/add-member { teamId, memberEmail, adminId }
        ↓
Backend: Verify admin is team admin
        ↓
Backend: Check if user@example.com exists in PostgreSQL
        ↓
        If NOT found:
            Return 404 { error: "User not found" }
            ↓
            Frontend: Show error message
        
        If FOUND:
            Get userId from User table
            ↓
            Create TeamMember { teamId, userId, email, status='pending' }
            ↓
            Return updated team + members
            ↓
            Frontend: Show success message
```

---

## 🔄 Data Flow: Member Receives Invitation

```
User B logs in
        ↓
DashboardWithTeamCheck mounts
        ↓
useTeamInvitations hook initializes
        ↓
    Polls: GET /api/teams/pending/:userId
        ↓
Backend: Find TeamMembers where userId=B AND status='pending'
        ↓
Return teams with pending status
        ↓
Frontend: If any pending:
        ├── Show TeamInvitationModal
        ├── Display team name + admin email
        └── Show Accept/Reject buttons
        ↓
User B clicks "Accept"
        ↓
POST /api/teams/accept-invitation { teamId, userId }
        ↓
Backend: Update TeamMember status → 'accepted'
        ↓
Return updated team
        ↓
Frontend: Modal closes
        ↓
User B refreshes or navigates
        ↓
GET /api/teams/user/:userId
        ↓
Backend: Find team where member is accepted
        ↓
Return team details
        ↓
Frontend: Show TeamDashboard or regular Dashboard with team info
```

---

## 📱 Component Hierarchy

```
App
├── DashboardWithTeamCheck (Wrapper)
│   ├── State: userTeam, isAdmin, invitations, etc.
│   ├── Effect: Check if user in team
│   ├── Effect: Listen for invitations
│   │
│   ├── IF (userTeam && isAdmin)
│   │   └── TeamDashboard
│   │       ├── CreateTeamForm (if no team)
│   │       ├── TeamSettings
│   │       │   ├── Create form
│   │       │   ├── Add member form
│   │       │   └── Members list
│   │       ├── TeamAnalytics (Chart)
│   │       └── TeamActivity
│   │
│   ├── ELSE
│   │   └── Dashboard (Regular)
│   │       └── +userTeam info if member
│   │
│   └── TeamInvitationModal
│       ├── Invitation details
│       ├── Accept button
│       └── Reject button
│
└── Other routes...
```

---

## 🔐 Security & Validation Flow

```
User tries to add member to team:
        ↓
POST /api/teams/add-member
        ├── Verify adminId is in request
        ├── Check team exists
        ├── Check adminId == team.adminId ✓ (admin check)
        ├── Check memberEmail exists in User table ✓ (user verification)
        ├── Check not already member ✓ (duplicate check)
        └── Create TeamMember with status='pending'

User tries to remove member:
        ↓
POST /api/teams/remove-member
        ├── Verify adminId in request
        ├── Check team exists
        ├── Check adminId == team.adminId ✓ (admin only)
        └── Delete TeamMember

User tries to accept invitation:
        ↓
POST /api/teams/accept-invitation
        ├── Check team exists
        ├── Check userId has pending invite in this team
        └── Update status to 'accepted'
```

---

## 📊 State Management Flow

```
Frontend State (DashboardWithTeamCheck):
├── userTeam: null | Team object
├── isAdmin: boolean
├── loading: boolean
├── showInvitationModal: boolean
├── currentInvitation: null | Invitation object
│
└── From useTeamInvitations hook:
    ├── invitations: Team[]
    ├── loading: boolean
    ├── acceptInvitation(teamId, userId)
    └── rejectInvitation(teamId, userId)

Backend State (Prisma/Database):
├── User { id, email, password, tier, ... }
├── Team { id, teamName, adminId, createdAt, updatedAt }
└── TeamMember { id, teamId, userId, email, status, joinedAt }
```

---

## 🔄 Polling Mechanism

```
useTeamInvitations Hook:
        ↓
useEffect(() => {
    fetchInvitations()           ← Call immediately on mount
    
    const interval = setInterval(
        fetchInvitations,         ← Call every 30 seconds
        30000
    )
    
    return () => clearInterval(interval)  ← Cleanup on unmount
}, [userId])

fetchInvitations():
        ↓
    GET /api/teams/pending/{userId}
        ↓
    setInvitations(response.pendingInvitations)
        ↓
    Component re-renders with new invitations
        ↓
    If invitations.length > 0:
        ├── Set showInvitationModal = true
        └── Show Modal to user
```

---

## 📋 Complete Request/Response Examples

### Request: Check User Exists
```
GET /api/teams/check-user?email=john@example.com

Response (200):
{
  "exists": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com"
}

Response (404):
{
  "exists": false,
  "message": "User not found in database"
}
```

### Request: Create Team
```
POST /api/teams/create
{
  "teamName": "Security Team",
  "adminId": "550e8400-e29b-41d4-a716-446655440000"
}

Response (201):
{
  "message": "Team created successfully",
  "team": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "teamName": "Security Team",
    "adminId": "550e8400-e29b-41d4-a716-446655440000",
    "members": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "teamId": "660e8400-e29b-41d4-a716-446655440001",
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "email": "admin@example.com",
        "status": "accepted",
        "joinedAt": "2025-11-14T10:00:00Z"
      }
    ],
    "createdAt": "2025-11-14T10:00:00Z",
    "updatedAt": "2025-11-14T10:00:00Z"
  }
}
```

---

**This architecture ensures:**
- ✅ User verification before invitations
- ✅ Admin-only operations
- ✅ Real-time notifications (via polling)
- ✅ PostgreSQL single source of truth
- ✅ Secure invitation flow
- ✅ Scalable team management
