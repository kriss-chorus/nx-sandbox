
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export interface TestData {
  // Note: Dashboard management is done via PostGraphile GraphQL, not REST endpoints
  // These are placeholder IDs for test organization
  clientId: string;
  dashboardId: string;
  userId: string;
  repositoryId: string;
}

export class TestDataManager {
  private testData: TestData = {
    clientId: '',
    dashboardId: '',
    userId: '',
    repositoryId: ''
  };

  async seedTestData(): Promise<TestData> {
    try {
      // For now, we'll use mock data since the API only has GitHub endpoints
      // and dashboard management is done via PostGraphile GraphQL
      console.log('Seeding test data with mock values (API uses PostGraphile GraphQL for dashboard management)');
      
      // Mock test data - in a real scenario, these would be created via GraphQL mutations
      this.testData = {
        clientId: 'mock-client-id',
        dashboardId: 'mock-dashboard-id', 
        userId: 'mock-user-id',
        repositoryId: 'mock-repository-id'
      };

      return this.testData;
    } catch (error) {
      console.error('Failed to seed test data:', error);
      throw error;
    }
  }

  async cleanupTestData(): Promise<void> {
    try {
      console.log('Cleaning up test data (mock cleanup)');
      // In a real scenario, this would clean up via GraphQL mutations
      this.testData = {
        clientId: '',
        dashboardId: '',
        userId: '',
        repositoryId: ''
      };
    } catch (error) {
      console.error('Failed to cleanup test data:', error);
      // Don't throw here to avoid masking test failures
    }
  }

  getTestData(): TestData {
    return { ...this.testData };
  }
}

export const testDataManager = new TestDataManager();
