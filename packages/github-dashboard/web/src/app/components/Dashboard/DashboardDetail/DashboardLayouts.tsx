import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import React from 'react';

interface UserActivity {
  user: {
    login: string;
    name: string;
    avatar_url: string;
  };
  totalActivity: number;
  prsCreated: number;
  prsReviewed: number;
  prsMerged: number;
}

interface DashboardLayoutsProps {
  dashboardTypeCode: string;
  userActivities: UserActivity[];
  sortBy: 'totalActivity' | 'prsCreated' | 'prsReviewed' | 'prsMerged';
}

// User Activity Layout - Focus on individual contributions
function UserActivityLayout({ userActivities, sortBy }: { userActivities: UserActivity[]; sortBy: string }) {
  return (
    <Grid container spacing={3}>
      {userActivities.map((activity, index) => (
        <Grid item xs={12} sm={6} md={4} key={activity.user.login}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  component="img"
                  src={activity.user.avatar_url}
                  alt={activity.user.name}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    mr: 2,
                  }}
                />
                <Box>
                  <Typography variant="h6" component="div">
                    {activity.user.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{activity.user.login}
                  </Typography>
                </Box>
              </Box>
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Total Activity:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {activity.totalActivity || 0}
                </Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">PRs Created:</Typography>
                <Typography variant="body2" fontWeight="bold" color="primary.main">
                  {activity.prsCreated || 0}
                </Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">PRs Reviewed:</Typography>
                <Typography variant="body2" fontWeight="bold" color="secondary.main">
                  {activity.prsReviewed || 0}
                </Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">PRs Merged:</Typography>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  {activity.prsMerged || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// Team Overview Layout - Team-wide summary with charts
function TeamOverviewLayout({ userActivities, sortBy }: { userActivities: UserActivity[]; sortBy: string }) {
  const totalStats = userActivities.reduce(
    (acc, activity) => ({
      totalActivity: acc.totalActivity + (activity.totalActivity || 0),
      prsCreated: acc.prsCreated + (activity.prsCreated || 0),
      prsReviewed: acc.prsReviewed + (activity.prsReviewed || 0),
      prsMerged: acc.prsMerged + (activity.prsMerged || 0),
    }),
    { totalActivity: 0, prsCreated: 0, prsReviewed: 0, prsMerged: 0 }
  );

  return (
    <Box>
      {/* Team Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary.main" gutterBottom>
                {totalStats.totalActivity}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Activity
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary.main" gutterBottom>
                {totalStats.prsCreated}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PRs Created
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="secondary.main" gutterBottom>
                {totalStats.prsReviewed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PRs Reviewed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main" gutterBottom>
                {totalStats.prsMerged}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PRs Merged
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Team Members List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Team Members ({userActivities.length})
          </Typography>
          <Grid container spacing={2}>
            {userActivities.map((activity) => (
              <Grid item xs={12} sm={6} md={4} key={activity.user.login}>
                <Box display="flex" alignItems="center" p={2} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Box
                    component="img"
                    src={activity.user.avatar_url}
                    alt={activity.user.name}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      mr: 2,
                    }}
                  />
                  <Box flexGrow={1}>
                    <Typography variant="body2" fontWeight="bold">
                      {activity.user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.totalActivity || 0} total activity
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

// Project Focus Layout - Repository and project metrics
function ProjectFocusLayout({ userActivities, sortBy }: { userActivities: UserActivity[]; sortBy: string }) {
  // Group by activity level for project focus
  const highActivityUsers = userActivities.filter(a => (a.totalActivity || 0) > 10);
  const mediumActivityUsers = userActivities.filter(a => (a.totalActivity || 0) > 5 && (a.totalActivity || 0) <= 10);
  const lowActivityUsers = userActivities.filter(a => (a.totalActivity || 0) <= 5);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Project Activity Distribution
      </Typography>
      
      {/* High Activity Contributors */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="success.main" gutterBottom>
            High Activity Contributors ({highActivityUsers.length})
          </Typography>
          <Grid container spacing={2}>
            {highActivityUsers.map((activity) => (
              <Grid item xs={12} sm={6} md={4} key={activity.user.login}>
                <Box display="flex" alignItems="center" p={2} sx={{ bgcolor: 'success.light', borderRadius: 1 }}>
                  <Box
                    component="img"
                    src={activity.user.avatar_url}
                    alt={activity.user.name}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      mr: 2,
                    }}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {activity.user.name}
                    </Typography>
                    <Typography variant="caption">
                      {activity.totalActivity || 0} activities
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Medium Activity Contributors */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="warning.main" gutterBottom>
            Medium Activity Contributors ({mediumActivityUsers.length})
          </Typography>
          <Grid container spacing={2}>
            {mediumActivityUsers.map((activity) => (
              <Grid item xs={12} sm={6} md={4} key={activity.user.login}>
                <Box display="flex" alignItems="center" p={2} sx={{ bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Box
                    component="img"
                    src={activity.user.avatar_url}
                    alt={activity.user.name}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      mr: 2,
                    }}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {activity.user.name}
                    </Typography>
                    <Typography variant="caption">
                      {activity.totalActivity || 0} activities
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Low Activity Contributors */}
      <Card>
        <CardContent>
          <Typography variant="h6" color="info.main" gutterBottom>
            Low Activity Contributors ({lowActivityUsers.length})
          </Typography>
          <Grid container spacing={2}>
            {lowActivityUsers.map((activity) => (
              <Grid item xs={12} sm={6} md={4} key={activity.user.login}>
                <Box display="flex" alignItems="center" p={2} sx={{ bgcolor: 'info.light', borderRadius: 1 }}>
                  <Box
                    component="img"
                    src={activity.user.avatar_url}
                    alt={activity.user.name}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      mr: 2,
                    }}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {activity.user.name}
                    </Typography>
                    <Typography variant="caption">
                      {activity.totalActivity || 0} activities
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export function DashboardLayouts({ dashboardTypeCode, userActivities, sortBy }: DashboardLayoutsProps): React.ReactElement {
  // Safety check for empty or undefined data
  const safeUserActivities = userActivities || [];
  
  switch (dashboardTypeCode) {
    case 'user_activity':
      return <UserActivityLayout userActivities={safeUserActivities} sortBy={sortBy} />;
    case 'team_overview':
      return <TeamOverviewLayout userActivities={safeUserActivities} sortBy={sortBy} />;
    case 'project_focus':
      return <ProjectFocusLayout userActivities={safeUserActivities} sortBy={sortBy} />;
    default:
      return <UserActivityLayout userActivities={safeUserActivities} sortBy={sortBy} />;
  }
}
