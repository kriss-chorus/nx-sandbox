import { useState } from 'react';

import {
    ACTIVITY_CONFIG_QUERIES,
    ACTIVITY_TYPE_QUERIES,
    executeGraphQL
} from '../api/postgraphile-client';
import { ActivityConfig } from '../types/dashboard';

// Activity type mapping - these match the database UUIDs
const ACTIVITY_TYPE_MAP: Record<string, string> = {
  'prs_created': '42c3b89d-2897-4109-a5e7-3406b773bbb4',
  'prs_merged': 'dff9302a-d6f0-49d1-9fb3-6414801eab46',
  'prs_reviewed': '7adbc498-4789-40ec-9be1-1bb3bf408e9f',
};

export function useActivityConfigs() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addActivityTypeToDashboard = async (dashboardId: string, activityTypeCode: string) => {
    setLoading(true);
    setError(null);

    try {
      // Map activity code to UUID
      const activityTypeId = ACTIVITY_TYPE_MAP[activityTypeCode];
      if (!activityTypeId) {
        throw new Error(`Unknown activity type code: ${activityTypeCode}`);
      }

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
