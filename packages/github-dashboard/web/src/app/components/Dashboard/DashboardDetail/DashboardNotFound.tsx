import { ArrowBack } from '@mui/icons-material';
import {
    Box,
    Button,
    Typography
} from '@mui/material';

interface DashboardNotFoundProps {
  onBackClick: () => void;
}

export function DashboardNotFound({ onBackClick }: DashboardNotFoundProps) {
  return (
    <Box sx={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Typography variant="h4">Dashboard not found</Typography>
      <Button
        variant="outlined"
        startIcon={<ArrowBack />}
        onClick={onBackClick}
        sx={{ mt: 2 }}
      >
        Back to Dashboards
      </Button>
    </Box>
  );
}
