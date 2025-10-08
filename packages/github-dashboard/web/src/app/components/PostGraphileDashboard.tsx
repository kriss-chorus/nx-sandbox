/**
 * PostGraphile Dashboard Component
 * Single Responsibility: Demonstrate PostGraphile CRUD operations
 */

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  TextField,
  Grid,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { useDashboardDataPostGraphile, useDashboardCRUD } from '../hooks/useDashboardDataPostGraphile';

interface PostGraphileDashboardProps {
  slug?: string;
}

export const PostGraphileDashboard: React.FC<PostGraphileDashboardProps> = ({ slug }) => {
  const [newDashboardName, setNewDashboardName] = useState('');
  const [newDashboardDescription, setNewDashboardDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Use PostGraphile hook for data fetching
  const { 
    dashboard, 
    dashboards,
    users, 
    repositories, 
    activityConfigs, 
    activityTypes, 
    loading, 
    error 
  } = useDashboardDataPostGraphile(slug);

  // Use PostGraphile hook for CRUD operations
  const {
    loading: crudLoading,
    error: crudError,
    createDashboard,
    updateDashboard,
    deleteDashboard,
  } = useDashboardCRUD();

  const handleCreateDashboard = async () => {
    if (!newDashboardName.trim()) return;

    try {
      const slug = newDashboardName.toLowerCase().replace(/\s+/g, '-');
      await createDashboard({
        name: newDashboardName,
        slug,
        description: newDashboardDescription,
        isPublic: true,
      });
      
      setNewDashboardName('');
      setNewDashboardDescription('');
      setShowCreateForm(false);
      
      // Refresh the page to show the new dashboard
      window.location.reload();
    } catch (error) {
      console.error('Failed to create dashboard:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading dashboard data from PostGraphile...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading dashboard: {error}
      </Alert>
    );
  }

  if (crudError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        CRUD Error: {crudError}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        PostGraphile CRUD Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This component demonstrates PostGraphile CRUD operations. All data is fetched and modified using GraphQL queries and mutations.
      </Typography>

      {/* Create Dashboard Form */}
      {!slug && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Create New Dashboard
            </Typography>
            
            {!showCreateForm ? (
              <Button 
                variant="contained" 
                onClick={() => setShowCreateForm(true)}
                disabled={crudLoading}
              >
                {crudLoading ? <CircularProgress size={20} /> : 'Create Dashboard'}
              </Button>
            ) : (
              <Box>
                <TextField
                  fullWidth
                  label="Dashboard Name"
                  value={newDashboardName}
                  onChange={(e) => setNewDashboardName(e.target.value)}
                  sx={{ mb: 2 }}
                  disabled={crudLoading}
                />
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  value={newDashboardDescription}
                  onChange={(e) => setNewDashboardDescription(e.target.value)}
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                  disabled={crudLoading}
                />
                <Box>
                  <Button 
                    variant="contained" 
                    onClick={handleCreateDashboard}
                    disabled={!newDashboardName.trim() || crudLoading}
                    sx={{ mr: 1 }}
                  >
                    {crudLoading ? <CircularProgress size={20} /> : 'Create'}
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setShowCreateForm(false)}
                    disabled={crudLoading}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dashboard List */}
      {!slug && dashboards.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Available Dashboards ({dashboards.length})
            </Typography>
            <Grid container spacing={2}>
              {dashboards.map((dash) => (
                <Grid item xs={12} sm={6} md={4} key={dash.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {dash.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Slug: {dash.slug}
                      </Typography>
                      {dash.description && (
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {dash.description}
                        </Typography>
                      )}
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Chip 
                          label={dash.isPublic ? 'Public' : 'Private'} 
                          color={dash.isPublic ? 'success' : 'default'}
                          size="small"
                        />
                        <Chip 
                          label={`Created: ${new Date(dash.createdAt).toLocaleDateString()}`}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                      <Button 
                        variant="contained" 
                        size="small" 
                        sx={{ mt: 2 }}
                        onClick={() => window.location.href = `/dashboard/${dash.slug}`}
                      >
                        View Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Details - Only show basic info */}
      {dashboard && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {dashboard.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Slug: {dashboard.slug}
            </Typography>
            {dashboard.description && (
              <Typography variant="body1" sx={{ mb: 2 }}>
                {dashboard.description}
              </Typography>
            )}
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip 
                label={dashboard.isPublic ? 'Public' : 'Private'} 
                color={dashboard.isPublic ? 'success' : 'default'}
                size="small"
              />
              <Chip 
                label={`Created: ${new Date(dashboard.createdAt).toLocaleDateString()}`}
                variant="outlined"
                size="small"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              This dashboard has {users.length} users, {repositories.length} repositories, and {activityConfigs.length} activity configurations.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
