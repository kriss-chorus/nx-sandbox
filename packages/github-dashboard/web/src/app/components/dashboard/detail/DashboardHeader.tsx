import { ArrowBack, Settings as SettingsIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    Typography
} from '@mui/material';

interface DashboardHeaderProps {
  dashboardName: string;
  dashboardDescription?: string;
  onBackClick: () => void;
  onConfigureClick: () => void;
}

export function DashboardHeader({
  dashboardName,
  dashboardDescription,
  onBackClick,
  onConfigureClick
}: DashboardHeaderProps) {
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
        <Typography variant="h4">{dashboardName}</Typography>
        {dashboardDescription && (
          <Typography variant="body1" color="text.secondary">
            {dashboardDescription}
          </Typography>
        )}
      </Box>
      <Button
        variant="outlined"
        startIcon={<SettingsIcon />}
        onClick={onConfigureClick}
      >
        Configure Dashboard
      </Button>
    </Box>
  );
}
