import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { ArrowBack, Add, Settings as SettingsIcon } from '@mui/icons-material';
import { UserCard } from './UserCard';
import { Dashboard } from '../../types/dashboard';
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

interface DashboardConfigurationProps {
  dashboard: Dashboard;
  githubUsers: GitHubUser[];
  userActivities: Array<{
    user: GitHubUser;
    activity: UserActivity;
    repos?: any[];
  }>;
  activityConfig: ActivityConfig;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onAddUser: (username: string) => void;
  onRemoveUser: (username: string) => void;
  onOpenConfig: () => void;
}

export const DashboardConfiguration: React.FC<DashboardConfigurationProps> = ({
  dashboard,
  githubUsers,
  userActivities,
  activityConfig,
  loading,
  error,
  onBack,
  onAddUser,
  onRemoveUser,
  onOpenConfig
}) => {
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [sortBy, setSortBy] = useState<'prsCreated' | 'prsReviewed' | 'prsMerged' | 'totalActivity'>('totalActivity');

  const handleAddUser = () => {
    if (newUsername.trim()) {
      onAddUser(newUsername.trim());
      setNewUsername('');
      setAddUserDialogOpen(false);
    }
  };

  const sortedActivities = [...userActivities].sort((a, b) => {
    return b.activity[sortBy] - a.activity[sortBy];
  });

  const enabledActivities = Object.entries(activityConfig)
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
    .join(', ');

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />}
          onClick={onBack}
        >
          Back to My Dashboards
        </Button>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        {dashboard.name}
      </Typography>
      
      {dashboard.description && (
        <Typography variant="body1" color="text.secondary" paragraph>
          {dashboard.description}
        </Typography>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Dashboard Configuration
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            <Chip label={`Date Range: ${activityConfig.dateRange.start} to ${activityConfig.dateRange.end}`} size="small" />
            <Chip label={`Tracking: ${enabledActivities || 'Basic info only'}`} size="small" />
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={onOpenConfig}
        >
          Dashboard Settings
        </Button>
      </Box>

      {error && (
        <Box mb={2} p={2} bgcolor="error.light" borderRadius={1}>
          <Typography color="error.contrastText">{error}</Typography>
        </Box>
      )}

      {loading ? (
        <Typography>Loading users...</Typography>
      ) : sortedActivities.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h5" gutterBottom>
            No Users Added Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
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
      ) : (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h6">
                Team Members ({sortedActivities.length})
              </Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <MenuItem value="totalActivity">Total Activity</MenuItem>
                  <MenuItem value="prsCreated">PRs Created</MenuItem>
                  <MenuItem value="prsReviewed">PRs Reviewed</MenuItem>
                  <MenuItem value="prsMerged">PRs Merged</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Button 
              variant="outlined" 
              startIcon={<Add />}
              onClick={() => setAddUserDialogOpen(true)}
            >
              Add Another GitHub User
            </Button>
          </Box>

          <Grid container spacing={2}>
            {sortedActivities.map((userActivity) => (
              <Grid item xs={12} sm={6} md={4} key={`${userActivity.user.id}-${userActivity.user.login}`}>
                <UserCard
                  user={userActivity.user}
                  activity={userActivity.activity}
                  activityConfig={activityConfig}
                  onRemoveUser={onRemoveUser}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}

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
          <Button 
            onClick={handleAddUser}
            variant="contained"
            disabled={!newUsername.trim()}
          >
            Add User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
