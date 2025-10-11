import { useState, useEffect, useRef, useCallback } from 'react';

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
  ActivityConfig, 
  DashboardData 
} from '../types/dashboard';

export function useDashboardDataPostGraphile(slug?: string, clientId?: string): DashboardData & { refetch: () => void } {
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

  const fetchDashboardData = useCallback(async () => {
    // Prevent duplicate calls for the same slug
    const currentSlug = slug || 'all-dashboards';
    if (fetchingRef.current === currentSlug) {
      return;
    }
    fetchingRef.current = currentSlug;
    
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      if (!slug) {
        // Build filter for client if provided
        const filter = clientId ? { clientId } : undefined;
        
        const dashboardsResponse = await executeGraphQL<{
          allDashboards: { nodes: Dashboard[] };
        }>(DASHBOARD_QUERIES.getAll, { filter });

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
  }, [slug, clientId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refetch = () => {
    fetchingRef.current = null; // Clear the ref to allow refetch
    fetchDashboardData();
  };

  return { ...data, refetch };
}

export function useDashboardCRUD() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDashboard = async (input: {
    name: string;
    slug: string;
    description?: string;
    isPublic?: boolean;
    clientId?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await executeGraphQL<{
        createDashboard: { dashboard: Dashboard };
      }>(DASHBOARD_QUERIES.create, { input: { dashboard: input } });

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

  const removeUserFromDashboard = async (dashboardId: string, githubUserId: string) => {
    setLoading(true);
    setError(null);

    try {
      // First, find the dashboard-user junction record
      const junctionResponse = await executeGraphQL<{
        allDashboardGithubUsers: { nodes: { id: string; dashboardId: string; githubUserId: string }[] };
      }>(DASHBOARD_USER_QUERIES.getByDashboard, { dashboardId });

      if (junctionResponse.errors) {
        throw new Error(junctionResponse.errors[0].message);
      }

      const junctionRecord = junctionResponse.data?.allDashboardGithubUsers.nodes.find(
        record => record.githubUserId === githubUserId
      );

      if (!junctionRecord) {
        throw new Error('User not found in dashboard');
      }

      // Now delete the junction record using its ID
      const response = await executeGraphQL<{
        deleteDashboardGithubUserById: { deletedDashboardGithubUserId: string };
      }>(DASHBOARD_USER_QUERIES.removeUser, { id: junctionRecord.id });

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

  const upsertRepository = async (repositoryData: { githubRepoId: number; name: string; owner: string; fullName: string }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await executeGraphQL<{
        createRepository: { repository: unknown };
      }>(DASHBOARD_REPOSITORY_QUERIES.upsertRepository, {
        input: { repository: repositoryData }
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.data?.createRepository.repository;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create repository';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addRepositoryToDashboard = async (dashboardId: string, repositoryId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await executeGraphQL<{
        createDashboardRepository: { dashboardRepository: DashboardRepository };
      }>(DASHBOARD_REPOSITORY_QUERIES.addRepository, {
        input: { 
          dashboardRepository: { 
            dashboardId, 
            repositoryId 
          } 
        }
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
        createGithubUser: { githubUser: unknown };
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
    const response = await executeGraphQL<{
      allGithubUsers: { nodes: unknown[] };
    }>(GITHUB_USER_QUERIES.getByUsername, { username });

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    const users = response.data?.allGithubUsers.nodes || [];
    if (users.length === 0) {
      throw new Error(`GitHub user ${username} not found`);
    }

    return users[0]; // Return the first (and should be only) user
  };

  const upsertGithubUser = async (userData: {
    githubUserId: string;
    githubUsername: string;
    displayName?: string;
    avatarUrl?: string;
    profileUrl?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      // First try to find existing user by username
      try {
        const existingUser = await getGithubUserByUsername(userData.githubUsername);
        return existingUser;
      } catch {
        // User doesn't exist in our database, fetch from GitHub API
        console.log('User not found in database, will create new user:', userData.githubUsername);
      }

      // Fetch user data from GitHub API
      let githubUserData;
      try {
        const githubResponse = await fetch(`http://localhost:3001/api/github/users/${userData.githubUsername}`);
        if (!githubResponse.ok) {
          throw new Error(`GitHub API request failed: ${githubResponse.status} ${githubResponse.statusText}`);
        }
        githubUserData = await githubResponse.json();
      } catch {
        // Fall back to using the provided data if GitHub API fails
        githubUserData = {
          id: userData.githubUserId,
          login: userData.githubUsername,
          name: userData.displayName || userData.githubUsername,
          avatar_url: userData.avatarUrl || `https://github.com/${userData.githubUsername}.png`,
          html_url: userData.profileUrl || `https://github.com/${userData.githubUsername}`
        };
      }

      // Create new user in our database with GitHub data
      const response = await executeGraphQL<{
        createGithubUser: { githubUser: unknown };
      }>(GITHUB_USER_MUTATIONS.create, {
        input: {
          githubUser: {
            githubUserId: githubUserData.id?.toString() || userData.githubUserId,
            githubUsername: githubUserData.login || userData.githubUsername,
            displayName: githubUserData.name || githubUserData.login || userData.githubUsername,
            avatarUrl: githubUserData.avatar_url || `https://github.com/${userData.githubUsername}.png`,
            profileUrl: githubUserData.html_url || `https://github.com/${userData.githubUsername}`
          }
        }
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      const createdUser = response.data?.createGithubUser.githubUser;
      return createdUser;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upsert GitHub user');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addActivityTypeToDashboard = async (dashboardId: string, activityCode: string) => {
    setLoading(true);
    setError(null);

    try {
      // First, resolve the activity code to an ID
      const activityTypeId = await resolveActivityTypeCodeToId(activityCode);
      
      if (!activityTypeId) {
        throw new Error(`Activity type with code ${activityCode} not found`);
      }

      // Check if config already exists for this dashboard and activity type
      const configsResponse = await executeGraphQL<{
        allDashboardActivityConfigs: { nodes: ActivityConfig[] };
      }>(ACTIVITY_CONFIG_QUERIES.getByDashboard, { dashboardId });

      if (configsResponse.errors) {
        throw new Error(configsResponse.errors[0].message);
      }

      const existingConfigs = configsResponse.data?.allDashboardActivityConfigs.nodes || [];
      
      // Look for existing config for this specific activity type
      const existingConfig = existingConfigs.find(config => config.activityTypeId === activityTypeId);
      
      if (existingConfig) {
        // Already exists, no need to create
        return existingConfig;
      } else {
        // Create new config (row exists = enabled)
        const createResp = await executeGraphQL<{
          createDashboardActivityConfig: { dashboardActivityConfig: ActivityConfig };
        }>(ACTIVITY_CONFIG_QUERIES.createConfig, {
          input: {
            dashboardActivityConfig: {
              dashboardId,
              activityTypeId
            }
          }
        });

        if (createResp.errors) {
          throw new Error(createResp.errors[0].message);
        }

        return createResp.data?.createDashboardActivityConfig.dashboardActivityConfig;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add activity type to dashboard';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resolveActivityTypeCodeToId = async (activityCode: string): Promise<string | null> => {
    try {
      // Try to fetch activity types from database
      const activityTypes = await fetchAllActivityTypes();
      const activityType = activityTypes.find((at: unknown) => 
        typeof at === 'object' && at !== null && 'code' in at && 'id' in at && 
        (at as { code: string; id: string }).code === activityCode
      ) as { code: string; id: string } | undefined;
      return activityType?.id || null;
    } catch {
      // Fallback to hardcoded mapping if database fetch fails
      const activityTypeMap: Record<string, string> = {
        'prs_created': '42c3b89d-2897-4109-a5e7-3406b773bbb4',
        'prs_merged': 'dff9302a-d6f0-49d1-9fb3-6414801eab46',
        'prs_reviewed': '7adbc498-4789-40ec-9be1-1bb3bf408e9f',
      };
      
      return activityTypeMap[activityCode] || null;
    }
  };

  const removeActivityTypeFromDashboard = async (dashboardId: string, activityTypeId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Find the config to delete
      const configsResponse = await executeGraphQL<{
        allDashboardActivityConfigs: { nodes: ActivityConfig[] };
      }>(ACTIVITY_CONFIG_QUERIES.getByDashboard, { dashboardId });

      if (configsResponse.errors) {
        throw new Error(configsResponse.errors[0].message);
      }

      const existingConfigs = configsResponse.data?.allDashboardActivityConfigs.nodes || [];
      const configToDelete = existingConfigs.find(config => config.activityTypeId === activityTypeId);
      
      if (configToDelete) {
        // Delete the config (row doesn't exist = disabled)
        const deleteResp = await executeGraphQL<{
          deleteDashboardActivityConfigById: { deletedDashboardActivityConfigId: string };
        }>(ACTIVITY_CONFIG_QUERIES.deleteConfig, {
          id: configToDelete.id
        });

        if (deleteResp.errors) {
          throw new Error(deleteResp.errors[0].message);
        }

        return deleteResp.data?.deleteDashboardActivityConfigById.deletedDashboardActivityConfigId;
      } else {
        // Already disabled, no need to delete
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove activity type from dashboard';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchAllActivityTypes = async () => {
    // Try different query variations
    const queries = [
      { name: 'allActivityTypes', query: ACTIVITY_TYPE_QUERIES.getAll },
      { name: 'allActivity_types', query: ACTIVITY_TYPE_QUERIES.getAllAlt1 },
      { name: 'activityTypes', query: ACTIVITY_TYPE_QUERIES.getAllAlt2 },
    ];

    for (const { query } of queries) {
      try {
        const response = await executeGraphQL(query, {});
        
        if (response.data && Object.keys(response.data).length > 0) {
          const dataKey = Object.keys(response.data)[0];
          const nodes = (response.data as Record<string, unknown>)[dataKey] as { nodes: unknown[] } | undefined;
          if (nodes?.nodes && Array.isArray(nodes.nodes)) {
            return nodes.nodes;
          }
        }
      } catch {
        // Continue to next query
      }
    }
    
    return [];
  };

  return {
    loading,
    error,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    addUserToDashboard,
    removeUserFromDashboard,
    upsertRepository,
    addRepositoryToDashboard,
    removeRepositoryFromDashboard,
    createGithubUser,
    getGithubUserByUsername,
    upsertGithubUser,
    addActivityTypeToDashboard,
    removeActivityTypeFromDashboard,
    fetchAllActivityTypes,
  };
}
