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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
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
    setLoading(true);
    setError(null);
    
    try {
      const users: GitHubUser[] = [];
      const githubUsers = dashboard.githubUsers || [];
      
      for (const username of githubUsers) {
        try {
          const response = await fetch(`http://localhost:3001/api/github/users/${username}`);
          if (response.ok) {
            const userData = await response.json();
            users.push(userData);
          }
        } catch (err) {
          console.error(`Failed to load user ${username}:`, err);
        }
      }
      setGithubUsers(users);
    } catch (err) {
      setError('Failed to load dashboard users');
    } finally {
      setLoading(false);
    }
  };

  const addUserToDashboard = async () => {
    if (!newUsername.trim() || !selectedDashboard) return;
    
    try {
      // First verify the user exists
      const userResponse = await fetch(`http://localhost:3001/api/github/users/${newUsername}`);
      if (!userResponse.ok) {
        throw new Error('User not found');
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

          {loading && <Typography>Loading users...</Typography>}
          
          {error && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
              <Typography color="error.contrastText">
                Error: {error}
              </Typography>
            </Box>
          )}

          <Grid container spacing={3}>
            {githubUsers.map((user) => (
              <Grid item xs={12} sm={6} md={4} key={user.id}>
                <UserCard>
                  <Avatar src={user.avatar_url} sx={{ width: 48, height: 48, mr: 2 }} />
                  <Box flex={1}>
                    <Typography variant="h6">{user.name || user.login}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{user.login}
                    </Typography>
                    <Box display="flex" gap={1} mt={1}>
                      <Chip label={`${user.public_repos} repos`} size="small" />
                      <Chip label={`${user.followers} followers`} size="small" />
                    </Box>
                  </Box>
                </UserCard>
              </Grid>
            ))}
            
            {githubUsers.length === 0 && !loading && (
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
