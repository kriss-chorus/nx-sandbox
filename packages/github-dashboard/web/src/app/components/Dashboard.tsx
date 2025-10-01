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
  Tabs,
  Tab
} from '@mui/material';
import { Add, Delete, Visibility, VisibilityOff } from '@mui/icons-material';
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
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const Dashboard: React.FC = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [githubUsers, setGithubUsers] = useState<GitHubUser[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [sortBy, setSortBy] = useState<'prsOpened' | 'prsReviewed' | 'prsMerged' | 'totalActivity'>('totalActivity');
  
  // Create Dashboard Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [newDashboardDescription, setNewDashboardDescription] = useState('');
  
  // Add User Dialog
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');

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

  const loadDashboardUsers = async (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
    setTabValue(1); // Switch to the dashboard tab
    setLoading(true);
    setError(null);
    
    try {
      const users: GitHubUser[] = [];
      const activities: UserActivity[] = [];
      const githubUsers = dashboard.githubUsers || [];
      
      for (const username of githubUsers) {
        try {
          // Get user basic info
          const userResponse = await fetch(`http://localhost:3001/api/github/users/${username}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            users.push(userData);
            
            // Get user's repositories for activity tracking
            const reposResponse = await fetch(`http://localhost:3001/api/github/users/${username}/repos?per_page=10`);
            if (reposResponse.ok) {
              const repos = await reposResponse.json();
              const repoList = repos.map((repo: any) => `${repo.owner.login}/${repo.name}`).slice(0, 5); // Limit to 5 repos
              
              // Get activity summary with repositories
              if (repoList.length > 0) {
                console.log(`Fetching activity for ${username} with repos:`, repoList);
                const activityResponse = await fetch(
                  `http://localhost:3001/api/github/users/${username}/activity-summary?repos=${repoList.join(',')}`
                );
                if (activityResponse.ok) {
                  const activityData = await activityResponse.json();
                  console.log(`Activity data for ${username}:`, activityData);
                  activities.push(activityData);
                } else {
                  console.error(`Failed to get activity for ${username}:`, activityResponse.status);
                }
              } else {
                // If no repos, create empty activity data
                activities.push({
                  user: userData,
                  weeklyActivity: { prsOpened: 0, prsReviewed: 0, prsMerged: 0, totalActivity: 0 },
                  overallStats: { totalPRs: 0, openPRs: 0, closedPRs: 0, mergedPRs: 0 },
                  repos: []
                });
              }
            }
          }
        } catch (err) {
          console.error(`Failed to load user ${username}:`, err);
        }
      }
      setGithubUsers(users);
      setUserActivities(activities);
    } catch (err) {
      setError('Failed to load dashboard users');
    } finally {
      setLoading(false);
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
      
      // Add user to dashboard (this would need a new API endpoint)
      // For now, just add to local state
      const updatedDashboard = {
        ...selectedDashboard,
        githubUsers: [...(selectedDashboard.githubUsers || []), newUsername]
      };
      setSelectedDashboard(updatedDashboard);
      setNewUsername('');
      setAddUserDialogOpen(false);
      
      // Reload the dashboard users
      loadDashboardUsers(updatedDashboard);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value as any);
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

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="My Dashboards" />
          {selectedDashboard && <Tab label={selectedDashboard.name} />}
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
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
      </TabPanel>

          {selectedDashboard && (
            <TabPanel value={tabValue} index={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                  <Typography variant="h4">{selectedDashboard.name}</Typography>
                  {selectedDashboard.description && (
                    <Typography variant="body1" color="text.secondary">
                      {selectedDashboard.description}
                    </Typography>
                  )}
                </Box>
                <Button 
                  variant="outlined" 
                  startIcon={<Add />}
                  onClick={() => setAddUserDialogOpen(true)}
                >
                  Add GitHub User
                </Button>
              </Box>

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

          {loading && <Typography>Loading users...</Typography>}
          
          {error && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
              <Typography color="error.contrastText">
                Error: {error}
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
                          
                          {/* Weekly Activity Stats */}
                          <Box mt={2}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              📊 This Week:
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              <Chip 
                                label={`${weekly.prsOpened} opened`} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                              <Chip 
                                label={`${weekly.prsReviewed} reviewed`} 
                                size="small" 
                                color="secondary" 
                                variant="outlined"
                              />
                              <Chip 
                                label={`${weekly.prsMerged} merged`} 
                                size="small" 
                                color="success" 
                                variant="outlined"
                              />
                              {activity.repos.length > 0 && (
                                <Chip 
                                  label={`${activity.repos.reduce((sum, repo) => sum + (repo.totalRecentPRs || 0), 0)} total PRs in repos`} 
                                  size="small" 
                                  color="info" 
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </Box>
                          
                          {/* Overall Stats */}
                          <Box mt={1}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              📈 Overall:
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              <Chip label={`${user.public_repos} repos`} size="small" />
                              <Chip label={`${user.followers} followers`} size="small" />
                              <Chip label={`${overall.totalPRs} total PRs`} size="small" />
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
        </TabPanel>
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
