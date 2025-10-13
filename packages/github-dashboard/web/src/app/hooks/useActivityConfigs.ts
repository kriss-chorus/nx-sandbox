import { useState } from 'react';

import {
    ACTIVITY_CONFIG_QUERIES,
    ACTIVITY_TYPE_QUERIES,
    executeGraphQL
} from '../api/postgraphile-client';
import { ActivityConfig } from '../types/dashboard';

export function useActivityConfigs() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addActivityTypeToDashboard = async (dashboardId: string, activityTypeId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await executeGraphQL<{
        createDashboardActivityConfig: { dashboardActivityConfig: ActivityConfig };
      }>(ACTIVITY_CONFIG_QUERIES.createConfig, {
        input: {
          dashboardActivityConfig: {
            dashboardId,
            activityTypeId
          }
        }
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.data?.createDashboardActivityConfig.dashboardActivityConfig;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add activity type to dashboard';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeActivityTypeFromDashboard = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await executeGraphQL<{
        deleteDashboardActivityConfigById: { deletedDashboardActivityConfigId: string };
      }>(ACTIVITY_CONFIG_QUERIES.deleteConfig, { id });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.data?.deleteDashboardActivityConfigById.deletedDashboardActivityConfigId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove activity type from dashboard';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getActivityTypes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await executeGraphQL<{
        allActivityTypes: { nodes: unknown[] };
      }>(ACTIVITY_TYPE_QUERIES.getAll);

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.data?.allActivityTypes.nodes || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get activity types';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    addActivityTypeToDashboard,
    removeActivityTypeFromDashboard,
    getActivityTypes,
    loading,
    error,
  };
}
