import { useState } from 'react';

import {
    DASHBOARD_REPOSITORY_QUERIES,
    executeGraphQL
} from '../api/postgraphile-client';
import { DashboardRepository } from '../types/dashboard';

export function useDashboardRepositories() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const upsertRepository = async (repositoryData: { 
    githubRepoId: number; 
    name: string; 
    owner: string; 
    fullName: string; 
  }) => {
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

  return {
    addRepositoryToDashboard,
    removeRepositoryFromDashboard,
    upsertRepository,
    loading,
    error,
  };
}
