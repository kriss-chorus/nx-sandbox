import {
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  Switch,
  Typography
} from '@mui/material';

interface VisibilitySectionProps {
  isPublic: boolean;
  onIsPublicChange: (isPublic: boolean) => void;
}

export function VisibilitySection({
  isPublic,
  onIsPublicChange
}: VisibilitySectionProps) {
  return (
    <Grid item xs={12}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Dashboard Visibility
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onIsPublicChange(e.target.checked)}
                color="primary"
              />
            }
            label={isPublic ? "Public Dashboard" : "Private Dashboard"}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {isPublic 
              ? "This dashboard will be visible to all users" 
              : "This dashboard will only be visible to you"}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}
