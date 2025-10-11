import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { ClientSelectionPage } from './pages/ClientSelectionPage';
import { DashboardDetailPage } from './pages/DashboardDetailPage';
import { DashboardListPage } from './pages/DashboardListPage';

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
          <Route path="/" element={<ClientSelectionPage />} />
          <Route path="/dashboards" element={<DashboardListPage />} />
          <Route path="/dashboard/:dashboardSlug" element={<DashboardDetailPage />} />
        </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;
