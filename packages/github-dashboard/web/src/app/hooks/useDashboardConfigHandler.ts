import { useActivityConfigs, useDashboardMutations, useDashboardRepositories, useDashboardUsers } from './';

interface UseDashboardConfigHandlerProps {
  selectedDashboard: any;
  postgraphileRepositories: any[];
  postgraphileUsers: any[];
  postgraphileActivityConfigs: any[];
  currentRepositories: string[];
  currentUsers: any[];
  currentActivityConfig: Record<string, boolean>;
  refetch: () => void;
}

// Activity type code to UUID mapping
const ACTIVITY_TYPE_MAP: Record<string, string> = {
  'prs_created': '42c3b89d-2897-4109-a5e7-3406b773bbb4',
  'prs_merged': 'dff9302a-d6f0-49d1-9fb3-6414801eab46',
  'prs_reviewed': '7adbc498-4789-40ec-9be1-1bb3bf408e9f',
};

export function useDashboardConfigHandler({
  selectedDashboard,
  postgraphileRepositories,
  postgraphileUsers,
  postgraphileActivityConfigs,
  currentRepositories,
  currentUsers,
  currentActivityConfig,
  refetch
}: UseDashboardConfigHandlerProps) {
  const { updateDashboard } = useDashboardMutations();
  const { upsertRepository, addRepositoryToDashboard, removeRepositoryFromDashboard } = useDashboardRepositories();
  const { createGithubUser, addUserToDashboard, removeUserFromDashboard } = useDashboardUsers();
  const { addActivityTypeToDashboard, removeActivityTypeFromDashboard } = useActivityConfigs();

  const handleConfigSave = async (config: any) => {
    if (!selectedDashboard?.id) {
      return;
    }
    
    try {
      // Persist dashboard visibility
      await updateDashboard(selectedDashboard.id, { isPublic: config.isPublic });

      // Sync repositories - remove ones not in config, add new ones
      const currentRepoFullNames = new Set(currentRepositories);
      const newRepoFullNames = new Set(config.repositories || []);
      
      // Remove repositories that are no longer in the config
      for (const fullName of currentRepoFullNames) {
        if (!newRepoFullNames.has(fullName)) {
          try {
            // Find the dashboard-repository junction ID
            const dashboardRepoToRemove = postgraphileRepositories.find(dr => 
              dr.repositoryByRepositoryId?.fullName === fullName
            );
            if (dashboardRepoToRemove?.id) {
              await removeRepositoryFromDashboard(dashboardRepoToRemove.id);
            }
          } catch (err) {
            console.error('Failed to remove repository', fullName, err);
          }
        }
      }
      
      // Add new repositories
      for (const full of (config.repositories || [])) {
        try {
          const value = (full || '').trim();
          if (!value) continue;
          const [owner, repoName] = value.split('/');
          if (!owner || !repoName) continue;
          
          // Skip if already exists
          if (currentRepoFullNames.has(value)) {
            continue;
          }
          
          // get repo details for id via backend proxy (handles auth/rate limits)
          const resp = await fetch(`http://localhost:3001/api/github/repos/${owner}/${repoName}`);
          if (!resp.ok) continue;
          const repoInfo = await resp.json();
          const githubRepoId = repoInfo?.id;
          if (!githubRepoId) continue;
          const ownerName = repoInfo?.owner?.login || owner;
          const displayName = repoInfo?.name || repoName;
          const fullName = repoInfo?.full_name || `${owner}/${repoName}`;
          
          // First create/upsert the repository
          const repository = await upsertRepository({
            githubRepoId,
            name: displayName,
            owner: ownerName,
            fullName
          });
          
          // Then add it to the dashboard
          if (repository && typeof repository === 'object' && 'id' in repository) {
            await addRepositoryToDashboard(selectedDashboard.id, (repository as { id: string }).id);
          }
        } catch (err) {
          console.error('Failed to resolve/persist repo', full, err);
        }
      }

      // Sync users - remove ones not in config, add new ones
      const currentUserLogins = new Set(currentUsers.map(u => u.login));
      const newUserLogins = new Set((config.users || []).map((u: any) => u.login));
      
      // Remove users that are no longer in the config
      for (const userLogin of currentUserLogins) {
        if (!newUserLogins.has(userLogin)) {
          try {
            // Find the dashboard-user junction record from postgraphileUsers
            const dashboardUserToRemove = postgraphileUsers.find(du => 
              du.githubUserByGithubUserId?.githubUsername === userLogin
            );
            if (dashboardUserToRemove?.id) {
              await removeUserFromDashboard(dashboardUserToRemove.id);
            }
          } catch (err) {
            console.error('Failed to remove user', userLogin, err);
          }
        }
      }
      
      // Add new users
      for (const user of (config.users || [])) {
        try {
          // Skip if already exists
          if (currentUserLogins.has(user.login)) {
            continue;
          }
          
          const githubUser = await createGithubUser(user.login, user.name, user.avatar_url);

          if (githubUser && typeof githubUser === 'object' && 'id' in githubUser) {
            const userId = (githubUser as { id: string }).id;
            await addUserToDashboard(selectedDashboard.id, userId);
          } else {
            console.error('No user ID returned from upsertGithubUser:', githubUser);
          }
        } catch (err) {
          console.error('Failed to persist user', user.login, err);
        }
      }

      // Sync activity types - remove disabled ones, add enabled ones
      const currentActivityCodes = new Set(Object.keys(currentActivityConfig));
      
      // Remove activity types that are no longer enabled
      for (const activityCode of currentActivityCodes) {
        if (!config.activityConfig?.[activityCode]) {
          try {
            // Find the activity type ID from the current configs
            const configToRemove = postgraphileActivityConfigs.find(config => 
              config.activityTypeByActivityTypeId?.code === activityCode
            );
            if (configToRemove?.id) {
              await removeActivityTypeFromDashboard(configToRemove.id);
            }
          } catch (err) {
            console.error('Failed to remove activity type', activityCode, err);
          }
        }
      }
      
      // Add new activity types that are enabled
      for (const [activityCode, enabled] of Object.entries(config.activityConfig || {})) {
        if (enabled && !currentActivityCodes.has(activityCode)) {
          try {
            const activityTypeId = ACTIVITY_TYPE_MAP[activityCode];
            if (activityTypeId) {
              await addActivityTypeToDashboard(selectedDashboard.id, activityTypeId);
            }
          } catch (err) {
            console.error('Failed to add activity type', activityCode, err);
          }
        }
      }

      // Refetch dashboard data to show the newly added users/repositories/activity configs
      refetch();

    } catch (e) {
      console.error('Failed to save dashboard configuration', e);
      throw e;
    }
  };

  return {
    handleConfigSave
  };
}
