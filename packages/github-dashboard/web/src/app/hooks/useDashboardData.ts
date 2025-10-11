import { useState } from 'react';

import { GitHubUser } from '../../types/github';

interface UserActivity {
  prsCreated: number;
  prsReviewed: number;
  prsMerged: number;
  totalActivity: number;
  commits?: number;
  issues?: number;
}

interface ActivityConfig {
  trackPRsCreated: boolean;
  trackPRsMerged: boolean;
  trackPRReviews: boolean;
  trackCommits: boolean;
  trackIssues: boolean;
  dateRange: {
    start: string;
    end: string;
  };
}

interface Dashboard {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  githubUsers: string[];
}

export const useDashboardData = (dashboardId?: string) => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [githubUsers, setGithubUsers] = useState<GitHubUser[]>([]);
  const [userActivities, setUserActivities] = useState<Array<{
    user: GitHubUser;
    activity: UserActivity;
    repos?: any[];
  }>>([]);
  const [activityConfig, setActivityConfig] = useState<ActivityConfig>({
    trackPRsCreated: true,
    trackPRsMerged: true,
    trackPRReviews: true,
    trackCommits: false,
    trackIssues: false,
    dateRange: {
      start: '2025-09-22',
      end: '2025-09-29'
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/dashboards');
      if (!response.ok) {
        throw new Error(`Failed to load dashboards: ${response.statusText}`);
      }
      const data = await response.json();
      setDashboards(data);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboards');
    } finally {
      setLoading(false);
    }
  };

  const loadActivityConfiguration = async (dashboardId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/dashboards/${dashboardId}/activity-config`);
      if (response.ok) {
        const config = await response.json();
        setActivityConfig(config);
      }
    } catch (err) {
      console.error('Error loading activity configuration:', err);
    }
  };

  const loadDashboardUsers = async (dashboard: Dashboard) => {
    try {
      setLoading(true);
      setGithubUsers([]);
      setUserActivities([]);

      await loadActivityConfiguration(dashboard.id);

      const dashboardUsersResponse = await fetch(`http://localhost:3001/api/dashboards/${dashboard.id}/users`);
      if (!dashboardUsersResponse.ok) {
        throw new Error(`Failed to load dashboard users: ${dashboardUsersResponse.statusText}`);
      }

      const dashboardUsers = await dashboardUsersResponse.json();
      if (dashboardUsers.length === 0) {
        setLoading(false);
        return;
      }

      const dateRangeParams = activityConfig.dateRange.start && activityConfig.dateRange.end
        ? `&start_date=${activityConfig.dateRange.start}&end_date=${activityConfig.dateRange.end}`
        : '';

      const batchResponse = await fetch(
        `http://localhost:3001/api/github/users/batch-activity-summary?dashboard_id=${dashboard.id}&repos=ChorusInnovations/platform${dateRangeParams}`
      );

      if (batchResponse.ok) {
        const batchData = await batchResponse.json();
        console.log('Batch data structure:', batchData[0]);
        
        const users: GitHubUser[] = [];
        const activities: Array<{ user: GitHubUser; activity: UserActivity; repos?: any[] }> = [];

        batchData.forEach((userActivity: any, index: number) => {
          const dashboardUser = dashboardUsers.find((du: any) => du.user.githubUsername === userActivity.user.login);
          if (dashboardUser) {
            const user = dashboardUser.user;
            const userData = {
              id: user.githubUserId,
              login: user.githubUsername,
              name: user.displayName || user.githubUsername,
              avatar_url: user.avatarUrl || `https://github.com/${user.githubUsername}.png`,
              html_url: user.profileUrl,
              public_repos: userActivity.user.public_repos || 0,
              public_gists: 0,
              followers: userActivity.user.followers || 0,
              following: userActivity.user.following || 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            users.push(userData);
            const transformedActivity = {
              user: userData,
              activity: userActivity.activity,
              repos: userActivity.repos || []
            };
            console.log(`Transformed activity for ${userData.login}:`, transformedActivity);
            activities.push(transformedActivity);
          }
        });

        setGithubUsers(users);
        setUserActivities(activities);
      } else {
        console.error(`Batch API failed:`, batchResponse.status);
        dashboardUsers.forEach((dashboardUser: any, index: number) => {
          const user = dashboardUser.user;
          const userData = {
            id: user.githubUserId,
            login: user.githubUsername,
            name: user.displayName || user.githubUsername,
            avatar_url: user.avatarUrl || `https://github.com/${user.githubUsername}.png`,
            html_url: user.profileUrl,
            public_repos: 0,
            public_gists: 0,
            followers: 0,
            following: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          users.push(userData);
          activities.push({
            user: userData,
            activity: { prsCreated: 0, prsReviewed: 0, prsMerged: 0, totalActivity: 0 },
            repos: []
          });
        });

        setGithubUsers(users);
        setUserActivities(activities);
      }

      setError(null);
    } catch (err) {
      console.error('Error loading dashboard users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard users');
    } finally {
      setLoading(false);
    }
  };

  const addUserToDashboard = async (username: string) => {
    if (!selectedDashboard) return;

    try {
      const userResponse = await fetch(`http://localhost:3001/api/github/users/${username}`);
      if (!userResponse.ok) {
        if (userResponse.status === 404) {
          throw new Error(`User '${username}' not found on GitHub`);
        } else if (userResponse.status === 429) {
          throw new Error('GitHub API rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`Failed to verify user: ${userResponse.statusText}`);
        }
      }

      const addUserResponse = await fetch(`http://localhost:3001/api/dashboards/${selectedDashboard.id}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ githubUsername: username }),
      });

      if (!addUserResponse.ok) {
        throw new Error(`Failed to add user to dashboard: ${addUserResponse.statusText}`);
      }

      const newUser = await addUserResponse.json();
      setGithubUsers(prev => [...prev, newUser]);
      
      const updatedDashboard = {
        ...selectedDashboard,
        githubUsers: [...(selectedDashboard.githubUsers || []), username]
      };
      setSelectedDashboard(updatedDashboard);
      setDashboards(dashboards.map(d => d.id === selectedDashboard.id ? updatedDashboard : d));
      
      setError(null);
    } catch (err) {
      console.error('Error adding user to dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to add user to dashboard');
    }
  };

  const removeUserFromDashboard = async (username: string) => {
    if (!selectedDashboard) return;
    
    try {
      const removeUserResponse = await fetch(`http://localhost:3001/api/dashboards/${selectedDashboard.id}/users/${username}`, {
        method: 'DELETE',
      });

      if (!removeUserResponse.ok) {
        throw new Error(`Failed to remove user from dashboard: ${removeUserResponse.status} ${removeUserResponse.statusText}`);
      }

      setGithubUsers(prev => prev.filter(user => user.login !== username));
      setUserActivities(prev => prev.filter(activity => activity.user.login !== username));
      
      const updatedDashboard = {
        ...selectedDashboard,
        githubUsers: (selectedDashboard.githubUsers || []).filter((user: string) => user !== username)
      };
      setSelectedDashboard(updatedDashboard);
      
      setDashboards(dashboards.map(d => 
        d.id === selectedDashboard.id ? updatedDashboard : d
      ));
      
      setError(null);
    } catch (err) {
      console.error('Error removing user from dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove user from dashboard');
    }
  };

  return {
    dashboards,
    selectedDashboard,
    githubUsers,
    userActivities,
    activityConfig,
    loading,
    error,
    setDashboards,
    setSelectedDashboard,
    setActivityConfig,
    loadDashboards,
    loadDashboardUsers,
    addUserToDashboard,
    removeUserFromDashboard,
    setError
  };
};
