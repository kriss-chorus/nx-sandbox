import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  vus: __ENV.VUS ? Number(__ENV.VUS) : 20,
  duration: __ENV.DURATION || '60s',
  thresholds: { http_req_duration: ['p(95)<800'], http_req_failed: ['rate<0.01'] }
};

const API_URL = __ENV.API_URL || 'http://localhost:3001';

export default function () {
  // Test GraphQL Queries (read operations)
  const dashboardsQuery = JSON.stringify({ 
    query: '{ allDashboards { nodes { id name clientId } } }' 
  });
  const dashboards = http.post(`${API_URL}/graphql`, dashboardsQuery, { 
    headers: { 'Content-Type': 'application/json' } 
  });
  check(dashboards, { 'dashboards query 200': (r) => r.status === 200 });

  const clientsQuery = JSON.stringify({ 
    query: '{ allClients { nodes { id name } } }' 
  });
  const clients = http.post(`${API_URL}/graphql`, clientsQuery, { 
    headers: { 'Content-Type': 'application/json' } 
  });
  check(clients, { 'clients query 200': (r) => r.status === 200 });

  // Test GraphQL Mutations (write operations) - only for some VUs to avoid data conflicts
  if (__VU % 3 === 0) {
    const createDashboardMutation = JSON.stringify({
      query: `
        mutation CreateDashboard($input: CreateDashboardInput!) {
          createDashboard(input: $input) {
            dashboard {
              id
              name
              slug
            }
          }
        }
      `,
      variables: {
        input: {
          dashboard: {
            name: `Test Dashboard ${__VU}-${Date.now()}`,
            slug: `test-dashboard-${__VU}-${Date.now()}`,
            clientId: "2667d6c1-89e6-4848-8e12-03cefeeec0c8" // Use existing client
          }
        }
      }
    });
    
    const createResult = http.post(`${API_URL}/graphql`, createDashboardMutation, {
      headers: { 'Content-Type': 'application/json' }
    });
    check(createResult, { 'create dashboard 200': (r) => r.status === 200 });
  }

  // Test Page Loads (frontend) - only for some VUs
  if (__VU % 2 === 0) {
    // Add longer delay to avoid overwhelming the frontend
    sleep(1);
    
    const homepage = http.get('http://[::1]:4202/', {
      timeout: '10s',
      headers: { 'User-Agent': 'k6-load-test' }
    });
    check(homepage, { 'homepage 200': (r) => r.status === 200 });
    
    // Test dashboard page loads
    const dashboardPage = http.get('http://[::1]:4202/dashboard/22fdda0c-3224-4153-bb5c-edb0b7e7a821', {
      timeout: '10s',
      headers: { 'User-Agent': 'k6-load-test' }
    });
    check(dashboardPage, { 'dashboard page 200': (r) => r.status === 200 });
  }

  sleep(1);
}






