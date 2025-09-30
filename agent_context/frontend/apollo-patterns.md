# Apollo Client Patterns

## Overview

This guide covers Apollo Client patterns for GraphQL operations, including the important distinction between CRUD and Domain graphs, query/mutation patterns, and error handling.

> **Critical**: Always use `gql(``)` syntax with parentheses for GraphQL codegen to work correctly with TypeScript types. Never use `` gql`...` `` without parentheses!

> **Note**: The examples in this guide use `useAppStore` and `useAppStateUpdate` as placeholder names. In your actual implementation, you should create typed hooks using `createCommonStoreCreator` as shown in the state management documentation. For example:
> ```typescript
> const { useCommonStore: useAppStore, useStateUpdate: useAppStateUpdate } = 
>   createCommonStoreCreator<AppModel>();
> ```

## API Context Strategy

### CRUD vs Domain Graph

Our architecture uses two distinct GraphQL contexts:

- **CRUD Graph** (`context: { apiName: 'crud' }`): Read-only access for data retrieval
- **Domain Graph** (`context: { apiName: 'domain' }`): Business logic operations and mutations

```tsx
// ✅ Use CRUD graph for all read operations
const { data } = useQuery(GET_FACILITIES, {
  context: { apiName: 'crud' },
  fetchPolicy: 'network-only',
});

// ✅ Use domain graph for all mutations
const [createFacility] = useMutation(CREATE_FACILITY, {
  context: { apiName: 'domain' },
});

// ✅ Always use gql(``) with parentheses
const GET_FACILITIES = gql(`
  query GetFacilities {
    facilities {
      nodes { id, name }
    }
  }
`);
```

## Query Patterns

### Basic Query

```tsx
import { useQuery } from '@apollo/client';
import { GET_FACILITIES } from './queries';

export const FacilitiesList = () => {
  const { data, loading, error, refetch } = useQuery(GET_FACILITIES, {
    context: { apiName: 'crud' }, // Always use CRUD for reads
    fetchPolicy: 'network-only', // Ensure fresh data
  });

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  // Safe data extraction with fallback
  const facilities = data?.facilities?.nodes?.filter(Boolean) || [];

  return (
    <div>
      {facilities.map((facility) => (
        <FacilityCard key={facility.id} facility={facility} />
      ))}
    </div>
  );
};
```

### Query with Variables

```tsx
const FACILITY_DETAILS = gql(`
  query FacilityDetails($id: ID!) {
    facility(id: $id) {
      id
      name
      description
      buildings {
        nodes {
          id
          name
        }
      }
    }
  }
`);

export const FacilityDetails = ({ facilityId }: { facilityId: string }) => {
  const { data, loading, error } = useQuery(FACILITY_DETAILS, {
    variables: { id: facilityId },
    context: { apiName: 'crud' },
    fetchPolicy: 'network-only',
    skip: !facilityId, // Skip query if no ID
  });

  // Handle loading and error states...
};
```

### Conditional Queries

```tsx
export const ConditionalDataLoader = () => {
  const selectedType = useAppStore((s) => s.selectedType);

  // Only run query when type is selected
  const { data, loading } = useQuery(GET_ITEMS_BY_TYPE, {
    variables: { type: selectedType },
    context: { apiName: 'crud' },
    fetchPolicy: 'network-only',
    skip: !selectedType, // Don't run if no type selected
  });

  return <ItemsList items={data?.items?.nodes || []} />;
};
```

## Mutation Patterns

### Basic Mutation

```tsx
import { useMutation } from '@apollo/client';
import { CREATE_FACILITY } from './mutations';

export const CreateFacilityForm = () => {
  const [createFacility, { loading }] = useMutation(CREATE_FACILITY, {
    context: { apiName: 'domain' }, // Always use domain for mutations
  });

  const handleSubmit = async (formData: FacilityInput) => {
    try {
      const { data, errors } = await createFacility({
        variables: {
          input: {
            id: v4(), // Generate UUID
            name: formData.name,
            description: formData.description,
          },
        },
      });

      // Always check for GraphQL errors
      if (errors) {
        notifications.show(`Error: ${errors[0]?.message}`, {
          severity: 'error',
          autoHideDuration: 3000,
        });
        return;
      }

      // Handle success
      notifications.show('Facility created successfully', {
        severity: 'success',
        autoHideDuration: 3000,
      });

      // Refresh data
      await refetchFacilities();
    } catch (error) {
      // Handle network errors
      notifications.show('Network error occurred', {
        severity: 'error',
        autoHideDuration: 3000,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Facility'}
      </Button>
    </form>
  );
};
```

### Mutation with onCompleted/onError

```tsx
// ✅ For useMutation - onCompleted/onError are supported
const [updateFacility] = useMutation(UPDATE_FACILITY, {
  context: { apiName: 'domain' },
  onCompleted: (data) => {
    updateState((draft) => {
      draft.isLoading = false;
      draft.editingId = undefined;
    });
    notifications.show('Facility updated', {
      severity: 'success',
      autoHideDuration: 3000,
    });
  },
  onError: (error) => {
    updateState((draft) => {
      draft.error = error.message;
      draft.isLoading = false;
    });
    notifications.show(`Error: ${error.message}`, {
      severity: 'error',
      autoHideDuration: 3000,
    });
  },
});

// ❌ For useQuery - onCompleted/onError are deprecated
const { data } = useQuery(QUERY, {
  onCompleted: (data) => {}, // Don't use - deprecated!
  onError: (error) => {}, // Don't use - deprecated!
});
```

## Error Handling

### Separate GraphQL and Network Errors

```tsx
const [deleteFacility] = useMutation(DELETE_FACILITY, {
  context: { apiName: 'domain' },
});

const handleDelete = async (id: string) => {
  try {
    const { data, errors } = await deleteFacility({
      variables: { input: { id } },
    });

    // Check for GraphQL errors first
    if (errors) {
      // These are business logic errors from the server
      const errorMessage = errors[0]?.message || 'Operation failed';
      notifications.show(errorMessage, {
        severity: 'error',
        autoHideDuration: 3000,
      });
      return;
    }

    // Success case
    notifications.show('Facility deleted', {
      severity: 'success',
      autoHideDuration: 3000,
    });
    await refetchFacilities();
  } catch (error) {
    // Network or other errors
    console.error('Delete error:', error);
    notifications.show('Network error occurred', {
      severity: 'error',
      autoHideDuration: 3000,
    });
  }
};
```

### Comprehensive Error Handling

```tsx
export const useEntityMutation = () => {
  const updateState = useAppStateUpdate();
  const [mutate, { loading }] = useMutation(UPDATE_ENTITY, {
    context: { apiName: 'domain' },
  });

  const updateEntity = useCallback(
    async (input: EntityInput) => {
      updateState((draft) => {
        draft.isLoading = true;
        draft.error = undefined;
      });

      try {
        const { data, errors } = await mutate({ variables: { input } });

        if (errors) {
          // GraphQL errors (validation, business logic)
          const errorMessage = errors[0]?.message || 'Update failed';

          updateState((draft) => {
            draft.error = errorMessage;
            draft.isLoading = false;
          });

          // Check for specific error types
          if (errorMessage.includes('duplicate')) {
            notifications.show('Name already exists', {
              severity: 'warning',
              autoHideDuration: 3000,
            });
          } else {
            notifications.show(errorMessage, {
              severity: 'error',
              autoHideDuration: 3000,
            });
          }
          return;
        }

        // Success
        updateState((draft) => {
          draft.isLoading = false;
          draft.successMessage = 'Updated successfully';
        });

        notifications.show('Entity updated', {
          severity: 'success',
          autoHideDuration: 3000,
        });
      } catch (error) {
        // Network/unexpected errors
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

        updateState((draft) => {
          draft.error = errorMessage;
          draft.isLoading = false;
        });

        notifications.show('Network error', {
          severity: 'error',
          autoHideDuration: 3000,
        });
      }
    },
    [mutate, updateState],
  );

  return { updateEntity, loading };
};
```

## Refetching Patterns

### After Mutations

```tsx
const CreateAndRefresh = () => {
  const { refetch: refetchFacilities } = useQuery(GET_FACILITIES, {
    context: { apiName: 'crud' },
    fetchPolicy: 'network-only',
  });

  const [createFacility] = useMutation(CREATE_FACILITY, {
    context: { apiName: 'domain' },
  });

  const handleCreate = async (input: FacilityInput) => {
    const { data, errors } = await createFacility({ variables: { input } });

    if (!errors) {
      // Always use network-only to get fresh data
      await refetchFacilities();
    }
  };
};
```

### Refetching Multiple Queries

```tsx
const ComplexMutation = () => {
  const { refetch: refetchFacilities } = useQuery(GET_FACILITIES, {
    context: { apiName: 'crud' },
    fetchPolicy: 'network-only',
  });

  const { refetch: refetchStats } = useQuery(GET_FACILITY_STATS, {
    context: { apiName: 'crud' },
    fetchPolicy: 'network-only',
  });

  const [updateCapacity] = useMutation(UPDATE_CAPACITY, {
    context: { apiName: 'domain' },
  });

  const handleUpdate = async (id: string, capacity: number) => {
    const { errors } = await updateCapacity({
      variables: { input: { id, capacity } },
    });

    if (!errors) {
      // Refresh all affected data
      await Promise.all([refetchFacilities(), refetchStats()]);
    }
  };
};
```

## Loading States

### Query Loading

```tsx
const DataDisplay = () => {
  const { data, loading, error } = useQuery(GET_DATA, {
    context: { apiName: 'crud' },
    fetchPolicy: 'network-only',
  });

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" minHeight={200}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading data...
        </Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Error Loading Data</AlertTitle>
        {error.message}
      </Alert>
    );
  }

  return <DataList data={data} />;
};
```

### Mutation Loading

```tsx
const ActionButton = () => {
  const [performAction, { loading }] = useMutation(PERFORM_ACTION, {
    context: { apiName: 'domain' },
  });

  return (
    <Button onClick={() => performAction()} disabled={loading} startIcon={loading && <CircularProgress size={16} />}>
      {loading ? 'Processing...' : 'Perform Action'}
    </Button>
  );
};
```

## Polling and Subscriptions

### Polling for Real-time Updates

```tsx
const RealTimeData = () => {
  const { data, loading, startPolling, stopPolling } = useQuery(GET_LIVE_DATA, {
    context: { apiName: 'crud' },
    fetchPolicy: 'network-only',
    pollInterval: 0, // Start with polling disabled
  });

  useEffect(() => {
    // Start polling when component mounts
    startPolling(5000); // Poll every 5 seconds

    return () => {
      // Stop polling when component unmounts
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  return <DataDisplay data={data} />;
};
```

## Fragment Usage

```tsx
// Define reusable fragments
const FACILITY_FIELDS = gql(`
  fragment FacilityFields on Facility {
    id
    name
    description
    capacity
    createdAt
    updatedAt
  }
`);

// Use in queries
const GET_FACILITIES_WITH_DETAILS = gql(`
  ${FACILITY_FIELDS}

  query GetFacilitiesWithDetails {
    facilities {
      nodes {
        ...FacilityFields
        buildings {
          nodes {
            id
            name
          }
        }
      }
    }
  }
`);
```

## Cache Management

### Skip Cache for Critical Operations

```tsx
// Always use network-only for critical data
const { data } = useQuery(GET_CRITICAL_DATA, {
  context: { apiName: 'crud' },
  fetchPolicy: 'network-only', // Always fetch fresh data
});

// After mutations, refetch instead of relying on cache
const [mutate] = useMutation(UPDATE_DATA, {
  context: { apiName: 'domain' },
  // Don't use refetchQueries with cache
  // Instead, manually refetch with network-only
});
```

## TypeScript Integration

```tsx
// Generated types from GraphQL codegen
import { GetFacilitiesQuery, CreateFacilityMutation, CreateFacilityMutationVariables } from '@/generated/graphql';

const useFacilities = () => {
  const { data, loading } = useQuery<GetFacilitiesQuery>(GET_FACILITIES, {
    context: { apiName: 'crud' },
    fetchPolicy: 'network-only',
  });

  const [createFacility] = useMutation<CreateFacilityMutation, CreateFacilityMutationVariables>(CREATE_FACILITY, {
    context: { apiName: 'domain' },
  });

  // Type-safe data access
  const facilities = data?.facilities?.nodes || [];

  return { facilities, loading, createFacility };
};
```

## Best Practices

1. **Always use `gql(``)` syntax** - Required for GraphQL codegen to generate TypeScript types
2. **Always specify context** - Use 'crud' for queries, 'domain' for mutations
3. **Use fetchPolicy: 'network-only'** - Avoid stale cache data
4. **Check for GraphQL errors** - Before handling success
5. **Refetch after mutations** - Don't rely on cache updates
6. **Handle both error types** - GraphQL errors and network errors
7. **Provide loading feedback** - Show spinners during operations
8. **Use skip for conditional queries** - Don't run unnecessary queries
9. **Type your operations** - Use generated types from codegen
10. **Extract reusable hooks** - Create custom hooks for complex operations
11. **Always show notifications** - Keep users informed of success/failure
