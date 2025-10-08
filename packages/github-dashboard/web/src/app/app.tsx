import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Dashboard } from './components/dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';

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
          <Route path="/" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/dashboard/:dashboardSlug" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
        </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;
