import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  FormControl,
  InputLabel,
  IconButton,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { Add, Assessment, ArrowBack, Settings as SettingsIcon, Close } from '@mui/icons-material';
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

interface OrganizationRepository {
  name: string;
  full_name: string;
  private: boolean;
  updated_at: string;
}

interface OrganizationMember {
  login: string;
  id: number;
  type: string;
}

interface ReviewSummary {
  reviewerStats: { [reviewer: string]: { prsReviewed: number; prs: string[] } };
  totalReviews: number;
  dateRange: { start: string; end: string };
}

const DashboardContainer = styled(Box)`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const DashboardCard = styled(Card)`
  margin-bottom: 24px;
  transition: transform 0.2s ease-in-out;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const UserCard = styled(Card)`
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  padding: 16px;
  position: relative;
`;

interface Dashboard {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  githubUsers: string[];
  repositories?: string[];
}


export const Dashboard: React.FC = () => {
  const { dashboardSlug } = useParams<{ dashboardSlug?: string }>();
  const navigate = useNavigate();
  
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [githubUsers, setGithubUsers] = useState<GitHubUser[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{current: number, total: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboards' | 'dashboard'>('dashboards');
  const [sortBy, setSortBy] = useState<'prsCreated' | 'prsReviewed' | 'prsMerged' | 'totalActivity'>('totalActivity');
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [newDashboardDescription, setNewDashboardDescription] = useState('');
  
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  const [organizationRepos, setOrganizationRepos] = useState<OrganizationRepository[]>([]);
  const [selectedRepoToAdd, setSelectedRepoToAdd] = useState<string>('');
  const [dashboardRepositories, setDashboardRepositories] = useState<{name: string}[]>([]);

  const [activityConfig, setActivityConfig] = useState({
    trackPRsCreated: true,
    trackPRsMerged: true,
    
    trackPRReviews: true,
    
    trackCommits: false,
    trackIssues: false,
    
    dateRange: {
      start: '',
      end: ''
    }
  });

  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [reviewTypes, setReviewTypes] = useState<string[]>(['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED']);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [loadingReviewSummary, setLoadingReviewSummary] = useState(false);

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [tempActivityConfig, setTempActivityConfig] = useState(activityConfig);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadDashboards();
  }, []);

  useEffect(() => {
    if (dashboardSlug && dashboards.length > 0) {
      const dashboard = dashboards.find(d => d.slug === dashboardSlug);
      if (dashboard && (!selectedDashboard || selectedDashboard.id !== dashboard.id)) {
        loadDashboardUsers(dashboard);
      } else if (!dashboard) {
        navigate('/');
      }
    } else if (!dashboardSlug) {
      setCurrentView('dashboards');
      setSelectedDashboard(null);
    }
  }, [dashboardSlug, dashboards, navigate, selectedDashboard]);

  const loadDashboards = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/dashboards');
      if (response.ok) {
        const data = await response.json();
        setDashboards(data);
      }
    } catch (err) {
      console.error('Failed to load dashboards:', err);
    }
  };

  const createDashboard = async () => {
    if (!newDashboardName.trim()) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDashboardName,
          description: newDashboardDescription
        })
      });
      
      if (response.ok) {
        const newDashboard = await response.json();
        setDashboards([...dashboards, newDashboard]);
        setNewDashboardName('');
        setNewDashboardDescription('');
        setCreateDialogOpen(false);
      }
    } catch (err) {
      setError('Failed to create dashboard');
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
      console.error('Failed to load activity configuration:', err);
    }
  };

  const saveActivityConfiguration = async (dashboardId: string, config: typeof activityConfig) => {
    try {
      const apiConfig = {
        configs: [
          { 
            activityTypeName: 'prs_created', 
            enabled: config.trackPRsCreated, 
            dateRangeStart: config.dateRange.start ? new Date(config.dateRange.start + 'T00:00:00.000Z').toISOString() : undefined, 
            dateRangeEnd: config.dateRange.end ? new Date(config.dateRange.end + 'T23:59:59.999Z').toISOString() : undefined 
          },
          { 
            activityTypeName: 'prs_merged', 
            enabled: config.trackPRsMerged, 
            dateRangeStart: config.dateRange.start ? new Date(config.dateRange.start + 'T00:00:00.000Z').toISOString() : undefined, 
            dateRangeEnd: config.dateRange.end ? new Date(config.dateRange.end + 'T23:59:59.999Z').toISOString() : undefined 
          },
          { 
            activityTypeName: 'pr_reviews', 
            enabled: config.trackPRReviews, 
            dateRangeStart: config.dateRange.start ? new Date(config.dateRange.start + 'T00:00:00.000Z').toISOString() : undefined, 
            dateRangeEnd: config.dateRange.end ? new Date(config.dateRange.end + 'T23:59:59.999Z').toISOString() : undefined 
          },
          { 
            activityTypeName: 'commits', 
            enabled: config.trackCommits, 
            dateRangeStart: config.dateRange.start ? new Date(config.dateRange.start + 'T00:00:00.000Z').toISOString() : undefined, 
            dateRangeEnd: config.dateRange.end ? new Date(config.dateRange.end + 'T23:59:59.999Z').toISOString() : undefined 
          },
          { 
            activityTypeName: 'issues', 
            enabled: config.trackIssues, 
            dateRangeStart: config.dateRange.start ? new Date(config.dateRange.start + 'T00:00:00.000Z').toISOString() : undefined, 
            dateRangeEnd: config.dateRange.end ? new Date(config.dateRange.end + 'T23:59:59.999Z').toISOString() : undefined 
          }
        ]
      };

      const response = await fetch(`http://localhost:3001/api/dashboards/${dashboardId}/activity-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiConfig),
      });

      if (response.ok) {
        const updatedConfig = await response.json();
        setActivityConfig(updatedConfig);
        console.log('Activity configuration saved successfully');
      } else {
        console.error('Failed to save activity configuration');
      }
    } catch (err) {
      console.error('Failed to save activity configuration:', err);
    }
  };

  const openConfigModal = async () => {
    setTempActivityConfig(activityConfig);
    setConfigModalOpen(true);
    
    if (organizationRepos.length === 0) {
      await loadOrganizationData();
    }
  };

  const closeConfigModal = () => {
    setConfigModalOpen(false);
    setTempActivityConfig(activityConfig);
  };

  const saveConfigModal = async () => {
    if (selectedDashboard) {
      await saveActivityConfiguration(selectedDashboard.id, tempActivityConfig);
      setActivityConfig(tempActivityConfig);
      
      // Reload dashboard users with the new configuration (repositories are already loaded)
      await loadDashboardUsers(selectedDashboard);
      
      setConfigModalOpen(false);
    }
  };

  const handleTempActivityConfigChange = (newConfig: typeof activityConfig) => {
    setTempActivityConfig(newConfig);
  };

  const loadDashboardUsers = async (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
    setCurrentView('dashboard');
    setLoading(true);
    setError(null);
    setIsUpdating(false);
    
    navigate(`/dashboard/${dashboard.slug}`);
    
    setGithubUsers([]);
    setUserActivities([]);

    // Hydrate from sessionStorage for instant render
    try {
      const cachedKey = `batch:${dashboard.id}`;
      const cached = sessionStorage.getItem(cachedKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const users: GitHubUser[] = parsed.map((item: any) => ({
            id: item.user.id,
            login: item.user.login,
            name: item.user.name || item.user.login,
            avatar_url: item.user.avatar_url,
            html_url: `https://github.com/${item.user.login}`,
            public_repos: item.user.public_repos ?? 0,
            followers: item.user.followers ?? 0,
            following: item.user.following ?? 0,
            public_gists: item.user.public_gists ?? 0,
            created_at: item.user.created_at ?? '',
            updated_at: item.user.updated_at ?? ''
          }));
          const activities: UserActivity[] = parsed.map((item: any) => ({
            user: {
              id: item.user.id,
              login: item.user.login,
              name: item.user.name || item.user.login,
              avatar_url: item.user.avatar_url,
              html_url: `https://github.com/${item.user.login}`,
              public_repos: item.user.public_repos ?? 0,
              followers: item.user.followers ?? 0,
              following: item.user.following ?? 0,
              public_gists: item.user.public_gists ?? 0,
              created_at: item.user.created_at ?? '',
              updated_at: item.user.updated_at ?? ''
            } as GitHubUser,
            activity: item.activity,
            repos: item.activity?.repos
          }));
          setGithubUsers(users);
          setUserActivities(activities);
        }
      }
    } catch {}
    
    // Load activity configuration first
    const configResponse = await fetch(`http://localhost:3001/api/dashboards/${dashboard.id}/activity-config`);
    let currentConfig = activityConfig;
    if (configResponse.ok) {
      const dbConfig = await configResponse.json();
      currentConfig = {
        ...dbConfig,
        dateRange: {
          start: dbConfig.dateRange.start ? new Date(dbConfig.dateRange.start).toISOString().split('T')[0] : '',
          end: dbConfig.dateRange.end ? new Date(dbConfig.dateRange.end).toISOString().split('T')[0] : ''
        }
      };
      setActivityConfig(currentConfig);
    }
    
    try {
      // Load users and repositories in parallel
      const [dashboardUsersResponse, repositoriesResponse] = await Promise.all([
        fetch(`http://localhost:3001/api/dashboards/${dashboard.id}/users`),
        fetch(`http://localhost:3001/api/dashboards/${dashboard.id}/repositories`)
      ]);
      if (!dashboardUsersResponse.ok) throw new Error(`Failed to load dashboard users: ${dashboardUsersResponse.statusText}`);
      const dashboardUsers = await dashboardUsersResponse.json();

      let fetchedRepos: any[] = [];
      if (repositoriesResponse.ok) {
        const repos = await repositoriesResponse.json();
        fetchedRepos = Array.isArray(repos) ? repos : [];
        setDashboardRepositories(repos);
      }

      const dateRangeParams = currentConfig.dateRange.start && currentConfig.dateRange.end 
        ? `&start_date=${new Date(currentConfig.dateRange.start + 'T00:00:00.000Z').toISOString()}&end_date=${new Date(currentConfig.dateRange.end + 'T23:59:59.999Z').toISOString()}`
        : '';
      const reposSource = fetchedRepos.length > 0 ? fetchedRepos : (dashboardRepositories || []);
      const reposParam = reposSource
        .map((r: any) => typeof r === 'string' ? r : r.name)
        .filter(Boolean)
        .join(',');
      const reposQuery = reposParam ? `&repos=${encodeURIComponent(reposParam)}` : '';

      // Stage 1: fast pass (skip reviews) for quick paint
      setIsUpdating(true);
      const fastResponse = await fetch(
        `http://localhost:3001/api/github/users/cached-batch-activity-summary?dashboard_id=${dashboard.id}${dateRangeParams}${reposQuery}&include_reviews=false`
      );
      if (fastResponse.ok) {
        const fastData = await fastResponse.json();
        const users: GitHubUser[] = fastData.map((item: any) => ({
          id: item.user.id,
          login: item.user.login,
          name: item.user.name || item.user.login,
          avatar_url: item.user.avatar_url,
          html_url: `https://github.com/${item.user.login}`,
          public_repos: item.user.public_repos ?? 0,
          followers: item.user.followers ?? 0,
          following: item.user.following ?? 0,
          public_gists: item.user.public_gists ?? 0,
          created_at: item.user.created_at ?? '',
          updated_at: item.user.updated_at ?? ''
        }));
        const activities: UserActivity[] = fastData.map((item: any) => ({
          user: {
            id: item.user.id,
            login: item.user.login,
            name: item.user.name || item.user.login,
            avatar_url: item.user.avatar_url,
            html_url: `https://github.com/${item.user.login}`,
            public_repos: item.user.public_repos ?? 0,
            followers: item.user.followers ?? 0,
            following: item.user.following ?? 0,
            public_gists: item.user.public_gists ?? 0,
            created_at: item.user.created_at ?? '',
            updated_at: item.user.updated_at ?? ''
          } as GitHubUser,
          activity: item.activity,
          repos: item.activity?.repos
        }));
        setGithubUsers(users);
        setUserActivities(activities);
        // Save to sessionStorage for next first paint
        try { sessionStorage.setItem(`batch:${dashboard.id}`, JSON.stringify(fastData)); } catch {}
      }

      // Stage 2: full pass per configuration
      const includeReviewsQuery = `&include_reviews=${currentConfig.trackPRReviews}`;
      const fullResponse = await fetch(
        `http://localhost:3001/api/github/users/cached-batch-activity-summary?dashboard_id=${dashboard.id}${dateRangeParams}${reposQuery}${includeReviewsQuery}`
      );
      if (fullResponse.ok) {
        const fullData = await fullResponse.json();
        // Replace state with full data
        const users: GitHubUser[] = fullData.map((item: any) => ({
          id: item.user.id,
          login: item.user.login,
          name: item.user.name || item.user.login,
          avatar_url: item.user.avatar_url,
          html_url: `https://github.com/${item.user.login}`,
          public_repos: item.user.public_repos ?? 0,
          followers: item.user.followers ?? 0,
          following: item.user.following ?? 0,
          public_gists: item.user.public_gists ?? 0,
          created_at: item.user.created_at ?? '',
          updated_at: item.user.updated_at ?? ''
        }));
        const activities: UserActivity[] = fullData.map((item: any) => ({
          user: {
            id: item.user.id,
            login: item.user.login,
            name: item.user.name || item.user.login,
            avatar_url: item.user.avatar_url,
            html_url: `https://github.com/${item.user.login}`,
            public_repos: item.user.public_repos ?? 0,
            followers: item.user.followers ?? 0,
            following: item.user.following ?? 0,
            public_gists: item.user.public_gists ?? 0,
            created_at: item.user.created_at ?? '',
            updated_at: item.user.updated_at ?? ''
          } as GitHubUser,
          activity: item.activity,
          repos: item.activity?.repos
        }));
        setGithubUsers(users);
        setUserActivities(activities);
        try { sessionStorage.setItem(`batch:${dashboard.id}`, JSON.stringify(fullData)); } catch {}
      }
      setIsUpdating(false);
    } catch (err) {
      setError('Failed to load dashboard users');
    } finally {
      setLoading(false);
      setLoadingProgress(null);
    }
  };

  const addUserToDashboard = async () => {
    if (!newUsername.trim() || !selectedDashboard) return;

    const username = newUsername.trim();
    // Client-side guard: prevent duplicate adds
    if (githubUsers.some(u => u.login.toLowerCase() === username.toLowerCase())) {
      setError(`User ${username} is already in this dashboard`);
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3001/api/dashboards/${selectedDashboard.id}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUsername: username })
      });

      if (!response.ok) {
        if (response.status === 409) {
          setError(`User ${username} is already in this dashboard`);
          return;
        }
        throw new Error(`Failed to add user: ${response.status} ${response.statusText}`);
      }

      // Close dialog immediately on success and navigate to dashboard detail to reflect add
      const dashboardForNav = selectedDashboard;
      setAddUserDialogOpen(false);
      setNewUsername('');
      setError(null);
      if (dashboardForNav && currentView !== 'dashboard') {
        navigate(`/dashboard/${dashboardForNav.slug}`);
      }

      // Fast background fetch: use cached batch endpoint filtered to this user (no reviews) for speed
      const reposParam = (dashboardRepositories || [])
        .map(r => typeof r === 'string' ? r : r.name)
        .filter(Boolean)
        .join(',');
      const start = activityConfig.dateRange.start ? new Date(activityConfig.dateRange.start + 'T00:00:00.000Z').toISOString() : '';
      const end = activityConfig.dateRange.end ? new Date(activityConfig.dateRange.end + 'T23:59:59.999Z').toISOString() : '';
      const rangeParams = start && end ? `&start_date=${start}&end_date=${end}` : '';
      const reposQuery = reposParam ? `&repos=${encodeURIComponent(reposParam)}` : '';

      try {
        const fastResp = await fetch(
          `http://localhost:3001/api/github/users/cached-batch-activity-summary?dashboard_id=${selectedDashboard.id}&include_reviews=false&users=${encodeURIComponent(username)}${reposQuery}${rangeParams}`
        );
        if (fastResp.ok) {
          const arr = await fastResp.json();
          const first = Array.isArray(arr) ? arr[0] : null;
          if (first && first.user) {
            const profile = first.user;
            const newUser = {
              id: profile.id,
              login: profile.login,
              name: profile.name || profile.login,
              avatar_url: profile.avatar_url,
              html_url: `https://github.com/${profile.login}`,
              public_repos: profile.public_repos ?? 0,
              followers: profile.followers ?? 0,
              following: profile.following ?? 0,
              public_gists: profile.public_gists ?? 0,
              created_at: profile.created_at ?? '',
              updated_at: profile.updated_at ?? ''
            } as GitHubUser;

            setGithubUsers(prev => {
              if (prev.find(u => u.login.toLowerCase() === newUser.login.toLowerCase())) return prev;
              return [newUser, ...prev];
            });

            const act = first.activity;
            if (act) {
              setUserActivities(prev => [{ user: newUser, activity: act, repos: act.repos }, ...prev]);
            } else {
              setUserActivities(prev => [{ user: newUser, activity: { prsCreated: 0, prsReviewed: 0, prsMerged: 0, totalActivity: 0 }, repos: [] }, ...prev]);
            }
          }
        }
      } catch {}

      // error already cleared above

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    }
  };

  const removeUserFromDashboard = async (username: string) => {
    if (!selectedDashboard) return;
    
    try {
      const removeUserResponse = await fetch(`http://localhost:3001/api/dashboards/${selectedDashboard.id}/users/${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });

      if (!removeUserResponse.ok && removeUserResponse.status !== 404) {
        throw new Error(`Failed to remove user from dashboard: ${removeUserResponse.status} ${removeUserResponse.statusText}`);
      }

      // Update local state to remove the user regardless (idempotent UX)
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

  const navigateToDashboards = () => {
    setCurrentView('dashboards');
    setSelectedDashboard(null);
    navigate('/');
  };


  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value as any);
  };

  const loadDashboardRepositories = async (dashboardId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/dashboards/${dashboardId}/repositories`);
      if (response.ok) {
        const repos = await response.json();
        setDashboardRepositories(repos);
      }
    } catch (err) {
      console.error('Failed to load dashboard repositories:', err);
    }
  };

  const addRepositoryToDashboard = async () => {
    if (!selectedDashboard || !selectedRepoToAdd) return;

    try {
      const response = await fetch(`http://localhost:3001/api/dashboards/${selectedDashboard.id}/repositories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedRepoToAdd })
      });

      if (response.ok) {
        // Update local state immediately instead of reloading from API
        const newRepo = { name: selectedRepoToAdd };
        setDashboardRepositories(prev => [...prev, newRepo]);
        setSelectedRepoToAdd('');
      } else {
        throw new Error(`Failed to add repository: ${response.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add repository');
    }
  };

  const removeRepositoryFromDashboard = async (name: string) => {
    if (!selectedDashboard) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/dashboards/${selectedDashboard.id}/repositories/${encodeURIComponent(name)}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        // Update local state immediately instead of reloading from API
        setDashboardRepositories(prev => prev.filter(repo => repo.name !== name));
      } else {
        throw new Error(`Failed to remove repository: ${response.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove repository');
    }
  };

  const loadOrganizationData = async () => {
    try {
      const reposResponse = await fetch('http://localhost:3001/api/github/org/ChorusInnovations/repos');
      if (reposResponse.ok) {
        const repos = await reposResponse.json();
        setOrganizationRepos(repos);
      }

      const membersResponse = await fetch('http://localhost:3001/api/github/org/ChorusInnovations/members');
      if (membersResponse.ok) {
        const members = await membersResponse.json();
        setOrganizationMembers(members);
      }
    } catch (err) {
      console.error('Failed to load organization data:', err);
      setError('Failed to load organization data');
    }
  };

  const generateReviewSummary = async () => {
    if (dashboardRepositories.length === 0 || !startDate || !endDate) {
      setError('Please add repositories to this dashboard and select a date range');
      return;
    }

    setLoadingReviewSummary(true);
    setError(null);

    try {
      const reposParam = dashboardRepositories.join(',');
      const response = await fetch(
        `http://localhost:3001/api/github/org/review-summary?repos=${reposParam}&startDate=${startDate}&endDate=${endDate}`
      );

      if (response.ok) {
        const summary = await response.json();
        setReviewSummary(summary);
      } else {
        throw new Error(`Failed to generate review summary: ${response.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate review summary');
    } finally {
      setLoadingReviewSummary(false);
    }
  };

  const handleReviewTypeChange = (reviewType: string) => {
    setReviewTypes(prev => 
      prev.includes(reviewType) 
        ? prev.filter(type => type !== reviewType)
        : [...prev, reviewType]
    );
  };

  const sortedActivities = [...userActivities].sort((a, b) => {
    const aValue = a.activity[sortBy] || 0;
    const bValue = b.activity[sortBy] || 0;
    console.log(`Sorting: ${a.user.login} (${sortBy}: ${aValue}) vs ${b.user.login} (${sortBy}: ${bValue})`);
    return bValue - aValue;
  });

  return (
    <DashboardContainer>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            GitHub Dashboard Builder
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Create and customize dashboards to track GitHub users and their activity
          </Typography>
        </Box>
        {/* Header and Create button only on dashboards list view */}
        
      </Box>

      {/* Navigation Header */}
      {currentView !== 'dashboards' && (
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />}
            onClick={navigateToDashboards}
          >
            Back to My Dashboards
          </Button>
        </Box>
      )}

      {/* My Dashboards View */}
      {currentView === 'dashboards' && (
        <Grid container spacing={3}>
          {/* Header and Create button only on dashboards list view */}
          {currentView === 'dashboards' && (
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">My Dashboards</Typography>
                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create Dashboard
                </Button>
              </Box>
            </Grid>
          )}
          {dashboards.map((dashboard) => (
            <Grid item xs={12} sm={6} md={4} key={dashboard.id}>
              <DashboardCard>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6">{dashboard.name}</Typography>
                      {dashboard.description && (
                        <Typography variant="body2" color="text.secondary">
                          {dashboard.description}
                        </Typography>
                      )}
                    </Box>
                    
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {dashboard.githubUsers?.length || 0} GitHub users tracked
                  </Typography>
                  
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={() => loadDashboardUsers(dashboard)}
                  >
                    View Dashboard
                  </Button>
                </CardContent>
              </DashboardCard>
            </Grid>
          ))}
          
          {dashboards.length === 0 && (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No dashboards yet
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Create your first dashboard to start tracking GitHub users
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create Dashboard
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Dashboard View */}
      {currentView === 'dashboard' && selectedDashboard && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                  <Typography variant="h4">{selectedDashboard.name}</Typography>
                  {selectedDashboard.description && (
                    <Typography variant="body1" color="text.secondary">
                      {selectedDashboard.description}
                    </Typography>
                  )}
                </Box>
                <Box display="flex" gap={2}>
                  {/* Add User button moved to bottom of user cards */}
                </Box>
              </Box>


              {/* Dashboard Configuration Section */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Dashboard Configuration
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Configure repositories and activity tracking for this dashboard
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      startIcon={<SettingsIcon />}
                      onClick={openConfigModal}
                    >
                      Configure Settings
                    </Button>
                  </Box>
                  
                  <Grid container spacing={3}>
                    {/* Tracked Repositories */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Tracked Repositories
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        Repositories used for activity tracking and organization review summaries
                      </Typography>
                      
                      {dashboardRepositories.length > 0 ? (
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {dashboardRepositories.map((repo) => (
                            <Chip
                              key={repo}
                              label={repo}
                              color="primary"
                              variant="outlined"
                              size="small"
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No repositories configured yet
                        </Typography>
                      )}
                    </Grid>

                    {/* Activity Tracking Summary */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Activity Tracking
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        Types of GitHub activity being tracked
                      </Typography>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Enabled:</strong> {
                            Object.entries(activityConfig)
                              .filter(([key, value]) => key !== 'dateRange' && value === true)
                              .map(([key]) => {
                                switch(key) {
                                  case 'trackPRsCreated': return 'PRs Created';
                                  case 'trackPRsMerged': return 'PRs Merged';
                                  case 'trackPRReviews': return 'PR Reviews';
                                  case 'trackCommits': return 'Commits';
                                  case 'trackIssues': return 'Issues';
                                  default: return key.replace('track', '').replace(/([A-Z])/g, ' $1').trim();
                                }
                              })
                              .join(', ') || 'None'
                          }
                        </Typography>
                        {activityConfig.dateRange.start && activityConfig.dateRange.end && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            <strong>Date Range:</strong> {activityConfig.dateRange.start} to {activityConfig.dateRange.end}
                          </Typography>
                        )}
                        {(!activityConfig.dateRange.start || !activityConfig.dateRange.end) && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            <strong>Date Range:</strong> All time
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Add User Button - Show when there are users */}
              {sortedActivities.length > 0 && (
                <Box textAlign="center" mb={3}>
                  <Button 
                    variant="outlined" 
                    startIcon={<Add />}
                    onClick={() => setAddUserDialogOpen(true)}
                  >
                    Add Another GitHub User
                  </Button>
                </Box>
              )}

              {/* Sorting Controls */}
              {userActivities.length > 0 && (
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Typography variant="body2" color="text.secondary">
                    Sort by:
                  </Typography>
                  <select 
                    value={sortBy} 
                    onChange={handleSortChange}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: '4px', 
                      border: '1px solid #ccc',
                      fontSize: '14px',
                      backgroundColor: '#f5f5f5'
                    }}
                  >
                    <option value="totalActivity">Total Activity</option>
                    <option value="prsCreated">PRs Created</option>
                    <option value="prsReviewed">PRs Reviewed</option>
                    <option value="prsMerged">PRs Merged</option>
                  </select>
                  <Typography variant="caption" color="text.secondary">
                    (Currently sorting by: {sortBy === 'totalActivity' ? 'Total Activity' : 
                     sortBy === 'prsCreated' ? 'PRs Created' :
                     sortBy === 'prsReviewed' ? 'PRs Reviewed' : 'PRs Merged'})
                  </Typography>
                </Box>
              )}

          {loading && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" gutterBottom>
                Loading users...
              </Typography>
              {loadingProgress && (
                <Typography variant="body2" color="text.secondary">
                  {loadingProgress.current} of {loadingProgress.total} users loaded
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                ⚠️ Using optimized API calls to preserve rate limits
              </Typography>
            </Box>
          )}
          
          {error && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
              <Typography color="error.contrastText">
                Error: {error}
              </Typography>
            </Box>
          )}

          {/* User Cards with Active Configuration Indicator */}
          {userActivities.length > 0 && (
            <Box mb={2}>
              <Typography variant="h6" gutterBottom>
                Team Members
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Showing: {Object.entries(activityConfig)
                  .filter(([key, value]) => key !== 'dateRange' && value === true)
                  .map(([key]) => {
                    switch(key) {
                      case 'trackPRsCreated': return 'PRs Created';
                      case 'trackPRsMerged': return 'PRs Merged';
                      case 'trackPRReviews': return 'PR Reviews';
                      case 'trackCommits': return 'Commits';
                      case 'trackIssues': return 'Issues';
                      default: return key.replace('track', '').replace(/([A-Z])/g, ' $1').trim();
                    }
                  })
                  .join(', ') || 'Basic info only'}
              </Typography>
            </Box>
          )}

              <Grid container spacing={3}>
                {sortedActivities.map((activityData) => {
                  const user = activityData.user;
                  const activity = activityData.activity;
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={`${user.id}-${user.login}`}>
                      <UserCard>
                        {/* Remove User Button */}
                        <IconButton
                          size="small"
                          onClick={() => removeUserFromDashboard(user.login)}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            }
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                        
                        <Avatar src={user.avatar_url} sx={{ width: 48, height: 48, mr: 2 }} />
                        <Box flex={1}>
                          <Typography variant="h6">{user.name || user.login}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            @{user.login}
                          </Typography>
                          
                          {/* Activity Stats - Dynamic based on configuration */}
                          <Box mt={2}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              📊 Activity:
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              {activityConfig.trackPRsCreated && (
                                <Chip 
                                  label={`${activity.prsCreated} created`} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                />
                              )}
                              {activityConfig.trackPRsMerged && (
                                <Chip 
                                  label={`${activity.prsMerged} merged`} 
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                />
                              )}
                              {activityConfig.trackPRReviews && (
                                <Chip 
                                  label={`${activity.prsReviewed} reviewed`} 
                                  size="small" 
                                  color="secondary" 
                                  variant="outlined"
                                />
                              )}
                              {activityConfig.trackCommits && (
                                <Chip 
                                  label={`${activity.commits || 0} commits`} 
                                  size="small" 
                                  color="default" 
                                  variant="outlined"
                                />
                              )}
                              {activityConfig.trackIssues && (
                                <Chip 
                                  label={`${activity.issues || 0} issues`} 
                                  size="small" 
                                  color="error" 
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </Box>
                          
                          {/* User Metadata */}
                          <Box mt={1}>
                            <Typography variant="caption" color="text.secondary">
                              {user.public_repos} repos • {user.followers} followers • {user.following} following
                            </Typography>
                          </Box>
                        </Box>
                      </UserCard>
                    </Grid>
                  );
                })}
            
            {sortedActivities.length === 0 && !loading && (
              <Grid item xs={12}>
                <Box textAlign="center" py={4}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No GitHub users added yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Add GitHub users to start tracking their activity
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<Add />}
                    onClick={() => setAddUserDialogOpen(true)}
                  >
                    Add GitHub User
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Organization Review View - Removed for now */}
      {false && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Organization Review Summary
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Generate code review summaries using repositories from the selected dashboard
                </Typography>

                {!selectedDashboard ? (
                  <Box textAlign="center" py={4}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Select a Dashboard First
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Choose a dashboard from the "My Dashboards" tab to configure repositories and generate review summaries.
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {/* Dashboard Repository Info */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Using repositories from: <strong>{selectedDashboard.name}</strong>
                      </Typography>
                      {dashboardRepositories.length > 0 ? (
                        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                          {dashboardRepositories.map((repo) => (
                            <Chip key={repo} label={repo} size="small" color="primary" />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" mb={2}>
                          No repositories configured in this dashboard. Add repositories in the dashboard tab first.
                        </Typography>
                      )}
                    </Grid>

                  {/* Date Range Selection */}
                  <Grid item xs={12} md={6}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Start Date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="End Date"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Review Type Filters */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Review Types to Include:
                    </Typography>
                    <FormGroup row>
                      {['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED'].map((type) => (
                        <FormControlLabel
                          key={type}
                          control={
                            <Checkbox
                              checked={reviewTypes.includes(type)}
                              onChange={() => handleReviewTypeChange(type)}
                            />
                          }
                          label={type}
                        />
                      ))}
                    </FormGroup>
                  </Grid>

                  {/* Generate Button */}
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={generateReviewSummary}
                      disabled={dashboardRepositories.length === 0 || !startDate || !endDate || loadingReviewSummary}
                      startIcon={<Assessment />}
                    >
                      {loadingReviewSummary ? 'Generating...' : 'Generate Review Summary'}
                    </Button>
                  </Grid>
                </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Review Summary Results */}
          {reviewSummary && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Review Summary Results
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Date Range: {reviewSummary.dateRange.start} to {reviewSummary.dateRange.end}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Total Reviews: {reviewSummary.totalReviews}
                  </Typography>

                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Reviewer</TableCell>
                          <TableCell align="right">PRs Reviewed</TableCell>
                          <TableCell>PRs</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(reviewSummary.reviewerStats)
                          .sort(([,a], [,b]) => b.prsReviewed - a.prsReviewed)
                          .map(([reviewer, stats]) => (
                            <TableRow key={reviewer}>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Avatar sx={{ width: 24, height: 24 }}>
                                    {reviewer.charAt(0).toUpperCase()}
                                  </Avatar>
                                  {reviewer}
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Chip label={stats.prsReviewed} color="primary" />
                              </TableCell>
                              <TableCell>
                                <Box display="flex" flexWrap="wrap" gap={0.5}>
                                  {stats.prs.map((pr) => (
                                    <Chip key={pr} label={pr} size="small" variant="outlined" />
                                  ))}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Create Dashboard Dialog */}
      {currentView === 'dashboards' && (
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Dashboard</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Dashboard Name"
              fullWidth
              variant="outlined"
              value={newDashboardName}
              onChange={(e) => setNewDashboardName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Description (Optional)"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={newDashboardDescription}
              onChange={(e) => setNewDashboardDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={createDashboard}
              variant="contained"
              disabled={!newDashboardName.trim()}
            >
              Create Dashboard
            </Button>
          </DialogActions>
        </Dialog>
      )}


      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onClose={() => setAddUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add GitHub User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="GitHub Username"
            fullWidth
            variant="outlined"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="e.g., octocat"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={addUserToDashboard} variant="contained" disabled={!newUsername.trim()}>
            Add User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dashboard Settings Modal */}
      <Dialog open={configModalOpen} onClose={closeConfigModal} maxWidth="lg" fullWidth>
        <DialogTitle>Dashboard Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure repositories and activity tracking for this dashboard
          </Typography>
          
          {/* Repository Management Section */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Repository Management
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Select repositories from ChorusInnovations organization for organization review summaries
              </Typography>
              
              {/* Current Repositories */}
              {dashboardRepositories.length > 0 ? (
                <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                  {dashboardRepositories.map((repo) => (
                    <Chip
                      key={repo}
                      label={repo}
                      onDelete={() => removeRepositoryFromDashboard(repo)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" mb={2}>
                  No repositories configured. Add repositories to enable organization review summaries.
                </Typography>
              )}
              
              {/* Add Repository */}
              <Box display="flex" gap={2} alignItems="center">
                <FormControl fullWidth size="small">
                  <InputLabel>Select Repository</InputLabel>
                  <Select
                    value={selectedRepoToAdd || ''}
                    onChange={(e) => setSelectedRepoToAdd(e.target.value)}
                    input={<OutlinedInput label="Select Repository" />}
                  >
                    {organizationRepos
                      .filter(repo => !dashboardRepositories.includes(repo.full_name))
                      .map((repo) => (
                        <MenuItem key={repo.full_name} value={repo.full_name}>
                          {repo.full_name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <Button 
                  variant="outlined" 
                  startIcon={<Add />}
                  onClick={addRepositoryToDashboard}
                  disabled={!selectedRepoToAdd}
                >
                  Add
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Activity Configuration Section */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity Tracking Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Configure what types of GitHub activity to track and display
              </Typography>
              
              {/* Date Range */}
              <Box display="flex" gap={2} alignItems="center" mb={3}>
                <TextField
                  label="Start Date"
                  type="date"
                  size="small"
                  value={tempActivityConfig.dateRange.start}
                  onChange={(e) => handleTempActivityConfigChange({
                    ...tempActivityConfig,
                    dateRange: { ...tempActivityConfig.dateRange, start: e.target.value }
                  })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 140 }}
                />
                <Typography variant="body2" color="text.secondary">to</Typography>
                <TextField
                  label="End Date"
                  type="date"
                  size="small"
                  value={tempActivityConfig.dateRange.end}
                  onChange={(e) => handleTempActivityConfigChange({
                    ...tempActivityConfig,
                    dateRange: { ...tempActivityConfig.dateRange, end: e.target.value }
                  })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 140 }}
                />
              </Box>
              
              <Grid container spacing={3}>
                {/* PR Creation & Management */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    PR Creation & Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Track when team members create and merge pull requests
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={tempActivityConfig.trackPRsCreated}
                          onChange={(e) => handleTempActivityConfigChange({
                            ...tempActivityConfig,
                            trackPRsCreated: e.target.checked
                          })}
                        />
                      }
                      label="Track PRs Created"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={tempActivityConfig.trackPRsMerged}
                          onChange={(e) => handleTempActivityConfigChange({
                            ...tempActivityConfig,
                            trackPRsMerged: e.target.checked
                          })}
                        />
                      }
                      label="Track PRs Merged"
                    />
                  </FormGroup>
                </Grid>

                {/* PR Review Activity */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    PR Review Activity
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Includes: comments, approvals, change requests, emoji reactions on PRs
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={tempActivityConfig.trackPRReviews}
                          onChange={(e) => handleTempActivityConfigChange({
                            ...tempActivityConfig,
                            trackPRReviews: e.target.checked
                          })}
                        />
                      }
                      label="Track PR Reviews"
                    />
                  </FormGroup>
                </Grid>

                {/* General Activity */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    General Activity
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Other GitHub activities
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={tempActivityConfig.trackCommits}
                          onChange={(e) => handleTempActivityConfigChange({
                            ...tempActivityConfig,
                            trackCommits: e.target.checked
                          })}
                        />
                      }
                      label="Track Commits"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={tempActivityConfig.trackIssues}
                          onChange={(e) => handleTempActivityConfigChange({
                            ...tempActivityConfig,
                            trackIssues: e.target.checked
                          })}
                        />
                      }
                      label="Track Issues"
                    />
                  </FormGroup>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfigModal}>Cancel</Button>
          <Button onClick={saveConfigModal} variant="contained">
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContainer>
  );
};
