/**
 * PostGraphile GraphQL Client
 * Single Responsibility: Provide GraphQL client for PostGraphile CRUD operations
 */

const POSTGRAPHILE_ENDPOINT = 'http://localhost:3001/graphql';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
  }>;
}

/**
 * Execute a GraphQL query against PostGraphile
 */
export async function executeGraphQL<T>(query: string, variables?: Record<string, any>): Promise<GraphQLResponse<T>> {
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

/**
 * PostGraphile CRUD Queries
 * These use the auto-generated schema from PostGraphile
 */

// Dashboard CRUD Operations
export const DASHBOARD_QUERIES = {
  // Get all dashboards with pagination
  getAll: `
    query GetAllDashboards($first: Int, $after: Cursor, $filter: DashboardCondition) {
      allDashboards(first: $first, after: $after, condition: $filter) {
        nodes {
          id
          name
          slug
          description
          isPublic
          createdAt
          updatedAt
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  `,

  // Get dashboard by slug
  getBySlug: `
    query GetDashboardBySlug($slug: String!) {
      dashboardBySlug(slug: $slug) {
        id
        name
        slug
        description
        isPublic
        createdAt
        updatedAt
      }
    }
  `,

  // Create dashboard
  create: `
    mutation CreateDashboard($input: CreateDashboardInput!) {
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
    }
  `,

  // Update dashboard
  update: `
    mutation UpdateDashboard($id: UUID!, $input: DashboardPatch!) {
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
    }
  `,

  // Delete dashboard
  delete: `
    mutation DeleteDashboard($id: UUID!) {
      deleteDashboardById(input: { id: $id }) {
        deletedDashboardId
      }
    }
  `,
};

// Dashboard Users CRUD Operations
export const DASHBOARD_USER_QUERIES = {
  // Get users for a dashboard
  getByDashboard: `
    query GetDashboardUsers($dashboardId: UUID!) {
      allDashboardGithubUsers(condition: { dashboardId: $dashboardId }) {
        nodes {
          id
          dashboardId
          githubUserId
          githubUser {
            id
            githubUsername
            displayName
            avatarUrl
            profileUrl
          }
        }
      }
    }
  `,

  // Add user to dashboard
  addUser: `
    mutation AddUserToDashboard($input: CreateDashboardGithubUserInput!) {
      createDashboardGithubUser(input: $input) {
        dashboardGithubUser {
          id
          dashboardId
          githubUserId
          githubUser {
            id
            githubUsername
            displayName
            avatarUrl
            profileUrl
          }
        }
      }
    }
  `,

  // Remove user from dashboard
  removeUser: `
    mutation RemoveUserFromDashboard($id: UUID!) {
      deleteDashboardGithubUserById(input: { id: $id }) {
        deletedDashboardGithubUserId
      }
    }
  `,
};

// Dashboard Repositories CRUD Operations
export const DASHBOARD_REPOSITORY_QUERIES = {
  // Get repositories for a dashboard
  getByDashboard: `
    query GetDashboardRepositories($dashboardId: UUID!) {
      allDashboardRepositories(condition: { dashboardId: $dashboardId }) {
        nodes {
          id
          dashboardId
          repositoryName
          githubRepositoryId
        }
      }
    }
  `,

  // Add repository to dashboard
  addRepository: `
    mutation AddRepositoryToDashboard($input: CreateDashboardRepositoryInput!) {
      createDashboardRepository(input: $input) {
        dashboardRepository {
          id
          dashboardId
          repositoryName
          githubRepositoryId
        }
      }
    }
  `,

  // Remove repository from dashboard
  removeRepository: `
    mutation RemoveRepositoryFromDashboard($id: UUID!) {
      deleteDashboardRepositoryById(input: { id: $id }) {
        deletedDashboardRepositoryId
      }
    }
  `,
};

// Activity Configuration CRUD Operations
export const ACTIVITY_CONFIG_QUERIES = {
  // Get activity config for a dashboard
  getByDashboard: `
    query GetDashboardActivityConfig($dashboardId: UUID!) {
      allDashboardActivityConfigs(condition: { dashboardId: $dashboardId }) {
        nodes {
          id
          dashboardId
          activityTypeId
          enabled
          dateRangeStart
          dateRangeEnd
          activityType {
            id
            name
            displayName
            description
            category
          }
        }
      }
    }
  `,

  // Update activity config
  updateConfig: `
    mutation UpdateDashboardActivityConfig($id: UUID!, $input: DashboardActivityConfigPatch!) {
      updateDashboardActivityConfigById(input: { id: $id, dashboardActivityConfigPatch: $input }) {
        dashboardActivityConfig {
          id
          dashboardId
          activityTypeId
          enabled
          dateRangeStart
          dateRangeEnd
        }
      }
    }
  `,
};

// Activity Types CRUD Operations
export const ACTIVITY_TYPE_QUERIES = {
  // Get all activity types
  getAll: `
    query GetAllActivityTypes {
      allActivityTypes {
        nodes {
          id
          name
          displayName
          description
          category
          createdAt
          updatedAt
        }
      }
    }
  `,
};
