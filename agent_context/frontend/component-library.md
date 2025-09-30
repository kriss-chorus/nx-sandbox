# Component Library Usage

## Overview

**IMPORTANT**: Always prefer `@platform/signature-component-library` over Material UI when an equivalent component exists. This is a critical architectural decision for consistency and customization.

## Decision Tree for Component Selection

### 1. Check @platform/signature-component-library First

Does the component exist in @platform/signature-component-library?

- **YES** → Use @platform/signature-component-library version
- **NO** → Continue to step 2

### 2. Check if it's a Composite Component

Can it be built using @platform/signature-component-library components?

- **YES** → Build using @platform/signature-component-library as building blocks
- **NO** → Use Material UI

### 3. When to Use Material UI

Use MUI only for:

- Layout components (Grid2, Stack)
- Typography (unless @platform/signature-component-library has specific variant)
- Components not available in @platform/signature-component-library yet (Dialog, Modal, Chip, etc.)
- Form utilities (FormControl, FormLabel, FormHelperText)

## Import Examples

### ✅ Correct Usage

```tsx
// Using @platform/signature-component-library for available components
import { TextField, SearchButton, CardContainer, Select, PhoneNumberTextField } from '@platform/signature-component-library';

// Using MUI only when necessary
import { Grid2, Stack, Typography, Dialog, Chip } from '@mui/material';
```

### ❌ Wrong Usage

```tsx
// Wrong - Using MUI when @platform/signature-component-library has equivalent
import { TextField, Card } from '@mui/material';

// Wrong - Inconsistent usage
import { Select } from '@mui/material';
import { TextField } from '@platform/signature-component-library';
```

## Quick Reference Guide

### @platform/signature-component-library Components (PREFER THESE)

```typescript
import {
  // Form inputs
  TextField, // Use for all text inputs
  PhoneNumberTextField, // Use for phone numbers
  Select, // Use for dropdowns

  // Buttons
  SearchButton, // Search functionality

  // Containers
  CardContainer, // Card layouts

  // Add other available components as discovered
} from '@platform/signature-component-library';
```

### Material UI Components (USE ONLY WHEN NO @platform/signature-component-library EQUIVALENT)

```typescript
import {
  // Layout (always from MUI)
  Grid2,
  Stack,

  // Typography (usually from MUI)
  Typography,

  // Components without @platform/signature-component-library equivalents
  Dialog,
  Modal,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Collapse,
  CircularProgress,
  Alert,
  Snackbar,

  // Form utilities (often needed with @platform/signature-component-library components)
  FormControl,
  FormLabel,
  FormHelperText,
  InputLabel,
  FormGroup,
} from '@mui/material';
```

## Mixed Usage Patterns

Mixed usage is acceptable and often necessary:

```tsx
// ✅ Correct - Using both libraries appropriately
import { TextField, Select } from '@platform/signature-component-library';
import { Typography, Chip, Grid2 } from '@mui/material';

export const UserForm = () => {
  return (
    <Grid2 container spacing={2}>
      <Grid2 size={12}>
        <Typography variant="h5">User Information</Typography>
      </Grid2>
      <Grid2 size={6}>
        <TextField label="Name" placeholder="Enter your name" />
      </Grid2>
      <Grid2 size={6}>
        <Select label="Role" options={roleOptions} />
      </Grid2>
      <Grid2 size={12}>
        <Chip label="Active" color="success" />
      </Grid2>
    </Grid2>
  );
};
```

## Component Migration Examples

### Migrating from MUI TextField

```tsx
// ❌ Before - Using MUI TextField
import { TextField } from '@mui/material';

<TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} error={!!errors.email} helperText={errors.email} />;

// ✅ After - Using @platform/signature-component-library TextField
import { TextField } from '@platform/signature-component-library';

<TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} error={!!errors.email} helperText={errors.email} />;
```

### Building Composite Components

```tsx
// ✅ Using @platform/signature-component-library as building blocks
import { TextField, Select } from '@platform/signature-component-library';
import { Grid2, Typography } from '@mui/material';

export const AddressForm = () => {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        Address Information
      </Typography>
      <Grid2 container spacing={2}>
        <Grid2 size={12}>
          <TextField label="Street Address" placeholder="123 Main St" fullWidth />
        </Grid2>
        <Grid2 size={6}>
          <TextField label="City" placeholder="New York" />
        </Grid2>
        <Grid2 size={6}>
          <Select label="State" options={stateOptions} />
        </Grid2>
      </Grid2>
    </>
  );
};
```

## Common Import Mistakes to Avoid

### 1. Wrong TextField Import

```tsx
// ❌ WRONG - Importing TextField from MUI
import { TextField } from '@mui/material';

// ✅ CORRECT - Importing TextField from @platform/signature-component-library
import { TextField } from '@platform/signature-component-library';
```

### 2. Inconsistent Select Usage

```tsx
// ❌ WRONG - Mixed imports when both are available in @platform/signature-component-library
import { Select } from '@mui/material';
import { TextField } from '@platform/signature-component-library';

// ✅ CORRECT - Consistent use of @platform/signature-component-library
import { Select, TextField } from '@platform/signature-component-library';
```

### 3. Using MUI When Building Forms

```tsx
// ❌ WRONG - Using all MUI for forms
import { TextField, Select, FormControl } from '@mui/material';

// ✅ CORRECT - @platform/signature-component-library for inputs, MUI for utilities
import { TextField, Select } from '@platform/signature-component-library';
import { FormControl, FormLabel } from '@mui/material';
```

## Integration with MUI Theme

@platform/signature-component-library components are designed to work seamlessly with the MUI theme system:

```tsx
import { SignatureThemeProvider } from '@platform/chorus-signature-theme';
import { TextField } from '@platform/signature-component-library';

export const App = () => (
  <SignatureThemeProvider>
    <TextField
      label="Themed Input"
      // Automatically uses theme tokens
    />
  </SignatureThemeProvider>
);
```

## Checking Component Availability

When unsure if a component exists in @platform/signature-component-library:

1. Check the component library's exports
2. Look for Storybook documentation
3. Review the component library's source code
4. If not found, use MUI equivalent

## Best Practices

1. **Always import from @platform/signature-component-library first**
2. **Keep imports organized** - Group @platform/signature-component-library imports separately from MUI
3. **Document when using MUI** - Add comments explaining why MUI was chosen if non-obvious
4. **Stay consistent within a feature** - Don't mix TextField implementations in the same form
5. **Update imports during refactoring** - When new components are added to @platform/signature-component-library, migrate from MUI

## Future-Proofing

As more components are added to @platform/signature-component-library:

1. Regularly check for new components
2. Plan migration from MUI components when equivalents become available
3. Contribute to @platform/signature-component-library when custom components are needed
4. Keep this documentation updated with new components
