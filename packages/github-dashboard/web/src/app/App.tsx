import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';

import { ClientProvider, useClientContext } from './context/ClientContext';
import { ClientSelectionPage } from './pages/ClientSelectionPage';
import { DashboardDetailPage } from './pages/DashboardDetailPage';
import { DashboardListPage } from './pages/DashboardListPage';
import { createTierTheme } from './theme';

function AppContent() {
  const { activeClient } = useClientContext();
  const location = useLocation();

  // Determine theme based on route and client selection
  let tierType: 'neutral' | 'basic' | 'premium' = 'neutral';

  if (location.pathname === '/') {
    // Client selection page - use neutral theme
    tierType = 'neutral';
  } else if (activeClient) {
    // Dashboard pages - use client's tier theme
    tierType = activeClient.tierTypeByTierTypeId.code === 'premium' ? 'premium' : 'basic';
  } else {
    // Fallback to neutral
    tierType = 'neutral';
  }

  const theme = createTierTheme(tierType);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<ClientSelectionPage />} />
        <Route path="/dashboards" element={<DashboardListPage />} />
        <Route path="/dashboard/:dashboardSlug" element={<DashboardDetailPage />} />
      </Routes>
    </ThemeProvider>
  );
}

export function App() {
  return (
    <Router>
      <ClientProvider>
        <AppContent />
      </ClientProvider>
    </Router>
  );
}

export default App;