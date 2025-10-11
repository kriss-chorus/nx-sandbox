import { Add, Close, Delete } from '@mui/icons-material';
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
import { useState, useEffect } from 'react';

import { GitHubUser } from '../../../../types/github';

// Hardcoded activity types - these match the database
// IDs are from the migration file: 0002_volatile_swarm.sql
const ACTIVITY_TYPES = [
  { id: '42c3b89d-2897-4109-a5e7-3406b773bbb4', code: 'prs_created', displayName: 'PRs Created' },
  { id: 'dff9302a-d6f0-49d1-9fb3-6414801eab46', code: 'prs_merged', displayName: 'PRs Merged' },
  { id: '7adbc498-4789-40ec-9be1-1bb3bf408e9f', code: 'prs_reviewed', displayName: 'PRs Reviewed' },
];

interface DashboardConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: {
    repositories: string[];
    users: GitHubUser[];
    activityConfig: any;
    isPublic: boolean;
  }) => void | Promise<void>;
  initialRepositories: string[];
  initialUsers: GitHubUser[];
  initialActivityConfig: any;
  initialIsPublic: boolean;
  organizationRepos?: any[];
}

export function DashboardConfigModal({
  open,
  onClose,
  onSave,
  initialRepositories,
  initialUsers,
  initialActivityConfig,
  initialIsPublic,
  organizationRepos = []
}: DashboardConfigModalProps) {
  const [repositories, setRepositories] = useState<string[]>(initialRepositories);
  const [users, setUsers] = useState<GitHubUser[]>(initialUsers);
  const [activityConfig, setActivityConfig] = useState(initialActivityConfig);
  const [isPublic, setIsPublic] = useState<boolean>(initialIsPublic);
  const [selectedRepoToAdd, setSelectedRepoToAdd] = useState<string>('');
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const hasOrgRepos = (organizationRepos?.length ?? 0) > 0;

  useEffect(() => {
    setRepositories(initialRepositories || []);
    setUsers(initialUsers || []);
    setActivityConfig(initialActivityConfig || {});
    setIsPublic(initialIsPublic ?? true);
  }, [initialRepositories, initialUsers, initialActivityConfig, initialIsPublic]);

  const addRepoFromInput = () => {
    const value = selectedRepoToAdd.trim();
    if (!value) return;
    // Minimal owner/repo validation when free text
    const isValid = hasOrgRepos || /.+\/.+/.test(value);
    if (!isValid) return;
    if (!repositories.includes(value)) {
      setRepositories([...repositories, value]);
    }
    setSelectedRepoToAdd('');
  };

  const handleAddRepository = () => {
    addRepoFromInput();
  };

  const handleRemoveRepository = (repo: string) => {
    setRepositories(repositories.filter(r => r !== repo));
  };

  const addUserFromInput = () => {
    const raw = selectedUserToAdd.trim();
    if (!raw) return;
    const username = raw.replace(/^@/, '');
    if (!users.find(u => (u as any).login === username)) {
      const newUser = {
        id: Date.now(),
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
      } as unknown as GitHubUser;
      setUsers([...users, newUser]);
    }
    setSelectedUserToAdd('');
  };

  const handleAddUser = () => {
    addUserFromInput();
  };

  const handleRemoveUser = (userLogin: string) => {
    setUsers(users.filter(u => (u as any).login !== userLogin));
  };

  const handleActivityConfigChange = (key: string, value: boolean) => {
    setActivityConfig({
      ...activityConfig,
      [key]: value
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await Promise.resolve(onSave({
        repositories,
        users,
        activityConfig,
        isPublic
      }));
      onClose();
    } catch (e) {
      console.error('Failed to save dashboard configuration', e);
    } finally {
      setSaving(false);
    }
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
                  {hasOrgRepos ? (
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
                        {(organizationRepos || [])
                          .filter(repo => !repositories.includes(repo.full_name))
                          .map(repo => (
                            <MenuItem key={repo.full_name} value={repo.full_name}>
                              {repo.full_name}
                            </MenuItem>
                          ))
                        }
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      fullWidth
                      label="Repository (owner/name)"
                      placeholder="e.g., vercel/next.js"
                      value={selectedRepoToAdd}
                      onChange={(e) => setSelectedRepoToAdd(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addRepoFromInput();
                        }
                      }}
                      helperText="Press Enter to add"
                    />
                  )}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addUserFromInput();
                      }
                    }}
                    placeholder="e.g., octocat"
                    helperText="Press Enter to add"
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
                        key={(user as any).login}
                        label={(user as any).name || (user as any).login}
                        onDelete={() => handleRemoveUser((user as any).login)}
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
                  {ACTIVITY_TYPES.map((activityType) => (
                    <Grid item xs={12} sm={6} key={activityType.id}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={activityConfig[activityType.code] || false}
                            onChange={(e) => handleActivityConfigChange(activityType.code, e.target.checked)}
                          />
                        }
                        label={activityType.displayName}
                      />
                    </Grid>
                  ))}
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
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
