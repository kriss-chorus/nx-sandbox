1. this is an nx/pnpm project - don't use npm.
2. check the project.json for commands to run in each project first.
3. Use nx commands for running tasks. Project names in nx use the format @scope/project-name (e.g., @platform/signature-component-library).
4. For running tests: `nx run <project-name>:vite:test -- path/to/file.spec.ts`
5. Tests use Vitest, not Jest. Import test utilities from 'vitest': `import { describe, it, expect, beforeEach, vi } from 'vitest';`
6. Use Emotion React w/ css prop. Don't use sx.
7. Use Emotion Best practices w/ css variables.
8. Define styles using a styles object, and use the css prop. no usage of styled.
9. Factor logic into hooks, and call them in components.
10. For dynamic styles, use CSS variables instead of functions:

```tsx
// ✅ Correct - Use CSS variables with fallback values
const styles = {
  container: css({
    // Use var() with fallback for defaults
    height: 'var(--dynamic-height, 44px)',
    color: 'var(--dynamic-color, rgba(0, 0, 0, 0.6))',
  }),
};

// In component - only set the CSS variable when needed
<div
  css={styles.container}
  style={
    {
      '--dynamic-height': size === 'small' ? '36px' : '44px',
      '--dynamic-color': filled ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.6)',
    } as React.CSSProperties
  }
/>;

// ❌ Wrong - Don't use functions for dynamic styles
const styles = {
  container: (size: string) =>
    css({
      height: size === 'small' ? '36px' : '44px',
    }),
};
```

11. Use separation of concerns, and make files for key/reusable components.
12. Use my `@platform/common-store` package (wrapper for Zustand) to avoid prop drilling and creating good reuse patterns.

## Component Library Preference

**IMPORTANT**: Always prefer @platform/signature-component-library over Material UI when an equivalent component exists.

### Decision Tree for Component Selection:

1. **Check @platform/signature-component-library first**: Does the component exist in @platform/signature-component-library?

   - YES → Use @platform/signature-component-library version
   - NO → Continue to step 2

2. **Check if it's a composite component**: Can it be built using @platform/signature-component-library?

   - YES → Build using @platform/signature-component-library as building blocks
   - NO → Use Material UI

3. **Examples**:

   ```tsx
   // ✅ CORRECT - Using @platform/signature-component-library
   import { TextField, SearchButton, CardContainer } from '@platform/signature-component-library';

   // ❌ WRONG - Using MUI when @platform/signature-component-library has equivalent
   import { TextField, Card } from '@mui/material';
   ```

4. **When to use Material UI**:

   - Layout components (Grid2, Stack)
   - Typography (unless @platform/signature-component-library has specific variant)
   - Components not available in @platform/signature-component-library yet (Dialog, Modal, Chip, etc.)
   - Form utilities (FormControl, FormLabel, FormHelperText)

5. **Mixed usage is acceptable**:
   ```tsx
   // ✅ CORRECT - Using both libraries appropriately
   import { TextField } from '@platform/signature-component-library';
   import { Typography, Chip } from '@mui/material';
   ```

### Quick Reference for AI/Models:

When you need a component, check this list first:

```typescript
// @@platform/signature-component-library imports (PREFER THESE)
import {
  // Form inputs
  TextField, // Use for all text inputs
  PhoneNumberTextField, // Use for phone numbers
  Select, // Use for dropdowns
} from '@platform/signature-component-library';

// Material UI imports (USE ONLY WHEN NO @platform/signature-component-library EQUIVALENT)
import {
  // Layout (always from MUI)
  Grid2,
  Stack,

  // Typography (usually from MUI)
  Typography,

  // Components without @nhha equivalents
  Dialog,
  Modal,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Collapse,

  // Form utilities (often needed with @nhha components)
  FormControl,
  FormLabel,
  FormHelperText,
  InputLabel,
  FormGroup,
} from '@mui/material';
```

### Import Best Practices:

1. **Always check imports first**: When reviewing or writing code, verify that @platform/signature-component-library is used where available

2. **Common mistakes to avoid**:

   ```tsx
   // ❌ WRONG - Importing TextField from MUI
   import { TextField } from '@mui/material';

   // ✅ CORRECT - Importing TextField from @platform/signature-component-library
   import { TextField } from '@platform/signature-component-library';

   // ❌ WRONG - Mixed imports when both are available in @platform/signature-component-library
   import { Select } from '@mui/material';
   import { TextField } from '@platform/signature-component-library';

   // ✅ CORRECT - Consistent use of @platform/signature-component-library
   import { Select, TextField } from '@platform/signature-component-library';
   ```

## State Management Pattern

13. **IMPORTANT**: Always wrap components with `CommonStoreProvider` when using state management:

```tsx
// In your main component/view file
import { CommonStoreProvider } from '@platform/common-state';
import { createCommonStoreCreator } from '@platform/common-state';

// Define your state model
class MyFeatureModel {
  data: any[] = [];
  isLoading = false;
}

// Create typed hooks
const { useCommonStore: useMyFeatureStore, useStateUpdate: useMyFeatureUpdate } = 
  createCommonStoreCreator<MyFeatureModel>();

export const MyFeature = () => (
  <CommonStoreProvider modelType={MyFeatureModel} modelData={new MyFeatureModel()}>
    <MyFeatureContent />
  </CommonStoreProvider>
);
```

14. **useCommonStore with Selectors**: `useCommonStore` is a thin Zustand wrapper that uses selectors to grab data:

```tsx
// Always use selectors to extract specific data
// do not create new objects!
const activeTab = useMyFeatureStore((state) => state.activeTab);
const facilities = useMyFeatureStore((state) => state.facilities);
const isLoading = useMyFeatureStore((state) => state.isLoading);
```

15. **State Updates with useStateUpdate**: Always use the `useStateUpdate` hook to modify state:

    ```tsx
    const updateState = useMyFeatureUpdate();
    
    // Update single value
    updateState((draft) => {
      draft.activeTab = 'facilities';
    });

    // Update multiple values
    updateState((draft) => {
      draft.facilities.push(newFacility);
      draft.isLoading = false;
    });
    ```

This pattern ensures proper re-rendering optimization and follows Zustand best practices for performance.

16. Use undefined. Using null is banned except to honor 3rd party library/typescript interfaces / usecases.

17. Use MUI spacing css vars. Read our Signature Theme located in packages/shared/themes/signature-theme.

e.g. use var(--mui-spacing-1) or var(--mui-spacing-4)

18. Use borderRadius css vars. Read the theme located in packages/shared/themes/signature-theme.

e.g. use var(--mui-shape-borderRadius) and various vars in the shape definition.

19. When you separate logic from components into hooks, try to use single responsibility and minimize creating huge hook files.

20. 100% of state changes must be done via useStateUpdate's function. Never mutably change state outside of it.

21. Do not mix logic and state together in the state store. Logic should be in separate files, and state + event definitions may exist in the state store model.
    Change state using useStateUpdate from relevant state providers.

22. Never call "useStore((s) => s)". Always select the values you need, and never return a new object.

23. All mutations should be done via the domain graph.

24. Queries may be done via the "CRUD" graph, or the domain graph. Always check the CRUD graph's schema for queries.

25. Use useStateUpdate to access state updating (@platform/common-state).

## Apollo Client Patterns

26. **Apollo Client Hook Callbacks**:

    - `useQuery`'s `onCompleted` and `onError` options are **deprecated**
    - `useMutation`'s `onCompleted` and `onError` options are **supported**

    ```tsx
    // ❌ Deprecated for useQuery - don't do this
    const { data } = useQuery(QUERY, {
      onCompleted: (data) => {
        /* handle success */
      },
      onError: (error) => {
        /* handle error */
      },
    });

    // ✅ For useMutation - both approaches are valid

    // Option 1: Using onCompleted/onError (supported)
    const [mutationFn] = useMutation(MUTATION, {
      context: { apiName: 'domain' },
      onCompleted: (data) => {
        updateState((draft) => {
          draft.isLoading = false;
        });
        notifications.show('Operation successful', { severity: 'success', autoHideDuration: 3000 });
      },
      onError: (error) => {
        updateState((draft) => {
          draft.error = error.message;
          draft.isLoading = false;
        });
        notifications.show('Operation failed', { severity: 'error', autoHideDuration: 3000 });
      },
    });

    // Option 2: Handling in action functions (also valid)
    const [mutationFn] = useMutation(MUTATION, {
      context: { apiName: 'domain' },
    });

    const performAction = useCallback(
      async (input) => {
        try {
          const { data, errors } = await mutationFn({ variables: { input } });

          if (errors) {
            // Handle GraphQL errors
            updateState((draft) => {
              draft.error = errors[0]?.message || 'Operation failed';
              draft.isLoading = false;
            });
            notifications.show(`Failed: ${errors[0]?.message}`, { severity: 'error', autoHideDuration: 3000 });
            return;
          }

          // Handle success
          updateState((draft) => {
            draft.isLoading = false;
          });
          notifications.show('Operation successful', { severity: 'success', autoHideDuration: 3000 });
        } catch (error) {
          // Handle network/other errors
          updateState((draft) => {
            draft.error = error instanceof Error ? error.message : 'Unknown error';
            draft.isLoading = false;
          });
          notifications.show('Operation failed', { severity: 'error', autoHideDuration: 3000 });
        }
      },
      [mutationFn, updateState, notifications],
    );
    ```

27. **Separate GraphQL errors from network errors**: Always check for `errors` in the response before handling success:

    ```tsx
    const { data, errors } = await mutationFn();

    if (errors) {
      // Handle GraphQL errors (business logic errors)
      handleGraphQLErrors(errors);
      return;
    }

    // Handle success case
    handleSuccess(data);
    ```

28. **Use focused entity hooks**: Create hooks that handle specific entities (e.g., `useFacilities`, `useBuildings`) rather than complex centralized providers. Each hook should:

    - Handle GraphQL operations for one entity type
    - Manage loading states for that entity
    - Provide CRUD operations as callback functions
    - Handle modal state for that entity

29. **Store selector best practices**:

    - Import `useStateUpdate` directly from the store exports, never access it through a selector
    - Use individual selectors for each piece of state you need
    - Never return new objects from selectors (violates rule 17)

    ```tsx
    // ✅ Correct
    const updateState = useMyFeatureUpdate(); // Direct import from typed hooks
    const facilities = useMyFeatureStore((state) => state.facilities);
    const isLoading = useMyFeatureStore((state) => state.isLoading);

    // ❌ Wrong
    const updateState = useMyFeatureStore((state) => state.updateState); // Don't access through selector
    const { facilities, isLoading } = useMyFeatureStore((state) => ({
      // Don't return new objects
      facilities: state.facilities,
      isLoading: state.isLoading,
    }));
    ```

30. **GraphQL Error Handling Best Practices**:

    - Always check for `errors` in mutation results before handling success
    - Separate GraphQL errors (business logic) from network errors (try/catch)
    - Provide user-friendly error messages through notifications
    - Update loading states properly in both success and error cases

31. **Modern Apollo Client Patterns**:

    - For `useQuery`: Handle results through the returned data/error/loading states (onCompleted/onError are deprecated)
    - For `useMutation`: Can use either onCompleted/onError callbacks OR handle results in action functions
    - Handle loading states explicitly in your action functions
    - Use proper TypeScript error checking: `error instanceof Error ? error.message : 'Unknown error'`
    - Reload data after mutations when needed: `await queryFn()` after successful mutations

32. DONT destructure props in function definitions. DO destructure props within the function definition.

33. Always use async/await pattern, and await promises. Use good judgement. Use Promise.allSettled if promise parallelization is necessary.

34. Dont use the following MUI components

- Box (use div)
- Grid (use Grid2)

35. Always prefer @platform/signature-component library, then MUI components, before using HTML elements.
36. Use the GraphQL Best Practices Guide for frontend querying - located here: docs/graphql-best-practices-guide.md
37. Use React Hook Form to manage forms.
38. When using notifications, always add a 3000ms autoHideDuration.
39. Icon usage hierarchy:
    - First choice: FontAwesome Pro icons (we have access to all Pro icon sets)
      ```tsx
      import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
      import { faCircleExclamation } from '@fortawesome/pro-solid-svg-icons';
      // Can use: pro-solid, pro-regular, pro-light, pro-thin, pro-duotone
      ```
    - Second choice: MUI icons if FontAwesome doesn't have the needed icon
      ```tsx
      import { Search, Email } from '@mui/icons-material';
      ```
    - Last resort: Write custom SVGs only if neither library has the icon
40. Use the Typography over raw text. Try to use the default theme typography values. All text should be represented as MUI Typography.
41. Default to using rgba() / rgb() for all color definitions. Don't use other color CSS schemes.

## Backend

1. Always use hard-private for injected parameters.
2. Use the ScopedDrizzleService for transactional database access via `runWithContext` - use for insert/update/delete workflows, and roll back
3. Use the ScopedDrizzleService via `db` for queries - no insert/update/delete workflows.
4. Factor DTO into .args.ts files.
5. Use NestJS Test Module to write tests. Aim for using our DBModule from @platform/nestjs-db, and it will automatically connect to our test database that automatically runs in tilt/CI/local.
6. Ensure that integration type tests can be run over and over without collision by writing integration tests that depend on their own ids.
7. For entities with globally unique constraints (like facility names), always append a UUID to test data names to prevent collisions between test runs. Example: `const facilityName = \`Test Facility \${uuidv4()}\`;`
8. Avoid N+1 database queries. Use batch operations instead of loops with database calls:
   - **Bad**: Looping through records and updating each one individually
     ```typescript
     for (const record of records) {
       await trx.update(entity).set({ field: value }).where(eq(entity.id, record.id));
     }
     ```
   - **Good**: Single UPDATE with WHERE conditions
     ```typescript
     await trx
       .update(entity)
       .set({ field: value })
       .where(and(inArray(entity.id, recordIds), isNull(entity.deletedAt)));
     ```
   - **Good**: Use `whereIn` or similar batch conditions when querying related data
   - **Good**: Leverage Drizzle's `with` for eager loading relationships instead of separate queries

## Workspace Package Management

For adding workspace packages to projects, see: [Adding Workspace Packages Guide](../docs/adding-workspace-packages.md)

## Backend

### Testing

Always write tests for your services.

#### Service Tests

```typescript
let module: TestingModule;
let myService: MyService;
let dbFactory: TestDrizzleService;

beforeEach(async () => {
  module = await Test.createTestingModule({
    imports: [
      DbModule.forRoot({
        drizzle: { schemas },
      }),
    ],
    providers: [MyService],
  }).compile();

  module.enableShutdownHooks();
  await module.init();

  myService = await module.resolve<MyService>(MyService);
  dbFactory = await module.resolve<TestDrizzleService>(SCOPED_DB_SERVICE_TOKEN);

  await dbFactory.beginTransaction();
});

afterEach(async () => {
  await dbFactory.rollbackTransaction();
  await module.close();
});
```

**⚠️ IMPORTANT: Always use `runWithContext` in tests**

Even in test code, you MUST use `runWithContext` when accessing the database:

```typescript
// ❌ WRONG - Don't do this in tests
const { db } = await dbFactory.getScopedDb();
await db.insert(myEntity).values({ ... });

// ✅ CORRECT - Always use runWithContext
const { runWithContext } = await dbFactory.getScopedDb();
await runWithContext(async (trx) => {
  await trx.insert(myEntity).values({ ... });
});
```

This ensures proper transaction handling and consistency between test code and production code.

2. Rely on transactions using the pattern from rule 1 to clean up all of the data created by services or by the test as we write/execute tests.

3. When setting up test data with mutations (insert/update/delete), always use `runWithContext` from the dbFactory instead of using `db` directly:

   ```typescript
   // ❌ Wrong - using db directly for mutations
   const { db } = await dbFactory.getScopedDb();
   await db.insert(entity).values({ ... });

   // ✅ Correct - using runWithContext for mutations
   const { runWithContext } = await dbFactory.getScopedDb();
   await runWithContext(async (trx) => {
     await trx.insert(entity).values({ ... });
   });
   ```

   This ensures test data mutations are created within the transaction scope and will be properly rolled back.

   Note: For read-only queries in tests, using `db` directly is acceptable as it's still within the transaction scope.

4. Always verify actual entity field names rather than assuming descriptive names

## General Stack

Typescript, GraphQL, GraphQLCodegen, Nx Monorepo, pnpm package manager and workspaces.

## Creating Reusable Components from Figma Designs

When implementing components from Figma designs, follow this approach to balance theme customization with component flexibility:

### 1. **Analyze the Design**

- Identify all states (default, hover, focus, error, disabled, etc.)
- Note custom elements not native to MUI (e.g., description text, special icons)
- Document spacing, colors, and typography requirements

### 2. **Component Structure**

Keep components simple and focused on unique features.

### 3. Aim for holistically defined components

- Use MUI components as building blocks (FormControl, FormLabel, etc.)
- Fully style the component so it is standalone

### 4. **Icon Hierarchy**

1. FontAwesome Pro icons (all sets available)
2. MUI icons as fallback
3. Custom SVGs only when necessary

### 5. **Testing Components**

- Always use SignatureThemeProvider from @platform/chorus-signature-theme in tests
- Be like Kent C Dodds - Prefer testing user behavior over styling
- Use `getAllByText` for elements that MUI might duplicate
- Check parent elements for MUI state classes

### 6. **Documentation**

Every reusable component needs:

- README with usage examples
- Props table with types and defaults
- Migration guide from native MUI
- Accessibility notes
- A Story
- Design link reference within the Story
  e.g.

```
const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    layout: 'padded',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/4ctWNymRT66GmXBrmnt2pO/HouseMD?node-id=35%3A12328',
    },
  },
  decorators: [
    (Story) => (
      <SignatureThemeProvider>
        <Story />
      </SignatureThemeProvider>
    ),
  ],
};
```

- A "docs" page within the `meta` of a Story.

### 7. **State Classes**

Leverage MUI's state classes instead of custom solutions:

- `Mui-disabled`
- `Mui-error`
- `Mui-focused`
- Custom classes like `Mui-readOnly` when needed

### 8. **CSS Best Practices**

Follow established patterns:

```tsx
const styles = {
  container: css({
    // Use CSS variables for dynamic values
    height: 'var(--dynamic-height, 44px)',
  }),
};

// Apply in component
<div
  css={styles.container}
  style={
    {
      '--dynamic-height': size === 'small' ? '36px' : '44px',
    } as React.CSSProperties
  }
/>;
```

### 9. **Component Flexibility**

- Don't assume defaults (like fullWidth)
- Support all MUI props unless explicitly overridden
- Preserve accessibility features
- Allow composition with other components

#### Testing Strategy

1. **Unit tests for theme functions**: Test style generation logic
2. **Integration tests**: Verify components receive correct styles
3. **State interaction tests**: Ensure all states work together

This ensures that as we add more component overrides, we maintain consistency and catch breaking changes early.

## MUI v6 Deprecated Props Migration

MUI v6 has deprecated several props in favor of the new `slotProps` API:

**Avoid using deprecated MUI properties**.

### ❌ Deprecated Props (Don't Use)

- `InputProps` → use `slotProps.input`
- `InputLabelProps` → use `slotProps.inputLabel`
- `FormHelperTextProps` → use `slotProps.formHelperText`
- `SelectDisplayProps` → use `slotProps.selectDisplay`

### ✅ Correct Usage with slotProps

```tsx
// ❌ Wrong - Using deprecated props
<TextField
  InputProps={{
    startAdornment: <Icon />,
    className: 'custom-input',
  }}
  InputLabelProps={{
    shrink: true,
  }}
  FormHelperTextProps={{
    className: 'custom-helper',
  }}
/>

// ✅ Correct - Using slotProps
<TextField
  slotProps={{
    input: {
      startAdornment: <Icon />,
      className: 'custom-input',
    },
    inputLabel: {
      shrink: true,
    },
    formHelperText: {
      className: 'custom-helper',
    },
  }}
/>
```
