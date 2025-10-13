import styled from '@emotion/styled';
import { ArrowBack, Settings as SettingsIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Typography
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { GitHubUser } from '../../types/github';
import { ActivitySettings } from '../components/activity';
import { DashboardConfigModal } from '../components/dashboard';
import { UserActivityGrid } from '../components/user';
import { useActivityConfigs, useDashboardCRUD, useDashboardData, useDashboardRepositories, useDashboardUsers } from '../hooks';

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

  const { updateDashboard } = useDashboardCRUD();
  const { upsertRepository, addRepositoryToDashboard, removeRepositoryFromDashboard } = useDashboardRepositories();
  const { createGithubUser, addUserToDashboard, removeUserFromDashboard } = useDashboardUsers();
  const { addActivityTypeToDashboard, removeActivityTypeFromDashboard } = useActivityConfigs();

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
  
  // Convert activity configs to the format expected by the modal
  const currentActivityConfig = postgraphileActivityConfigs.reduce((acc, config) => {
    if (config.activityTypeByActivityTypeId?.code) {
      acc[config.activityTypeByActivityTypeId.code] = true;
    }
    return acc;
  }, {} as Record<string, boolean>);

  // Convert users to the format expected by the modal
  const currentUsers = postgraphileUsers.map(dashboardUser => ({
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
    if (!selectedDashboard || githubUsers.length === 0) {
      return;
    }

    const cacheKey = `${selectedDashboard.id}-${githubUsers.length}`;
    if (fetchingRef.current === cacheKey) {
      return;
    }
    fetchingRef.current = cacheKey;

    try {
      setFetchingUsers(true);
      

           // For now, create user activities with mock data since we don't have the batch activity summary query
           // TODO: Implement proper activity data fetching when the backend query is available
           const activities = githubUsers.map(dashboardUser => {
        if (!dashboardUser?.githubUserByGithubUserId) {
          return null;
        }
        
        // Convert to GitHubUser format expected by UserActivityGrid
        const githubUser: GitHubUser = {
          id: parseInt(dashboardUser.githubUserByGithubUserId.id) || 0,
          login: dashboardUser.githubUserByGithubUserId.githubUsername,
          name: dashboardUser.githubUserByGithubUserId.displayName || dashboardUser.githubUserByGithubUserId.githubUsername || '',
          avatar_url: dashboardUser.githubUserByGithubUserId.avatarUrl || `https://github.com/${dashboardUser.githubUserByGithubUserId.githubUsername}.png`,
          html_url: dashboardUser.githubUserByGithubUserId.profileUrl || `https://github.com/${dashboardUser.githubUserByGithubUserId.githubUsername}`,
          public_repos: 0,
          followers: 0,
          following: 0,
          public_gists: 0,
          created_at: '',
          updated_at: ''
        };
        
        // Mock activity data for now
        const mockActivity = {
          prsCreated: Math.floor(Math.random() * 10),
          prsReviewed: Math.floor(Math.random() * 15),
          prsMerged: Math.floor(Math.random() * 8),
          totalActivity: 0, // Will be calculated
          commits: Math.floor(Math.random() * 20),
          issues: Math.floor(Math.random() * 5)
        };
        mockActivity.totalActivity = mockActivity.prsCreated + mockActivity.prsReviewed + mockActivity.prsMerged;
        
        return {
          user: githubUser,
          activity: mockActivity,
          repos: [],
        };
      }).filter(Boolean) || [];

           setUserActivities(activities.filter((activity: any): activity is UserActivity => activity !== null) as UserActivity[]);
    } catch (error) {
      console.error('Error fetching user activities:', error);
    } finally {
      setFetchingUsers(false);
      fetchingRef.current = null;
    }
  }, [selectedDashboard, dashboardRepositories, githubUsers]);

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
    if (!selectedDashboard?.id) {
      return;
    }
    
    try {
      // Persist dashboard visibility
      await updateDashboard(selectedDashboard.id, { isPublic: config.isPublic });

      // Sync repositories - remove ones not in config, add new ones
      const currentRepoFullNames = new Set(currentRepositories);
      const newRepoFullNames = new Set(config.repositories || []);
      
      // Remove repositories that are no longer in the config
      for (const fullName of currentRepoFullNames) {
        if (!newRepoFullNames.has(fullName)) {
          try {
            // Find the dashboard-repository junction ID
            const dashboardRepoToRemove = postgraphileRepositories.find(dr => 
              dr.repositoryByRepositoryId?.fullName === fullName
            );
            if (dashboardRepoToRemove?.id) {
              await removeRepositoryFromDashboard(dashboardRepoToRemove.id);
            }
          } catch (err) {
            console.error('Failed to remove repository', fullName, err);
          }
        }
      }
      
      // Add new repositories
      for (const full of (config.repositories || [])) {
        try {
          const value = (full || '').trim();
          if (!value) continue;
          const [owner, repo] = value.split('/');
          if (!owner || !repo) continue;
          
          // Skip if already exists
          if (currentRepoFullNames.has(value)) {
            continue;
          }
          
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
          if (repository && typeof repository === 'object' && 'id' in repository) {
            await addRepositoryToDashboard(selectedDashboard.id, (repository as { id: string }).id);
          }
        } catch (err) {
          console.error('Failed to resolve/persist repo', full, err);
        }
      }

      // Sync users - remove ones not in config, add new ones
      const currentUserLogins = new Set(currentUsers.map(u => u.login));
      const newUserLogins = new Set((config.users || []).map((u: any) => u.login));
      
      // Remove users that are no longer in the config
      for (const userLogin of currentUserLogins) {
        if (!newUserLogins.has(userLogin)) {
          try {
            // Find the user ID from current users
            const userToRemove = currentUsers.find((u: any) => u.login === userLogin);
            if (userToRemove?.id) {
              await removeUserFromDashboard(userToRemove.id);
            }
          } catch (err) {
            console.error('Failed to remove user', userLogin, err);
          }
        }
      }
      
      // Add new users
      for (const user of (config.users || [])) {
        try {
          // Skip if already exists
          if (currentUserLogins.has(user.login)) {
            continue;
          }
          
          const githubUser = await createGithubUser(user.login, user.name, user.avatar_url);

          if (githubUser && typeof githubUser === 'object' && 'id' in githubUser) {
            const userId = (githubUser as { id: string }).id;
            await addUserToDashboard(selectedDashboard.id, userId);
          } else {
            console.error('No user ID returned from upsertGithubUser:', githubUser);
          }
        } catch (err) {
          console.error('Failed to persist user', user.login, err);
        }
      }

      // Sync activity types - remove disabled ones, add enabled ones
      const currentActivityCodes = new Set(Object.keys(currentActivityConfig));
      
      // Remove activity types that are no longer enabled
      for (const activityCode of currentActivityCodes) {
        if (!config.activityConfig?.[activityCode]) {
          try {
            // Find the activity type ID from the current configs
            const configToRemove = postgraphileActivityConfigs.find(config => 
              config.activityTypeByActivityTypeId?.code === activityCode
            );
            if (configToRemove?.activityTypeId) {
              await removeActivityTypeFromDashboard(selectedDashboard.id, configToRemove.activityTypeId);
            }
          } catch (err) {
            console.error('Failed to remove activity type', activityCode, err);
          }
        }
      }
      
      // Add new activity types that are enabled
      for (const [activityCode, enabled] of Object.entries(config.activityConfig || {})) {
        if (enabled && !currentActivityCodes.has(activityCode)) {
          try {
            await addActivityTypeToDashboard(selectedDashboard.id, activityCode);
          } catch (err) {
            console.error('Failed to add activity type', activityCode, err);
          }
        }
      }

      // Refetch dashboard data to show the newly added users/repositories/activity configs
      refetch();

    } catch (e) {
      console.error('Failed to save dashboard configuration', e);
      throw e;
    } finally {
      setConfigModalOpen(false);
    }
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
