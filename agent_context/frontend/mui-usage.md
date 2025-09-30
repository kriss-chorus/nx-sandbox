# MUI Component Usage

## MUI v6 Migration Guide

### Deprecated Props Migration

MUI v6 has deprecated several props in favor of the new `slotProps` API. **Always use the new API to avoid deprecation warnings.**

#### ❌ Deprecated Props (Don't Use)

- `InputProps` → use `slotProps.input`
- `InputLabelProps` → use `slotProps.inputLabel`
- `FormHelperTextProps` → use `slotProps.formHelperText`
- `SelectDisplayProps` → use `slotProps.selectDisplay`

#### ✅ Correct Usage with slotProps

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

### Select Component Migration

```tsx
// ❌ Wrong - Deprecated props
<Select
  SelectDisplayProps={{
    className: 'custom-display',
  }}
  MenuProps={{
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'left',
    },
  }}
/>

// ✅ Correct - Using slotProps
<Select
  slotProps={{
    selectDisplay: {
      className: 'custom-display',
    },
  }}
  MenuProps={{
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'left',
    },
  }}
/>
```

## Components to Avoid

### ❌ Don't Use These MUI Components

```tsx
// Don't use Box - use div
import { Box } from '@mui/material'; // ❌

// Don't use Grid - use Grid2
import { Grid } from '@mui/material'; // ❌

// ✅ Correct alternatives
<div>{/* Instead of Box */}</div>
<Grid2>{/* Instead of Grid */}</Grid2>
```

## Layout Components

### Grid2 Usage

Always use Grid2 for grid layouts:

```tsx
import { Grid2 } from '@mui/material';

export const Layout = () => (
  <Grid2 container spacing={2}>
    <Grid2 size={6}>{/* 50% width on all breakpoints */}</Grid2>
    <Grid2 size={{ xs: 12, md: 6 }}>{/* Responsive: 100% mobile, 50% desktop */}</Grid2>
  </Grid2>
);
```

### Stack Usage

Use Stack for simple flex layouts:

```tsx
import { Stack } from '@mui/material';

export const VerticalLayout = () => (
  <Stack spacing={2} direction="column">
    <Typography>Item 1</Typography>
    <Typography>Item 2</Typography>
  </Stack>
);

export const HorizontalLayout = () => (
  <Stack spacing={2} direction="row" alignItems="center">
    <Avatar />
    <Typography>User Name</Typography>
  </Stack>
);
```

## Typography

### Always Use Typography for Text

All text should be represented as MUI Typography. Try to use the default theme typography values.

```tsx
// ❌ Wrong - Raw text
<div>Welcome to our application</div>
<span>User: {userName}</span>

// ✅ Correct - Using Typography
<Typography variant="h4">Welcome to our application</Typography>
<Typography variant="body2">User: {userName}</Typography>
```

### Common Typography Variants

```tsx
// Headings
<Typography variant="h1">Page Title</Typography>
<Typography variant="h2">Section Title</Typography>
<Typography variant="h3">Subsection</Typography>
<Typography variant="h4">Card Title</Typography>
<Typography variant="h5">Small Heading</Typography>
<Typography variant="h6">Smallest Heading</Typography>

// Body Text
<Typography variant="body1">Default paragraph text</Typography>
<Typography variant="body2">Secondary text</Typography>

// Special Text
<Typography variant="subtitle1">Subtitle text</Typography>
<Typography variant="subtitle2">Smaller subtitle</Typography>
<Typography variant="caption">Caption text</Typography>
<Typography variant="overline">OVERLINE TEXT</Typography>
```

## Form Components

### FormControl Pattern

Use FormControl to group form elements:

```tsx
import { FormControl, FormLabel, FormHelperText } from '@mui/material';
import { TextField } from '@platform/signature-component-library';

export const FormField = () => (
  <FormControl fullWidth error={!!error}>
    <FormLabel>Field Label</FormLabel>
    <TextField value={value} onChange={handleChange} />
    <FormHelperText>{error || 'Helper text'}</FormHelperText>
  </FormControl>
);
```

### FormGroup for Checkboxes/Radios

```tsx
import { FormGroup, FormControlLabel, Checkbox } from '@mui/material';

export const CheckboxGroup = () => (
  <FormGroup>
    <FormControlLabel control={<Checkbox checked={option1} onChange={handleChange} />} label="Option 1" />
    <FormControlLabel control={<Checkbox checked={option2} onChange={handleChange} />} label="Option 2" />
  </FormGroup>
);
```

## Feedback Components

### Alert Usage

```tsx
import { Alert, AlertTitle } from '@mui/material';

// Basic alerts
<Alert severity="error">This is an error alert</Alert>
<Alert severity="warning">This is a warning alert</Alert>
<Alert severity="info">This is an info alert</Alert>
<Alert severity="success">This is a success alert</Alert>

// Alert with title
<Alert severity="error">
  <AlertTitle>Error</AlertTitle>
  This is an error alert with a title
</Alert>

// Dismissible alert
<Alert
  severity="info"
  onClose={() => setOpen(false)}
>
  This alert can be closed
</Alert>
```

### CircularProgress

```tsx
import { CircularProgress } from '@mui/material';

// Basic loading
<CircularProgress />

// With size
<CircularProgress size={24} />

// With custom color
<CircularProgress color="secondary" />

// Inside button
<Button disabled={loading}>
  {loading && <CircularProgress size={20} />}
  Save
</Button>
```

## Dialog Pattern

```tsx
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

export const ConfirmDialog = ({ open, onClose, onConfirm }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Confirm Action</DialogTitle>
    <DialogContent>
      <Typography>Are you sure you want to perform this action?</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} variant="contained">
        Confirm
      </Button>
    </DialogActions>
  </Dialog>
);
```

## Menu Pattern

```tsx
import { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { MoreVert } from '@mui/icons-material';

export const ActionMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <MoreVert />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleClose}>Edit</MenuItem>
        <MenuItem onClick={handleClose}>Delete</MenuItem>
        <MenuItem onClick={handleClose}>Share</MenuItem>
      </Menu>
    </>
  );
};
```

## Chip Usage

```tsx
import { Chip, Stack } from '@mui/material';

export const ChipExamples = () => (
  <Stack direction="row" spacing={1}>
    {/* Basic chip */}
    <Chip label="Basic" />

    {/* Clickable chip */}
    <Chip label="Clickable" onClick={() => {}} />

    {/* Deletable chip */}
    <Chip label="Deletable" onDelete={() => {}} />

    {/* With icon */}
    <Chip icon={<Avatar>A</Avatar>} label="With Avatar" />

    {/* Color variants */}
    <Chip label="Primary" color="primary" />
    <Chip label="Success" color="success" />
    <Chip label="Error" color="error" />

    {/* Size variants */}
    <Chip label="Small" size="small" />
    <Chip label="Medium" size="medium" />
  </Stack>
);
```

## Theme-Aware Components

### Using Theme Values

```tsx
import { useTheme } from '@mui/material/styles';

export const ThemedComponent = () => {
  const theme = useTheme();

  return (
    <div
      style={{
        padding: theme.spacing(2),
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
      }}
    >
      Content
    </div>
  );
};
```

### Responsive Values

```tsx
// Typography responsive
<Typography
  variant="h3"
  sx={{
    fontSize: {
      xs: '1.5rem',
      sm: '2rem',
      md: '2.5rem',
    }
  }}
>
  Responsive Heading
</Typography>

// Container responsive padding
<Container
  sx={{
    py: { xs: 2, sm: 3, md: 4 },
    px: { xs: 2, sm: 3 },
  }}
>
  Content
</Container>
```

## Common Patterns

### Loading State

```tsx
export const LoadingWrapper = ({ loading, children }) => {
  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" minHeight={200}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading...
        </Typography>
      </Stack>
    );
  }

  return <>{children}</>;
};
```

### Empty State

```tsx
export const EmptyState = ({ message = 'No data available' }) => (
  <Stack alignItems="center" justifyContent="center" minHeight={200} spacing={2}>
    <Typography variant="h6" color="text.secondary">
      {message}
    </Typography>
    <Button variant="contained" startIcon={<Add />}>
      Add New Item
    </Button>
  </Stack>
);
```

### Error State

```tsx
export const ErrorState = ({ error, onRetry }) => (
  <Alert
    severity="error"
    action={
      <Button color="inherit" size="small" onClick={onRetry}>
        Retry
      </Button>
    }
  >
    <AlertTitle>Error</AlertTitle>
    {error.message || 'An unexpected error occurred'}
  </Alert>
);
```

## Best Practices

1. **Always prefer @platform/signature-component-library** when available
2. **Use Typography for all text** - no raw text elements
3. **Use Grid2 instead of Grid** - Grid is deprecated
4. **Use div instead of Box** - Box adds unnecessary abstraction
5. **Use theme values** for spacing, colors, and breakpoints
6. **Keep MUI imports organized** and separate from other imports
7. **Use proper semantic variants** for Typography
8. **Leverage MUI's responsive utilities** for adaptive layouts
