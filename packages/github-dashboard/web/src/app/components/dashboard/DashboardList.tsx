import React from 'react';
import { Box, Typography, Button, Grid, CardContent, CardActions, Chip } from '@mui/material';
import { Add, Visibility, Business, Star } from '@mui/icons-material';
import { Dashboard as DashboardType } from '../../types/dashboard';
import { GradientCard } from '../common/GradientCard';

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
      {dashboards.map((dashboard) => {
        const isPremium = dashboard.clientByClientId?.tierTypeByTierTypeId?.code === 'premium';
        
        return (
          <Grid item xs={12} sm={6} md={4} key={dashboard.id}>
            <GradientCard isPremium={isPremium}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  {dashboard.clientByClientId?.logoUrl ? (
                    <img 
                      src={dashboard.clientByClientId.logoUrl} 
                      alt={`${dashboard.clientByClientId.name} logo`}
                      style={{ width: 24, height: 24, borderRadius: '50%' }}
                    />
                  ) : (
                    <Business sx={{ fontSize: 20 }} />
                  )}
                  <Typography variant="subtitle2" color="text.secondary">
                    {dashboard.clientByClientId?.name || 'Unknown Client'}
                  </Typography>
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  {dashboard.name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {dashboard.description || 'No description'}
                </Typography>
                
                <Box display="flex" gap={1} mb={1}>
                  <Chip
                    icon={isPremium ? <Star /> : undefined}
                    label={dashboard.clientByClientId?.tierTypeByTierTypeId?.name || 'Unknown'}
                    size="small"
                    color={isPremium ? 'secondary' : 'default'}
                    variant={isPremium ? 'filled' : 'outlined'}
                  />
                  {dashboard.dashboardType && (
                    <Chip
                      label={dashboard.dashboardType.name}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
                
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
            </GradientCard>
          </Grid>
        );
      })}
    </Grid>
  );
};