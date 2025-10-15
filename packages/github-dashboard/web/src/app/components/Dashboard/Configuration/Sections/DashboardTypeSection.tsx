import { Box, Card, CardContent, Chip, Grid, Typography } from '@mui/material';
import React from 'react';

import { useClientContext } from '../../../../context/ClientContext';

interface DashboardTypeSectionProps {
  currentTypeCode: string;
  onTypeChange: (typeCode: string) => void;
}

const DASHBOARD_TYPES = [
  { code: 'user_activity', name: 'User Activity', description: 'Focus on individual user contributions' },
  { code: 'team_overview', name: 'Team Overview', description: 'Team-wide activity summary' },
  { code: 'project_focus', name: 'Project Focus', description: 'Repository and project metrics' },
];

export function DashboardTypeSection({ currentTypeCode, onTypeChange }: DashboardTypeSectionProps): React.ReactElement | null {
  const { hasFeature } = useClientContext();
  
  // Check if client has type_chips feature (dashboard type selection)
  const hasDashboardTypeSelection = hasFeature('type_chips');
  
  if (!hasDashboardTypeSelection) {
    return null;
  }

  return (
    <Grid item xs={12}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Dashboard Layout Type
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose how your dashboard displays activity data
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {DASHBOARD_TYPES.map((type) => (
              <Chip
                key={type.code}
                label={type.name}
                color={type.code === currentTypeCode ? 'primary' : 'default'}
                variant={type.code === currentTypeCode ? 'filled' : 'outlined'}
                onClick={() => onTypeChange(type.code)}
                title={type.description}
                sx={{
                  cursor: 'pointer',
                  minWidth: 120,
                  '&:hover': {
                    backgroundColor: type.code === currentTypeCode ? 'primary.dark' : 'action.hover',
                  },
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}
