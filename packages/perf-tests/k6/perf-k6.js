import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  vus: __ENV.VUS ? Number(__ENV.VUS) : 50,
  duration: __ENV.DURATION || '60s',
  thresholds: { http_req_duration: ['p(95)<800'], http_req_failed: ['rate<0.01'] }
};

const GRAPHQL = __ENV.GRAPHQL_URL || 'http://localhost:3001/graphql';
const API = __ENV.API_URL || 'http://localhost:3001/api/health';

export default function () {
  const gql = JSON.stringify({ query: '{ allDashboards { nodes { id name } } }' });
  const r1 = http.post(GRAPHQL, gql, { headers: { 'Content-Type': 'application/json' } });
  check(r1, { 'graphql 200': (r) => r.status === 200 });

  const r2 = http.get(API);
  check(r2, { 'api 200': (r) => r.status === 200 });

  sleep(1);
}
