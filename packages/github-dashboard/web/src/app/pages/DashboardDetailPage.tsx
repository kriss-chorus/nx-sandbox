import styled from '@emotion/styled';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ActivitySettings } from '../components/activity';
import { DashboardConfigModal } from '../components/dashboard/configuration';
import { DashboardHeader, DashboardNotFound } from '../components/dashboard/detail';
import { UserActivityGrid } from '../components/user';
import { useDashboardConfigHandler, useDashboardData, useUserActivityManager } from '../hooks';


const DashboardContainer = styled(Box)`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

export function DashboardDetailPage() {
  const { dashboardSlug } = useParams<{ dashboardSlug: string }>();
  const navigate = useNavigate();

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

  const openConfigModal = () => {
    setConfigModalOpen(true);
  };


  if (!selectedDashboard) {
    return <DashboardNotFound onBackClick={() => navigate('/dashboards')} />;
  }

  return (
    <DashboardContainer>
      <DashboardHeader
        dashboardName={selectedDashboard.name}
        dashboardDescription={selectedDashboard.description}
        onBackClick={() => navigate('/dashboards')}
        onConfigureClick={openConfigModal}
      />

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

      {/* User Activity Grid */}
      {UserActivityGrid({ userActivities: userActivities as any, sortBy })}

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
