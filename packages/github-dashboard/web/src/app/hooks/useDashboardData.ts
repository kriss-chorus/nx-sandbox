import { useCallback, useEffect, useRef, useState } from 'react';

import {
    ACTIVITY_CONFIG_QUERIES,
    DASHBOARD_QUERIES,
    DASHBOARD_REPOSITORY_QUERIES,
    DASHBOARD_USER_QUERIES,
    executeGraphQL
} from '../api/postgraphile-client';
import {
    ActivityConfig,
    Dashboard,
    DashboardData,
    DashboardRepository,
    DashboardUser
} from '../types/dashboard';

export function useDashboardData(slug?: string, clientId?: string): DashboardData & { refetch: () => void } {
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
        }>(ACTIVITY_CONFIG_QUERIES.getByDashboard, { dashboardId: dashboard.id })
      ]);

      // Handle errors from parallel requests
      const errors = [
        usersResponse.errors?.[0]?.message,
        repositoriesResponse.errors?.[0]?.message,
        activityConfigsResponse.errors?.[0]?.message
      ].filter(Boolean);

      if (errors.length > 0) {
        throw new Error(errors.join('; '));
      }

      setData({
        dashboard,
        dashboards: [],
        users: usersResponse.data?.allDashboardGithubUsers.nodes || [],
        repositories: repositoriesResponse.data?.allDashboardRepositories.nodes || [],
        activityConfigs: activityConfigsResponse.data?.allDashboardActivityConfigs.nodes || [],
        activityTypes: [],
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard data'
      }));
    } finally {
      fetchingRef.current = null;
    }
  }, [slug, clientId]);

  const refetch = useCallback(() => {
    fetchingRef.current = null;
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { ...data, refetch };
}
