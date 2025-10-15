import { Close } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Typography
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';

import { GitHubUser } from '../../../../types/github';

import { ActivityConfigSection, DashboardTypeSection, RepositorySection, UserSection, VisibilitySection } from './Sections';

interface DashboardConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: {
    repositories: string[];
    users: GitHubUser[];
    activityConfig: Record<string, boolean>;
    isPublic: boolean;
    dashboardTypeCode?: string;
  }) => void | Promise<void>;
  initialRepositories: string[];
  initialUsers: GitHubUser[];
  initialActivityConfig: Record<string, boolean>;
  initialIsPublic: boolean;
  initialDashboardTypeCode?: string;
  organizationRepos?: Array<{ full_name: string }>;
}

export function DashboardConfigModal({
  open,
  onClose,
  onSave,
  initialRepositories,
  initialUsers,
  initialActivityConfig,
  initialIsPublic,
  initialDashboardTypeCode = 'user_activity',
  organizationRepos = []
}: DashboardConfigModalProps): React.ReactElement {
  const [repositories, setRepositories] = useState<string[]>(initialRepositories);
  const [users, setUsers] = useState<GitHubUser[]>(initialUsers);
  const [activityConfig, setActivityConfig] = useState(initialActivityConfig);
  const [isPublic, setIsPublic] = useState<boolean>(initialIsPublic);
  const [dashboardTypeCode, setDashboardTypeCode] = useState<string>(initialDashboardTypeCode);
  const [saving, setSaving] = useState(false);
  const initialValuesRef = useRef<{
    repositories: string[];
    users: GitHubUser[];
    activityConfig: Record<string, boolean>;
    isPublic: boolean;
    dashboardTypeCode: string;
  }>({ repositories: [], users: [], activityConfig: {}, isPublic: true, dashboardTypeCode: 'user_activity' });

  useEffect(() => {
    if (open) {
      // Capture initial values when modal opens
      initialValuesRef.current = {
        repositories: initialRepositories || [],
        users: initialUsers || [],
        activityConfig: initialActivityConfig || {},
        isPublic: initialIsPublic ?? true,
        dashboardTypeCode: initialDashboardTypeCode || 'user_activity'
      };
      
      setRepositories(initialValuesRef.current.repositories);
      setUsers(initialValuesRef.current.users);
      setActivityConfig(initialValuesRef.current.activityConfig);
      setIsPublic(initialValuesRef.current.isPublic);
      setDashboardTypeCode(initialValuesRef.current.dashboardTypeCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);


  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave({
        repositories,
        users,
        activityConfig,
        isPublic,
        dashboardTypeCode
      });
      onClose();
    } catch (e) {
      console.error('Failed to save Dashboard Configuration', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        style: {
          zIndex: 1300
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Configure Dashboard</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          <RepositorySection
            repositories={repositories}
            onRepositoriesChange={setRepositories}
            organizationRepos={organizationRepos}
          />
          
          <UserSection
            users={users}
            onUsersChange={setUsers}
          />
          
          <ActivityConfigSection
            activityConfig={activityConfig}
            onActivityConfigChange={setActivityConfig}
          />
          
          <VisibilitySection
            isPublic={isPublic}
            onIsPublicChange={setIsPublic}
          />
          
          <DashboardTypeSection
            currentTypeCode={dashboardTypeCode}
            onTypeChange={setDashboardTypeCode}
          />
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
