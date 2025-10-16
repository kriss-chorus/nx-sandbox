# Demo 2: Client Experiences - Basic vs Premium

Purpose: Implement and demo two distinct client experiences (frontend + backend) without auth, using a multi-tenant model (clients) and tier-based entitlements.

> **📖 See the [GitHub Dashboard README](../packages/github-dashboard/README.md) for current implementation status and features.**

## Summary

- Client (tenant) has a plan/tier: basic | premium (persisted in database)
- Dashboard belongs to a client (client_id) and has a layout type: user_activity | team_overview | project_focus
- **Backend stores feature entitlements** in `tier_type_feature` table linking tiers to specific features
- **Frontend uses React Context** to fetch client features and determine UI display/theme
- Backend enforces ownership (client ↔ dashboards) and entitlements (premium-only features)

## Key Decisions

- No auth: UI uses an "Active Client" selector; client context stored in React Context and localStorage
- **Feature entitlements live on client tier** (NOT on dashboard type) - stored in `tier_type_feature` table
- Dashboard type changes layout/UX only
- **Frontend Context pattern** for feature checking and theme determination

---

## Premium Features Implementation

### Three Premium Features

1. **`export`** - CSV export functionality for dashboard data
2. **`summary`** - Summary statistics bar showing aggregated team metrics
3. **`type_chips`** - Dashboard type selection (User Activity, Team Overview, Project Focus)

### Backend Feature Storage

Features are stored in the database with the following structure:

```sql
-- Features table
feature (id, code, name, created_at, updated_at)
-- Examples:
-- 'export' -> 'Export'
-- 'summary' -> 'Summary Statistics Bar'
-- 'type_chips' -> 'Dashboard Type Selection Chips'

-- Tier-Feature mapping
tier_type_feature (tier_type_id, feature_id)
-- Premium tier gets all features
-- Basic tier gets no features
```

### Frontend Context Integration

The frontend uses React Context (`ClientContext`) to:

1. **Fetch client data** including tier and associated features via GraphQL
2. **Provide feature checking** with `hasFeature(featureCode)` function
3. **Determine theme** based on tier (Basic = coral, Premium = dracula)
4. **Conditionally render** premium UI components

```typescript
// Example usage in components
const { hasFeature, isPremium } = useClientContext();

// Show export button only if client has 'export' feature
{
  hasFeature('export') && <ExportButton />;
}

// Show summary bar only if client has 'summary' feature
{
  hasFeature('summary') && <SummaryBar />;
}

// Show dashboard type selection only if client has 'type_chips' feature
{
  hasFeature('type_chips') && <DashboardTypeSection />;
}
```

### Custom Experience Design Patterns

#### **1. Database-Driven Feature Flags**

Instead of hardcoded feature toggles, features are stored in the database:

```sql
-- Features are defined as data, not code
INSERT INTO feature (code, name) VALUES
  ('export', 'Export'),
  ('summary', 'Summary Statistics Bar'),
  ('type_chips', 'Dashboard Type Selection Chips');

-- Feature entitlements are relationships, not conditions
INSERT INTO tier_type_feature (tier_type_id, feature_id)
SELECT premium_tier.id, feature.id FROM feature;
```

**Benefits:**

- Features can be added/removed without code changes
- A/B testing different feature combinations
- Runtime feature management
- Clear audit trail of feature access

#### **2. Context-Based Feature Resolution**

The `ClientContext` centralizes all client state and feature logic:

```typescript
// Single source of truth for client features
const hasFeature = (featureCode: string): boolean => {
  return clientData.activeClient?.tierTypeByTierTypeId?.tierTypeFeaturesByTierTypeId?.nodes?.some(
    (tierFeature) => tierFeature.featureByFeatureId.code === featureCode
  );
};
```

**Benefits:**

- Consistent feature checking across components
- Single GraphQL query for all client data
- Easy to add new features without prop drilling
- Centralized caching and state management

#### **3. Tier-Based Theme System**

Themes are determined by tier, not individual features:

```typescript
// App.tsx - Theme determination
const tierType =
  activeClient.tierTypeByTierTypeId.code === 'premium' ? 'premium' : 'basic';
const theme = createTierTheme(tierType);
```

**Benefits:**

- Cohesive visual experience per tier
- Easy to maintain brand consistency
- Simple theme switching logic
- Clear visual hierarchy between tiers

#### **4. Conditional Component Rendering**

Components self-regulate based on feature availability:

```typescript
// Components check their own feature requirements
export function DashboardTypeSection() {
  const { hasFeature } = useClientContext();

  if (!hasFeature('type_chips')) {
    return null; // Component doesn't render at all
  }

  return <DashboardTypeSelector />;
}
```

**Benefits:**

- Components are self-contained and reusable
- No need to pass feature flags as props
- Clean separation of concerns
- Easy to test individual components

#### **5. Multi-Tenant Data Isolation**

Each client's data is isolated through database relationships:

```typescript
// GraphQL query includes client context
const CLIENTS_QUERY = `
  query GetClients {
    allClients {
      nodes {
        tierTypeByTierTypeId {
          tierTypeFeaturesByTierTypeId {
            nodes {
              featureByFeatureId { code, name }
            }
          }
        }
      }
    }
  }
`;
```

**Benefits:**

- Secure data isolation
- Scalable multi-tenant architecture
- Easy to add new clients/tiers
- Clear data ownership model

### Implementation Architecture

#### **Data Flow**

```
Database → GraphQL → ClientContext → Components
    ↓         ↓           ↓            ↓
Features → Features → hasFeature() → Conditional Rendering
```

1. **Database Layer**: Features and entitlements stored as relational data
2. **GraphQL Layer**: Single query fetches client + tier + features
3. **Context Layer**: Centralized state management and feature resolution
4. **Component Layer**: Self-regulating components based on feature availability

#### **Key Design Decisions**

**Why Database-Driven Features?**

- **Flexibility**: Add new features without deployments
- **A/B Testing**: Test different feature combinations
- **Audit Trail**: Track feature usage and access
- **Runtime Management**: Enable/disable features dynamically

**Why Context Over Props?**

- **Avoid Prop Drilling**: No need to pass feature flags through component trees
- **Single Source of Truth**: All feature logic in one place
- **Performance**: Single GraphQL query for all client data
- **Consistency**: Same feature checking logic everywhere

**Why Tier-Based Themes?**

- **Brand Consistency**: Each tier has cohesive visual identity
- **Simple Logic**: Tier determines theme, not individual features
- **User Experience**: Clear visual hierarchy between tiers
- **Maintainability**: Easy to update themes per tier

**Why Self-Regulating Components?**

- **Reusability**: Components work in any context
- **Testability**: Easy to test with different feature combinations
- **Maintainability**: Feature logic stays with the component
- **Performance**: Components don't render if features unavailable

#### **Alternative Approaches Considered**

**❌ Hardcoded Feature Flags**

```typescript
// Bad: Hardcoded in components
const isExportEnabled = client.tier === 'premium';
```

**Problems**: Requires code changes for new features, no runtime control

**❌ Prop-Based Feature Passing**

```typescript
// Bad: Prop drilling
<DashboardHeader hasExport={hasExport} hasSummary={hasSummary} />
```

**Problems**: Props need to be passed through multiple levels, hard to maintain

**❌ Feature-Based Themes**

```typescript
// Bad: Theme based on individual features
const theme = hasExport ? premiumTheme : basicTheme;
```

**Problems**: Inconsistent visual experience, complex theme logic

**✅ Database + Context + Tier Themes**
**Benefits**: Flexible, maintainable, consistent, performant

---

## Backend (PostGraphile + API)

### Data Model

- Create table `tier_types`:
  - id uuid pk default gen_random_uuid()
  - code varchar(32) unique not null // 'basic' | 'premium'
  - name varchar(64) not null
  - created_at timestamp default now()
  - updated_at timestamp default now()
- Create table `features`:
  - id uuid pk default gen_random_uuid()
  - code varchar(32) unique not null // 'export', 'summary', 'type_chips'
  - name varchar(64) not null
  - created_at timestamp default now()
  - updated_at timestamp default now()
- Create table `tier_type_features`:
  - tier_type_id uuid not null references tier_types(id)
  - feature_id uuid not null references features(id)
  - primary key (tier_type_id, feature_id)
- Create table `dashboard_types`:
  - id uuid pk default gen_random_uuid()
  - code varchar(32) unique not null // 'user_activity', 'team_overview', 'project_focus'
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
  - "Candy Corn Labs" (basic) // logo_url TBD
  - "Haunted Hollow" (premium) // logo_url TBD
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

- Premium: gradient header, "Premium" chip, selected chip highlight, card top-border accent
- Basic: existing neutral look

## Technical Implementation Details

### Theme System

The application uses a modular MUI theme system following SOLID principles:

```
web/src/app/theme/
├── baseTheme.ts          # Shared base configuration
├── basicTheme.ts         # Light theme for basic tier
├── premiumTheme.ts       # Dracula-inspired dark theme
├── themeFactory.ts       # Theme creation factory
└── index.ts             # Barrel exports
```

**Key Features:**

- Dynamic theme switching based on `client.tierType.code`
- Dracula color palette: `#282a36` background, `#bd93f9` accent, `#6272a4` muted
- Gradient buttons and premium styling
- Consistent typography and spacing

### Client Context

Global client state management via React Context:

```typescript
// ClientContext provides:
- activeClient: Current selected client
- isPremium: Computed boolean from tierType.code
- setActiveClientId: Function to switch clients
- loading/error states
```

**Usage:**

```typescript
const { isPremium, activeClient } = useClientContext();
```

### Feature Flags

Premium features are conditionally rendered using the `isPremium` flag:

```typescript
{
  isPremium && <PremiumComponent />;
}
```

### Premium Features Implementation

#### 1. Dashboard Type Chips

**Purpose**: Allow premium users to switch between different dashboard layouts.

**Implementation:**

- Three layout types: User Activity, Team Overview, Project Focus
- PostGraphile mutation to update `dashboards.dashboard_type_id`
- Visual feedback with premium accent colors
- Persists selection across sessions

**Technical Details:**

- Component: `DashboardTypeChips.tsx`
- Mutation: `UPDATE_DASHBOARD_TYPE_MUTATION`
- Maps to database codes: `user_activity`, `team_overview`, `project_focus`

#### 2. Summary Bar

**Purpose**: Provide aggregated team activity statistics.

**Implementation:**

- Displays totals: PRs Created, Merged, Reviewed, Commits
- Calculated from `userActivities` data
- Premium gradient styling with icons
- Real-time updates when data refreshes

**Technical Details:**

- Component: `SummaryBar.tsx`
- Data source: `userActivities` from `useUserActivityManager`
- Styling: Dracula color scheme with gradient cards

#### 3. Export Button

**Purpose**: Allow premium users to export dashboard data as CSV.

**Implementation:**

- Calls `GET /api/dashboards/:id/export.csv`
- Includes `X-Demo-Client-Id` header for ownership verification
- Handles 403 responses (entitlement errors)
- Downloads CSV file on success

**Technical Details:**

- Component: `ExportButton.tsx`
- **TODO**: Backend endpoint not yet implemented
- Error handling: Toast notifications for failures
- Security: Client ownership and tier validation

### Security & Access Control

#### Client Ownership Guard

**Implementation**: Dashboard access validation in `DashboardDetailPage.tsx`

```typescript
if (
  activeClient &&
  selectedDashboard.clientByClientId?.id !== activeClient.id
) {
  return <AccessDeniedComponent />;
}
```

**Protection**: Prevents cross-client dashboard access via direct URLs.

#### Export Entitlement

**Server-Side Validation** (when implemented):

1. Verify `X-Demo-Client-Id` matches dashboard owner
2. Check client tier is premium
3. Generate and stream CSV data

### File Structure

```
web/src/app/
├── theme/                    # Modular theme system
│   ├── baseTheme.ts
│   ├── basicTheme.ts
│   ├── premiumTheme.ts
│   ├── themeFactory.ts
│   └── index.ts
├── context/
│   └── ClientContext.tsx     # Global client state
├── components/dashboard/
│   ├── DashboardTypeChips.tsx # Premium: Layout switching
│   ├── SummaryBar.tsx        # Premium: Activity summary
│   └── ExportButton.tsx      # Premium: CSV export
└── pages/
    └── DashboardDetailPage.tsx # Integration point
```

---

## Demo Flow (2–3 minutes)

1. Active Client = Candy Corn Labs (Basic) → dashboards filter down
2. Open basic dashboard → cards-only, no Export; refresh shows live proxy stats
3. Active Client = Haunted Hollow (Premium) → dashboards change
4. Open premium dashboard → premium styling, Type Chips, Summary, Export works
5. Export on basic client’s dashboard → 403 entitlement
6. Deep-link cross-client dashboard → ownership guard

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
- [x] Frontend: guard page on `clientId` mismatch
- [x] Frontend (premium): Type Chips + persist `dashboardType`
- [x] Frontend (premium): Summary bar (totals from `userActivities`)
- [x] Frontend (premium): Export button (call API, handle 403)
- [x] Frontend: premium styling/badges + client branding
- [ ] API: implement `GET /api/dashboards/:id/export.csv` with header checks
- [ ] QA: run demo flow end-to-end

---

## Architecture Decisions

### Why Tier-Based Entitlements?

**Decision**: Entitlements are based on client tier, not dashboard type.

**Rationale:**

- **Consistency**: All premium features available regardless of dashboard layout
- **Simplicity**: Single source of truth for feature access
- **Scalability**: Easy to add new features without complex permission logic
- **User Experience**: Clear value proposition for premium tier

### Theme Modularity

**Decision**: Separate theme files with factory pattern.

**Rationale:**

- **SOLID Compliance**: Single Responsibility Principle for each theme
- **Maintainability**: Easy to modify themes independently
- **Extensibility**: Simple to add new tiers or themes
- **Type Safety**: TypeScript support for theme variants

### Client Context Pattern

**Decision**: Global React Context for client state.

**Rationale:**

- **Performance**: Avoids prop drilling
- **Consistency**: Single source of truth for client data
- **Developer Experience**: Simple hook-based API
- **Caching**: Leverages existing `useClientData` hook

## Known Limitations & TODOs

### Backend Implementation

- [ ] Export CSV endpoint: `GET /api/dashboards/:id/export.csv`
- [ ] Dashboard type mutation validation
- [ ] Enhanced activity data aggregation

### Future Enhancements

- [ ] More dashboard layout types
- [ ] Advanced filtering and sorting for premium users
- [ ] Custom dashboard themes per client
- [ ] Real-time collaboration features

### Performance Considerations

- [ ] Theme switching optimization
- [ ] Large dataset export handling
- [ ] Caching for summary calculations

## Testing Checklist

### Theme System

- [ ] Switch client → theme changes immediately
- [ ] Premium theme applies Dracula colors correctly
- [ ] Basic theme maintains neutral appearance
- [ ] Theme persists across navigation

### Premium Features

- [ ] Type Chips visible only for premium users
- [ ] Summary Bar shows correct aggregated totals
- [ ] Export button appears only for premium users
- [ ] All features hidden for basic users

### Security

- [ ] Cross-client dashboard access blocked
- [ ] Ownership guard shows appropriate error
- [ ] Export entitlement properly enforced (when backend ready)

### Integration

- [ ] Premium features work together seamlessly
- [ ] State updates propagate correctly
- [ ] Error handling graceful across all features

## Notes / Conventions

- Prefer PostGraphile CRUD; minimize custom resolvers
- Enforce export entitlement server-side; other differences are UI-driven
- Reuse ActivitySettings, UserActivityGrid, UserCard and compose features around them

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
