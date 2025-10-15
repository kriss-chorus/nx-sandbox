import { CheckCircle, Code, Message, TrendingUp } from '@mui/icons-material';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import React from 'react';

interface UserActivity {
  user: any;
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

interface SummaryBarProps {
  userActivities: UserActivity[];
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(189, 147, 249, 0.1) 0%, rgba(255, 121, 198, 0.1) 100%)' }}>
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        <Box sx={{ color, mb: 1 }}>
          {icon}
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function SummaryBar({ userActivities }: SummaryBarProps): React.ReactElement {
  // Calculate totals from user activities
  const totals = userActivities.reduce(
    (acc, userActivity) => ({
      totalPRs: acc.totalPRs + userActivity.activity.prsCreated,
      totalMerged: acc.totalMerged + userActivity.activity.prsMerged,
      totalReviewed: acc.totalReviewed + userActivity.activity.prsReviewed,
      totalCommits: acc.totalCommits + (userActivity.activity.commits || 0),
    }),
    { totalPRs: 0, totalMerged: 0, totalReviewed: 0, totalCommits: 0 }
  );

  const stats = [
    {
      title: 'PRs Created',
      value: totals.totalPRs,
      icon: <Code sx={{ fontSize: 32 }} />,
      color: '#bd93f9',
    },
    {
      title: 'PRs Merged',
      value: totals.totalMerged,
      icon: <CheckCircle sx={{ fontSize: 32 }} />,
      color: '#50fa7b',
    },
    {
      title: 'PRs Reviewed',
      value: totals.totalReviewed,
      icon: <Message sx={{ fontSize: 32 }} />,
      color: '#ffb86c',
    },
    {
      title: 'Total Commits',
      value: totals.totalCommits,
      icon: <TrendingUp sx={{ fontSize: 32 }} />,
      color: '#8be9fd',
    },
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
        Team Activity Summary
      </Typography>
      <Grid container spacing={2}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
