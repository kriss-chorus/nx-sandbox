import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useDashboardDataPostGraphile, useDashboardCRUD } from '../hooks/useDashboardDataPostGraphile';
import { useClientData } from '../hooks/useClientData';
import { DashboardList } from '../components/dashboard/DashboardList';
import { CreateDashboardDialog } from '../components/dashboard/modals/CreateDashboardDialog';
import { DashboardConfigModal } from '../components/dashboard/modals/DashboardConfigModal';
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

  const { 
    createDashboard, 
    updateDashboard,
    addRepositoryToDashboard,
    upsertRepository,
    addUserToDashboard,
    createGithubUser,
    getGithubUserByUsername,
    loading: creating, 
    error: createError, 
    addActivityTypeToDashboard
  } = useDashboardCRUD();

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
          console.log('DashboardListPage onSave called with config:', config);
          if (!newDashboardId) {
            console.log('No newDashboardId, returning early');
            return;
          }
          console.log('newDashboardId:', newDashboardId);
          try {
            // Persist dashboard visibility
            await updateDashboard(newDashboardId, { isPublic: config.isPublic });

            // Resolve and persist repositories
            for (const full of (config.repositories || [])) {
              try {
                const value = (full || '').trim();
                if (!value) continue;
                const [owner, repo] = value.split('/');
                if (!owner || !repo) continue;
                // get repo details for id via backend proxy (handles auth/rate limits)
                const resp = await fetch(`http://localhost:3001/api/github/repos/${owner}/${repo}`);
                if (!resp.ok) continue;
                const repoInfo = await resp.json();
                const githubRepoId = repoInfo?.id;
                if (!githubRepoId) continue;
                const ownerName = repoInfo?.owner?.login || owner;
                const displayName = repoInfo?.name || repo;
                const fullName = repoInfo?.full_name || `${owner}/${repo}`;
                
                // First create/upsert the repository
                const repository = await upsertRepository({
                  githubRepoId,
                  name: displayName,
                  owner: ownerName,
                  fullName
                });
                
                // Then add it to the dashboard
                if (repository?.id) {
                  await addRepositoryToDashboard(newDashboardId, repository.id);
                }
              } catch (err) {
                console.error('Failed to resolve/persist repo', full, err);
              }
            }

            // Ensure users exist and add them to the dashboard (best-effort per user)
            for (const user of (config.users || [])) {
              try {
                const username = (user as any).login || (user as any).githubUsername;
                if (!username) continue;
                let ghUser: any;
                try {
                  ghUser = await getGithubUserByUsername(username);
                } catch {
                  ghUser = await createGithubUser(username, (user as any).name, (user as any).avatar_url);
                }
                if (ghUser?.id) {
                  await addUserToDashboard(newDashboardId, ghUser.id);
                }
              } catch (err) {
                console.error('Failed to attach user to dashboard', err);
              }
            }

            // Persist activity types (date range is frontend-only)
            if (config.activityConfig && Object.keys(config.activityConfig).length > 0) {
              try {
                console.log('Saving activity config:', config.activityConfig);
                
                // Save each selected activity type using the code directly
                for (const [activityCode, enabled] of Object.entries(config.activityConfig)) {
                  if (enabled) {
                    console.log(`Saving activity type: ${activityCode}`);
                    // Add activity type to dashboard using code (will resolve to ID in backend)
                    await addActivityTypeToDashboard(newDashboardId, activityCode);
                    console.log(`Successfully saved activity config for ${activityCode}`);
                  }
                }
              } catch (err) {
                console.error('Failed to save activity configuration', err);
              }
            } else {
              console.log('No activity config to save');
            }
          } catch (e) {
            console.error('Failed to save dashboard configuration', e);
            throw e;
          } finally {
            setConfigDialogOpen(false);
          }
        }}
        initialRepositories={[]}
        initialUsers={[]}
        initialActivityConfig={{ prs_created: true, prs_merged: true, prs_reviewed: true }}
        initialDateRange={{ start: '', end: '' }}
        initialIsPublic={true}
        organizationRepos={[]}
      />

      {creating && <LoadingState message="Creating dashboard..." maxWidth={false} py={2} />}
      {createError && <ErrorState message={createError} maxWidth={false} py={2} />}
    </Box>
  );
};
