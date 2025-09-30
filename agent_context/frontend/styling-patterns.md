# CSS & Styling Patterns

## Overview

This project uses **Emotion React with the css prop**. We follow Emotion best practices with CSS variables for dynamic styling.

## Core Principles

1. **Use Emotion React css prop** - Don't use sx prop
2. **Define styles using a styles object** - No usage of styled components
3. **Use CSS variables for dynamic styles** - Never use functions for styling
4. **Use MUI spacing and shape CSS variables** - Leverage the theme system

## Basic Styling Pattern

### ✅ Correct Pattern

```tsx
import { css } from '@emotion/react';

const styles = {
  container: css({
    padding: 'var(--mui-spacing-2)',
    borderRadius: 'var(--mui-shape-borderRadius)',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease',

    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.08)',
    },
  }),

  title: css({
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: 'var(--mui-spacing-1)',
    color: 'rgba(0, 0, 0, 0.87)',
  }),

  content: css({
    padding: 'var(--mui-spacing-3)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--mui-spacing-2)',
  }),
};

export const MyComponent = () => {
  return (
    <div css={styles.container}>
      <h2 css={styles.title}>Title</h2>
      <div css={styles.content}>Content goes here</div>
    </div>
  );
};
```

### ❌ Wrong Patterns

```tsx
// Wrong - Using sx prop
<Box sx={{ padding: 2 }}>Content</Box>;

// Wrong - Using styled components
const StyledDiv = styled.div`
  padding: 16px;
`;

// Wrong - Using makeStyles (deprecated)
const useStyles = makeStyles(() => ({
  root: { padding: 16 },
}));

// Wrong - Function-based styles
const styles = {
  container: (isActive: boolean) =>
    css({
      backgroundColor: isActive ? 'blue' : 'gray',
    }),
};
```

## Dynamic Styles with CSS Variables

### The CSS Variable Pattern

Use CSS variables with fallback values for dynamic styling:

```tsx
// ✅ Correct - CSS variables with fallbacks
const styles = {
  container: css({
    // Use var() with fallback for defaults
    height: 'var(--dynamic-height, 44px)',
    color: 'var(--dynamic-color, rgba(0, 0, 0, 0.6))',
    backgroundColor: 'var(--dynamic-bg, transparent)',
    padding: 'var(--dynamic-padding, var(--mui-spacing-2))',
  }),

  button: css({
    minWidth: 'var(--button-width, 120px)',
    fontSize: 'var(--button-font-size, 0.875rem)',
    borderRadius: 'var(--button-radius, var(--mui-shape-borderRadius))',
  }),
};

// In component - only set the CSS variable when needed
export const DynamicComponent = ({ size, variant, isActive }) => {
  return (
    <div
      css={styles.container}
      style={
        {
          '--dynamic-height': size === 'small' ? '36px' : '44px',
          '--dynamic-color': isActive ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.6)',
          '--dynamic-bg': variant === 'filled' ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
        } as React.CSSProperties
      }
    >
      <button
        css={styles.button}
        style={
          {
            '--button-width': size === 'large' ? '200px' : '120px',
            '--button-font-size': size === 'small' ? '0.75rem' : '0.875rem',
          } as React.CSSProperties
        }
      >
        Click me
      </button>
    </div>
  );
};
```

### Complex Dynamic Styles

```tsx
const styles = {
  card: css({
    border: '1px solid var(--card-border-color, rgba(0, 0, 0, 0.12))',
    backgroundColor: 'var(--card-bg, var(--mui-palette-background-paper))',
    boxShadow: 'var(--card-shadow, none)',
    transform: 'var(--card-transform, none)',
    transition: 'all 0.3s ease',

    '&:hover': {
      boxShadow: 'var(--card-hover-shadow, 0 4px 8px rgba(0, 0, 0, 0.1))',
      transform: 'var(--card-hover-transform, translateY(-2px))',
    },
  }),
};

export const InteractiveCard = ({ elevated, highlighted, interactive }) => {
  return (
    <div
      css={styles.card}
      style={
        {
          '--card-border-color': highlighted ? 'var(--mui-palette-primary-main)' : 'rgba(0, 0, 0, 0.12)',
          '--card-bg': highlighted ? 'rgba(25, 118, 210, 0.08)' : 'var(--mui-palette-background-paper)',
          '--card-shadow': elevated ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
          '--card-hover-shadow': interactive ? '0 8px 16px rgba(0, 0, 0, 0.15)' : '0 4px 8px rgba(0, 0, 0, 0.1)',
          '--card-hover-transform': interactive ? 'translateY(-4px)' : 'translateY(-2px)',
        } as React.CSSProperties
      }
    >
      Card content
    </div>
  );
};
```

## MUI Theme Variables

### Spacing Variables

Always use MUI spacing CSS variables from the Signature Theme:

```tsx
const styles = {
  container: css({
    // Use MUI spacing variables
    padding: 'var(--mui-spacing-2)', // 16px
    margin: 'var(--mui-spacing-1) var(--mui-spacing-2)',
    gap: 'var(--mui-spacing-3)', // 24px

    // Responsive spacing
    paddingTop: 'var(--mui-spacing-4)', // 32px
    paddingBottom: 'var(--mui-spacing-4)',

    // Negative margins
    marginTop: 'calc(-1 * var(--mui-spacing-2))',
  }),
};
```

Common spacing values:

- `--mui-spacing-0.5` = 4px
- `--mui-spacing-1` = 8px
- `--mui-spacing-2` = 16px
- `--mui-spacing-3` = 24px
- `--mui-spacing-4` = 32px
- `--mui-spacing-5` = 40px

### Shape Variables

Use borderRadius CSS variables from the theme:

```tsx
const styles = {
  card: css({
    borderRadius: 'var(--mui-shape-borderRadius)', // Default radius
  }),

  button: css({
    borderRadius: 'var(--mui-shape-borderRadius-small)', // Smaller radius
  }),

  dialog: css({
    borderRadius: 'var(--mui-shape-borderRadius-large)', // Larger radius
  }),

  circular: css({
    borderRadius: '50%', // Full circle
  }),
};
```

### Color Usage

Always use rgba() / rgb() for all color definitions:

```tsx
const styles = {
  // ✅ Correct - Using rgba/rgb
  container: css({
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    color: 'rgb(33, 33, 33)',
    borderColor: 'rgba(0, 0, 0, 0.12)',
  }),

  // ❌ Wrong - Using other color schemes
  wrongContainer: css({
    backgroundColor: '#f5f5f5', // Don't use hex
    color: 'hsl(0, 0%, 20%)', // Don't use hsl
    borderColor: 'gray', // Don't use named colors
  }),
};
```

## Responsive Styles

### Media Queries with Emotion

```tsx
const styles = {
  container: css({
    padding: 'var(--mui-spacing-2)',

    '@media (min-width: 600px)': {
      padding: 'var(--mui-spacing-3)',
    },

    '@media (min-width: 960px)': {
      padding: 'var(--mui-spacing-4)',
    },

    '@media (min-width: 1280px)': {
      padding: 'var(--mui-spacing-5)',
    },
  }),

  grid: css({
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 'var(--mui-spacing-2)',

    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },

    '@media (min-width: 1024px)': {
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 'var(--mui-spacing-3)',
    },
  }),
};
```

### Responsive CSS Variables

```tsx
const styles = {
  text: css({
    fontSize: 'var(--responsive-font-size, 1rem)',
    lineHeight: 'var(--responsive-line-height, 1.5)',
  }),
};

export const ResponsiveText = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <p
      css={styles.text}
      style={
        {
          '--responsive-font-size': windowWidth < 768 ? '0.875rem' : '1rem',
          '--responsive-line-height': windowWidth < 768 ? '1.4' : '1.6',
        } as React.CSSProperties
      }
    >
      Responsive text
    </p>
  );
};
```

## Component Styles Organization

### Styles File Structure

For complex components, organize styles in separate files:

```tsx
// FacilityCard.styles.ts
import { css } from '@emotion/react';

export const facilityCardStyles = {
  container: css({
    padding: 'var(--mui-spacing-3)',
    borderRadius: 'var(--mui-shape-borderRadius)',
    backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 1))',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
    transition: 'box-shadow 0.3s ease',

    '&:hover': {
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15)',
    },
  }),

  header: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--mui-spacing-2)',
  }),

  title: css({
    fontSize: '1.125rem',
    fontWeight: 600,
    color: 'rgba(0, 0, 0, 0.87)',
    margin: 0,
  }),

  content: css({
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: 1.6,
  }),

  actions: css({
    display: 'flex',
    gap: 'var(--mui-spacing-1)',
    marginTop: 'var(--mui-spacing-2)',
    paddingTop: 'var(--mui-spacing-2)',
    borderTop: '1px solid rgba(0, 0, 0, 0.12)',
  }),
};

// FacilityCard.tsx
import { facilityCardStyles as styles } from './FacilityCard.styles';

export const FacilityCard = ({ facility, onEdit, onDelete }) => {
  return (
    <div css={styles.container}>
      <div css={styles.header}>
        <h3 css={styles.title}>{facility.name}</h3>
        <IconButton size="small" onClick={() => onEdit(facility.id)}>
          <EditIcon />
        </IconButton>
      </div>
      <div css={styles.content}>{facility.description}</div>
      <div css={styles.actions}>
        <Button size="small">View Details</Button>
        <Button size="small" color="error" onClick={() => onDelete(facility.id)}>
          Delete
        </Button>
      </div>
    </div>
  );
};
```

## Animation Patterns

```tsx
const styles = {
  fadeIn: css({
    animation: 'fadeIn 0.3s ease-in',

    '@keyframes fadeIn': {
      from: {
        opacity: 0,
        transform: 'translateY(10px)',
      },
      to: {
        opacity: 1,
        transform: 'translateY(0)',
      },
    },
  }),

  slideIn: css({
    animation: 'slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',

    '@keyframes slideIn': {
      from: {
        transform: 'translateX(-100%)',
      },
      to: {
        transform: 'translateX(0)',
      },
    },
  }),

  pulse: css({
    animation: 'pulse 2s infinite',

    '@keyframes pulse': {
      '0%': {
        transform: 'scale(1)',
      },
      '50%': {
        transform: 'scale(1.05)',
      },
      '100%': {
        transform: 'scale(1)',
      },
    },
  }),
};
```

## Best Practices Summary

1. **Always use css prop** - Never use sx or styled components
2. **Define styles objects** - Keep styles organized and reusable
3. **Use CSS variables for dynamic values** - With sensible fallbacks
4. **Leverage MUI theme variables** - For consistency
5. **Use rgba/rgb colors only** - No hex, hsl, or named colors
6. **Organize complex styles** - Separate files for large components
7. **Avoid inline styles** - Except for CSS variable assignments
8. **Use semantic style names** - Make styles self-documenting
9. **Group related styles** - Keep container, header, content together
10. **Comment complex styles** - Explain non-obvious CSS
