import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { useDashboardDataPostGraphile, useDashboardCRUD } from '../../hooks/useDashboardDataPostGraphile';
import { Dashboard as DashboardType } from '../../types/dashboard';
import { DashboardConfigModal, CreateDashboardDialog } from './modals';
import { DashboardList } from './DashboardList';
import { ActivitySettings } from '../activity';
import { UserActivityGrid } from '../user';
import { 
  Box, 
  Typography, 
  Button
} from '@mui/material';
import { ArrowBack, Settings as SettingsIcon } from '@mui/icons-material';
import { GitHubUser } from '../../../types/github';
import { executeGraphQL, DASHBOARD_REPOSITORY_QUERIES } from '../../api/postgraphile-client';

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

export const Dashboard: React.FC = () => {
  const { dashboardSlug } = useParams<{ dashboardSlug?: string }>();
  const navigate = useNavigate();

  const {
    dashboard: postgraphileDashboard,
    dashboards: postgraphileDashboards,
    users: postgraphileUsers,
    repositories: postgraphileRepositories,
    activityConfigs: postgraphileActivityConfigs
  } = useDashboardDataPostGraphile(dashboardSlug);

  const {
    createDashboard: createDashboardPostGraphile,
    updateDashboard: updateDashboardPostGraphile,
    addUserToDashboard: addUserToDashboardPostGraphile,
    removeUserFromDashboard: removeUserFromDashboardPostGraphile,
    createGithubUser,
    getGithubUserByUsername,
    saveActivityConfiguration
  } = useDashboardCRUD();

  const [dashboards, setDashboards] = useState<DashboardType[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardType | null>(null);
  const [githubUsers, setGithubUsers] = useState<GitHubUser[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const fetchingRef = useRef(false);
  const [currentView, setCurrentView] = useState<'dashboards' | 'dashboard'>('dashboards');
  const [sortBy, setSortBy] = useState<'prsCreated' | 'prsReviewed' | 'prsMerged' | 'totalActivity'>('totalActivity');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [organizationRepos, setOrganizationRepos] = useState<OrganizationRepository[]>([]);

  const [dashboardRepositories, setDashboardRepositories] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('2024-01-01');
  const [endDate, setEndDate] = useState<string>('2024-12-31');

  // Load dashboards from PostGraphile data
  useEffect(() => {
    if (postgraphileDashboards) {
      setDashboards(postgraphileDashboards);
    }
  }, [postgraphileDashboards]);

  // Fetch GitHub user profiles and activity stats
  const fetchGitHubUserProfiles = useCallback(async (
    userActivities: UserActivity[],
    options?: { repos?: string[]; startDate?: string; endDate?: string }
  ) => {
    if (fetchingRef.current) {
      console.log('Already fetching users, skipping...');
      return;
    }

    fetchingRef.current = true;
    setFetchingUsers(true);
    console.log(`Fetching data for ${userActivities.length} users...`);

    try {
      const updatedUserActivities = await Promise.all(
        userActivities.map(async (userActivity, index) => {
          // Add a small delay between requests to avoid rate limiting
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          try {
            // Fetch GitHub profile data
            console.log(`Fetching GitHub profile for: ${userActivity.user.login}`);
            const profileResponse = await fetch(`http://localhost:3001/api/github/users/${userActivity.user.login}`);
            let githubUser = null;
            if (profileResponse.ok) {
              githubUser = await profileResponse.json();
              console.log(`Successfully fetched profile for: ${userActivity.user.login}`);
            } else {
              const errorData = await profileResponse.json();
              console.error(`Failed to fetch profile for ${userActivity.user.login}:`, profileResponse.status, errorData);
            }

            // Determine effective repos and dates (prefer explicit options over component state)
            const effectiveRepos = options?.repos ?? dashboardRepositories;
            const effectiveStart = options?.startDate ?? startDate;
            const effectiveEnd = options?.endDate ?? endDate;

            // Fetch activity stats if we have repositories and date range
            let activityStats = {
              prsCreated: 0,
              prsReviewed: 0,
              prsMerged: 0,
              totalActivity: 0,
              commits: 0,
              issues: 0
            };

            if (effectiveRepos.length > 0 && effectiveStart && effectiveEnd) {
              try {
                const reposParam = effectiveRepos.join(',');
                console.log(`Fetching activity stats for ${userActivity.user.login} with repos: ${reposParam}, dates: ${effectiveStart} to ${effectiveEnd}`);

                const statsResponse = await fetch(
                  `http://localhost:3001/api/github/users/${userActivity.user.login}/activity-summary?repos=${reposParam}&start_date=${effectiveStart}&end_date=${effectiveEnd}`
                );

                if (statsResponse.ok) {
                  const summary = await statsResponse.json();
                  console.log(`Activity summary for ${userActivity.user.login}:`, summary);

                  if (summary.activity) {
                    activityStats = {
                      prsCreated: summary.activity.prsCreated || 0,
                      prsReviewed: summary.activity.prsReviewed || 0,
                      prsMerged: summary.activity.prsMerged || 0,
                      totalActivity: summary.activity.totalActivity || 0,
                      commits: 0,
                      issues: 0
                    };
                    console.log(`Activity stats for ${userActivity.user.login}:`, activityStats);
                  } else {
                    console.log(`No activity data found for ${userActivity.user.login}`);
                  }
                } else {
                  console.error(`Failed to fetch activity stats for ${userActivity.user.login}:`, statsResponse.status, statsResponse.statusText);
                }
              } catch (error) {
                console.error(`Failed to fetch activity stats for ${userActivity.user.login}:`, error);
              }
            } else {
              console.log(`Skipping activity stats for ${userActivity.user.login} - missing repos (${effectiveRepos.length}) or dates (${effectiveStart} to ${effectiveEnd})`);
            }

            return {
              ...userActivity,
              user: {
                ...userActivity.user,
                public_repos: githubUser?.public_repos || 0,
                followers: githubUser?.followers || 0,
                following: githubUser?.following || 0,
                public_gists: githubUser?.public_gists || 0
              },
              activity: activityStats
            };
          } catch (error) {
            console.error(`Failed to fetch data for ${userActivity.user.login}:`, error);
            // Return the user activity with default values if fetch fails
            return {
              ...userActivity,
              user: {
                ...userActivity.user,
                public_repos: 0,
                followers: 0,
                following: 0,
                public_gists: 0
              },
              activity: {
                prsCreated: 0,
                prsReviewed: 0,
                prsMerged: 0,
                totalActivity: 0,
                commits: 0,
                issues: 0
              }
            };
          }
        })
      );
      setUserActivities(updatedUserActivities);
      console.log('Successfully fetched all user data');
    } catch (error) {
      console.error('Failed to fetch GitHub user profiles:', error);
      setError(`Failed to fetch user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      fetchingRef.current = false;
      setFetchingUsers(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle dashboard selection and navigation
  useEffect(() => {
    if (postgraphileDashboard && dashboardSlug) {
      setSelectedDashboard(postgraphileDashboard);
      setCurrentView('dashboard');

      // Convert PostGraphile users to GitHubUser format
      const githubUsers = postgraphileUsers.map(user => ({
        id: parseInt(user.githubUserByGithubUserId.id.replace(/-/g, '').substring(0, 8), 16),
        login: user.githubUserByGithubUserId.githubUsername,
        name: user.githubUserByGithubUserId.displayName || user.githubUserByGithubUserId.githubUsername,
        avatar_url: user.githubUserByGithubUserId.avatarUrl || '',
        html_url: user.githubUserByGithubUserId.profileUrl || `https://github.com/${user.githubUserByGithubUserId.githubUsername}`,
        public_repos: 0,
        followers: 0,
        following: 0,
        public_gists: 0,
        created_at: '',
        updated_at: ''
      }));
      setGithubUsers(githubUsers);

      // Convert PostGraphile users to UserActivity format
      const userActivities = postgraphileUsers.map(user => ({
        user: {
          id: parseInt(user.githubUserByGithubUserId.id.replace(/-/g, '').substring(0, 8), 16),
          login: user.githubUserByGithubUserId.githubUsername,
          name: user.githubUserByGithubUserId.displayName || user.githubUserByGithubUserId.githubUsername,
          avatar_url: user.githubUserByGithubUserId.avatarUrl || '',
          html_url: user.githubUserByGithubUserId.profileUrl || `https://github.com/${user.githubUserByGithubUserId.githubUsername}`,
          public_repos: 0,
          followers: 0,
          following: 0,
          public_gists: 0,
          created_at: '',
          updated_at: ''
        },
        activity: {
          prsCreated: 0,
          prsReviewed: 0,
          prsMerged: 0,
          totalActivity: 0,
          commits: 0,
          issues: 0
        }
      }));
      setUserActivities(userActivities);

      // Convert PostGraphile repositories to strings
      const repositories = postgraphileRepositories.map(repo => repo.fullName);
      setDashboardRepositories(repositories);

      setLoading(false);
    }
  }, [postgraphileDashboard, postgraphileUsers, postgraphileRepositories, dashboardSlug, fetchGitHubUserProfiles]);

  // Load date range from PostGraphile activity configs
  useEffect(() => {
    if (postgraphileActivityConfigs && postgraphileActivityConfigs.length > 0) {
      const configWithDateRange = postgraphileActivityConfigs.find(config =>
        config.dateRangeStart && config.dateRangeEnd
      );

      if (configWithDateRange && configWithDateRange.dateRangeStart && configWithDateRange.dateRangeEnd) {
        const startDate = new Date(configWithDateRange.dateRangeStart).toISOString().split('T')[0];
        const endDate = new Date(configWithDateRange.dateRangeEnd).toISOString().split('T')[0];
        console.log('Loading date range from database:', { startDate, endDate });
        setStartDate(startDate);
        setEndDate(endDate);
      }
    }
  }, [postgraphileActivityConfigs]);

  // Removed automatic refresh to prevent infinite loops
  // Users can manually refresh stats using the button

  // Create dashboard handler
  const handleCreateDashboard = async (name: string, description: string) => {
    try {
      setLoading(true);
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      const newDashboard = await createDashboardPostGraphile({
        name,
        slug,
        description,
        isPublic: false
      });
      console.log('Dashboard created:', newDashboard);
      setCreateDialogOpen(false);
    } catch (error) {
      setError('Failed to create dashboard');
    } finally {
      setLoading(false);
    }
  };

  // View dashboard handler
  const handleViewDashboard = (dashboard: DashboardType) => {
    navigate(`/dashboard/${dashboard.slug}`);
  };

  // Back to dashboards handler
  const handleBackToDashboards = () => {
    setCurrentView('dashboards');
    setSelectedDashboard(null);
    navigate('/');
  };

  // Load organization data for config modal
  const loadOrganizationData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/github/org/ChorusInnovations/repos');
      if (response.ok) {
        const repos = await response.json();
        setOrganizationRepos(repos);
      } else {
        console.error('Failed to load organization repositories');
        setOrganizationRepos([]);
      }
    } catch (error) {
      console.error('Failed to load organization data:', error);
      setOrganizationRepos([]);
    }
  };

  // Open config modal
  const openConfigModal = async () => {
    await loadOrganizationData();
    setConfigModalOpen(true);
  };

  // Handle config save
  const handleConfigSave = async (config: {
    repositories: string[];
    users: GitHubUser[];
    activityConfig: any;
    dateRange: { start: string; end: string };
    isPublic: boolean;
  }) => {
    console.log('=== HANDLE CONFIG SAVE CALLED ===');
    console.log('Config received:', config);
    let hasErrors = false;

    try {
      // Save repositories
      setDashboardRepositories(config.repositories);

      // Save activity config and date range
      setStartDate(config.dateRange.start);
      setEndDate(config.dateRange.end);

      // Save activity configuration to database
      if (selectedDashboard) {
        try {
          await saveActivityConfiguration(selectedDashboard.id, config.dateRange);
          console.log('Activity configuration saved with date range:', config.dateRange);
        } catch (error) {
          console.error('Failed to save activity configuration:', error);
          hasErrors = true;
          alert(`Failed to save activity configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Save dashboard visibility
      if (selectedDashboard) {
        try {
          await updateDashboardPostGraphile(selectedDashboard.id, {
            isPublic: config.isPublic
          });
          console.log('Dashboard visibility updated to:', config.isPublic ? 'Public' : 'Private');
        } catch (error) {
          console.error('Failed to update dashboard visibility:', error);
          hasErrors = true;
          alert(`Failed to update dashboard visibility: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Handle users - add new users and remove deleted users
      if (selectedDashboard) {
        const currentUserLogins = postgraphileUsers.map(u => u.githubUserByGithubUserId.githubUsername);
        const newUserLogins = config.users.map(u => u.login);

        // Remove users that are no longer in the config
        for (const currentUser of postgraphileUsers) {
          if (!newUserLogins.includes(currentUser.githubUserByGithubUserId.githubUsername)) {
            try {
              await removeUserFromDashboardPostGraphile(currentUser.id);
              console.log(`Removed user: ${currentUser.githubUserByGithubUserId.githubUsername}`);
            } catch (error) {
              console.error('Failed to remove user from dashboard:', error);
              hasErrors = true;
              alert(`Failed to remove user ${currentUser.githubUserByGithubUserId.githubUsername}: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        }

        // Add new users
        for (const user of config.users) {
          if (!currentUserLogins.includes(user.login)) {
            try {
              let githubUser;
              try {
                githubUser = await getGithubUserByUsername(user.login);
              } catch (error) {
                githubUser = await createGithubUser(user.login, user.name, user.avatar_url);
              }

              if (!githubUser || !githubUser.id) {
                throw new Error(`Failed to get GitHub user ID for ${user.login}`);
              }

              await addUserToDashboardPostGraphile(selectedDashboard.id, githubUser.id);
              console.log(`Successfully added user: ${user.login} to dashboard`);
            } catch (error) {
              console.error(`Failed to add user ${user.login} to dashboard:`, error);
              hasErrors = true;
              alert(`Failed to add user ${user.login}: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        }
      }

      setGithubUsers(config.users);
      const userActivities = config.users.map(user => ({
        user,
        activity: {
          prsCreated: 0, prsReviewed: 0, prsMerged: 0, totalActivity: 0, commits: 0, issues: 0
        }
      }));
      setUserActivities(userActivities);

      if (hasErrors) {
        console.log('Configuration saved with errors - modal will stay open');
        alert('Some users could not be added. Check console for details.');
        return;
      }

      console.log('Configuration saved successfully');
      setConfigModalOpen(false);

      // Fetch updated user profiles and activity stats after configuration is saved
      if (userActivities.length > 0 && config.dateRange.start && config.dateRange.end) {
        console.log('Fetching updated user profiles after configuration save...');
        
        // Always refetch repositories from DB to use persisted values
        let persistedRepos: string[] = [];
        if (selectedDashboard) {
          try {
            const reposResp = await executeGraphQL<{ allDashboardRepositories: { nodes: Array<{ fullName: string }> } }>(
              DASHBOARD_REPOSITORY_QUERIES.getByDashboard,
              { dashboardId: selectedDashboard.id }
            );
            const nodes = reposResp.data?.allDashboardRepositories.nodes || [];
            persistedRepos = nodes.map(r => r.fullName);
            console.log('Persisted repos from DB:', persistedRepos);
          } catch (err) {
            console.error('Failed to refetch repositories from DB:', err);
          }
        }

        const effectiveRepos = persistedRepos.length > 0 ? persistedRepos : config.repositories;
        console.log('Using repos for stats:', effectiveRepos);
        // Use unified fetch with explicit options
        fetchGitHubUserProfiles(userActivities, {
          repos: effectiveRepos,
          startDate: config.dateRange.start,
          endDate: config.dateRange.end,
        }).catch(error => {
          console.error('Failed to fetch updated user profiles:', error);
        });
      }

    } catch (error) {
      console.error('Failed to save dashboard configuration:', error);
      alert(`Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Refresh stats handler
  const handleRefreshStats = async () => {
    if (userActivities.length === 0 || fetchingRef.current) return;
    console.log('Manual refresh triggered...');

    let persistedRepos: string[] = [];
    if (selectedDashboard) {
      try {
        const reposResp = await executeGraphQL<{ allDashboardRepositories: { nodes: Array<{ fullName: string }> } }>(
          DASHBOARD_REPOSITORY_QUERIES.getByDashboard,
          { dashboardId: selectedDashboard.id }
        );
        const nodes = reposResp.data?.allDashboardRepositories.nodes || [];
        persistedRepos = nodes.map(r => r.fullName);
        console.log('Persisted repos from DB (manual refresh):', persistedRepos);
      } catch (err) {
        console.error('Failed to refetch repositories from DB (manual refresh):', err);
      }
    }

    const effectiveRepos = persistedRepos.length > 0 ? persistedRepos : dashboardRepositories;
    console.log('Using repos for manual refresh:', effectiveRepos, 'dates:', { startDate, endDate });

    if (effectiveRepos.length > 0 && startDate && endDate) {
      await fetchGitHubUserProfiles(userActivities, {
        repos: effectiveRepos,
        startDate,
        endDate,
      }).catch(error => {
        console.error('Failed to fetch GitHub user profiles:', error);
      });
    } else {
      console.log('Skipping manual refresh - missing repos or dates');
    }
  };

  if (loading) {
    return (
      <DashboardContainer>
        <Typography>Loading...</Typography>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <Typography color="error">{error}</Typography>
      </DashboardContainer>
    );
  }

  console.log('Dashboard render - currentView:', currentView, 'selectedDashboard:', selectedDashboard, 'userActivities:', userActivities.length);
  
  return (
    <DashboardContainer>
      {/* Navigation Header */}
      {currentView !== 'dashboards' && (
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBackToDashboards}
            variant="outlined"
          >
            Back to Dashboards
          </Button>
        </Box>
      )}

      {/* My Dashboards View */}
      {currentView === 'dashboards' && (
        <DashboardList
          dashboards={dashboards}
          onCreateDashboard={() => setCreateDialogOpen(true)}
          onViewDashboard={handleViewDashboard}
        />
      )}

      {/* Dashboard View */}
      {currentView === 'dashboard' && selectedDashboard && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
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
        </Box>
      )}

      {/* Create Dashboard Dialog */}
      <CreateDashboardDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSave={handleCreateDashboard}
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
        initialIsPublic={selectedDashboard?.isPublic || false}
        organizationRepos={organizationRepos}
      />
    </DashboardContainer>
  );
};
