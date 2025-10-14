import { ThemeOptions } from '@mui/material/styles';

import { baseTheme } from './baseTheme';

export const premiumTheme: ThemeOptions = {
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#bd93f9', // Dracula purple accent
      light: '#d1a3ff',
      dark: '#a373e6',
    },
    secondary: {
      main: '#ff79c6', // Dracula pink
      light: '#ffa3d1',
      dark: '#e64fb3',
    },
    background: {
      default: '#282a36', // Dracula background
      paper: '#44475a', // Dracula current line
    },
    text: {
      primary: '#f8f8f2', // Dracula foreground
      secondary: '#6272a4', // Dracula comment
    },
    divider: '#6272a4',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #6272a4',
        },
        // Only make dashboard list cards slightly darker
        elevation1: {
          backgroundColor: '#3a3c4e', // Slightly darker than the default #44475a
        },
      },
    },
    // Keep icon buttons more visible
    MuiIconButton: {
      styleOverrides: {
        root: {
          backgroundColor: '#44475a', // Slightly lighter for better visibility
          '&:hover': {
            backgroundColor: '#4a4d61',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          background: 'linear-gradient(45deg, #bd93f9 30%, #ff79c6 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #a373e6 30%, #e64fb3 90%)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#44475a',
          color: '#f8f8f2',
          '&.MuiChip-colorPrimary': {
            backgroundColor: '#bd93f9',
            color: '#282a36',
          },
        },
      },
    },
  },
};

