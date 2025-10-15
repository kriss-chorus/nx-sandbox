import styled from '@emotion/styled';
import { Box, Button, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ActivitySettings } from '../components/Activity';
import { DashboardConfigModal, DashboardHeader, DashboardLayouts, DashboardNotFound, DashboardTypeChips, SummaryBar } from '../components/Dashboard';
import { useClientContext } from '../context/ClientContext';
import { useDashboardConfigHandler, useDashboardData, useUserActivityManager } from '../hooks';


const DashboardContainer = styled(Box)`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

export function DashboardDetailPage() {
  const { dashboardSlug } = useParams<{ dashboardSlug: string }>();
  const navigate = useNavigate();
  const { activeClient, isPremium } = useClientContext();

  const {
    dashboard: postgraphileDashboard,
    users: postgraphileUsers,
    repositories: postgraphileRepositories,
    activityConfigs: postgraphileActivityConfigs,
    refetch
  } = useDashboardData(dashboardSlug || '');

  // State management
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'totalActivity' | 'prsCreated' | 'prsReviewed' | 'prsMerged'>('totalActivity');
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [dashboardTypeCode, setDashboardTypeCode] = useState<string>('user_activity');

  // Derived data
  const selectedDashboard = postgraphileDashboard;
  const githubUsers = postgraphileUsers;
  const dashboardRepositories = postgraphileRepositories;

  // Convert activity configs to the format expected by the modal
  const currentActivityConfig = postgraphileActivityConfigs.reduce((acc: Record<string, boolean>, config: any) => {
    if (config.activityTypeByActivityTypeId?.code) {
      acc[config.activityTypeByActivityTypeId.code] = true;
    }
    return acc;
  }, {} as Record<string, boolean>);

  // Convert users to the format expected by the modal
  const currentUsers = postgraphileUsers.map((dashboardUser: any) => ({
    id: dashboardUser.githubUserByGithubUserId?.id || '',
    login: dashboardUser.githubUserByGithubUserId?.githubUsername || '',
    name: dashboardUser.githubUserByGithubUserId?.displayName || dashboardUser.githubUserByGithubUserId?.githubUsername || '',
    avatar_url: dashboardUser.githubUserByGithubUserId?.avatarUrl || `https://github.com/${dashboardUser.githubUserByGithubUserId?.githubUsername}.png`,
    html_url: dashboardUser.githubUserByGithubUserId?.profileUrl || `https://github.com/${dashboardUser.githubUserByGithubUserId?.githubUsername}`,
    public_repos: 0,
    followers: 0,
    following: 0,
    public_gists: 0,
    created_at: '',
    updated_at: ''
  }));

  // Convert repositories to the format expected by the modal
  const currentRepositories = postgraphileRepositories.map((dashboardRepo: any) => 
    dashboardRepo.repositoryByRepositoryId?.fullName || ''
  ).filter(Boolean);

  // Use extracted hooks for complex logic
  const { userActivities, fetchingUsers, handleRefreshStats } = useUserActivityManager({
    selectedDashboard,
    githubUsers,
    dashboardRepositories
  });

  const { handleConfigSave } = useDashboardConfigHandler({
    selectedDashboard,
    postgraphileRepositories,
    postgraphileUsers,
    postgraphileActivityConfigs,
    currentRepositories,
    currentUsers,
    currentActivityConfig,
    refetch
  });


  // Set default date range (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Set dashboard type from selected dashboard
  useEffect(() => {
    if (selectedDashboard?.dashboardTypeByDashboardTypeId?.code) {
      setDashboardTypeCode(selectedDashboard.dashboardTypeByDashboardTypeId.code);
    }
  }, [selectedDashboard]);

  const openConfigModal = () => {
    setConfigModalOpen(true);
  };


  if (!selectedDashboard) {
    return <DashboardNotFound onBackClick={() => navigate('/dashboards')} />;
  }

  // Client ownership guard
  if (activeClient && selectedDashboard.clientByClientId?.id !== activeClient.id) {
    return (
      <DashboardContainer>
        <Box textAlign="center" py={8}>
          <Typography variant="h5" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            This dashboard belongs to another client. You don't have permission to view it.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Back to Client Selection
          </Button>
        </Box>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <DashboardHeader
        dashboardName={selectedDashboard.name}
        dashboardDescription={selectedDashboard.description}
        dashboardId={selectedDashboard.id}
        onBackClick={() => navigate('/dashboards')}
        onConfigureClick={openConfigModal}
      />

      {/* Premium: Dashboard Type Chips */}
      {isPremium && (
        <DashboardTypeChips
          dashboardId={selectedDashboard.id}
          currentTypeCode={dashboardTypeCode}
          onTypeChange={setDashboardTypeCode}
        />
      )}

      {/* Premium: Summary Bar */}
      {isPremium && (
        <SummaryBar userActivities={userActivities} />
      )}

      {/* Activity Settings */}
      <ActivitySettings
        startDate={startDate}
        endDate={endDate}
        sortBy={sortBy}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onSortByChange={setSortBy}
        onRefreshStats={handleRefreshStats}
        disabled={!startDate || !endDate || fetchingUsers}
      />

      {/* Dynamic Dashboard Layout */}
      <DashboardLayouts
        dashboardTypeCode={dashboardTypeCode}
        userActivities={userActivities as any}
        sortBy={sortBy}
      />

      {/* Configuration Modal */}
      <DashboardConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onSave={handleConfigSave}
        initialRepositories={currentRepositories}
        initialUsers={currentUsers}
        initialActivityConfig={currentActivityConfig}
        initialIsPublic={selectedDashboard?.isPublic ?? true}
      />
    </DashboardContainer>
  );
};
