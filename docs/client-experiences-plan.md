# Client Experiences Plan (Basic vs Premium)

Purpose: Implement and demo two distinct client experiences (frontend + backend) without auth, using a multi-tenant model (clients) and tier-based entitlements.

## Summary
- Client (tenant) has a plan/tier: basic | premium (persisted)
- Dashboard belongs to a client (client_id) and has a layout type: user_activity | team_overview | project_focus
- Frontend derives features from client tier; layout comes from dashboard type
- Backend enforces ownership (client ↔ dashboards) and entitlements (premium-only export)

## Key Decisions
- No auth: UI uses an “Active Client” selector; backend receives X-Demo-Client-Id to simulate tenancy
- Entitlements live on client tier (NOT on dashboard type)
- Dashboard type changes layout/UX only (never entitlements)

---

## Backend (PostGraphile + API)
### Data Model
- Create table `tier_types`:
  - id uuid pk default gen_random_uuid()
  - code varchar(32) unique not null  // 'basic' | 'premium'
  - name varchar(64) not null
  - features jsonb default '{}'::jsonb (optional)
- Create table `clients`:
  - id uuid pk default gen_random_uuid()
  - name varchar(255) not null
  - tier_type_id uuid not null references tier_types(id)
  - icon_url varchar(500) null
  - logo_url varchar(500) null
  - created_at timestamp default now()
  - updated_at timestamp default now()
- Alter `dashboards`:
  - client_id uuid not null references clients(id)
  - dashboard_type varchar(32) not null default 'user_activity'

### Seeding
- tier_types: basic, premium
- clients:
  - “Candy Corn Labs” (basic)  // icon_url/logo_url TBD
  - “Haunted Hollow Ltd.” (premium)  // icon_url/logo_url TBD
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
### Active Client
- Selector (top-right); load via PostGraphile; persist selection (state/localStorage)
- Filter dashboards list by `clientId`
- Show client brand: prefer logo_url in header, fallback icon_url, else initials

### Dashboard View
- Guard: if dashboard.clientId ≠ activeClient.id → show “Not your client”
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
3) Active Client = Haunted Hollow Ltd. (Premium) → dashboards change
4) Open premium dashboard → premium styling, Type Chips, Summary, Export works
5) Export on basic client’s dashboard → 403 entitlement
6) Deep-link cross-client dashboard → ownership guard

---

## TODO (Working Checklist)
- [ ] Backend: create `tier_types` table
- [ ] Backend: create `clients` table (FK → tier_types)
- [ ] Backend: alter `dashboards` (add `client_id`, `dashboard_type`)
- [ ] Backend: seed Candy Corn Labs (basic) and Haunted Hollow Ltd. (premium)
- [ ] Frontend: Active Client selector + persist selection
- [ ] Frontend: filter dashboards by `clientId`
- [ ] Frontend: include client (tier, logo/icon) and dashboardType in queries
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
