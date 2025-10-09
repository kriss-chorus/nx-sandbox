import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material';
import { Add, Close, Delete } from '@mui/icons-material';
import { GitHubUser } from '../../../types/github';

interface DashboardConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: {
    repositories: string[];
    users: GitHubUser[];
    activityConfig: any;
    dateRange: { start: string; end: string };
    isPublic: boolean;
  }) => void;
  initialRepositories: string[];
  initialUsers: GitHubUser[];
  initialActivityConfig: any;
  initialDateRange: { start: string; end: string };
  initialIsPublic: boolean;
  organizationRepos?: any[];
}

export const DashboardConfigModal: React.FC<DashboardConfigModalProps> = ({
  open,
  onClose,
  onSave,
  initialRepositories,
  initialUsers,
  initialActivityConfig,
  initialDateRange,
  initialIsPublic,
  organizationRepos = []
}) => {
  const [repositories, setRepositories] = useState<string[]>(initialRepositories);
  const [users, setUsers] = useState<GitHubUser[]>(initialUsers);
  const [activityConfig, setActivityConfig] = useState(initialActivityConfig);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [isPublic, setIsPublic] = useState<boolean>(initialIsPublic);
  const [selectedRepoToAdd, setSelectedRepoToAdd] = useState<string>('');
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>('');

  useEffect(() => {
    setRepositories(initialRepositories || []);
    setUsers(initialUsers || []);
    setActivityConfig(initialActivityConfig || {});
    setDateRange(initialDateRange || { start: '', end: '' });
    setIsPublic(initialIsPublic ?? true);
  }, [initialRepositories, initialUsers, initialActivityConfig, initialDateRange, initialIsPublic]);

  const handleAddRepository = () => {
    if (selectedRepoToAdd && !repositories.includes(selectedRepoToAdd)) {
      setRepositories([...repositories, selectedRepoToAdd]);
      setSelectedRepoToAdd('');
    }
  };

  const handleRemoveRepository = (repo: string) => {
    setRepositories(repositories.filter(r => r !== repo));
  };

  const handleAddUser = () => {
    if (selectedUserToAdd.trim()) {
      const username = selectedUserToAdd.trim();
      // Check if user already exists
      if (!users.find(u => u.login === username)) {
        const newUser = {
          id: Date.now(), // Temporary ID
          login: username,
          name: username,
          avatar_url: `https://github.com/${username}.png`,
          html_url: `https://github.com/${username}`,
          public_repos: 0,
          followers: 0,
          following: 0,
          public_gists: 0,
          created_at: '',
          updated_at: ''
        };
        setUsers([...users, newUser]);
        setSelectedUserToAdd('');
      }
    }
  };

  const handleRemoveUser = (userLogin: string) => {
    setUsers(users.filter(u => u.login !== userLogin));
  };

  const handleActivityConfigChange = (key: string, value: boolean) => {
    setActivityConfig({
      ...activityConfig,
      [key]: value
    });
  };

  const handleSave = () => {
    onSave({
      repositories,
      users,
      activityConfig,
      dateRange,
      isPublic
    });
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        style: {
          zIndex: 1300
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Configure Dashboard</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Repositories Section */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Repositories
                </Typography>
                
                <Box display="flex" gap={2} mb={2}>
                  <FormControl fullWidth>
                    <InputLabel>Add Repository</InputLabel>
                    <Select
                      value={selectedRepoToAdd}
                      onChange={(e) => setSelectedRepoToAdd(e.target.value)}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                            zIndex: 9999
                          }
                        }
                      }}
                    >
                      {(organizationRepos?.length ?? 0) > 0 ? (
                        (organizationRepos || [])
                          .filter(repo => !repositories.includes(repo.full_name))
                          .map(repo => (
                            <MenuItem key={repo.full_name} value={repo.full_name}>
                              {repo.full_name}
                            </MenuItem>
                          ))
                      ) : (
                        <MenuItem disabled>
                          Loading repositories...
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddRepository}
                    disabled={!selectedRepoToAdd}
                  >
                    Add
                  </Button>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={1}>
                  {repositories.map(repo => (
                    <Chip
                      key={repo}
                      label={repo}
                      onDelete={() => handleRemoveRepository(repo)}
                      deleteIcon={<Delete />}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Users Section */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Members
                </Typography>
                
                <Box display="flex" gap={2} mb={2}>
                  <TextField
                    fullWidth
                    label="GitHub Username"
                    value={selectedUserToAdd}
                    onChange={(e) => setSelectedUserToAdd(e.target.value)}
                    placeholder="e.g., octocat"
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddUser}
                    disabled={!selectedUserToAdd.trim()}
                  >
                    Add
                  </Button>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={1}>
                  {users.length > 0 && (
                    users.map(user => (
                      <Chip
                        key={user.login}
                        label={user.name || user.login}
                        onDelete={() => handleRemoveUser(user.login)}
                        deleteIcon={<Delete />}
                      />
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Activity Configuration */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Activity Types
                </Typography>
                
                <Grid container spacing={2}>
                  {Object.entries(activityConfig).map(([key, enabled]) => (
                    <Grid item xs={12} sm={6} key={key}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={enabled as boolean}
                            onChange={(e) => handleActivityConfigChange(key, e.target.checked)}
                          />
                        }
                        label={key.replace('track', '').replace(/([A-Z])/g, ' $1').trim()}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Date Range */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Date Range
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Dashboard Visibility */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Dashboard Visibility
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={isPublic ? "Public Dashboard" : "Private Dashboard"}
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {isPublic 
                    ? "This dashboard will be visible to all users" 
                    : "This dashboard will only be visible to you"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};
