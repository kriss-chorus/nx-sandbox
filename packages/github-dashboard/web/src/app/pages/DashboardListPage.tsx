import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useDashboardDataPostGraphile, useDashboardCRUD } from '../hooks/useDashboardDataPostGraphile';
import { useClientData } from '../hooks/useClientData';
import { DashboardList } from '../components/dashboard';
import { CreateDashboardDialog } from '../components/dashboard';
import { DashboardConfigModal } from '../components/dashboard';
import { Dashboard as DashboardType } from '../types/dashboard';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

export const DashboardListPage: React.FC = (): React.ReactElement => {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [newDashboardId, setNewDashboardId] = useState<string | null>(null);

  // Client data - get the active client from localStorage
  const { 
    activeClient, 
    loading: clientsLoading,
    error: clientsError
  } = useClientData();

  // Dashboard data filtered by client
  const { dashboards, loading: dashboardsLoading, error: dashboardsError } = useDashboardDataPostGraphile(
    undefined, // no specific dashboard slug
    activeClient?.id || undefined
  );

  const { createDashboard, loading: creating, error: createError, saveActivityConfiguration } = useDashboardCRUD();

  const handleViewDashboard = (dashboard: DashboardType) => {
    navigate(`/dashboard/${dashboard.slug}`);
  };

  const slugify = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const handleCreateDashboard = async (name: string, description: string) => {
    try {
      const slug = slugify(name);
      const created = await createDashboard({ 
        name, 
        slug, 
        description, 
        isPublic: true,
        clientId: activeClient?.id
      });
      if (created?.id) {
        setNewDashboardId(created.id);
        setConfigDialogOpen(true);
      }
      setCreateDialogOpen(false);
    } catch (e) {
      console.error('Failed to create dashboard', e);
    }
  };

  if (clientsLoading || dashboardsLoading) {
    return <LoadingState message="Loading dashboards..." />;
  }

  if (clientsError) {
    return <ErrorState message={`Error loading client: ${clientsError}`} />;
  }

  if (dashboardsError) {
    return <ErrorState message={`Error loading dashboards: ${dashboardsError}`} />;
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

      {/* Dashboard Configuration Modal after creation */}
      <DashboardConfigModal
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        onSave={async (config) => {
          // Minimal persistence: save date range if possible; others can be wired next
          if (newDashboardId && config.dateRange?.start && config.dateRange?.end) {
            try {
              await saveActivityConfiguration(newDashboardId, config.dateRange);
            } catch {}
          }
          setConfigDialogOpen(false);
        }}
        initialRepositories={[]}
        initialUsers={[]}
        initialActivityConfig={{ trackPRsCreated: true, trackPRsMerged: true, trackPRsReviewed: true }}
        initialDateRange={{ start: '', end: '' }}
        initialIsPublic={true}
        organizationRepos={[]}
      />

      {creating && <LoadingState message="Creating dashboard..." maxWidth={false} py={2} />}
      {createError && <ErrorState message={createError} maxWidth={false} py={2} />}
    </Box>
  );
};
