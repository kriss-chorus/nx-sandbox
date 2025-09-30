# State Management Patterns

## Overview

This project uses `@platform/common-state`, a custom state management wrapper built on top of Zustand. It provides type-safe, scoped state management with immutable updates using Mutative.

## Core Concepts

### 1. Define State Models as Classes

State is defined using plain TypeScript classes with default values:

```typescript
// models/FacilityManagementModel.ts
class FacilityManagementModel {
  // Data
  facilities: Facility[] = [];
  buildings: Building[] = [];
  selectedFacilityId?: string;
  selectedBuildingId?: string;

  // UI State
  showAddDialog = false;
  showEditDialog = false;
  activeTab: 'facilities' | 'buildings' | 'rooms' = 'facilities';

  // Loading States
  isLoadingFacilities = false;
  isLoadingBuildings = false;

  // Error Handling
  error?: string;
  validationErrors: Record<string, string> = {};

  // Filters
  searchTerm = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';
}
```

### 2. Create Typed Store Hooks

Use `createCommonStoreCreator` to generate typed hooks for your state:

```typescript
// hooks/useFacilityStore.ts
import { createCommonStoreCreator } from '@platform/common-state';
import { FacilityManagementModel } from '../models/FacilityManagementModel';

export const { useCommonStore: useFacilityStore, useStateUpdate: useFacilityStateUpdate } = createCommonStoreCreator<FacilityManagementModel>();
```

### 3. Provide State in Component Tree

Wrap your feature components with `CommonStoreProvider`:

```tsx
import { CommonStoreProvider } from '@platform/common-state';
import { FacilityManagementModel } from './models/FacilityManagementModel';

export const FacilityManagement = () => {
  return (
    <CommonStoreProvider modelType={FacilityManagementModel} modelData={new FacilityManagementModel()}>
      <FacilityManagementContent />
    </CommonStoreProvider>
  );
};
```

### 4. Consume State with Selectors

Always use selectors to access specific pieces of state:

```tsx
const FacilityList = () => {
  // ✅ Correct - Select specific values
  const facilities = useFacilityStore((state) => state.facilities);
  const searchTerm = useFacilityStore((state) => state.searchTerm);
  const isLoading = useFacilityStore((state) => state.isLoadingFacilities);

  // ❌ Wrong - Don't select entire state
  const state = useFacilityStore((s) => s);

  // ❌ Wrong - Don't create new objects in selectors
  const { facilities, isLoading } = useFacilityStore((state) => ({
    facilities: state.facilities,
    isLoading: state.isLoadingFacilities,
  }));
};
```

### 5. Update State Immutably

Use `useStateUpdate` to modify state with automatic immutability:

```tsx
const FacilityActions = () => {
  const updateState = useFacilityStateUpdate();

  const handleAddFacility = (facility: Facility) => {
    updateState((draft) => {
      draft.facilities.push(facility);
      draft.showAddDialog = false;
    });
  };

  const handleDeleteFacility = (id: string) => {
    updateState((draft) => {
      draft.facilities = draft.facilities.filter((f) => f.id !== id);
    });
  };

  const handleSearch = (term: string) => {
    updateState((draft) => {
      draft.searchTerm = term;
    });
  };
};
```

## Common Patterns

### Loading Data with GraphQL

```typescript
const FacilityDataLoader = () => {
  const updateState = useFacilityStateUpdate();

  const { data, loading, error } = useQuery(GET_FACILITIES, {
    context: { apiName: 'crud' },
    fetchPolicy: 'network-only',
  });

  // Sync GraphQL loading state to store
  useEffect(() => {
    updateState((draft) => {
      draft.isLoadingFacilities = loading;
    });
  }, [loading, updateState]);

  // Sync data to store
  useEffect(() => {
    if (data?.facilities?.nodes) {
      updateState((draft) => {
        draft.facilities = data.facilities.nodes.filter(Boolean);
      });
    }
  }, [data, updateState]);

  // Handle errors
  useEffect(() => {
    if (error) {
      updateState((draft) => {
        draft.error = error.message;
      });
    }
  }, [error, updateState]);
};
```

### Complex State Updates

```typescript
const FacilityManagementActions = () => {
  const updateState = useFacilityStateUpdate();
  const selectedFacilityId = useFacilityStore((s) => s.selectedFacilityId);

  const [createFacility] = useMutation(CREATE_FACILITY, {
    context: { apiName: 'domain' },
  });

  const handleCreateFacility = async (input: CreateFacilityInput) => {
    // Set loading state
    updateState((draft) => {
      draft.isLoadingFacilities = true;
      draft.error = undefined;
    });

    try {
      const { data, errors } = await createFacility({
        variables: { input },
      });

      if (errors) {
        updateState((draft) => {
          draft.error = errors[0]?.message || 'Failed to create facility';
          draft.isLoadingFacilities = false;
        });
        return;
      }

      // Success - update state
      updateState((draft) => {
        draft.showAddDialog = false;
        draft.isLoadingFacilities = false;
        // Note: Let GraphQL query refetch handle adding to list
      });

      // Refetch data
      await refetchFacilities();
    } catch (error) {
      updateState((draft) => {
        draft.error = error instanceof Error ? error.message : 'Unknown error';
        draft.isLoadingFacilities = false;
      });
    }
  };

  const handleFacilitySelection = (facilityId: string) => {
    updateState((draft) => {
      draft.selectedFacilityId = facilityId;
      // Reset dependent selections
      draft.selectedBuildingId = undefined;
    });
  };
};
```

### Derived State with Selectors

```typescript
const FilteredFacilityList = () => {
  const facilities = useFacilityStore(s => s.facilities);
  const searchTerm = useFacilityStore(s => s.searchTerm);
  const filterStatus = useFacilityStore(s => s.filterStatus);

  // Compute filtered list
  const filteredFacilities = useMemo(() => {
    return facilities.filter(facility => {
      const matchesSearch = !searchTerm ||
        facility.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' ||
        facility.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [facilities, searchTerm, filterStatus]);

  return <FacilityGrid facilities={filteredFacilities} />;
};
```

### Multiple Store Providers

For complex features, you can nest multiple providers:

```tsx
// Different models for different concerns
class FacilityDataModel {
  facilities: Facility[] = [];
  buildings: Building[] = [];
}

class FacilityUIModel {
  selectedId?: string;
  showDialog = false;
  viewMode: 'grid' | 'list' = 'grid';
}

// Create separate hooks
const { useCommonStore: useFacilityData, useStateUpdate: updateFacilityData } = createCommonStoreCreator<FacilityDataModel>();

const { useCommonStore: useFacilityUI, useStateUpdate: updateFacilityUI } = createCommonStoreCreator<FacilityUIModel>();

// Nest providers
export const FacilityFeature = () => (
  <CommonStoreProvider modelType={FacilityDataModel}>
    <CommonStoreProvider modelType={FacilityUIModel}>
      <FacilityManagement />
    </CommonStoreProvider>
  </CommonStoreProvider>
);
```

## Testing State

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommonStoreProvider } from '@platform/common-state';

describe('FacilityManagement', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <CommonStoreProvider
        modelType={FacilityManagementModel}
        modelData={new FacilityManagementModel()}
      >
        {component}
      </CommonStoreProvider>
    );
  };

  it('should update search term', async () => {
    const SearchComponent = () => {
      const searchTerm = useFacilityStore(s => s.searchTerm);
      const updateState = useFacilityStateUpdate();

      return (
        <input
          value={searchTerm}
          onChange={(e) => updateState(draft => {
            draft.searchTerm = e.target.value;
          })}
          placeholder="Search facilities"
        />
      );
    };

    renderWithProvider(<SearchComponent />);

    const input = screen.getByPlaceholderText('Search facilities');
    await userEvent.type(input, 'Test Facility');

    expect(input).toHaveValue('Test Facility');
  });
});
```

## Best Practices

### DO's ✅

1. **Define state models as classes** with default values
2. **Create typed hooks** using `createCommonStoreCreator`
3. **Wrap features with CommonStoreProvider** at appropriate level
4. **Use specific selectors** for each piece of state
5. **Update state immutably** using the draft function
6. **Keep state models focused** - separate UI state from data state
7. **Use undefined for optional values** - never null
8. **Test with proper provider setup**

### DON'Ts ❌

1. **Don't select entire state** - `useStore(s => s)` causes unnecessary re-renders
2. **Don't create new objects in selectors** - breaks referential equality
3. **Don't mutate state directly** - always use useStateUpdate
4. **Don't mix business logic in state models** - keep them pure data
5. **Don't forget the provider** - hooks will fail without it
6. **Don't use null** - use undefined for optional values
7. **Don't put async logic in state updates** - handle async operations outside

## Common Pitfalls and Solutions

### Pitfall 1: Forgetting the Provider

```tsx
// ❌ This will throw an error
const App = () => {
  const facilities = useFacilityStore((s) => s.facilities); // Error!
  return <div>...</div>;
};

// ✅ Wrap with provider
const App = () => (
  <CommonStoreProvider modelType={FacilityManagementModel}>
    <AppContent />
  </CommonStoreProvider>
);

const AppContent = () => {
  const facilities = useFacilityStore((s) => s.facilities); // Works!
  return <div>...</div>;
};
```

### Pitfall 2: Creating New Objects in Selectors

```tsx
// ❌ Creates new object every render
const Component = () => {
  const data = useFacilityStore((s) => ({
    facilities: s.facilities,
    count: s.facilities.length,
  }));
};

// ✅ Use separate selectors
const Component = () => {
  const facilities = useFacilityStore((s) => s.facilities);
  const count = useFacilityStore((s) => s.facilities.length);
};
```

### Pitfall 3: Async Operations in State Updates

```tsx
// ❌ Don't do async in state updates
const updateState = useFacilityStateUpdate();
updateState(async (draft) => {
  const data = await fetchData(); // Won't work!
  draft.facilities = data;
});

// ✅ Handle async outside, then update
const loadData = async () => {
  const data = await fetchData();
  updateState((draft) => {
    draft.facilities = data;
  });
};
```

## Integration with GraphQL

The common pattern is to sync GraphQL query results with your store:

```tsx
const FacilitySync = () => {
  const updateState = useFacilityStateUpdate();

  // Query data
  const { data, loading, error, refetch } = useQuery(GET_FACILITIES, {
    context: { apiName: 'crud' },
    fetchPolicy: 'network-only',
  });

  // Sync to store
  useEffect(() => {
    if (data?.facilities?.nodes) {
      updateState((draft) => {
        draft.facilities = data.facilities.nodes.filter(Boolean);
        draft.isLoadingFacilities = false;
      });
    }
  }, [data, updateState]);

  // Expose refetch for mutations
  useEffect(() => {
    window.__facilityRefetch = refetch; // Anti-pattern, but shows the concept
  }, [refetch]);
};
```

This approach keeps your UI components decoupled from GraphQL while maintaining a single source of truth in your store.
