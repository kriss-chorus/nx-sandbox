import { ArrowBack, Settings as SettingsIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    Chip,
    Typography
} from '@mui/material';
import React from 'react';
import { useClientContext } from '../../../context/ClientContext';
import { ExportButton } from '../ExportButton';

interface DashboardHeaderProps {
  dashboardName: string;
  dashboardDescription?: string;
  dashboardId: string;
  onBackClick: () => void;
  onConfigureClick: () => void;
}

export function DashboardHeader({
  dashboardName,
  dashboardDescription,
  dashboardId,
  onBackClick,
  onConfigureClick
}: DashboardHeaderProps): React.ReactElement {
  const { isPremium } = useClientContext();

  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
      <Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={onBackClick}
          sx={{ mb: 2 }}
        >
          Back to Dashboards
        </Button>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Typography variant="h4">{dashboardName}</Typography>
          {isPremium && (
            <Chip
              label="Premium"
              color="primary"
              size="small"
              sx={{
                background: 'linear-gradient(45deg, #bd93f9 30%, #ff79c6 90%)',
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          )}
        </Box>
        {dashboardDescription && (
          <Typography variant="body1" color="text.secondary">
            {dashboardDescription}
          </Typography>
        )}
      </Box>
      <Box display="flex" gap={2}>
        {isPremium && (
          <ExportButton dashboardId={dashboardId} dashboardName={dashboardName} />
        )}
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={onConfigureClick}
        >
          Configure Dashboard
        </Button>
      </Box>
    </Box>
  );
}
