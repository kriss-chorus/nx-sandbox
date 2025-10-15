import {
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  Switch,
  Typography
} from '@mui/material';

// Hardcoded activity types - these match the database
// IDs are from the migration file: 0002_volatile_swarm.sql
const ACTIVITY_TYPES = [
  { id: '42c3b89d-2897-4109-a5e7-3406b773bbb4', code: 'prs_created', displayName: 'PRs Created' },
  { id: 'dff9302a-d6f0-49d1-9fb3-6414801eab46', code: 'prs_merged', displayName: 'PRs Merged' },
  { id: '7adbc498-4789-40ec-9be1-1bb3bf408e9f', code: 'prs_reviewed', displayName: 'PRs Reviewed' },
];

interface ActivityConfigSectionProps {
  activityConfig: Record<string, boolean>;
  onActivityConfigChange: (activityConfig: Record<string, boolean>) => void;
}

export function ActivityConfigSection({
  activityConfig,
  onActivityConfigChange
}: ActivityConfigSectionProps) {
  const handleActivityConfigChange = (key: string, value: boolean) => {
    onActivityConfigChange({
      ...activityConfig,
      [key]: value
    });
  };

  return (
    <Grid item xs={12}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Activity Types
          </Typography>
          
          <Grid container spacing={2}>
            {ACTIVITY_TYPES.map((activityType) => (
              <Grid item xs={12} sm={6} key={activityType.id}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={activityConfig[activityType.code] || false}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleActivityConfigChange(activityType.code, e.target.checked)}
                    />
                  }
                  label={activityType.displayName}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
}
