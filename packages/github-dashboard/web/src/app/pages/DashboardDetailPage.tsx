import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { useDashboardDataPostGraphile, useDashboardCRUD } from '../hooks/useDashboardDataPostGraphile';
import { DashboardConfigModal } from '../components/dashboard/modals';
import { ActivitySettings } from '../components/activity';
import { UserActivityGrid } from '../components/user';
import { 
  Box, 
  Typography, 
  Button
} from '@mui/material';
import { ArrowBack, Settings as SettingsIcon } from '@mui/icons-material';
import { GitHubUser } from '../../types/github';
import { executeGraphQL, DASHBOARD_REPOSITORY_QUERIES } from '../api/postgraphile-client';

interface UserActivity {
  user: GitHubUser;
  activity: {
    prsCreated: number;
    prsReviewed: number;
    prsMerged: number;
    totalActivity: number;
    commits?: number;
    issues?: number;
  };
  repos?: any[];
}

interface OrganizationRepository {
  name: string;
  full_name: string;
  private: boolean;
  updated_at: string;
}

const DashboardContainer = styled(Box)`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

export const DashboardDetailPage: React.FC = (): React.ReactElement => {
  const { dashboardSlug } = useParams<{ dashboardSlug: string }>();
  const navigate = useNavigate();

  const {
    dashboard: postgraphileDashboard,
    users: postgraphileUsers,
    repositories: postgraphileRepositories,
    activityConfigs: postgraphileActivityConfigs
  } = useDashboardDataPostGraphile(dashboardSlug);

  const {
    createDashboard: createDashboardPostGraphile,
    updateDashboard: updateDashboardPostGraphile,
    addUserToDashboard: addUserToDashboardPostGraphile,
    removeUserFromDashboard: removeUserFromDashboardPostGraphile,
    addRepositoryToDashboard: addRepositoryToDashboardPostGraphile,
    removeRepositoryFromDashboard: removeRepositoryFromDashboardPostGraphile,
    createGithubUser: createGithubUserPostGraphile,
    getGithubUserByUsername: getGithubUserByUsernamePostGraphile,
    saveActivityConfiguration: saveActivityConfigurationPostGraphile,
  } = useDashboardCRUD();

  // State management
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'totalActivity' | 'prsCreated' | 'prsReviewed' | 'prsMerged'>('totalActivity');
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Refs for tracking
  const fetchingRef = useRef<string | null>(null);

  // Derived data
  const selectedDashboard = postgraphileDashboard;
  const githubUsers = postgraphileUsers;
  const dashboardRepositories = postgraphileRepositories;

  // Set default date range (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Fetch user activities when dashboard, users, repositories, or date range changes
  const fetchUserActivities = useCallback(async () => {
    if (!selectedDashboard || !startDate || !endDate || dashboardRepositories.length === 0 || githubUsers.length === 0) {
      return;
    }

    const cacheKey = `${selectedDashboard.id}-${startDate}-${endDate}-${githubUsers.length}-${dashboardRepositories.length}`;
    if (fetchingRef.current === cacheKey) {
      return;
    }
    fetchingRef.current = cacheKey;

    try {
      setFetchingUsers(true);
      
      const repoFullNames = dashboardRepositories.map(repo => repo.fullName);
      const usernames = githubUsers.map(user => user.githubUsername);

      const response = await executeGraphQL<{
        githubUsersBatchActivitySummary: {
          users: Array<{
            username: string;
            activity: {
              prsCreated: number;
              prsReviewed: number;
              prsMerged: number;
              totalActivity: number;
              commits?: number;
              issues?: number;
            };
            repos: Array<{
              name: string;
              full_name: string;
              private: boolean;
              updated_at: string;
            }>;
          }>;
        };
      }>(DASHBOARD_REPOSITORY_QUERIES.getBatchActivitySummary, {
        usernames,
        repoFullNames,
        startDate,
        endDate,
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      const activities: UserActivity[] = response.data?.githubUsersBatchActivitySummary.users.map(userData => {
        const githubUser = githubUsers.find(u => u.githubUsername === userData.username);
        return {
          user: githubUser!,
          activity: userData.activity,
          repos: userData.repos,
        };
      }) || [];

      setUserActivities(activities);
    } catch (error) {
      console.error('Error fetching user activities:', error);
    } finally {
      setFetchingUsers(false);
      fetchingRef.current = null;
    }
  }, [selectedDashboard, startDate, endDate, dashboardRepositories, githubUsers]);

  useEffect(() => {
    fetchUserActivities();
  }, [fetchUserActivities]);

  const handleRefreshStats = useCallback(() => {
    fetchUserActivities();
  }, [fetchUserActivities]);

  const openConfigModal = () => {
    setConfigModalOpen(true);
  };

  const handleConfigSave = async (config: any) => {
    // TODO: Implement configuration save
    console.log('Save config:', config);
    setConfigModalOpen(false);
  };

  if (!selectedDashboard) {
    return (
      <DashboardContainer>
        <Typography variant="h4">Dashboard not found</Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboards')}
          sx={{ mt: 2 }}
        >
          Back to Dashboards
        </Button>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboards')}
            sx={{ mb: 2 }}
          >
            Back to Dashboards
          </Button>
          <Typography variant="h4">{selectedDashboard.name}</Typography>
          {selectedDashboard.description && (
            <Typography variant="body1" color="text.secondary">
              {selectedDashboard.description}
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={openConfigModal}
        >
          Configure Dashboard
        </Button>
      </Box>

      {/* Activity Settings */}
      <ActivitySettings
        startDate={startDate}
        endDate={endDate}
        sortBy={sortBy}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onSortByChange={setSortBy}
        onRefreshStats={handleRefreshStats}
        disabled={!startDate || !endDate || dashboardRepositories.length === 0 || fetchingUsers}
      />

      {/* User Activity Grid */}
      <UserActivityGrid
        userActivities={userActivities}
        sortBy={sortBy}
      />

      {/* Configuration Modal */}
      <DashboardConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onSave={handleConfigSave}
        initialRepositories={dashboardRepositories}
        initialUsers={githubUsers}
        initialActivityConfig={{}}
        initialDateRange={{ start: startDate, end: endDate }}
      />
    </DashboardContainer>
  );
};
