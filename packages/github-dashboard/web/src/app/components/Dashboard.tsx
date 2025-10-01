import React, { useState, useEffect } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Fab,
  FormControl,
  InputLabel,
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
import { Add, Assessment, ArrowBack } from '@mui/icons-material';
import { GitHubUser } from '../../types/github';

interface UserActivity {
  user: GitHubUser;
  weeklyActivity: {
    prsOpened: number;
    prsReviewed: number;
    prsMerged: number;
    totalActivity: number;
  };
  overallStats: {
    totalPRs: number;
    openPRs: number;
    closedPRs: number;
    mergedPRs: number;
  };
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
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [githubUsers, setGithubUsers] = useState<GitHubUser[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{current: number, total: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboards' | 'dashboard'>('dashboards');
  const [sortBy, setSortBy] = useState<'prsOpened' | 'prsReviewed' | 'prsMerged' | 'totalActivity'>('totalActivity');
  
  // Create Dashboard Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [newDashboardDescription, setNewDashboardDescription] = useState('');
  
  // Add User Dialog
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  // Repository Management (per dashboard)
  const [organizationRepos, setOrganizationRepos] = useState<OrganizationRepository[]>([]);
  const [addRepoDialogOpen, setAddRepoDialogOpen] = useState(false);
  const [selectedRepoToAdd, setSelectedRepoToAdd] = useState<string>('');
  const [dashboardRepositories, setDashboardRepositories] = useState<string[]>([]);

  // Activity Configuration - Simplified and Grouped
  const [activityConfig, setActivityConfig] = useState({
    // PR Creation & Management
    trackPRsOpened: true,
    trackPRsMerged: true,
    
    // PR Review Activity (includes comments, approvals, changes requested, emoji reactions within PRs)
    trackPRReviews: true,
    
    // General Activity
    trackCommits: false,
    trackIssues: false,
    
    // Date Range
    dateRange: {
      start: '',
      end: ''
    }
  });

  // Organization Review Features
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [reviewTypes, setReviewTypes] = useState<string[]>(['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED']);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [loadingReviewSummary, setLoadingReviewSummary] = useState(false);

  // Load dashboards on component mount
  useEffect(() => {
    loadDashboards();
  }, []);

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
          description: newDashboardDescription,
          isPublic: true
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

  // Load activity configuration for a dashboard
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

  // Save activity configuration for a dashboard
  const saveActivityConfiguration = async (dashboardId: string, config: typeof activityConfig) => {
    try {
      // Convert the frontend config format to the API format
      const apiConfig = {
        configs: [
          { activityTypeName: 'prs_opened', enabled: config.trackPRsOpened, dateRangeStart: config.dateRange.start, dateRangeEnd: config.dateRange.end },
          { activityTypeName: 'prs_merged', enabled: config.trackPRsMerged, dateRangeStart: config.dateRange.start, dateRangeEnd: config.dateRange.end },
          { activityTypeName: 'pr_reviews', enabled: config.trackPRReviews, dateRangeStart: config.dateRange.start, dateRangeEnd: config.dateRange.end },
          { activityTypeName: 'commits', enabled: config.trackCommits, dateRangeStart: config.dateRange.start, dateRangeEnd: config.dateRange.end },
          { activityTypeName: 'issues', enabled: config.trackIssues, dateRangeStart: config.dateRange.start, dateRangeEnd: config.dateRange.end }
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

  // Handle activity configuration changes and auto-save
  const handleActivityConfigChange = (newConfig: typeof activityConfig) => {
    setActivityConfig(newConfig);
    // Auto-save when configuration changes
    if (selectedDashboard) {
      saveActivityConfiguration(selectedDashboard.id, newConfig);
    }
  };

  const loadDashboardUsers = async (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
    setCurrentView('dashboard'); // Navigate to dashboard view
    setLoading(true);
    setError(null);
    
    // Clear previous state immediately to prevent showing wrong users
    setGithubUsers([]);
    setUserActivities([]);
    
    // Load activity configuration for this dashboard
    await loadActivityConfiguration(dashboard.id);
    
    try {
      const users: GitHubUser[] = [];
      const activities: UserActivity[] = [];
      const githubUsers = dashboard.githubUsers || [];
      
      // DEVELOPMENT MODE: Comment out expensive API calls to preserve rate limits
      // TODO: Uncomment when ready to load real user data
      /*
      // OPTIMIZATION: Load users sequentially with progress updates to reduce API pressure
      for (let i = 0; i < githubUsers.length; i++) {
        const username = githubUsers[i];
        setLoadingProgress({ current: i + 1, total: githubUsers.length });
        console.log(`Loading user ${i + 1}/${githubUsers.length}: ${username}`);
        
        try {
          // Get user basic info (1 API call)
          const userResponse = await fetch(`http://localhost:3001/api/github/users/${username}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            
            // OPTIMIZATION: Use a much smaller repo limit to reduce API calls
            const reposResponse = await fetch(`http://localhost:3001/api/github/users/${username}/repos?per_page=3&sort=updated`);
            if (reposResponse.ok) {
              const repos = await reposResponse.json();
              const repoList = repos.map((repo: any) => `${repo.owner.login}/${repo.name}`).slice(0, 2); // Only 2 most recent repos
              
              // Get activity summary with limited repositories (1 API call)
              if (repoList.length > 0) {
                console.log(`Fetching activity for ${username} with repos:`, repoList);
                const activityResponse = await fetch(
                  `http://localhost:3001/api/github/users/${username}/activity-summary?repos=${repoList.join(',')}`
                );
                if (activityResponse.ok) {
                  const activityData = await activityResponse.json();
                  users.push(userData);
                  activities.push(activityData);
                  continue; // Success, move to next user
                } else {
                  console.error(`Failed to get activity for ${username}:`, activityResponse.status);
                }
              }
            }
            
            // Fallback: create empty activity data (no additional API calls)
            users.push(userData);
            activities.push({
              user: userData,
              weeklyActivity: { prsOpened: 0, prsReviewed: 0, prsMerged: 0, totalActivity: 0 },
              overallStats: { totalPRs: 0, openPRs: 0, closedPRs: 0, mergedPRs: 0 },
              repos: []
            });
          } else {
            console.error(`Failed to get user ${username}:`, userResponse.status);
          }
        } catch (err) {
          console.error(`Failed to load user ${username}:`, err);
        }
        
        // Small delay between users to be respectful to GitHub API
        if (i < githubUsers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      */
      
      // DEVELOPMENT MODE: Create mock data for users
      console.log(`DEVELOPMENT MODE: Creating mock data for ${githubUsers.length} users`);
      githubUsers.forEach((username, index) => {
        const mockUser = {
          id: index + 1,
          login: username,
          name: username,
          avatar_url: `https://github.com/${username}.png`,
          html_url: `https://github.com/${username}`,
          public_repos: 0,
          followers: 0,
          following: 0
        };
        
        const mockActivity = {
          user: mockUser,
          weeklyActivity: { prsOpened: 0, prsReviewed: 0, prsMerged: 0, totalActivity: 0 },
          overallStats: { totalPRs: 0, openPRs: 0, closedPRs: 0, mergedPRs: 0 },
          repos: []
        };
        
        users.push(mockUser);
        activities.push(mockActivity);
      });
      
      setGithubUsers(users);
      setUserActivities(activities);

      // Load dashboard repositories
      await loadDashboardRepositories(dashboard.id);
    } catch (err) {
      setError('Failed to load dashboard users');
    } finally {
      setLoading(false);
      setLoadingProgress(null);
    }
  };

  const addUserToDashboard = async () => {
    if (!newUsername.trim() || !selectedDashboard) return;
    
    // Check if user is already in the dashboard
    const existingUsers = selectedDashboard.githubUsers || [];
    if (existingUsers.includes(newUsername.trim())) {
      setError(`User '${newUsername}' is already in this dashboard`);
      return;
    }
    
    try {
      // DEVELOPMENT MODE: Skip user verification to preserve API calls
      // TODO: Uncomment when ready to verify users
      /*
      // First verify the user exists
      const userResponse = await fetch(`http://localhost:3001/api/github/users/${newUsername}`);
      if (!userResponse.ok) {
        if (userResponse.status === 404) {
          throw new Error(`GitHub user '${newUsername}' not found. Please check the username and try again.`);
        } else if (userResponse.status === 429) {
          throw new Error(`GitHub API rate limit exceeded. Please wait a few minutes and try again.`);
        } else {
          throw new Error(`Failed to verify user: ${userResponse.status} ${userResponse.statusText}`);
        }
      }
      */
      
      console.log(`DEVELOPMENT MODE: Skipping user verification for ${newUsername}`);
      
      // Add user to dashboard via API
      const addUserResponse = await fetch(`http://localhost:3001/api/dashboards/${selectedDashboard.id}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          githubUsername: newUsername.trim(),
          displayName: newUsername.trim()
        })
      });

      if (!addUserResponse.ok) {
        if (addUserResponse.status === 409) {
          throw new Error(`User '${newUsername}' is already in this dashboard`);
        } else {
          throw new Error(`Failed to add user to dashboard: ${addUserResponse.status} ${addUserResponse.statusText}`);
        }
      }

      // OPTIMIZATION: Just update local state instead of making more API calls
      const updatedDashboard = {
        ...selectedDashboard,
        githubUsers: [...(selectedDashboard.githubUsers || []), newUsername.trim()]
      };
      setSelectedDashboard(updatedDashboard);
      
      // Update the dashboards list locally too
      setDashboards(dashboards.map(d => 
        d.id === selectedDashboard.id ? updatedDashboard : d
      ));
      
      setNewUsername('');
      setAddUserDialogOpen(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    }
  };

  const navigateToDashboards = () => {
    setCurrentView('dashboards');
    setSelectedDashboard(null);
  };


  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value as any);
  };

  // Repository Management Functions
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
        // Refresh dashboard repositories
        await loadDashboardRepositories(selectedDashboard.id);
        setSelectedRepoToAdd('');
        setAddRepoDialogOpen(false);
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
        // Refresh dashboard repositories
        await loadDashboardRepositories(selectedDashboard.id);
      } else {
        throw new Error(`Failed to remove repository: ${response.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove repository');
    }
  };

  // Organization Review Functions
  const loadOrganizationData = async () => {
    try {
      // Load organization repositories
      const reposResponse = await fetch('http://localhost:3001/api/github/org/ChorusInnovations/repos');
      if (reposResponse.ok) {
        const repos = await reposResponse.json();
        setOrganizationRepos(repos);
      }

      // Load organization members
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
    return b.weeklyActivity[sortBy] - a.weeklyActivity[sortBy];
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
        <Fab 
          color="primary" 
          aria-label="create dashboard"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Add />
        </Fab>
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
                    <Chip 
                      label={dashboard.isPublic ? 'Public' : 'Private'} 
                      size="small" 
                      color={dashboard.isPublic ? 'primary' : 'default'}
                    />
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
                  <Button 
                    variant="outlined" 
                    startIcon={<Add />}
                    onClick={() => setAddRepoDialogOpen(true)}
                  >
                    Add Repository
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<Add />}
                    onClick={() => setAddUserDialogOpen(true)}
                  >
                    Add GitHub User
                  </Button>
                </Box>
              </Box>

              {/* Repository Management Section */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Dashboard Repositories
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Repositories used for organization review summaries
                  </Typography>
                  
                  {dashboardRepositories.length > 0 ? (
                    <Box display="flex" flexWrap="wrap" gap={1}>
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
                    <Typography variant="body2" color="text.secondary">
                      No repositories configured. Add repositories to enable organization review summaries.
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* Activity Configuration Section */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Activity Tracking Configuration
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Configure what types of GitHub activity to track and display
                      </Typography>
                    </Box>
                    
                    {/* Date Range - Inline with title */}
                    <Box display="flex" gap={2} alignItems="center">
                      <TextField
                        label="Start Date"
                        type="date"
                        size="small"
                        value={activityConfig.dateRange.start}
                        onChange={(e) => handleActivityConfigChange({
                          ...activityConfig,
                          dateRange: { ...activityConfig.dateRange, start: e.target.value }
                        })}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 140 }}
                      />
                      <Typography variant="body2" color="text.secondary">to</Typography>
                      <TextField
                        label="End Date"
                        type="date"
                        size="small"
                        value={activityConfig.dateRange.end}
                        onChange={(e) => handleActivityConfigChange({
                          ...activityConfig,
                          dateRange: { ...activityConfig.dateRange, end: e.target.value }
                        })}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 140 }}
                      />
                    </Box>
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
                              checked={activityConfig.trackPRsOpened}
                              onChange={(e) => handleActivityConfigChange({
                                ...activityConfig,
                                trackPRsOpened: e.target.checked
                              })}
                            />
                          }
                          label="Track PRs Opened"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={activityConfig.trackPRsMerged}
                              onChange={(e) => handleActivityConfigChange({
                                ...activityConfig,
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
                              checked={activityConfig.trackPRReviews}
                              onChange={(e) => handleActivityConfigChange({
                                ...activityConfig,
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
                              checked={activityConfig.trackCommits}
                              onChange={(e) => handleActivityConfigChange({
                                ...activityConfig,
                                trackCommits: e.target.checked
                              })}
                            />
                          }
                          label="Track Commits"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={activityConfig.trackIssues}
                              onChange={(e) => handleActivityConfigChange({
                                ...activityConfig,
                                trackIssues: e.target.checked
                              })}
                            />
                          }
                          label="Track Issues"
                        />
                      </FormGroup>
                    </Grid>


                    {/* Configuration Summary */}
                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            Current Configuration Summary
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Enabled:</strong> {
                              Object.entries(activityConfig)
                                .filter(([key, value]) => key !== 'dateRange' && value === true)
                                .map(([key]) => {
                                  switch(key) {
                                    case 'trackPRsOpened': return 'PRs Opened';
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
                              <strong>Date Range:</strong> All time (no date range set)
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

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
                      fontSize: '14px'
                    }}
                  >
                    <option value="totalActivity">Total Activity</option>
                    <option value="prsOpened">PRs Opened</option>
                    <option value="prsReviewed">PRs Reviewed</option>
                    <option value="prsMerged">PRs Merged</option>
                  </select>
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
                      case 'trackPRsOpened': return 'PRs Opened';
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
                {sortedActivities.map((activity) => {
                  const user = activity.user;
                  const weekly = activity.weeklyActivity;
                  const overall = activity.overallStats;
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={user.id}>
                      <UserCard>
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
                              {activityConfig.trackPRsOpened && (
                                <Chip 
                                  label={`${weekly.prsOpened} opened`} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                />
                              )}
                              {activityConfig.trackPRsMerged && (
                                <Chip 
                                  label={`${weekly.prsMerged} merged`} 
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                />
                              )}
                              {activityConfig.trackPRReviews && (
                                <Chip 
                                  label={`${weekly.prsReviewed} reviewed`} 
                                  size="small" 
                                  color="secondary" 
                                  variant="outlined"
                                />
                              )}
                              {activityConfig.trackCommits && (
                                <Chip 
                                  label={`${weekly.commits || 0} commits`} 
                                  size="small" 
                                  color="default" 
                                  variant="outlined"
                                />
                              )}
                              {activityConfig.trackIssues && (
                                <Chip 
                                  label={`${weekly.issues || 0} issues`} 
                                  size="small" 
                                  color="error" 
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </Box>
                          
                          {/* Overall Stats - Dynamic based on configuration */}
                          <Box mt={1}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              📈 Overall:
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              <Chip label={`${user.public_repos} repos`} size="small" />
                              <Chip label={`${user.followers} followers`} size="small" />
                              {activityConfig.trackPRsOpened && (
                                <Chip label={`${overall.totalPRs} total PRs`} size="small" />
                              )}
                              {activityConfig.trackPRsMerged && (
                                <Chip label={`${overall.mergedPRs} merged`} size="small" />
                              )}
                              {activityConfig.trackPRReviews && (
                                <Chip label={`${overall.totalReviews || 0} reviews`} size="small" />
                              )}
                              {activityConfig.trackCommits && (
                                <Chip label={`${overall.totalCommits || 0} commits`} size="small" />
                              )}
                              {activityConfig.trackIssues && (
                                <Chip label={`${overall.totalIssues || 0} issues`} size="small" />
                              )}
                            </Box>
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
            label="Description (optional)"
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
          <Button onClick={createDashboard} variant="contained" disabled={!newDashboardName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Repository Dialog */}
      <Dialog open={addRepoDialogOpen} onClose={() => setAddRepoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Repository to Dashboard</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Select a repository from ChorusInnovations organization to add to this dashboard.
          </Typography>
          
          {organizationRepos.length === 0 ? (
            <Box textAlign="center" py={2}>
              <Typography variant="body2" color="text.secondary" mb={2}>
                No organization repositories loaded yet.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={loadOrganizationData}
              >
                Load Organization Repositories
              </Button>
            </Box>
          ) : (
            <FormControl fullWidth>
              <InputLabel>Select Repository</InputLabel>
              <Select
                value={selectedRepoToAdd}
                onChange={(e) => setSelectedRepoToAdd(e.target.value)}
                input={<OutlinedInput label="Select Repository" />}
              >
                {organizationRepos
                  .filter(repo => !dashboardRepositories.includes(repo.full_name))
                  .map((repo) => (
                    <MenuItem key={repo.full_name} value={repo.full_name}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography>{repo.name}</Typography>
                        {repo.private && <Chip label="Private" size="small" color="secondary" />}
                      </Box>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddRepoDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={addRepositoryToDashboard} 
            variant="contained" 
            disabled={!selectedRepoToAdd || organizationRepos.length === 0}
          >
            Add Repository
          </Button>
        </DialogActions>
      </Dialog>

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
    </DashboardContainer>
  );
};
