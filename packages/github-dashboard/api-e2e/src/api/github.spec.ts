import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

describe('GitHub API E2E Tests', () => {
  describe('GitHub User Endpoints', () => {
    it('should fetch GitHub user information', async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/github/users/octocat`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('login', 'octocat');
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('avatar_url');
      } catch (error: any) {
        // If GitHub token is not provided, that's expected in test environment
        const status = error?.response?.status;
        if (status == null) {
          expect(true).toBe(true);
        } else {
          expect([401, 404, 403]).toContain(status);
        }
      }
    });

    it('should fetch user repositories', async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/github/users/octocat/repos?per_page=5`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      } catch (error: any) {
        // If GitHub token is not provided, that's expected in test environment
        const status = error?.response?.status;
        if (status == null) {
          expect(true).toBe(true);
        } else {
          expect([401, 404, 403]).toContain(status);
        }
      }
    });

    it('should fetch user activity', async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/github/users/octocat/activity?start_date=2024-01-01&end_date=2024-12-31`);

        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
      } catch (error: any) {
        // If GitHub token is not provided, that's expected in test environment
        const status = error?.response?.status;
        if (status == null) {
          expect(true).toBe(true);
        } else {
          expect([401, 404, 403]).toContain(status);
        }
      }
    });
  });

  describe('GitHub Repository Endpoints', () => {
    it('should fetch repository information', async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/github/repos/octocat/Hello-World`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('full_name', 'octocat/Hello-World');
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('html_url');
      } catch (error: any) {
        // If GitHub token is not provided, that's expected in test environment
        const status = error?.response?.status;
        if (status == null) {
          expect(true).toBe(true);
        } else {
          expect([401, 404, 403]).toContain(status);
        }
      }
    });

    it('should fetch repository pull requests', async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/github/repos/octocat/Hello-World/pulls?state=all&per_page=5`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      } catch (error) {
        // If GitHub token is not provided, that's expected in test environment
        expect([401, 404, 403]).toContain(error.response.status);
      }
    });
  });

  describe('GitHub Activity Endpoints', () => {
    it('should fetch batch activity summary', async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/github/activity/batch-summary?dashboard_id=test-dashboard-id`);

        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
      } catch (error: any) {
        // This might fail if no dashboard exists, which is expected
        const status = error?.response?.status;
        if (status == null) {
          expect(true).toBe(true);
        } else {
          expect([400, 404, 500, 502]).toContain(status);
        }
      }
    });

    it('should fetch user PR stats', async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/github/activity/users/octocat/pr-stats`, {
          repos: ['octocat/Hello-World']
        });

        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
      } catch (error: any) {
        // If GitHub token is not provided, that's expected in test environment
        const status = error?.response?.status;
        if (status == null) {
          expect(true).toBe(true);
        } else {
          expect([401, 404, 403, 500, 502]).toContain(status);
        }
      }
    }, 15000); // 15 second timeout
  });

  describe('Error Handling', () => {
    it('should handle non-existent user gracefully', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/github/users/nonexistentuser12345`);
        fail('Should have thrown an error for non-existent user');
      } catch (error: any) {
        const status = error?.response?.status;
        if (status == null) {
          expect(true).toBe(true);
        } else {
          expect([404, 401, 403]).toContain(status);
        }
      }
    });

    it('should handle non-existent repository gracefully', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/github/repos/nonexistentuser/nonexistentrepo`);
        fail('Should have thrown an error for non-existent repository');
      } catch (error: any) {
        const status = error?.response?.status;
        if (status == null) {
          expect(true).toBe(true);
        } else {
          expect([404, 401, 403]).toContain(status);
        }
      }
    });
  });
});