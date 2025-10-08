import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Dashboard } from './components/Dashboard';
import { PostGraphileDashboard } from './components/PostGraphileDashboard';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          <Route path="/" element={<PostGraphileDashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/dashboard/:slug" element={<PostGraphileDashboard />} />
          <Route path="/legacy" element={<Dashboard />} />
          <Route path="/legacy/dashboard/:dashboardSlug" element={<Dashboard />} />
        </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;
