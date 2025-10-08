export interface Dashboard {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  dashboardGithubUsersByDashboardId?: {
    totalCount: number;
  };
}

export interface DashboardUser {
  id: string;
  dashboardId: string;
  githubUserId: string;
  githubUserByGithubUserId: {
    id: string;
    githubUsername: string;
    displayName?: string;
    avatarUrl?: string;
    profileUrl?: string;
  };
}

export interface DashboardRepository {
  id: string;
  dashboardId: string;
  githubRepoId: number;
  name: string;
  owner: string;
  fullName: string;
}

export interface ActivityType {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityConfig {
  id: string;
  dashboardId: string;
  activityTypeId: string;
  enabled: boolean;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  activityTypeByActivityTypeId: ActivityType;
}

export interface DashboardData {
  dashboard: Dashboard | null;
  dashboards: Dashboard[];
  users: DashboardUser[];
  repositories: DashboardRepository[];
  activityConfigs: ActivityConfig[];
  activityTypes: ActivityType[];
  loading: boolean;
  error: string | null;
}