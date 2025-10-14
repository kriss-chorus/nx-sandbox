import { ThemeOptions } from '@mui/material/styles';

import { baseTheme } from './baseTheme';

export const basicTheme: ThemeOptions = {
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#ff7043', // Coral orange for basic tier
    },
    secondary: {
      main: '#ff5722', // Deeper orange accent
    },
    background: {
      default: '#fff8f6', // Very light coral tint
      paper: '#ffffff',
    },
    text: {
      primary: '#ff7043', // Coral text
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ff7043',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
};

