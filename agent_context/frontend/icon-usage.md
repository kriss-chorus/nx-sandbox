# Icon Usage

## Icon Hierarchy

Always follow this hierarchy when selecting icons:

1. **First choice**: FontAwesome Pro icons (we have access to all Pro icon sets)
2. **Second choice**: MUI icons if FontAwesome doesn't have the needed icon
3. **Last resort**: Write custom SVGs only if neither library has the icon

## FontAwesome Pro Icons

We have access to all FontAwesome Pro icon sets. Always prefer these for consistency.

### Import Pattern

```tsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation } from '@fortawesome/pro-solid-svg-icons';
import { faCircleExclamation as faCircleExclamationRegular } from '@fortawesome/pro-regular-svg-icons';
import { faCircleExclamation as faCircleExclamationLight } from '@fortawesome/pro-light-svg-icons';
import { faCircleExclamation as faCircleExclamationThin } from '@fortawesome/pro-thin-svg-icons';
import { faCircleExclamation as faCircleExclamationDuotone } from '@fortawesome/pro-duotone-svg-icons';
```

### Available Icon Sets

- `@fortawesome/pro-solid-svg-icons` - Solid style (filled icons)
- `@fortawesome/pro-regular-svg-icons` - Regular style (outlined icons)
- `@fortawesome/pro-light-svg-icons` - Light style (thin outlined icons)
- `@fortawesome/pro-thin-svg-icons` - Thin style (very thin outlined icons)
- `@fortawesome/pro-duotone-svg-icons` - Duotone style (two-color icons)

### Basic Usage

```tsx
// ✅ Correct - Using FontAwesome Pro
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faHome, faSearch } from '@fortawesome/pro-solid-svg-icons';
import { faBell } from '@fortawesome/pro-regular-svg-icons';

export const IconExamples = () => (
  <>
    {/* Basic usage */}
    <FontAwesomeIcon icon={faUser} />

    {/* With size */}
    <FontAwesomeIcon icon={faHome} size="lg" />

    {/* With custom color */}
    <FontAwesomeIcon icon={faSearch} color="rgba(25, 118, 210, 1)" />

    {/* With rotation */}
    <FontAwesomeIcon icon={faBell} rotation={90} />

    {/* As button icon */}
    <Button startIcon={<FontAwesomeIcon icon={faUser} />}>Profile</Button>
  </>
);
```

### Icon Sizes

FontAwesome provides predefined sizes:

```tsx
// Size options: xs, sm, lg, 1x, 2x, 3x, 4x, 5x, 6x, 7x, 8x, 9x, 10x
<FontAwesomeIcon icon={faUser} size="xs" />  // Extra small
<FontAwesomeIcon icon={faUser} size="sm" />  // Small
<FontAwesomeIcon icon={faUser} />           // Default (1x)
<FontAwesomeIcon icon={faUser} size="lg" />  // Large
<FontAwesomeIcon icon={faUser} size="2x" />  // 2x size
<FontAwesomeIcon icon={faUser} size="3x" />  // 3x size
```

### Advanced Styling

```tsx
import { css } from '@emotion/react';

const styles = {
  icon: css({
    transition: 'all 0.3s ease',
    cursor: 'pointer',

    '&:hover': {
      transform: 'scale(1.1)',
      color: 'var(--mui-palette-primary-main)',
    },
  }),
};

export const StyledIcon = () => (
  <span css={styles.icon}>
    <FontAwesomeIcon icon={faHeart} />
  </span>
);
```

### Common FontAwesome Icons

```tsx
// Navigation
import { faHome, faBars, faChevronLeft, faChevronRight } from '@fortawesome/pro-solid-svg-icons';

// Actions
import { faEdit, faTrash, faPlus, faSave, faDownload } from '@fortawesome/pro-solid-svg-icons';

// Status
import { faCheck, faTimes, faExclamationTriangle, faInfoCircle } from '@fortawesome/pro-solid-svg-icons';

// User
import { faUser, faUsers, faUserPlus, faSignOut } from '@fortawesome/pro-solid-svg-icons';

// Communication
import { faEnvelope, faPhone, faComment, faBell } from '@fortawesome/pro-regular-svg-icons';

// Data
import { faDatabase, faFile, faFolder, faImage } from '@fortawesome/pro-solid-svg-icons';
```

## MUI Icons (Fallback)

Only use MUI icons when FontAwesome doesn't have the icon you need.

### Import Pattern

```tsx
// ✅ Use only when FontAwesome doesn't have the icon
import { Search, Email, Phone } from '@mui/icons-material';

// ❌ Wrong - FontAwesome has these icons
import { Home, User, Settings } from '@mui/icons-material';
```

### MUI Icon Usage

```tsx
import { Visibility, VisibilityOff } from '@mui/icons-material';

export const PasswordField = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField
      type={showPassword ? 'text' : 'password'}
      slotProps={{
        input: {
          endAdornment: <IconButton onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton>,
        },
      }}
    />
  );
};
```

## Icon Button Patterns

### With FontAwesome

```tsx
import { IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faEdit, faTrash } from '@fortawesome/pro-solid-svg-icons';

export const ActionButtons = () => (
  <>
    <IconButton size="small" aria-label="edit">
      <FontAwesomeIcon icon={faEdit} />
    </IconButton>

    <IconButton size="small" color="error" aria-label="delete">
      <FontAwesomeIcon icon={faTrash} />
    </IconButton>

    <IconButton aria-label="more options">
      <FontAwesomeIcon icon={faEllipsisV} />
    </IconButton>
  </>
);
```

### Icon Sizes in Buttons

```tsx
const styles = {
  smallIcon: css({
    fontSize: '0.875rem',
  }),
  largeIcon: css({
    fontSize: '1.5rem',
  }),
};

export const SizedIconButtons = () => (
  <>
    <IconButton size="small">
      <span css={styles.smallIcon}>
        <FontAwesomeIcon icon={faEdit} />
      </span>
    </IconButton>

    <IconButton size="large">
      <span css={styles.largeIcon}>
        <FontAwesomeIcon icon={faEdit} />
      </span>
    </IconButton>
  </>
);
```

## Custom SVG Icons (Last Resort)

Only create custom SVGs when neither FontAwesome nor MUI has the icon.

### Custom SVG Component

```tsx
// CustomIcon.tsx
export const CustomLogoIcon = (props: { size?: number; color?: string }) => {
  const { size = 24, color = 'currentColor' } = props;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Usage
<CustomLogoIcon size={32} color="rgba(25, 118, 210, 1)" />;
```

### SVG Icon with Emotion

```tsx
const styles = {
  customIcon: css({
    width: 24,
    height: 24,
    fill: 'currentColor',
    transition: 'all 0.3s ease',

    '&:hover': {
      transform: 'rotate(360deg)',
    },
  }),
};

export const AnimatedCustomIcon = () => (
  <svg css={styles.customIcon} viewBox="0 0 24 24">
    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" />
  </svg>
);
```

## Icon Accessibility

Always include proper accessibility attributes:

```tsx
// ✅ Correct - With aria-label
<IconButton aria-label="delete item">
  <FontAwesomeIcon icon={faTrash} />
</IconButton>

// ✅ Correct - Decorative icon with aria-hidden
<span aria-hidden="true">
  <FontAwesomeIcon icon={faCheckCircle} />
</span>
<span>Success message</span>

// ✅ Correct - Icon with text
<Button startIcon={<FontAwesomeIcon icon={faSave} />}>
  Save Changes
</Button>
```

## Icon Color Patterns

```tsx
// Using theme colors
<FontAwesomeIcon
  icon={faExclamationTriangle}
  color="var(--mui-palette-warning-main)"
/>

// Using rgba colors
<FontAwesomeIcon
  icon={faCheckCircle}
  color="rgba(76, 175, 80, 1)"
/>

// Conditional colors
<FontAwesomeIcon
  icon={faCircle}
  color={isActive ? 'rgba(25, 118, 210, 1)' : 'rgba(0, 0, 0, 0.3)'}
/>
```

## Common Icon Patterns

### Status Icons

```tsx
const StatusIcon = ({ status }: { status: 'success' | 'warning' | 'error' | 'info' }) => {
  const iconMap = {
    success: { icon: faCheckCircle, color: 'rgba(76, 175, 80, 1)' },
    warning: { icon: faExclamationTriangle, color: 'rgba(255, 152, 0, 1)' },
    error: { icon: faTimesCircle, color: 'rgba(244, 67, 54, 1)' },
    info: { icon: faInfoCircle, color: 'rgba(33, 150, 243, 1)' },
  };

  const { icon, color } = iconMap[status];

  return <FontAwesomeIcon icon={icon} color={color} />;
};
```

### Loading Icons

```tsx
import { faSpinner } from '@fortawesome/pro-solid-svg-icons';

export const LoadingIcon = () => <FontAwesomeIcon icon={faSpinner} spin size="2x" color="var(--mui-palette-primary-main)" />;
```

### Icon with Badge

```tsx
import { Badge } from '@mui/material';
import { faBell } from '@fortawesome/pro-regular-svg-icons';

export const NotificationIcon = ({ count }: { count: number }) => (
  <Badge badgeContent={count} color="error">
    <FontAwesomeIcon icon={faBell} />
  </Badge>
);
```

## Best Practices

1. **Always check FontAwesome first** - It has the most comprehensive icon set
2. **Use consistent icon styles** - Don't mix solid and regular unnecessarily
3. **Include aria-labels** - For standalone icon buttons
4. **Use semantic colors** - Match icon colors to their meaning
5. **Size icons appropriately** - Use FontAwesome's size prop or CSS
6. **Avoid inline SVGs** - Create reusable components for custom icons
7. **Test icon visibility** - Ensure icons are visible in all themes
8. **Document custom icons** - Explain why a custom icon was needed
9. **Use icon fonts efficiently** - Import only the icons you need
10. **Maintain icon consistency** - Use the same icon for the same action throughout the app
