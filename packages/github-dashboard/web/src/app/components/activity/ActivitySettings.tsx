import React from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

interface ActivitySettingsProps {
  startDate: string;
  endDate: string;
  sortBy: 'prsCreated' | 'prsReviewed' | 'prsMerged' | 'totalActivity';
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onSortByChange: (sortBy: 'prsCreated' | 'prsReviewed' | 'prsMerged' | 'totalActivity') => void;
  onRefreshStats: () => void;
  disabled?: boolean;
}

export const ActivitySettings: React.FC<ActivitySettingsProps> = ({
  startDate,
  endDate,
  sortBy,
  onStartDateChange,
  onEndDateChange,
  onSortByChange,
  onRefreshStats,
  disabled = false
}) => {
  const handlePresetDateRange = (days: number) => {
    const today = new Date();
    const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    onStartDateChange(startDate.toISOString().split('T')[0]);
    onEndDateChange(today.toISOString().split('T')[0]);
  };

  const handleAll2024 = () => {
    onStartDateChange('2024-01-01');
    onEndDateChange('2024-12-31');
  };

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Activity Settings
            </Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onStartDateChange(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEndDateChange(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => onSortByChange(e.target.value as any)}
                    label="Sort By"
                  >
                    <MenuItem value="totalActivity">Total Activity</MenuItem>
                    <MenuItem value="prsCreated">PRs Created</MenuItem>
                    <MenuItem value="prsReviewed">PRs Reviewed</MenuItem>
                    <MenuItem value="prsMerged">PRs Merged</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={onRefreshStats}
                  disabled={disabled}
                >
                  Refresh Stats
                </Button>
              </Grid>
            </Grid>
            
            {/* Preset Date Range Buttons */}
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Quick Date Ranges:
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handlePresetDateRange(7)}
                >
                  Last 7 Days
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handlePresetDateRange(30)}
                >
                  Last 30 Days
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handlePresetDateRange(90)}
                >
                  Last 90 Days
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleAll2024}
                >
                  All 2024
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
