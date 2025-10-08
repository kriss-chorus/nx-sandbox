import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useDashboardDataPostGraphile } from '../hooks/useDashboardDataPostGraphile';
import { useClientData } from '../hooks/useClientData';
import { DashboardList } from '../components/dashboard/DashboardList';
import { CreateDashboardDialog } from '../components/dashboard/modals';
import { Dashboard as DashboardType } from '../types/dashboard';

export const DashboardListPage: React.FC = (): React.ReactElement => {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Client data - get the active client from localStorage
  const { 
    activeClient, 
    loading: clientsLoading
  } = useClientData();

  // Dashboard data filtered by client
  const { dashboards, loading: dashboardsLoading } = useDashboardDataPostGraphile(
    undefined, // no specific dashboard slug
    activeClient?.id || undefined
  );

  const handleViewDashboard = (dashboard: DashboardType) => {
    navigate(`/dashboard/${dashboard.slug}`);
  };

  const handleCreateDashboard = (dashboardData: any) => {
    // TODO: Implement dashboard creation
    console.log('Create dashboard:', dashboardData);
    setCreateDialogOpen(false);
  };

  if (clientsLoading || dashboardsLoading) {
    return <div>Loading...</div>;
  }

  // If no client is selected, redirect to home
  if (!activeClient) {
    navigate('/');
    return null;
  }

  return (
    <Box sx={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header with back button and client info */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          variant="outlined"
        >
          Back to Client Selection
        </Button>
        <Typography variant="h4" component="h1">
          {activeClient.name} Dashboards
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          ({activeClient.tierTypeByTierTypeId?.name || 'Unknown'} Plan)
        </Typography>
      </Box>
      
      {/* Dashboard List */}
      <DashboardList
        dashboards={dashboards}
        onCreateDashboard={() => setCreateDialogOpen(true)}
        onViewDashboard={handleViewDashboard}
      />

      {/* Create Dashboard Dialog */}
      <CreateDashboardDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSave={handleCreateDashboard}
      />
    </Box>
  );
};
