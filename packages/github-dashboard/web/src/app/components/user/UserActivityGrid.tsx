import { Grid, Box, Typography } from '@mui/material';
import { UserCard } from './UserCard';

interface UserActivity {
  user: {
    id: number;
    login: string;
    name: string;
    avatar_url: string;
    html_url: string;
    public_repos: number;
    followers: number;
    following: number;
    public_gists: number;
    created_at: string;
    updated_at: string;
  };
  activity: {
    prsCreated: number;
    prsReviewed: number;
    prsMerged: number;
    totalActivity: number;
    commits?: number;
    issues?: number;
  };
  repos?: unknown[];
}

interface UserActivityGridProps {
  userActivities: UserActivity[];
  sortBy: 'prsCreated' | 'prsReviewed' | 'prsMerged' | 'totalActivity';
}

export function UserActivityGrid({
  userActivities,
  sortBy
}: UserActivityGridProps) {
  // Sort user activities based on the selected sort option
  const sortedActivities = [...userActivities].sort((a, b) => {
    const aValue = a.activity[sortBy] || 0;
    const bValue = b.activity[sortBy] || 0;
    return bValue - aValue; // Descending order
  });

  return (
    <Box>
      {/* Sorting Controls */}
      {userActivities.length > 0 && (
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Typography variant="body2" color="text.secondary">
            Sort by:
          </Typography>
          <select
            value={sortBy}
            onChange={() => {
              // This will be handled by parent component
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: 'white'
            }}
          >
            <option value="totalActivity">Total Activity</option>
            <option value="prsCreated">PRs Created</option>
            <option value="prsReviewed">PRs Reviewed</option>
            <option value="prsMerged">PRs Merged</option>
          </select>
          <Typography variant="caption" color="text.secondary">
            (Currently sorting by: {sortBy === 'totalActivity' ? 'Total Activity' : 
             sortBy === 'prsCreated' ? 'PRs Created' :
             sortBy === 'prsReviewed' ? 'PRs Reviewed' : 'PRs Merged'})
          </Typography>
        </Box>
      )}

      {/* User Activity Grid */}
      <Grid container spacing={3}>
        {sortedActivities.map((activityData) => (
          <Grid item xs={12} sm={6} md={4} key={`${activityData.user.id}-${activityData.user.login}`}>
            <UserCard 
              userActivity={activityData} 
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
