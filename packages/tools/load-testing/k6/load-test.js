import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  vus: __ENV.VUS ? Number(__ENV.VUS) : 50,
  duration: __ENV.DURATION || '60s',
  thresholds: { http_req_duration: ['p(95)<800'], http_req_failed: ['rate<0.01'] }
};

const WEB_URL = __ENV.WEB_URL || 'http://localhost:8080';

export default function () {
  // Test dashboard page loads (simulating real user behavior)
  const dashboard1 = http.get(`${WEB_URL}/dashboard/22fdda0c-3224-4153-bb5c-edb0b7e7a821`); // First Candy Corn Dashboard
  check(dashboard1, { 'dashboard1 200': (r) => r.status === 200 });

  const dashboard2 = http.get(`${WEB_URL}/dashboard/97e807a7-7c24-45df-9ba6-3c58f36d7c51`); // Haunted Board
  check(dashboard2, { 'dashboard2 200': (r) => r.status === 200 });

  // Test homepage/landing page
  const homepage = http.get(`${WEB_URL}/`);
  check(homepage, { 'homepage 200': (r) => r.status === 200 });

  sleep(1);
}






