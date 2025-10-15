import { Box, Chip, Typography } from '@mui/material';
import React, { useState } from 'react';

import { executeGraphQL } from '../../../api/postgraphile-client';

interface DashboardTypeChipsProps {
  dashboardId: string;
  currentTypeCode?: string;
  onTypeChange?: (typeCode: string) => void;
}

const DASHBOARD_TYPES = [
  { code: 'user_activity', name: 'User Activity', description: 'Focus on individual user contributions' },
  { code: 'team_overview', name: 'Team Overview', description: 'Team-wide activity summary' },
  { code: 'project_focus', name: 'Project Focus', description: 'Repository and project metrics' },
];

// Dashboard type UUID mapping
const DASHBOARD_TYPE_UUID_MAP: Record<string, string> = {
  'user_activity': '48bfc042-81aa-4814-9d56-4d0f841bcb92',
  'team_overview': '79e67172-ff4b-4237-906f-14e7a6c7deb0',
  'project_focus': '91fc99b6-05d0-4dad-bba2-2f82ff912f1d',
};

const UPDATE_DASHBOARD_TYPE_MUTATION = `
  mutation UpdateDashboardType($dashboardId: UUID!, $dashboardTypeId: UUID!) {
    updateDashboardById(
      input: {
        id: $dashboardId
        dashboardPatch: {
          dashboardTypeId: $dashboardTypeId
        }
      }
    ) {
      dashboard {
        id
        dashboardTypeByDashboardTypeId {
          code
          name
        }
      }
    }
  }
`;

export function DashboardTypeChips({ dashboardId, currentTypeCode, onTypeChange }: DashboardTypeChipsProps): React.ReactElement {
  const [updating, setUpdating] = useState(false);

  const handleTypeChange = async (typeCode: string) => {
    if (typeCode === currentTypeCode || updating) return;

    try {
      setUpdating(true);
      
      // Map type code to UUID
      const dashboardTypeId = DASHBOARD_TYPE_UUID_MAP[typeCode];
      if (!dashboardTypeId) {
        throw new Error(`Unknown dashboard type code: ${typeCode}`);
      }
      
      const response = await executeGraphQL(UPDATE_DASHBOARD_TYPE_MUTATION, {
        dashboardId,
        dashboardTypeId,
      });

      if (response.errors) {
        return;
      }

      onTypeChange?.(typeCode);
    } catch (error) {
      // Error handling - could show user notification here
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
        Dashboard Layout
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {DASHBOARD_TYPES.map((type) => (
          <Chip
            key={type.code}
            label={type.name}
            color={type.code === currentTypeCode ? 'primary' : 'default'}
            variant={type.code === currentTypeCode ? 'filled' : 'outlined'}
            onClick={() => handleTypeChange(type.code)}
            disabled={updating}
            title={type.description}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: type.code === currentTypeCode ? 'primary.dark' : 'action.hover',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
