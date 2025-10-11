import styled from '@emotion/styled';
import { Card, Avatar, Box, Typography, Chip } from '@mui/material';
import React from 'react';

import { GitHubUser } from '../../types/github';

const UserCardContainer = styled(Card)`
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  padding: 16px;
  position: relative;
`;

interface UserActivity {
  user: GitHubUser;
  activity: {
    prsCreated: number;
    prsReviewed: number;
    prsMerged: number;
    totalActivity: number;
    commits?: number;
    issues?: number;
  };
  repos?: any[];
}

interface UserCardProps {
  userActivity: UserActivity;
  reviewSummary: any;
}

export const UserCard: React.FC<UserCardProps> = React.memo(({ userActivity, reviewSummary }) => {
  const { user, activity } = userActivity;
  
  return (
    <UserCardContainer>
      <Avatar src={user.avatar_url} sx={{ width: 48, height: 48, mr: 2 }} />
      <Box flex={1}>
        <Typography variant="h6">{user.name || user.login}</Typography>
        <Typography variant="body2" color="text.secondary">
          @{user.login}
        </Typography>
        
        {/* Activity Stats */}
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            📊 Activity:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip label={`${activity.prsCreated} created`} size="small" color="primary" variant="outlined" />
            <Chip label={`${activity.prsMerged} merged`} size="small" color="success" variant="outlined" />
            <Chip label={`${activity.prsReviewed} reviewed`} size="small" color="info" variant="outlined" />
          </Box>
        </Box>
        
        <Box mt={1}>
          <Typography variant="caption" color="text.secondary">
            {user.public_repos} repos • {user.followers} followers • {user.following} following
          </Typography>
        </Box>
      </Box>
    </UserCardContainer>
  );
});

UserCard.displayName = 'UserCard';