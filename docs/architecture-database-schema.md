# Architecture: Database Schema - Client Tier System

## Client Tier System Database Relationships

```mermaid
erDiagram
    TIER_TYPES {
        uuid id PK
        varchar code UK "basic, premium"
        varchar name "Basic, Premium"
        timestamp created_at
        timestamp updated_at
    }
    
    FEATURES {
        uuid id PK
        varchar code UK "export, summary, type_chips"
        varchar name "Export, Summary Bar, Type Chips"
        timestamp created_at
        timestamp updated_at
    }
    
    TIER_TYPE_FEATURES {
        uuid id PK
        uuid tier_type_id FK
        uuid feature_id FK
    }
    
    CLIENTS {
        uuid id PK
        varchar name "Candy Corn Labs, Haunted Hollow"
        uuid tier_type_id FK
        varchar logo_url
        timestamp created_at
        timestamp updated_at
    }
    
    DASHBOARDS {
        uuid id PK
        varchar name
        varchar slug
        varchar description
        boolean is_public
        uuid client_id FK
        uuid dashboard_type_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    DASHBOARD_TYPES {
        uuid id PK
        varchar code UK "user_activity, team_overview, project_focus"
        varchar name "User Activity, Team Overview, Project Focus"
        timestamp created_at
        timestamp updated_at
    }

    %% Relationships
    TIER_TYPES ||--o{ TIER_TYPE_FEATURES : "has many"
    FEATURES ||--o{ TIER_TYPE_FEATURES : "belongs to"
    TIER_TYPES ||--o{ CLIENTS : "defines tier for"
    CLIENTS ||--o{ DASHBOARDS : "owns"
    DASHBOARD_TYPES ||--o{ DASHBOARDS : "categorizes"
```

## Key Relationships

### 1. **Tier Types → Features (Many-to-Many)**
- `tier_types` table defines available tiers (basic, premium)
- `features` table defines available features (export, summary, type_chips)
- `tier_type_features` join table determines which features each tier has access to

### 2. **Clients → Tier Types (Many-to-One)**
- Each client belongs to one tier type
- Tier type determines which features the client can access
- Example: "Candy Corn Labs" → "basic" tier, "Haunted Hollow" → "premium" tier

### 3. **Dashboards → Clients (Many-to-One)**
- Each dashboard belongs to one client
- Client's tier determines dashboard capabilities
- Example: Premium clients can create different dashboard types

### 4. **Dashboards → Dashboard Types (Many-to-One)**
- Dashboard types are premium features (user_activity, team_overview, project_focus)
- Basic clients only get user_activity dashboards
- Premium clients can choose from all dashboard types

## Data Flow

```
Client Selection → Tier Type → Available Features → Dashboard Capabilities
     ↓                ↓              ↓                    ↓
Candy Corn Labs → Basic Tier → Basic Features → User Activity Only
Haunted Hollow → Premium Tier → All Features → All Dashboard Types
```

## Sample Data

### Tier Types
- **Basic**: `code: 'basic'`, `name: 'Basic'`
- **Premium**: `code: 'premium'`, `name: 'Premium'`

### Features
- **Export**: `code: 'export'`, `name: 'Export'`
- **Summary**: `code: 'summary'`, `name: 'Summary Statistics Bar'`
- **Type Chips**: `code: 'type_chips'`, `name: 'Dashboard Type Selection Chips'`

### Clients
- **Candy Corn Labs**: `name: 'Candy Corn Labs'`, `tier_type_id: basic_tier_id`
- **Haunted Hollow**: `name: 'Haunted Hollow'`, `tier_type_id: premium_tier_id`

### Tier Type Features
- **Basic Tier**: No features (empty)
- **Premium Tier**: All features (export, summary, type_chips)
