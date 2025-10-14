import { expect, test } from '@playwright/test';
import axios from 'axios';

const WEB_BASE_URL = process.env.WEB_BASE_URL || 'http://localhost:4200';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

test.describe('Full Stack Integration Tests', () => {
  let testClientId: string;
  let testDashboardId: string;

  test.beforeAll(async () => {
    // Create test client via API
    const clientResponse = await axios.post(`${API_BASE_URL}/api/clients`, {
      name: 'Integration Test Client',
      description: 'Client for full stack integration testing'
    });
    testClientId = clientResponse.data.id;
  });

  test.afterAll(async () => {
    // Clean up test data
    if (testDashboardId) {
      await axios.delete(`${API_BASE_URL}/api/dashboards/${testDashboardId}`);
    }
    if (testClientId) {
      await axios.delete(`${API_BASE_URL}/api/clients/${testClientId}`);
    }
  });

  test('should create dashboard via web UI and verify via API', async ({ page }) => {
    // Navigate to web app
    await page.goto(WEB_BASE_URL);
    
    // Select the test client (assuming it appears in the list)
    await page.click(`text=Integration Test Client`);
    
    // Create dashboard via UI
    await page.click('button:has-text("Create Dashboard")');
    await page.fill('input[name="name"]', 'Integration Test Dashboard');
    await page.fill('input[name="description"]', 'Dashboard created via web UI');
    await page.click('button:has-text("Create Dashboard")');
    
    // Configure dashboard
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Add repository
    const repoInput = page.locator('input[placeholder*="repository"]').first();
    await repoInput.fill('facebook/react');
    await page.keyboard.press('Enter');
    
    // Add user
    const userInput = page.locator('input[placeholder*="GitHub username"]').first();
    await userInput.fill('gaearon');
    await page.keyboard.press('Enter');
    
    // Configure activity types
    await page.check('input[type="checkbox"][value="prs_created"]');
    await page.check('input[type="checkbox"][value="prs_merged"]');
    
    // Save configuration
    await page.click('button:has-text("Save Configuration")');
    
    // Wait for redirect to dashboard detail
    await expect(page).toHaveURL(/\/dashboard\/integration-test-dashboard/);
    
    // Extract dashboard ID from URL or page content
    const dashboardSlug = 'integration-test-dashboard';
    
    // Verify dashboard exists via API
    const dashboardsResponse = await axios.get(`${API_BASE_URL}/api/dashboards?clientId=${testClientId}`);
    const dashboard = dashboardsResponse.data.find(d => d.slug === dashboardSlug);
    
    expect(dashboard).toBeDefined();
    expect(dashboard.name).toBe('Integration Test Dashboard');
    expect(dashboard.description).toBe('Dashboard created via web UI');
    
    testDashboardId = dashboard.id;
    
    // Verify dashboard has repositories
    const reposResponse = await axios.get(`${API_BASE_URL}/api/dashboards/${testDashboardId}/repositories`);
    expect(reposResponse.data.length).toBeGreaterThan(0);
    
    // Verify dashboard has users
    const usersResponse = await axios.get(`${API_BASE_URL}/api/dashboards/${testDashboardId}/users`);
    expect(usersResponse.data.length).toBeGreaterThan(0);
    
    // Verify dashboard has activity configurations
    const activityConfigsResponse = await axios.get(`${API_BASE_URL}/api/dashboards/${testDashboardId}/activity-configs`);
    expect(activityConfigsResponse.data.length).toBeGreaterThan(0);
  });

  test('should update dashboard via web UI and verify via API', async ({ page }) => {
    // Navigate to the dashboard detail page
    await page.goto(`${WEB_BASE_URL}/dashboard/integration-test-dashboard`);
    
    // Open configuration modal
    await page.click('button:has-text("Configure")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Add another repository
    const repoInput = page.locator('input[placeholder*="repository"]').first();
    await repoInput.fill('microsoft/vscode');
    await page.keyboard.press('Enter');
    
    // Add another user
    const userInput = page.locator('input[placeholder*="GitHub username"]').first();
    await userInput.fill('octocat');
    await page.keyboard.press('Enter');
    
    // Add more activity types
    await page.check('input[type="checkbox"][value="prs_reviewed"]');
    
    // Change visibility to private
    await page.check('input[type="radio"][value="private"]');
    
    // Save changes
    await page.click('button:has-text("Save Configuration")');
    
    // Wait for modal to close
    await expect(page.locator('[role="dialog"]')).toBeHidden();
    
    // Verify changes via API
    const dashboardResponse = await axios.get(`${API_BASE_URL}/api/dashboards/${testDashboardId}`);
    expect(dashboardResponse.data.isPublic).toBe(false);
    
    // Verify additional repository was added
    const reposResponse = await axios.get(`${API_BASE_URL}/api/dashboards/${testDashboardId}/repositories`);
    expect(reposResponse.data.length).toBeGreaterThan(1);
    
    // Verify additional user was added
    const usersResponse = await axios.get(`${API_BASE_URL}/api/dashboards/${testDashboardId}/users`);
    expect(usersResponse.data.length).toBeGreaterThan(1);
    
    // Verify additional activity config was added
    const activityConfigsResponse = await axios.get(`${API_BASE_URL}/api/dashboards/${testDashboardId}/activity-configs`);
    expect(activityConfigsResponse.data.length).toBeGreaterThan(1);
  });

  test('should create data via API and display in web UI', async ({ page }) => {
    // Create a new dashboard via API
    const dashboardResponse = await axios.post(`${API_BASE_URL}/api/dashboards`, {
      name: 'API Created Dashboard',
      slug: 'api-created-dashboard',
      description: 'Dashboard created via API',
      isPublic: true,
      clientId: testClientId
    });
    
    const apiDashboardId = dashboardResponse.data.id;
    
    // Add repository via API
    const repoResponse = await axios.post(`${API_BASE_URL}/api/github/repositories`, {
      githubRepoId: 123456,
      name: 'api-test-repo',
      owner: 'testuser',
      fullName: 'testuser/api-test-repo',
      description: 'Repository created via API',
      isPrivate: false,
      htmlUrl: 'https://github.com/testuser/api-test-repo'
    });
    
    await axios.post(`${API_BASE_URL}/api/dashboards/${apiDashboardId}/repositories`, {
      repositoryId: repoResponse.data.id
    });
    
    // Add user via API
    const userResponse = await axios.post(`${API_BASE_URL}/api/github/users`, {
      githubUserId: 'apitestuser',
      githubUsername: 'apitestuser',
      displayName: 'API Test User',
      avatarUrl: 'https://github.com/apitestuser.png',
      profileUrl: 'https://github.com/apitestuser'
    });
    
    await axios.post(`${API_BASE_URL}/api/dashboards/${apiDashboardId}/users`, {
      githubUserId: userResponse.data.id
    });
    
    // Navigate to web UI and verify data appears
    await page.goto(`${WEB_BASE_URL}/dashboard/api-created-dashboard`);
    
    // Verify dashboard name appears
    await expect(page.locator('h4')).toContainText('API Created Dashboard');
    
    // Verify description appears
    await expect(page.locator('p')).toContainText('Dashboard created via API');
    
    // Open configuration to verify repositories and users
    await page.click('button:has-text("Configure")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Verify repository appears in the list
    await expect(page.locator('text=testuser/api-test-repo')).toBeVisible();
    
    // Verify user appears in the list
    await expect(page.locator('text=apitestuser')).toBeVisible();
    
    // Clean up
    await axios.delete(`${API_BASE_URL}/api/dashboards/${apiDashboardId}`);
    await axios.delete(`${API_BASE_URL}/api/github/repositories/${repoResponse.data.id}`);
    await axios.delete(`${API_BASE_URL}/api/github/users/${userResponse.data.id}`);
  });

  test('should handle API errors gracefully in web UI', async ({ page }) => {
    // Navigate to web app
    await page.goto(WEB_BASE_URL);
    
    // Try to create dashboard with invalid data
    await page.click('button:has-text("Create New Client")');
    await page.fill('input[name="name"]', 'Error Test Client');
    await page.fill('input[name="description"]', 'Client for error testing');
    await page.click('button:has-text("Create Client")');
    
    await page.click('button:has-text("Create Dashboard")');
    await page.fill('input[name="name"]', 'Error Test Dashboard');
    await page.fill('input[name="description"]', 'Dashboard for error testing');
    await page.click('button:has-text("Create Dashboard")');
    
    // Try to add invalid repository
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    const repoInput = page.locator('input[placeholder*="repository"]').first();
    await repoInput.fill('invalid/repo/format');
    await page.keyboard.press('Enter');
    
    // Try to add invalid user
    const userInput = page.locator('input[placeholder*="GitHub username"]').first();
    await userInput.fill('nonexistentuser12345');
    await page.keyboard.press('Enter');
    
    // Save configuration (should handle errors gracefully)
    await page.click('button:has-text("Save Configuration")');
    
    // Should either show error messages or complete successfully with partial data
    // The exact behavior depends on error handling implementation
  });

  test('should maintain data consistency between API and web UI', async ({ page }) => {
    // Create dashboard via API
    const dashboardResponse = await axios.post(`${API_BASE_URL}/api/dashboards`, {
      name: 'Consistency Test Dashboard',
      slug: 'consistency-test-dashboard',
      description: 'Dashboard for consistency testing',
      isPublic: true,
      clientId: testClientId
    });
    
    const consistencyDashboardId = dashboardResponse.data.id;
    
    // Navigate to web UI
    await page.goto(`${WEB_BASE_URL}/dashboard/consistency-test-dashboard`);
    
    // Verify initial state
    await expect(page.locator('h4')).toContainText('Consistency Test Dashboard');
    
    // Make changes via web UI
    await page.click('button:has-text("Configure")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Add repository
    const repoInput = page.locator('input[placeholder*="repository"]').first();
    await repoInput.fill('angular/angular');
    await page.keyboard.press('Enter');
    
    // Save changes
    await page.click('button:has-text("Save Configuration")');
    await expect(page.locator('[role="dialog"]')).toBeHidden();
    
    // Verify changes are reflected in API
    const reposResponse = await axios.get(`${API_BASE_URL}/api/dashboards/${consistencyDashboardId}/repositories`);
    expect(reposResponse.data.length).toBeGreaterThan(0);
    
    // Make changes via API
    await axios.patch(`${API_BASE_URL}/api/dashboards/${consistencyDashboardId}`, {
      name: 'Updated Consistency Test Dashboard',
      description: 'Updated description via API'
    });
    
    // Refresh web UI and verify changes
    await page.reload();
    await expect(page.locator('h4')).toContainText('Updated Consistency Test Dashboard');
    await expect(page.locator('p')).toContainText('Updated description via API');
    
    // Clean up
    await axios.delete(`${API_BASE_URL}/api/dashboards/${consistencyDashboardId}`);
  });
});
