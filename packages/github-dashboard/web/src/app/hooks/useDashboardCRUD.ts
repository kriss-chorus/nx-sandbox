import { useState } from 'react';

import { DASHBOARD_QUERIES, executeGraphQL } from '../api/postgraphile-client';
import { Dashboard } from '../types/dashboard';

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

  return {
    createDashboard,
    updateDashboard,
    deleteDashboard,
    loading,
    error,
  };
}
