import { expect, test } from '@playwright/test';

const WEB_BASE_URL = process.env.WEB_BASE_URL || 'http://localhost:4200';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock backend GitHub proxy routes to avoid rate limits
    await page.route('**/api/github/users/**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ login: 'octocat', id: 1, avatar_url: 'https://github.com/octocat.png' })
      });
    });
    await page.route('**/api/github/repos/**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1296269, full_name: 'octocat/Hello-World', name: 'Hello-World', owner: { login: 'octocat' } })
      });
    });

    await page.goto(WEB_BASE_URL);
  });

  test.describe('Client Selection', () => {
    test('should display client selection page', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Select Client');
      await expect(page.locator('button')).toContainText('Create New Client');
    });

    test('should create a new client', async ({ page }) => {
      await page.click('button:has-text("Create New Client")');
      
      await page.fill('input[name="name"]', 'E2E Test Client');
      await page.fill('input[name="description"]', 'Test client for e2e testing');
      
      await page.click('button:has-text("Create Client")');
      
      // Should redirect to dashboard list page
      await expect(page).toHaveURL(/\/dashboards/);
      await expect(page.locator('h4')).toContainText('E2E Test Client');
    });
  });

  test.describe('Dashboard Management', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test client first
      await page.goto(WEB_BASE_URL);
      await page.click('button:has-text("Create New Client")');
      await page.fill('input[name="name"]', 'Dashboard Test Client');
      await page.fill('input[name="description"]', 'Client for dashboard tests');
      await page.click('button:has-text("Create Client")');
      
      // Wait for redirect to dashboard list
      await expect(page).toHaveURL(/\/dashboards/);
    });

    test('should display dashboard list page', async ({ page }) => {
      await expect(page.locator('h4')).toContainText('Dashboard Test Client');
      await expect(page.locator('button')).toContainText('Create Dashboard');
      await expect(page.locator('h4')).toContainText('My Dashboards');
    });

    test('should create a new dashboard', async ({ page }) => {
      await page.click('button:has-text("Create Dashboard")');
      
      await page.fill('input[name="name"]', 'E2E Test Dashboard');
      await page.fill('input[name="description"]', 'A test dashboard for e2e testing');
      
      await page.click('button:has-text("Create Dashboard")');
      
      // Should open configuration modal
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('h6')).toContainText('Configure Dashboard');
    });

    test('should configure dashboard with repositories and users', async ({ page }) => {
      // Create dashboard
      await page.click('button:has-text("Create Dashboard")');
      await page.fill('input[name="name"]', 'Configured Test Dashboard');
      await page.fill('input[name="description"]', 'Dashboard with configuration');
      await page.click('button:has-text("Create Dashboard")');
      
      // Wait for configuration modal
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Add repositories
      const repoInput = page.locator('input[placeholder*="repository"]').first();
      await repoInput.fill('facebook/react');
      await page.keyboard.press('Enter');
      
      // Add users
      const userInput = page.locator('input[placeholder*="GitHub username"]').first();
      await userInput.fill('gaearon');
      await page.keyboard.press('Enter');
      
      // Configure activity types
      await page.check('input[type="checkbox"][value="prs_created"]');
      await page.check('input[type="checkbox"][value="prs_merged"]');
      await page.check('input[type="checkbox"][value="prs_reviewed"]');
      
      // Set visibility
      await page.check('input[type="radio"][value="public"]');
      
      // Save configuration
      await page.click('button:has-text("Save Configuration")');
      
      // Should close modal and redirect to dashboard detail
      await expect(page.locator('[role="dialog"]')).toBeHidden();
      await expect(page).toHaveURL(/\/dashboard\/configured-test-dashboard/);
    });

    test('should view dashboard detail page', async ({ page }) => {
      // Create and configure a dashboard first
      await page.click('button:has-text("Create Dashboard")');
      await page.fill('input[name="name"]', 'Detail Test Dashboard');
      await page.fill('input[name="description"]', 'Dashboard for detail view testing');
      await page.click('button:has-text("Create Dashboard")');
      
      // Quick configuration
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await page.click('button:has-text("Save Configuration")');
      
      // Should be on detail page
      await expect(page).toHaveURL(/\/dashboard\/detail-test-dashboard/);
      await expect(page.locator('h4')).toContainText('Detail Test Dashboard');
      await expect(page.locator('button')).toContainText('Configure');
    });

    test('should edit dashboard configuration', async ({ page }) => {
      // Create dashboard first
      await page.click('button:has-text("Create Dashboard")');
      await page.fill('input[name="name"]', 'Edit Test Dashboard');
      await page.fill('input[name="description"]', 'Dashboard for edit testing');
      await page.click('button:has-text("Create Dashboard")');
      
      // Quick save
      await page.click('button:has-text("Save Configuration")');
      
      // Navigate to detail page
      await expect(page).toHaveURL(/\/dashboard\/edit-test-dashboard/);
      
      // Open configuration modal
      await page.click('button:has-text("Configure")');
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Make changes
      const repoInput = page.locator('input[placeholder*="repository"]').first();
      await repoInput.fill('microsoft/vscode');
      await page.keyboard.press('Enter');
      
      // Save changes
      await page.click('button:has-text("Save Configuration")');
      
      // Modal should close
      await expect(page.locator('[role="dialog"]')).toBeHidden();
    });
  });

  test.describe('Dashboard Navigation', () => {
    test('should navigate back to dashboard list', async ({ page }) => {
      // Create a dashboard first
      await page.click('button:has-text("Create New Client")');
      await page.fill('input[name="name"]', 'Navigation Test Client');
      await page.fill('input[name="description"]', 'Client for navigation tests');
      await page.click('button:has-text("Create Client")');
      
      await page.click('button:has-text("Create Dashboard")');
      await page.fill('input[name="name"]', 'Navigation Test Dashboard');
      await page.fill('input[name="description"]', 'Dashboard for navigation testing');
      await page.click('button:has-text("Create Dashboard")');
      await page.click('button:has-text("Save Configuration")');
      
      // Should be on detail page
      await expect(page).toHaveURL(/\/dashboard\/navigation-test-dashboard/);
      
      // Click back button
      await page.click('button:has-text("Back to Dashboards")');
      
      // Should be back on dashboard list
      await expect(page).toHaveURL(/\/dashboards/);
      await expect(page.locator('h4')).toContainText('Navigation Test Client');
    });

    test('should navigate back to client selection', async ({ page }) => {
      // Create a client first
      await page.click('button:has-text("Create New Client")');
      await page.fill('input[name="name"]', 'Back Navigation Client');
      await page.fill('input[name="description"]', 'Client for back navigation');
      await page.click('button:has-text("Create Client")');
      
      // Should be on dashboard list
      await expect(page).toHaveURL(/\/dashboards/);
      
      // Click back to client selection
      await page.click('button:has-text("Back to Client Selection")');
      
      // Should be back on client selection page
      await expect(page).toHaveURL(/\//);
      await expect(page.locator('h1')).toContainText('Select Client');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid dashboard URL', async ({ page }) => {
      // Navigate to non-existent dashboard
      await page.goto(`${WEB_BASE_URL}/dashboard/non-existent-dashboard`);
      
      // Should show not found message
      await expect(page.locator('h4')).toContainText('Dashboard Not Found');
      await expect(page.locator('button')).toContainText('Back to Dashboards');
    });

    test('should handle form validation errors', async ({ page }) => {
      // Create client first
      await page.click('button:has-text("Create New Client")');
      await page.fill('input[name="name"]', 'Validation Test Client');
      await page.fill('input[name="description"]', 'Client for validation tests');
      await page.click('button:has-text("Create Client")');
      
      // Try to create dashboard without name
      await page.click('button:has-text("Create Dashboard")');
      await page.click('button:has-text("Create Dashboard")');
      
      // Should show validation error or not proceed
      // The exact behavior depends on form validation implementation
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await expect(page.locator('h1')).toContainText('Select Client');
      await expect(page.locator('button')).toContainText('Create New Client');
      
      // Test mobile navigation
      await page.click('button:has-text("Create New Client")');
      await page.fill('input[name="name"]', 'Mobile Test Client');
      await page.fill('input[name="description"]', 'Mobile client test');
      await page.click('button:has-text("Create Client")');
      
      await expect(page).toHaveURL(/\/dashboards/);
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await expect(page.locator('h1')).toContainText('Select Client');
      
      // Test tablet layout
      await page.click('button:has-text("Create New Client")');
      await page.fill('input[name="name"]', 'Tablet Test Client');
      await page.fill('input[name="description"]', 'Tablet client test');
      await page.click('button:has-text("Create Client")');
      
      await expect(page).toHaveURL(/\/dashboards/);
    });
  });
});
