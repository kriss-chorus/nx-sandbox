import React from 'react';
import {
  Card,
  Avatar,
  Typography,
  Box,
  Chip,
  IconButton,
  styled
} from '@mui/material';
import { Close } from '@mui/icons-material';
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
}

interface UserCardProps {
  user: GitHubUser;
  activity: UserActivity;
  activityConfig: ActivityConfig;
  onRemoveUser: (username: string) => void;
}

const UserCardContainer = styled(Card)`
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  padding: 16px;
  position: relative;
`;

export const UserCard: React.FC<UserCardProps> = ({
  user,
  activity,
  activityConfig,
  onRemoveUser
}) => {
  return (
    <UserCardContainer>
      <IconButton
        size="small"
        onClick={() => onRemoveUser(user.login)}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          }
        }}
      >
        <Close fontSize="small" />
      </IconButton>
      
      <Avatar src={user.avatar_url} sx={{ width: 48, height: 48, mr: 2 }} />
      <Box flex={1}>
        <Typography variant="h6">{user.name || user.login}</Typography>
        <Typography variant="body2" color="text.secondary">
          @{user.login}
        </Typography>
        
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            📊 Activity:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {activityConfig.trackPRsCreated && (
              <Chip 
                label={`${activity.prsCreated} created`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            )}
            {activityConfig.trackPRsMerged && (
              <Chip 
                label={`${activity.prsMerged} merged`} 
                size="small" 
                color="success" 
                variant="outlined"
              />
            )}
            {activityConfig.trackPRReviews && (
              <Chip 
                label={`${activity.prsReviewed} reviewed`} 
                size="small" 
                color="secondary" 
                variant="outlined"
              />
            )}
            {activityConfig.trackCommits && (
              <Chip 
                label={`${activity.commits || 0} commits`} 
                size="small" 
                color="default" 
                variant="outlined"
              />
            )}
            {activityConfig.trackIssues && (
              <Chip 
                label={`${activity.issues || 0} issues`} 
                size="small" 
                color="error" 
                variant="outlined"
              />
            )}
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
};
