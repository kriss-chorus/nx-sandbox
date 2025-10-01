import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Add, Assessment } from '@mui/icons-material';
import { Dashboard } from '../../types/dashboard';

interface DashboardListProps {
  dashboards: Dashboard[];
  onCreateDashboard: (name: string, description: string) => void;
  onSelectDashboard: (dashboard: Dashboard) => void;
  loading: boolean;
}

export const DashboardList: React.FC<DashboardListProps> = ({
  dashboards,
  onCreateDashboard,
  onSelectDashboard,
  loading
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [newDashboardDescription, setNewDashboardDescription] = useState('');

  const handleCreateDashboard = () => {
    if (newDashboardName.trim()) {
      onCreateDashboard(newDashboardName.trim(), newDashboardDescription.trim());
      setNewDashboardName('');
      setNewDashboardDescription('');
      setCreateDialogOpen(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            GitHub Dashboard Builder
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage GitHub activity dashboards for your teams
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Dashboard
        </Button>
      </Box>

      {loading ? (
        <Typography>Loading dashboards...</Typography>
      ) : dashboards.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Dashboards Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Create your first dashboard to start tracking GitHub activity
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Your First Dashboard
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {dashboards.map((dashboard) => (
            <Grid item xs={12} sm={6} md={4} key={dashboard.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { 
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
                onClick={() => onSelectDashboard(dashboard)}
              >
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {dashboard.name}
                  </Typography>
                  {dashboard.description && (
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {dashboard.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {dashboard.githubUsers?.length || 0} users • Created {new Date(dashboard.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

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
            onClick={handleCreateDashboard}
            variant="contained"
            disabled={!newDashboardName.trim()}
          >
            Create Dashboard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
