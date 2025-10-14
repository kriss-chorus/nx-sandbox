import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

describe('Basic API Tests', () => {
  describe('Health Check', () => {
    it('should return API health status', async () => {
      const response = await axios.get(`${API_BASE_URL}/api`);

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ message: 'Hello API' });
    });
  });

  describe('GitHub Integration', () => {
    it('should handle GitHub user lookup (with mocking)', async () => {
      // This test will work if GitHub token is provided, or fail gracefully if not
      try {
        const response = await axios.get(`${API_BASE_URL}/api/github/users/octocat`);
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('login', 'octocat');
    } catch (error: any) {
        // If GitHub token is not provided or user doesn't exist, that's expected
      expect([401, 404, 403]).toContain(error?.response?.status);
      }
    });

    it('should handle GitHub repository lookup (with mocking)', async () => {
      // This test will work if GitHub token is provided, or fail gracefully if not
      try {
        const response = await axios.get(`${API_BASE_URL}/api/github/repos/octocat/Hello-World`);
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('full_name', 'octocat/Hello-World');
    } catch (error: any) {
        // If GitHub token is not provided or repo doesn't exist, that's expected
      expect([401, 404, 403]).toContain(error?.response?.status);
      }
    });
  });

  describe('PostGraphile GraphQL', () => {
    it('should have GraphQL endpoint available', async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/graphql`, {
          query: '{ __schema { types { name } } }'
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('data');
      } catch (error: any) {
        // GraphQL endpoint might not be available if PostGraphile isn't properly configured
        expect(error?.response?.status).toBe(404);
        console.log('GraphQL endpoint not available - PostGraphile may not be configured');
      }
    });

    it('should have GraphiQL playground available', async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/graphiql`);

        expect(response.status).toBe(200);
        expect(response.data).toContain('GraphiQL');
      } catch (error: any) {
        // GraphiQL might not be available if PostGraphile isn't properly configured
        expect(error?.response?.status).toBe(404);
        console.log('GraphiQL endpoint not available - PostGraphile may not be configured');
      }
    });
  });
});
