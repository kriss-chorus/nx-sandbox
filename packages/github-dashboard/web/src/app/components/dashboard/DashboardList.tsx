import React from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, CardActions } from '@mui/material';
import { Add, Visibility } from '@mui/icons-material';
import { Dashboard as DashboardType } from '../types/dashboard';

interface DashboardListProps {
  dashboards: DashboardType[];
  onCreateDashboard: () => void;
  onViewDashboard: (dashboard: DashboardType) => void;
}

export const DashboardList: React.FC<DashboardListProps> = ({
  dashboards,
  onCreateDashboard,
  onViewDashboard
}) => {
  return (
    <Grid container spacing={3}>
      {/* Header and Create button */}
      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">My Dashboards</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onCreateDashboard}
          >
            Create Dashboard
          </Button>
        </Box>
      </Grid>

      {/* Dashboard Cards */}
      {dashboards.map((dashboard) => (
        <Grid item xs={12} sm={6} md={4} key={dashboard.id}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {dashboard.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {dashboard.description || 'No description'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {dashboard.dashboardGithubUsersByDashboardId?.totalCount || 0} GitHub users
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                startIcon={<Visibility />}
                onClick={() => onViewDashboard(dashboard)}
              >
                View Dashboard
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};