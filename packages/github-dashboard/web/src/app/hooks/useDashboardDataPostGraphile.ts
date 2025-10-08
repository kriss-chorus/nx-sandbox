import { useState, useEffect, useRef } from 'react';
import { 
  executeGraphQL, 
  DASHBOARD_QUERIES, 
  DASHBOARD_USER_QUERIES, 
  DASHBOARD_REPOSITORY_QUERIES,
  ACTIVITY_CONFIG_QUERIES,
  ACTIVITY_TYPE_QUERIES,
  GITHUB_USER_QUERIES,
  GITHUB_USER_MUTATIONS
} from '../api/postgraphile-client';
import { 
  Dashboard, 
  DashboardUser, 
  DashboardRepository, 
  ActivityType, 
  ActivityConfig, 
  DashboardData 
} from '../types/dashboard';

export function useDashboardDataPostGraphile(slug?: string): DashboardData {
  const [data, setData] = useState<DashboardData>({
    dashboard: null,
    dashboards: [],
    users: [],
    repositories: [],
    activityConfigs: [],
    activityTypes: [],
    loading: true,
    error: null,
  });
  
  const fetchingRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Prevent duplicate calls for the same slug
      const currentSlug = slug || 'all-dashboards';
      if (fetchingRef.current === currentSlug) {
        return;
      }
      fetchingRef.current = currentSlug;
      
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        if (!slug) {
          const dashboardsResponse = await executeGraphQL<{
            allDashboards: { nodes: Dashboard[] };
          }>(DASHBOARD_QUERIES.getAll);

          if (dashboardsResponse.errors) {
            throw new Error(dashboardsResponse.errors[0].message);
          }

          setData({
            dashboard: null,
            dashboards: dashboardsResponse.data?.allDashboards.nodes || [],
            users: [],
            repositories: [],
            activityConfigs: [],
            activityTypes: [],
            loading: false,
            error: null,
          });
          fetchingRef.current = null;
          return;
        }

        const dashboardResponse = await executeGraphQL<{
          dashboardBySlug: Dashboard;
        }>(DASHBOARD_QUERIES.getBySlug, { slug });

        if (dashboardResponse.errors) {
          throw new Error(dashboardResponse.errors[0].message);
        }

        const dashboard = dashboardResponse.data?.dashboardBySlug || null;
        
        if (!dashboard) {
          setData(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Dashboard not found' 
          }));
          return;
        }

        const [usersResponse, repositoriesResponse, activityConfigsResponse] = await Promise.all([
          executeGraphQL<{
            allDashboardGithubUsers: { nodes: DashboardUser[] };
          }>(DASHBOARD_USER_QUERIES.getByDashboard, { dashboardId: dashboard.id }),
          
          executeGraphQL<{
            allDashboardRepositories: { nodes: DashboardRepository[] };
          }>(DASHBOARD_REPOSITORY_QUERIES.getByDashboard, { dashboardId: dashboard.id }),
          
          executeGraphQL<{
            allDashboardActivityConfigs: { nodes: ActivityConfig[] };
          }>(ACTIVITY_CONFIG_QUERIES.getByDashboard, { dashboardId: dashboard.id }),
        ]);

        const errors = [
          usersResponse.errors,
          repositoriesResponse.errors,
          activityConfigsResponse.errors,
        ].filter(Boolean);

        if (errors.length > 0) {
          throw new Error(errors[0]?.[0]?.message || 'Failed to fetch dashboard data');
        }

        const activityConfigs = activityConfigsResponse.data?.allDashboardActivityConfigs.nodes || [];
        const activityTypes = activityConfigs.map(config => config.activityTypeByActivityTypeId);

        setData({
          dashboard,
          dashboards: [],
          users: usersResponse.data?.allDashboardGithubUsers.nodes || [],
          repositories: repositoriesResponse.data?.allDashboardRepositories.nodes || [],
          activityConfigs,
          activityTypes,
          loading: false,
          error: null,
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
        }));
      } finally {
        // Clear the fetching ref when request completes
        fetchingRef.current = null;
      }
    };

    fetchDashboardData();
  }, [slug]);

  return data;
}

export function useDashboardCRUD() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDashboard = async (input: {
    name: string;
    slug: string;
    description?: string;
    isPublic?: boolean;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await executeGraphQL<{
        createDashboard: { dashboard: Dashboard };
      }>(DASHBOARD_QUERIES.create, { input });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.data?.createDashboard.dashboard;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create dashboard';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateDashboard = async (id: string, input: {
    name?: string;
    slug?: string;
    description?: string;
    isPublic?: boolean;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await executeGraphQL<{
        updateDashboardById: { dashboard: Dashboard };
      }>(DASHBOARD_QUERIES.update, { id, input });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.data?.updateDashboardById.dashboard;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update dashboard';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteDashboard = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await executeGraphQL<{
        deleteDashboardById: { deletedDashboardId: string };
      }>(DASHBOARD_QUERIES.delete, { id });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.data?.deleteDashboardById.deletedDashboardId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete dashboard';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addUserToDashboard = async (dashboardId: string, githubUserId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await executeGraphQL<{
        createDashboardGithubUser: { dashboardGithubUser: DashboardUser };
      }>(DASHBOARD_USER_QUERIES.addUser, {
        input: { 
          dashboardGithubUser: { 
            dashboardId, 
            githubUserId 
          } 
        }
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.data?.createDashboardGithubUser.dashboardGithubUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add user to dashboard';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeUserFromDashboard = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await executeGraphQL<{
        deleteDashboardGithubUserById: { deletedDashboardGithubUserId: string };
      }>(DASHBOARD_USER_QUERIES.removeUser, { id });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.data?.deleteDashboardGithubUserById.deletedDashboardGithubUserId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove user from dashboard';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addRepositoryToDashboard = async (dashboardId: string, repositoryName: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await executeGraphQL<{
        createDashboardRepository: { dashboardRepository: DashboardRepository };
      }>(DASHBOARD_REPOSITORY_QUERIES.addRepository, {
        input: { dashboardId, repositoryName }
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.data?.createDashboardRepository.dashboardRepository;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add repository to dashboard';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeRepositoryFromDashboard = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await executeGraphQL<{
        deleteDashboardRepositoryById: { deletedDashboardRepositoryId: string };
      }>(DASHBOARD_REPOSITORY_QUERIES.removeRepository, { id });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.data?.deleteDashboardRepositoryById.deletedDashboardRepositoryId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove repository from dashboard';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createGithubUser = async (username: string, displayName?: string, avatarUrl?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await executeGraphQL<{
        createGithubUser: { githubUser: any };
      }>(GITHUB_USER_MUTATIONS.create, {
        input: {
          githubUser: {
            githubUsername: username,
            displayName: displayName || username,
            avatarUrl: avatarUrl || `https://github.com/${username}.png`,
            profileUrl: `https://github.com/${username}`
          }
        }
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.data?.createGithubUser.githubUser;
    } catch (error) {
      console.error('Error creating GitHub user:', error);
      setError(error instanceof Error ? error.message : 'Failed to create GitHub user');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getGithubUserByUsername = async (username: string) => {
    try {
      const response = await executeGraphQL<{
        allGithubUsers: { nodes: any[] };
      }>(GITHUB_USER_QUERIES.getByUsername, { username });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      const users = response.data?.allGithubUsers.nodes || [];
      if (users.length === 0) {
        throw new Error(`GitHub user ${username} not found`);
      }

      return users[0]; // Return the first (and should be only) user
    } catch (error) {
      console.error('Error fetching GitHub user:', error);
      throw error;
    }
  };

  const saveActivityConfiguration = async (dashboardId: string, dateRange: { start: string; end: string }) => {
    setLoading(true);
    setError(null);

    try {
      // First, get existing activity configs for this dashboard
      const configsResponse = await executeGraphQL<{
        allDashboardActivityConfigs: { nodes: ActivityConfig[] };
      }>(ACTIVITY_CONFIG_QUERIES.getByDashboard, { dashboardId });

      if (configsResponse.errors) {
        throw new Error(configsResponse.errors[0].message);
      }

      const existingConfigs = configsResponse.data?.allDashboardActivityConfigs.nodes || [];
      
      // Update the first config with the date range, or create a new one if none exists
      if (existingConfigs.length > 0) {
        const configToUpdate = existingConfigs[0];
        const response = await executeGraphQL<{
          updateDashboardActivityConfigById: { dashboardActivityConfig: ActivityConfig };
        }>(ACTIVITY_CONFIG_QUERIES.updateConfig, {
          id: configToUpdate.id,
          input: {
            dateRangeStart: dateRange.start,
            dateRangeEnd: dateRange.end,
            enabled: true
          }
        });

        if (response.errors) {
          throw new Error(response.errors[0].message);
        }

        return response.data?.updateDashboardActivityConfigById.dashboardActivityConfig;
      } else {
        // If no config exists, we would need to create one, but for now just return success
        console.log('No existing activity config found, date range not saved to database');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save activity configuration';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    addUserToDashboard,
    removeUserFromDashboard,
    addRepositoryToDashboard,
    removeRepositoryFromDashboard,
    createGithubUser,
    getGithubUserByUsername,
    saveActivityConfiguration,
  };
}
