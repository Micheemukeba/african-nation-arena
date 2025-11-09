# African Nations League - Project Assets & Reference Guide

## Core Feature Implementations

### 1. Authentication & Authorization
**Files:**
- `src/lib/authHelpers.ts` - Role checking functions
- `src/pages/Auth.tsx` - Login/signup with auto-role assignment
- `src/components/ProtectedRoute.tsx` - Route authorization wrapper

**Key Functions:**
- `assignFederationRepresentativeRole()` - Auto-assign on signup
- `isAdmin(userId)` - Check admin status
- `checkUserRole()` - Generic role checker

---

### 2. Tournament Management
**Files:**
- `src/pages/AdminDashboard.tsx` - Admin control panel
- `src/lib/bracketGeneration.ts` - Bracket creation logic

**Key Features:**
- Start tournament (requires 8+ teams)
- Reset tournament to quarter-finals
- View tournament status and progression
- Match control interface (Play/Simulate)

**Key Functions:**
- `generateBracket(tournamentId)` - Create bracket structure
- `getBracketForTournament(tournamentId)` - Fetch current bracket

---

### 3. Match Simulation
**File:** `src/lib/matchSimulation.ts`

**Key Functions:**
- `simulateMatch(team1Id, team2Id, withCommentary)` - Run match simulation
- `recordMatchResult(matchId, result, matchType)` - Store results
- `getPlayerPositionRating()` - Calculate player effectiveness
- `calculateGoalProbability()` - Dynamic goal scoring probability

**Algorithm:**
```
Goal Probability = Base × Rating Factor × Time Factor
- Base: 0.02 (2% per minute)
- Rating Factor: 1 + (team_rating_diff / 100)
- Time Factor: 0.6 to 1.2 (increases with match time)
```

**Match Flow:**
1. Simulate 90 minutes with probabilistic goals
2. If draw: Extra time (30 min, reduced probability)
3. If still draw: Penalty shootout (5 rounds)
4. Record all events and update stats

---

### 4. Public Views

#### Tournament Bracket
**File:** `src/pages/Tournament.tsx`
- Display bracket structure
- Show match results as they complete
- Navigate to match details

#### Match Detail Page
**File:** `src/pages/MatchDetail.tsx`
- **Route:** `/match/:matchId`
- Show score and result
- List goal scorers with minutes
- Display commentary (if Played)
- Show match type badge

#### Top Scorers Leaderboard
**File:** `src/pages/TopScorers.tsx`
- **Route:** `/top-scorers`
- Sort by goals (primary)
- Tiebreak by minutes played
- Show player country and position

---

### 5. Team Registration
**File:** `src/pages/RegisterTeam.tsx`
- Create team with unique country
- Add 23 players
- Assign positions and captain
- Auto-calculate ratings

**Features:**
- Form validation
- Player rating generation
- Team rating calculation
- Duplicate country prevention

---

### 6. Email Notifications
**File:** `supabase/functions/send-match-notification/index.ts`

**Endpoint:** `POST /functions/v1/send-match-notification`

**Payload:**
```typescript
{
  matchId: string
  team1Name: string
  team2Name: string
  team1Email: string
  team2Email: string
  team1Score: number
  team2Score: number
  goals: Array<{
    playerName: string
    teamName: string
    minute: number
  }>
  matchType: string
}
```

**Output:** Formatted HTML emails with match details

---

## Database Schema

### Tables

#### `teams`
- `id` (UUID, PK)
- `country_name` (TEXT, UNIQUE)
- `representative_id` (UUID, FK → auth.users)
- `representative_name` (TEXT)
- `manager_name` (TEXT)
- `team_rating` (DECIMAL)

#### `players`
- `id` (UUID, PK)
- `team_id` (UUID, FK → teams)
- `name` (TEXT)
- `natural_position` (player_position ENUM)
- `rating_gk`, `rating_df`, `rating_md`, `rating_at` (INTEGER)
- `is_captain` (BOOLEAN)
- `goals_scored` (INTEGER, AUTO)
- `total_minutes_played` (INTEGER, AUTO)

#### `tournaments`
- `id` (UUID, PK)
- `name` (TEXT)
- `status` (tournament_status ENUM)
- `current_stage` (match_stage ENUM)
- `started_at` (TIMESTAMPTZ)
- `completed_at` (TIMESTAMPTZ)

#### `matches`
- `id` (UUID, PK)
- `tournament_id` (UUID, FK)
- `stage` (match_stage ENUM)
- `team1_id`, `team2_id` (UUID, FK → teams)
- `team1_score`, `team2_score` (INTEGER)
- `match_type` (match_type ENUM)
- `commentary` (TEXT)
- `winner_id` (UUID, FK → teams)
- `played_at` (TIMESTAMPTZ)

#### `goal_events`
- `id` (UUID, PK)
- `match_id` (UUID, FK → matches)
- `player_id` (UUID, FK → players)
- `team_id` (UUID, FK → teams)
- `minute` (INTEGER, 0-120)

#### `user_roles`
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `role` (app_role ENUM)

#### `profiles`
- `id` (UUID, PK, FK → auth.users)
- `full_name` (TEXT)
- `email` (TEXT)

### Enums

**app_role:** admin | federation_representative

**player_position:** GK | DF | MD | AT

**match_stage:** quarter_final | semi_final | final

**match_type:** played | simulated

**tournament_status:** registration | in_progress | completed

---

## API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/` | GET | - | Home page |
| `/auth` | GET | - | Authentication |
| `/register-team` | GET | ✅ | Team registration |
| `/tournament` | GET | - | Tournament bracket |
| `/match/:matchId` | GET | - | Match details |
| `/top-scorers` | GET | - | Scorers leaderboard |
| `/admin` | GET | ✅ Admin | Admin dashboard |

---

## Environment Variables Required

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

---

## Dependencies

### Production
- React 18.3.1
- React Router DOM 6.30.1
- Supabase JS 2.80.0
- TanStack Query 5.83.0
- shadcn/ui components
- Zod (validation)
- Sonner (notifications)

### Build
- Vite 5.4.19
- TypeScript 5.8.3
- Tailwind CSS 3.4.17

---

## User Roles & Permissions

### Visitor (Anonymous)
✅ View tournament bracket
✅ View match details & commentary
✅ View top scorers
❌ Register team
❌ Access admin panel

### Federation Representative (Authenticated)
✅ All visitor permissions
✅ Register team
✅ Manage own team & players
✅ View own match results
❌ Access admin panel
❌ Manage other teams

### Administrator (Admin Role)
✅ All permissions
✅ Start tournament
✅ Play/simulate matches
✅ Reset tournament
✅ View all data
✅ Manage all teams

---

## Security Policies (RLS)

### Public Access Tables
- `teams` - Read only for public
- `matches` - Read only for public
- `goal_events` - Read only for public
- `tournaments` - Read only for public
- `players` - Read only for public

### Protected Tables
- `user_roles` - Users read own, admins read all
- `profiles` - Users read all, update own

### Admin-Only Operations
- Tournament management (start, reset)
- Match simulation
- All update/delete on data

---

## Development Workflow

### Running Locally
```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

### Building
```bash
npm run build
npm run preview
```

### Code Quality
```bash
npm run lint
```

---

## Key Implementation Patterns

### Protected Routes
```typescript
<Route path="/admin" element={
  <ProtectedRoute requireAdmin>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

### Database Queries
```typescript
const { data, error } = await supabase
  .from("matches")
  .select("*")
  .eq("tournament_id", tournamentId)
  .order("stage");
```

### Match Simulation Call
```typescript
const result = await simulateMatch(team1Id, team2Id, true);
await recordMatchResult(matchId, result, "played");
```

---

## Performance Considerations

- Build size: 629.65 KB (gzipped: 182.71 KB)
- No code splitting implemented (can be optimized)
- RLS policies reduce database query overhead
- React Query for efficient data caching

---

## Testing Scenarios

### Happy Path (Complete Tournament)
1. Create 8 teams
2. Start tournament
3. Play/simulate all matches
4. View tournament progression
5. Check top scorers
6. Reset tournament

### Edge Cases
- Exactly 8 teams (minimum)
- 9+ teams (bracket selection)
- Draw matches (extra time/penalties)
- Multiple goals by same player
- Admin user creation

### Security Tests
- Unauthorized access to protected routes
- Users accessing other users' data
- Non-admin trying to start tournament
- RLS policy enforcement

---

## Maintenance & Monitoring

### Regular Tasks
- Monitor database performance
- Check error logs
- Review user feedback
- Performance profiling

### Recommended Monitoring
- Error tracking (Sentry)
- Performance monitoring (New Relic)
- Database metrics (Supabase Dashboard)
- User analytics

---

## Future Enhancement Opportunities

1. **AI Commentary** - Integrate ChatGPT API
2. **Email Service** - SendGrid/Resend integration
3. **Analytics** - Team statistics & insights
4. **Mobile App** - React Native version
5. **Real-time Updates** - WebSocket live scoring
6. **Team Chat** - In-app messaging
7. **Match Predictions** - Pre-match odds
8. **Tournament History** - Archive past tournaments

---

## Support Resources

- Supabase Documentation: https://supabase.com/docs
- React Documentation: https://react.dev
- React Router: https://reactrouter.com
- shadcn/ui: https://ui.shadcn.com
- Vite: https://vitejs.dev

---

*This guide provides complete reference for project implementation and maintenance.*
*Last Updated: November 9, 2025*
