import { useCallback, useEffect, useRef, useState } from 'react';

import { GitHubUser } from '../../types/github';

interface UserActivity {
  user: GitHubUser;
  activity: {
    prsCreated: number;
    prsReviewed: number;
    prsMerged: number;
    totalActivity: number;
    commits?: number;
    issues?: number;
  };
  repos?: any[];
}

interface UseUserActivityManagerProps {
  selectedDashboard: any;
  githubUsers: any[];
  dashboardRepositories: any[];
}

export function useUserActivityManager({
  selectedDashboard,
  githubUsers,
  dashboardRepositories
}: UseUserActivityManagerProps) {
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const fetchingRef = useRef<string | null>(null);

  const fetchUserActivities = useCallback(async () => {
    if (!selectedDashboard || githubUsers.length === 0) {
      return;
    }

    const cacheKey = `${selectedDashboard.id}-${githubUsers.length}`;
    if (fetchingRef.current === cacheKey) {
      return;
    }
    fetchingRef.current = cacheKey;

    try {
      setFetchingUsers(true);
      
      // For now, create user activities with mock data since we don't have the batch activity summary query
      // TODO: Implement proper activity data fetching when the backend query is available
      const activities = githubUsers.map(dashboardUser => {
        if (!dashboardUser?.githubUserByGithubUserId) {
          return null;
        }
        
        // Convert to GitHubUser format expected by UserActivityGrid
        const githubUser: GitHubUser = {
          id: parseInt(dashboardUser.githubUserByGithubUserId.id) || 0,
          login: dashboardUser.githubUserByGithubUserId.githubUsername,
          name: dashboardUser.githubUserByGithubUserId.displayName || dashboardUser.githubUserByGithubUserId.githubUsername || '',
          avatar_url: dashboardUser.githubUserByGithubUserId.avatarUrl || `https://github.com/${dashboardUser.githubUserByGithubUserId.githubUsername}.png`,
          html_url: dashboardUser.githubUserByGithubUserId.profileUrl || `https://github.com/${dashboardUser.githubUserByGithubUserId.githubUsername}`,
          public_repos: 0,
          followers: 0,
          following: 0,
          public_gists: 0,
          created_at: '',
          updated_at: ''
        };
        
        // Mock activity data for now
        const mockActivity = {
          prsCreated: Math.floor(Math.random() * 10),
          prsReviewed: Math.floor(Math.random() * 15),
          prsMerged: Math.floor(Math.random() * 8),
          totalActivity: 0, // Will be calculated
          commits: Math.floor(Math.random() * 20),
          issues: Math.floor(Math.random() * 5)
        };
        mockActivity.totalActivity = mockActivity.prsCreated + mockActivity.prsReviewed + mockActivity.prsMerged;
        
        return {
          user: githubUser,
          activity: mockActivity,
          repos: [],
        };
      }).filter(Boolean) || [];

      setUserActivities(activities.filter((activity: any): activity is UserActivity => activity !== null) as UserActivity[]);
    } catch (error) {
      console.error('Error fetching user activities:', error);
    } finally {
      setFetchingUsers(false);
      fetchingRef.current = null;
    }
  }, [selectedDashboard, dashboardRepositories, githubUsers]);

  useEffect(() => {
    fetchUserActivities();
  }, [fetchUserActivities]);

  const handleRefreshStats = useCallback(() => {
    fetchUserActivities();
  }, [fetchUserActivities]);

  return {
    userActivities,
    fetchingUsers,
    handleRefreshStats
  };
}
