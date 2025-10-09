export interface Dashboard {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  dashboardType: DashboardType;
  clientByClientId?: {
    id: string;
    name: string;
    logoUrl?: string;
    tierTypeByTierTypeId: {
      id: string;
      code: string;
      name: string;
    };
  };
  dashboardTypeByDashboardTypeId?: {
    id: string;
    code: string;
    name: string;
  };
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

export interface DashboardType {
  id: string;
  code: string;
  name: string;
}

export interface DashboardRepository {
  id: string;
  dashboardId: string;
  repositoryId: string;
  repositoryByRepositoryId?: {
    id: string;
    githubRepoId: number;
    name: string;
    owner: string;
    fullName: string;
  };
}

export interface ActivityType {
  id: string;
  code: string;
  displayName: string;
  description?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityConfig {
  id: string;
  dashboardId: string;
  activityTypeId: string;
  createdAt: string;
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