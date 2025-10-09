const POSTGRAPHILE_ENDPOINT = 'http://localhost:3001/graphql';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
  }>;
}

export async function executeGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<GraphQLResponse<T>> {
  try {
    const response = await fetch(POSTGRAPHILE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('GraphQL execution error:', error);
    return {
      errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }],
    };
  }
}

// Dashboard CRUD Operations
export const DASHBOARD_QUERIES = {
  getAll: `query GetAllDashboards($first: Int, $after: Cursor, $filter: DashboardCondition) {
    allDashboards(first: $first, after: $after, condition: $filter) {
      nodes {
        id
        name
        slug
        description
        isPublic
        createdAt
        updatedAt
        clientByClientId {
          id
          name
          logoUrl
          tierTypeByTierTypeId {
            id
            code
            name
          }
        }
        dashboardTypeByDashboardTypeId {
          id
          code
          name
        }
        dashboardGithubUsersByDashboardId {
          totalCount
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }`,

  getBySlug: `query GetDashboardBySlug($slug: String!) {
    dashboardBySlug(slug: $slug) {
      id
      name
      slug
      description
      isPublic
      createdAt
      updatedAt
      clientByClientId {
        id
        name
        logoUrl
        tierTypeByTierTypeId {
          id
          code
          name
        }
      }
      dashboardTypeByDashboardTypeId {
        id
        code
        name
      }
    }
  }`,

  create: `mutation CreateDashboard($input: CreateDashboardInput!) {
    createDashboard(input: $input) {
      dashboard {
        id
        name
        slug
        description
        isPublic
        createdAt
        updatedAt
      }
    }
  }`,

  update: `mutation UpdateDashboard($id: UUID!, $input: DashboardPatch!) {
    updateDashboardById(input: { id: $id, dashboardPatch: $input }) {
      dashboard {
        id
        name
        slug
        description
        isPublic
        createdAt
        updatedAt
      }
    }
  }`,

  delete: `mutation DeleteDashboard($id: UUID!) {
    deleteDashboardById(input: { id: $id }) {
      deletedDashboardId
    }
  }`,
};

export const DASHBOARD_USER_QUERIES = {
  getByDashboard: `query GetDashboardUsers($dashboardId: UUID!) {
    allDashboardGithubUsers(condition: { dashboardId: $dashboardId }) {
      nodes {
        id
        dashboardId
        githubUserId
        githubUserByGithubUserId {
          id
          githubUsername
          displayName
          avatarUrl
          profileUrl
        }
      }
    }
  }`,

  addUser: `mutation AddUserToDashboard($input: CreateDashboardGithubUserInput!) {
    createDashboardGithubUser(input: $input) {
      dashboardGithubUser {
        id
        dashboardId
        githubUserId
        githubUserByGithubUserId {
          id
          githubUsername
          displayName
          avatarUrl
          profileUrl
        }
      }
    }
  }`,

  removeUser: `mutation RemoveUserFromDashboard($id: UUID!) {
    deleteDashboardGithubUserById(input: { id: $id }) {
      deletedDashboardGithubUserId
    }
  }`,
};

export const DASHBOARD_REPOSITORY_QUERIES = {
  getByDashboard: `query GetDashboardRepositories($dashboardId: UUID!) {
    allDashboardRepositories(condition: { dashboardId: $dashboardId }) {
      nodes {
        id
        dashboardId
        repositoryId
        addedAt
        repositoryByRepositoryId {
          id
          githubRepoId
          name
          owner
          fullName
        }
      }
    }
  }`,

  // Create or update repository
  upsertRepository: `mutation UpsertRepository($input: CreateRepositoryInput!) {
    createRepository(input: $input) {
      repository {
        id
        githubRepoId
        name
        owner
        fullName
      }
    }
  }`,

  // Add repository to dashboard (join table)
  addRepository: `mutation AddRepositoryToDashboard($input: CreateDashboardRepositoryInput!) {
    createDashboardRepository(input: $input) {
      dashboardRepository {
        id
        dashboardId
        repositoryId
        addedAt
      }
    }
  }`,

  removeRepository: `mutation RemoveRepositoryFromDashboard($id: UUID!) {
    deleteDashboardRepositoryById(input: { id: $id }) {
      deletedDashboardRepositoryId
    }
  }`,
};

export const ACTIVITY_CONFIG_QUERIES = {
  getByDashboard: `query GetDashboardActivityConfig($dashboardId: UUID!) {
    allDashboardActivityConfigs(condition: { dashboardId: $dashboardId }) {
      nodes {
        id
        dashboardId
        activityTypeId
        createdAt
        activityTypeByActivityTypeId {
          id
          code
          displayName
        }
      }
    }
  }`,

  createConfig: `mutation CreateDashboardActivityConfig($input: CreateDashboardActivityConfigInput!) {
    createDashboardActivityConfig(input: $input) {
      dashboardActivityConfig {
        id
        dashboardId
        activityTypeId
        createdAt
      }
    }
  }`,

  deleteConfig: `mutation DeleteDashboardActivityConfig($id: UUID!) {
    deleteDashboardActivityConfigById(input: { id: $id }) {
      deletedDashboardActivityConfigId
    }
  }`,
};

export const ACTIVITY_TYPE_QUERIES = {
  getAll: `query GetAllActivityTypes {
    allActivityTypes {
      nodes {
        id
        code
        displayName
        createdAt
        updatedAt
      }
    }
  }`,
  
  // Alternative query names to try
  getAllAlt1: `query GetAllActivityTypesAlt1 {
    allActivity_types {
      nodes {
        id
        code
        displayName
        createdAt
        updatedAt
      }
    }
  }`,
  
  getAllAlt2: `query GetAllActivityTypesAlt2 {
    activityTypes {
      nodes {
        id
        code
        displayName
        createdAt
        updatedAt
      }
    }
  }`,
};

export const GITHUB_USER_MUTATIONS = {
  create: `mutation CreateGithubUser($input: CreateGithubUserInput!) {
    createGithubUser(input: $input) {
      githubUser {
        id
        githubUserId
        githubUsername
        displayName
        avatarUrl
        profileUrl
        createdAt
        updatedAt
      }
    }
  }`,
};

export const GITHUB_USER_QUERIES = {
  getByUsername: `query GetGithubUserByUsername($username: String!) {
    allGithubUsers(condition: { githubUsername: $username }) {
      nodes {
        id
        githubUsername
        displayName
        avatarUrl
        profileUrl
        createdAt
        updatedAt
      }
    }
  }`,
};
