# Demo 2: Client Experiences - Basic vs Premium

Purpose: Implement and demo two distinct client experiences (frontend + backend) without auth, using a multi-tenant model (clients) and tier-based entitlements.

## Summary
- Client (tenant) has a plan/tier: basic | premium (persisted)
- Dashboard belongs to a client (client_id) and has a layout type: user_activity | team_overview | project_focus
- Frontend derives features from client tier; layout comes from dashboard type
- Backend enforces ownership (client ↔ dashboards) and entitlements (premium-only export)

## Key Decisions
- No auth: UI uses an “Active Client” selector; backend receives X-Demo-Client-Id to simulate tenancy
- Entitlements live on client tier (NOT on dashboard type)
- Dashboard type changes layout/UX only

---

## Backend (PostGraphile + API)
### Data Model
- Create table `tier_types`:
  - id uuid pk default gen_random_uuid()
  - code varchar(32) unique not null  // 'basic' | 'premium'
  - name varchar(64) not null
  - created_at timestamp default now()
  - updated_at timestamp default now()
- Create table `features`:
  - id uuid pk default gen_random_uuid()
  - code varchar(32) unique not null  // 'export', 'summary', 'type_chips'
  - name varchar(64) not null
  - created_at timestamp default now()
  - updated_at timestamp default now()
- Create table `tier_type_features`:
  - tier_type_id uuid not null references tier_types(id)
  - feature_id uuid not null references features(id)
  - primary key (tier_type_id, feature_id)
- Create table `dashboard_types`:
  - id uuid pk default gen_random_uuid()
  - code varchar(32) unique not null  // 'user_activity', 'team_overview', 'project_focus'
  - name varchar(64) not null
  - created_at timestamp default now()
  - updated_at timestamp default now()
- Create table `clients`:
  - id uuid pk default gen_random_uuid()
  - name varchar(255) not null
  - tier_type_id uuid not null references tier_types(id)
  - logo_url varchar(500) null
  - created_at timestamp default now()
  - updated_at timestamp default now()
- Alter `dashboards`:
  - client_id uuid not null references clients(id)
  - dashboard_type_id uuid not null references dashboard_types(id)

### Seeding
- tier_types: basic, premium
- features: export, summary, type_chips
- tier_type_features: premium gets all features, basic gets none
- dashboard_types: user_activity, team_overview, project_focus
- clients:
  - "Candy Corn Labs" (basic)  // logo_url TBD
  - "Haunted Hollow" (premium)  // logo_url TBD
- Assign existing dashboards to one of the demo clients

### GraphQL (PostGraphile)
- Expose: `dashboard { client { id name tierTypeByTierTypeId { code name } iconUrl logoUrl } dashboardType }`
- Filter dashboards by `clientId`

### API
- Export (premium-only, ownership-enforced):
  - GET /api/dashboards/:id/export.csv
  - Deny if X-Demo-Client-Id ≠ dashboard.client_id (ownership)
  - Deny if dashboard.client.tierTypeByTierTypeId.code ≠ 'premium' (entitlement)
  - Otherwise, generate CSV from current activity and stream

---

## Frontend (Shared Components, Two Experiences)
### Routing Structure
- `/` → Client Selection Page (choose between Candy Corn Labs Basic vs Haunted Hollow Premium)
- `/dashboards` → Dashboard List Page (shows "My Dashboards" + Create Dashboard button)
- `/dashboard/:slug` → Individual Dashboard Detail Page

### Active Client
- Client Selection Page: Two client cards (Candy Corn Labs Basic, Haunted Hollow Premium)
- Persist selection in localStorage; load via PostGraphile
- Filter dashboards list by `clientId`
- Show client brand: prefer logo_url in header, fallback icon_url, else initials

### Dashboard View
- Guard: if dashboard.clientId ≠ activeClient.id → show "Not your client"
- Map `client.tierType.code` → features:
  - basic: neutral styling, no Export, no Type Chips, no Summary
  - premium: premium header/badge, Type Chips, Summary bar, Export button
- Dashboard Type Chips (premium only):
  - user_activity → ActivitySettings → UserActivityGrid (current)
  - team_overview → SummaryBar → UserActivityGrid
  - project_focus → Repositories panel → UserActivityGrid
  - Persist via PostGraphile update (dashboardType)
- Export:
  - Call /api/dashboards/:id/export.csv with X-Demo-Client-Id; handle 403 (ownership/tier)

### Styling Cues (fast)
- Premium: gradient header, “Premium” chip, selected chip highlight, card top-border accent
- Basic: existing neutral look

---

## Demo Flow (2–3 minutes)
1) Active Client = Candy Corn Labs (Basic) → dashboards filter down
2) Open basic dashboard → cards-only, no Export; refresh shows live proxy stats
3) Active Client = Haunted Hollow (Premium) → dashboards change
4) Open premium dashboard → premium styling, Type Chips, Summary, Export works
5) Export on basic client’s dashboard → 403 entitlement
6) Deep-link cross-client dashboard → ownership guard

---

## TODO (Working Checklist)
- [x] Backend: create `tier_types` table
- [x] Backend: create `clients` table (FK → tier_types)
- [x] Backend: create `dashboard_types` table
- [x] Backend: create `features` table
- [x] Backend: create `tier_type_features` junction table
- [x] Backend: alter `dashboards` (add `client_id`, `dashboard_type`)
- [x] Backend: seed Candy Corn Labs (basic) and Haunted Hollow (premium)
- [x] Frontend: Client Selection Page with two client cards
- [x] Frontend: Dashboard List Page with "My Dashboards" and Create Dashboard button
- [x] Frontend: Individual Dashboard Detail Page
- [x] Frontend: Active Client selector + persist selection
- [x] Frontend: filter dashboards by `clientId`
- [x] Frontend: include client (tier, logo/icon) and dashboardType in queries
- [x] Frontend: Fix PostGraphile field naming (`tierTypeByTierTypeId` vs `tierType`)
- [x] Frontend: Fix GraphQL filter structure for clientId (direct UUID value not {equalTo: uuid})
- [x] Frontend: Halloween orange colors for Candy Corn Labs
- [x] Frontend: Remove 'Ltd' from Haunted Hollow references
- [ ] Frontend: guard page on `clientId` mismatch
- [ ] Frontend (premium): Type Chips + persist `dashboardType`
- [ ] Frontend (premium): Summary bar (totals from `userActivities`)
- [ ] Frontend (premium): Export button (call API, handle 403)
- [ ] Frontend: premium styling/badges + client branding
- [ ] API: implement `GET /api/dashboards/:id/export.csv` with header checks
- [ ] QA: run demo flow end-to-end

---

## Notes / Conventions
- Prefer PostGraphile CRUD; minimize custom resolvers
- Enforce export entitlement server-side; other differences are UI-driven
- Reuse ActivitySettings, UserActivityGrid, UserCard and compose features around them

## Work Log
- Use this section for quick timestamps and changes as you implement.

### Recent Issues and Solutions

**Issue: Tilt Port Conflict**
- Problem: `Error: Tilt cannot start because you already have another process on port 10360`
- Solution: Use different port `tilt up --port 10361 github-dashboard` or kill existing process

**Issue: PostGraphile Field Naming**
- Problem: GraphQL queries failed with `Cannot query field "tierType" on type "Client"`
- Root Cause: PostGraphile uses `tierTypeByTierTypeId` for foreign key relations, not `tierType`
- Additional Issue: Dashboard queries failed with `Cannot query field "client" on type "Dashboard"`
- Root Cause: PostGraphile uses `clientByClientId` for foreign key relations, not `client`
- Solution: Updated all GraphQL queries and TypeScript types to use PostGraphile naming:
  - `tierType` → `tierTypeByTierTypeId`
  - `client` → `clientByClientId`
- Files updated: `useClientData.ts`, `postgraphile-client.ts`, `dashboard.ts` types, `ClientSelector.tsx`, `DashboardList.tsx`

**Issue: React DOM Prop Warning**
- Problem: `React does not recognize the 'isPremium' prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase 'ispremium' instead.`
- Root Cause: Styled components were passing custom props (`isPremium`) to DOM elements, which React doesn't recognize as valid HTML attributes
- Solution: Added `shouldForwardProp` to styled components to filter out custom props:
  ```typescript
  const ClientCard = styled(Paper, {
    shouldForwardProp: (prop) => prop !== 'isPremium',
  })<{ isPremium: boolean }>`
  ```
- Files updated: `ClientSelectionPage.tsx` (ClientCard and ClientIcon styled components)

**Issue: GraphQL Filter Structure**
- Problem: GraphQL query failed with `Expected value of type "UUID", found {equalTo: "uuid"}` when filtering dashboards by clientId
- Root Cause: The filter structure was using `{ clientId: { equalTo: clientId } }` but PostGraphile expects a direct UUID value
- Solution: Changed filter structure from `{ clientId: { equalTo: clientId } }` to `{ clientId }`
- Files updated: `useDashboardDataPostGraphile.ts`

**Issue: Routing and Component Structure**
- Problem: Monolithic Dashboard component was causing import errors and caching issues
- Root Cause: Single component handling multiple responsibilities (client selection, dashboard list, dashboard detail)
- Solution: Split into separate page components:
  - `ClientSelectionPage` for `/` route
  - `DashboardListPage` for `/dashboards` route  
  - `DashboardDetailPage` for `/dashboard/:slug` route
- Files updated: `App.tsx`, created new page components, removed old `Dashboard.tsx` and `ClientSelector.tsx`
