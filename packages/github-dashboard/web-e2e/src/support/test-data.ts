import { Page } from '@playwright/test';
import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const WEB_BASE_URL = process.env.WEB_BASE_URL || 'http://localhost:4200';

export interface WebTestData {
  clientId: string;
  dashboardId: string;
  userId: string;
  repositoryId: string;
}

export class WebTestDataManager {
  private testData: WebTestData = {
    clientId: '',
    dashboardId: '',
    userId: '',
    repositoryId: ''
  };

  async seedTestData(): Promise<WebTestData> {
    try {
      // Create test client via API
      const clientResponse = await axios.post(`${API_BASE_URL}/api/clients`, {
        name: 'Web E2E Test Client',
        description: 'Test client for web e2e testing',
        logoUrl: 'https://example.com/logo.png'
      });
      this.testData.clientId = clientResponse.data.id;

      // Create test GitHub user
      const userResponse = await axios.post(`${API_BASE_URL}/api/github/users`, {
        githubUserId: 'webe2etestuser',
        githubUsername: 'webe2etestuser',
        displayName: 'Web E2E Test User',
        avatarUrl: 'https://github.com/webe2etestuser.png',
        profileUrl: 'https://github.com/webe2etestuser'
      });
      this.testData.userId = userResponse.data.id;

      // Create test repository
      const repoResponse = await axios.post(`${API_BASE_URL}/api/github/repositories`, {
        githubRepoId: 888888,
        name: 'web-e2e-test-repo',
        owner: 'webe2etestuser',
        fullName: 'webe2etestuser/web-e2e-test-repo',
        description: 'Repository for web e2e testing',
        isPrivate: false,
        htmlUrl: 'https://github.com/webe2etestuser/web-e2e-test-repo',
        cloneUrl: 'https://github.com/webe2etestuser/web-e2e-test-repo.git',
        defaultBranch: 'main',
        language: 'TypeScript',
        stargazersCount: 0,
        forksCount: 0,
        openIssuesCount: 0
      });
      this.testData.repositoryId = repoResponse.data.id;

      return this.testData;
    } catch (error) {
      console.error('Failed to seed web test data:', error);
      throw error;
    }
  }

  async cleanupTestData(): Promise<void> {
    try {
      // Clean up in reverse order to handle dependencies
      if (this.testData.dashboardId) {
        await axios.delete(`${API_BASE_URL}/api/dashboards/${this.testData.dashboardId}`);
      }
      if (this.testData.repositoryId) {
        await axios.delete(`${API_BASE_URL}/api/github/repositories/${this.testData.repositoryId}`);
      }
      if (this.testData.userId) {
        await axios.delete(`${API_BASE_URL}/api/github/users/${this.testData.userId}`);
      }
      if (this.testData.clientId) {
        await axios.delete(`${API_BASE_URL}/api/clients/${this.testData.clientId}`);
      }
    } catch (error) {
      console.error('Failed to cleanup web test data:', error);
      // Don't throw here to avoid masking test failures
    }
  }

  async createDashboardViaUI(page: Page, name: string, description: string): Promise<string> {
    // Navigate to web app
    await page.goto(WEB_BASE_URL);
    
    // Select the test client
    await page.click(`text=Web E2E Test Client`);
    
    // Create dashboard
    await page.click('button:has-text("Create Dashboard")');
    await page.fill('input[name="name"]', name);
    await page.fill('input[name="description"]', description);
    await page.click('button:has-text("Create Dashboard")');
    
    // Wait for configuration modal
    await page.waitForSelector('[role="dialog"]');
    
    // Save configuration (empty for now)
    await page.click('button:has-text("Save Configuration")');
    
    // Wait for redirect to dashboard detail
    await page.waitForURL(/\/dashboard\//);
    
    // Extract dashboard ID from URL
    const url = page.url();
    const match = url.match(/\/dashboard\/([^\/]+)/);
    if (match) {
      const slug = match[1];
      
      // Get dashboard ID from API
      const dashboardsResponse = await axios.get(`${API_BASE_URL}/api/dashboards?clientId=${this.testData.clientId}`);
      const dashboard = dashboardsResponse.data.find(d => d.slug === slug);
      
      if (dashboard) {
        this.testData.dashboardId = dashboard.id;
        return dashboard.id;
      }
    }
    
    throw new Error('Failed to create dashboard via UI');
  }

  getTestData(): WebTestData {
    return { ...this.testData };
  }
}

export const webTestDataManager = new WebTestDataManager();
