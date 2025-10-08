/**
 * PostGraphile Dashboard Data Hook
 * Single Responsibility: Manage dashboard data using PostGraphile CRUD operations
 */

import { useState, useEffect } from 'react';
import { 
  executeGraphQL, 
  DASHBOARD_QUERIES, 
  DASHBOARD_USER_QUERIES, 
  DASHBOARD_REPOSITORY_QUERIES,
  ACTIVITY_CONFIG_QUERIES,
  ACTIVITY_TYPE_QUERIES 
} from '../api/postgraphile-client';

export interface Dashboard {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardUser {
  id: string;
  dashboardId: string;
  githubUserId: string;
  user: {
    id: string;
    githubUsername: string;
    displayName?: string;
    avatarUrl?: string;
    profileUrl?: string;
  };
}

export interface DashboardRepository {
  id: string;
  dashboardId: string;
  repositoryName: string;
  githubRepositoryId?: string;
}

export interface ActivityType {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityConfig {
  id: string;
  dashboardId: string;
  activityTypeId: string;
  enabled: boolean;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  activityType: ActivityType;
}

export interface DashboardData {
  dashboard: Dashboard | null;
  dashboards: Dashboard[]; // Add list of all dashboards
  users: DashboardUser[];
  repositories: DashboardRepository[];
  activityConfigs: ActivityConfig[];
  activityTypes: ActivityType[];
  loading: boolean;
  error: string | null;
}

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        if (!slug) {
          // Fetch all dashboards when no specific slug is provided
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
          return;
        }

        // Fetch dashboard by slug
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

        // Fetch related data in parallel
        const [usersResponse, repositoriesResponse, activityConfigsResponse, activityTypesResponse] = await Promise.all([
          executeGraphQL<{
            allDashboardGithubUsers: { nodes: DashboardUser[] };
          }>(DASHBOARD_USER_QUERIES.getByDashboard, { dashboardId: dashboard.id }),
          
          executeGraphQL<{
            allDashboardRepositories: { nodes: DashboardRepository[] };
          }>(DASHBOARD_REPOSITORY_QUERIES.getByDashboard, { dashboardId: dashboard.id }),
          
          executeGraphQL<{
            allDashboardActivityConfigs: { nodes: ActivityConfig[] };
          }>(ACTIVITY_CONFIG_QUERIES.getByDashboard, { dashboardId: dashboard.id }),
          
          executeGraphQL<{
            allActivityTypes: { nodes: ActivityType[] };
          }>(ACTIVITY_TYPE_QUERIES.getAll),
        ]);

        // Check for errors in any response
        const errors = [
          usersResponse.errors,
          repositoriesResponse.errors,
          activityConfigsResponse.errors,
          activityTypesResponse.errors,
        ].filter(Boolean);

        if (errors.length > 0) {
          throw new Error(errors[0]?.[0]?.message || 'Failed to fetch dashboard data');
        }

        setData({
          dashboard,
          dashboards: [], // Empty for single dashboard view
          users: usersResponse.data?.allDashboardGithubUsers.nodes || [],
          repositories: repositoriesResponse.data?.allDashboardRepositories.nodes || [],
          activityConfigs: activityConfigsResponse.data?.allDashboardActivityConfigs.nodes || [],
          activityTypes: activityTypesResponse.data?.allActivityTypes.nodes || [],
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
      }
    };

    fetchDashboardData();
  }, [slug]);

  return data;
}

// CRUD Operations Hook
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
        input: { dashboardId, githubUserId }
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
  };
}
