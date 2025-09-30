# React Patterns

## Component Structure

### Functional Components Only

Always use functional components with hooks. Class components are not used in this codebase.

```tsx
// ✅ Correct
export const MyComponent = (props: Props) => {
  const { data, onAction } = props;
  return <div>{/* component content */}</div>;
};

// ❌ Wrong - don't use class components
class MyComponent extends React.Component {}
```

### Props Destructuring

**DON'T** destructure props in function definitions. **DO** destructure props within the function body.

```tsx
// ✅ Correct
export const MyComponent = (props: Props) => {
  const { data, onAction, isLoading } = props;
  return <div>{/* component content */}</div>;
};

// ❌ Wrong
export const MyComponent = ({ data, onAction, isLoading }: Props) => {
  return <div>{/* component content */}</div>;
};
```

## Hooks Patterns

### Factor Logic into Hooks

Separate business logic from UI components by creating custom hooks:

```tsx
// ✅ Correct - Logic in a custom hook
// useFacilityManagement.ts
export const useFacilityManagement = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFacilities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFacilities();
      setFacilities(data);
    } finally {
      setLoading(false);
    }
  }, []);

  return { facilities, loading, loadFacilities };
};

// FacilityList.tsx
export const FacilityList = () => {
  const { facilities, loading, loadFacilities } = useFacilityManagement();

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  if (loading) return <CircularProgress />;

  return (
    <div>
      {facilities.map((facility) => (
        <FacilityCard key={facility.id} facility={facility} />
      ))}
    </div>
  );
};
```

### Single Responsibility Hooks

Keep hooks focused on a single concern. Avoid creating huge hook files:

```tsx
// ✅ Correct - Separate hooks for different concerns
// useFacilityData.ts
export const useFacilityData = (facilityId: string) => {
  // Only handles data fetching for a facility
};

// useFacilityActions.ts
export const useFacilityActions = () => {
  // Only handles facility mutations
};

// useFacilityFilters.ts
export const useFacilityFilters = () => {
  // Only handles filtering logic
};

// ❌ Wrong - One giant hook doing everything
export const useFacilityEverything = () => {
  // Handles data, actions, filters, UI state, etc.
};
```

## Component Organization

### Separation of Concerns

Create separate files for key/reusable components:

```
components/
  FacilityManagement/
    FacilityManagement.tsx        # Main container component
    FacilityList.tsx             # List display component
    FacilityCard.tsx             # Individual item component
    FacilityForm.tsx             # Form component
    hooks/
      useFacilityData.ts         # Data fetching hook
      useFacilityActions.ts      # Action handlers
    styles/
      FacilityManagement.styles.ts # Shared styles
```

### Container vs Presentational Components

```tsx
// First, create typed hooks for your state model
import { createCommonStoreCreator } from '@platform/common-state';

class FacilityModel {
  facilities: Facility[] = [];
  selectedFacility?: Facility;
  isLoading = false;
}

// Create typed hooks
const { useCommonStore: useFacilityStore, useStateUpdate: useFacilityUpdate } = 
  createCommonStoreCreator<FacilityModel>();

// Container Component - Handles data and state
export const FacilityManagementContainer = () => {
  const facilities = useFacilityStore((state) => state.facilities);
  const updateState = useFacilityUpdate();

  const handleDelete = useCallback((id: string) => {
    updateState((draft) => {
      draft.facilities = draft.facilities.filter(f => f.id !== id);
    });
  }, [updateState]);

  return <FacilityList facilities={facilities} onDelete={handleDelete} />;
};

// Presentational Component - Only handles display
interface FacilityListProps {
  facilities: Facility[];
  onDelete: (id: string) => void;
}

export const FacilityList = (props: FacilityListProps) => {
  const { facilities, onDelete } = props;

  return (
    <Grid2 container spacing={2}>
      {facilities.map((facility) => (
        <Grid2 key={facility.id} size={4}>
          <FacilityCard facility={facility} onDelete={onDelete} />
        </Grid2>
      ))}
    </Grid2>
  );
};
```

## Provider Pattern

Always wrap components with `CommonStoreProvider` when using state management:

```tsx
import { CommonStoreProvider } from '@platform/common-state';

// Define your state model
class FacilityModel {
  facilities: Facility[] = [];
  selectedFacility?: Facility;
  isLoading = false;
}

// Main feature component
export const FacilityManagement = () => (
  <CommonStoreProvider modelType={FacilityModel} modelData={new FacilityModel()}>
    <FacilityManagementContent />
  </CommonStoreProvider>
);

// Content component that uses the state
const FacilityManagementContent = () => {
  const facilities = useFacilityStore((state) => state.facilities);
  const isLoading = useFacilityStore((state) => state.isLoading);
  const updateState = useFacilityUpdate();
  
  // Component implementation
};
```

## Error Boundaries

Implement error boundaries for feature sections:

```tsx
export const FacilityManagementPage = () => {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <CommonStoreProvider modelType={FacilityModel} modelData={new FacilityModel()}>
        <FacilityManagement />
      </CommonStoreProvider>
    </ErrorBoundary>
  );
};
```

## Async Patterns

### Always Use Async/Await

Use async/await pattern and await promises. Use Promise.allSettled for parallel operations:

```tsx
// ✅ Correct
const handleSave = async () => {
  try {
    await updateFacility(data);
    await refetchFacilities();
    notifications.show('Saved successfully', { severity: 'success', autoHideDuration: 3000 });
  } catch (error) {
    notifications.show('Save failed', { severity: 'error', autoHideDuration: 3000 });
  }
};

// ✅ Correct - Parallel operations
const loadAllData = async () => {
  const results = await Promise.allSettled([fetchFacilities(), fetchBuildings(), fetchFloors()]);

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Operation ${index} failed:`, result.reason);
    }
  });
};
```

## Component Testing

Test user behavior over implementation details:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignatureThemeProvider } from '@platform/chorus-signature-theme';

describe('FacilityCard', () => {
  const renderComponent = (props = {}) => {
    return render(
      <SignatureThemeProvider>
        <FacilityCard {...defaultProps} {...props} />
      </SignatureThemeProvider>,
    );
  };

  it('should display facility name', () => {
    renderComponent({ facility: { name: 'Test Facility' } });
    expect(screen.getByText('Test Facility')).toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    renderComponent({ onDelete });

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalled();
  });
});
```

## Performance Patterns

### Memoization

Use React.memo, useMemo, and useCallback appropriately:

```tsx
// Memoize expensive computations
const sortedFacilities = useMemo(() => {
  return facilities.sort((a, b) => a.name.localeCompare(b.name));
}, [facilities]);

// Memoize callbacks passed to child components
const handleDelete = useCallback(
  (id: string) => {
    updateState((draft) => {
      draft.facilities = draft.facilities.filter((f) => f.id !== id);
    });
  },
  [updateState],
);

// Memoize components that receive stable props
export const FacilityCard = React.memo((props: FacilityCardProps) => {
  const { facility, onDelete } = props;
  // Component implementation
});
```

### Key Prop Usage

Always use stable, unique keys for lists:

```tsx
// ✅ Correct - Using unique IDs
{
  facilities.map((facility) => <FacilityCard key={facility.id} facility={facility} />);
}

// ❌ Wrong - Using array index
{
  facilities.map((facility, index) => <FacilityCard key={index} facility={facility} />);
}
```

## Common Pitfalls to Avoid

1. **Don't use `useEffect` for derived state** - Use `useMemo` instead
2. **Don't forget cleanup in effects** - Return cleanup functions
3. **Don't mutate props or state** - Always create new objects/arrays
4. **Don't use inline functions in JSX when avoidable** - Use useCallback
5. **Don't forget error boundaries** - Catch and handle errors gracefully
