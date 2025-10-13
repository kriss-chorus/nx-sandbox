import { useState } from 'react';

import {
    DASHBOARD_USER_QUERIES,
    executeGraphQL,
    GITHUB_USER_MUTATIONS,
    GITHUB_USER_QUERIES
} from '../api/postgraphile-client';
import { DashboardUser } from '../types/dashboard';

export function useDashboardUsers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const getGithubUserByUsername = async (username: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await executeGraphQL<{
        githubUserByUsername: unknown;
      }>(GITHUB_USER_QUERIES.getByUsername, { username });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.data?.githubUserByUsername;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get GitHub user';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createGithubUser = async (username: string, name?: string, avatarUrl?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await executeGraphQL<{
        createGithubUser: { githubUser: unknown };
      }>(GITHUB_USER_MUTATIONS.create, {
        input: {
          githubUser: {
            username,
            name: name || username,
            avatarUrl: avatarUrl || `https://github.com/${username}.png`
          }
        }
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.data?.createGithubUser.githubUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create GitHub user';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    addUserToDashboard,
    removeUserFromDashboard,
    getGithubUserByUsername,
    createGithubUser,
    loading,
    error,
  };
}
