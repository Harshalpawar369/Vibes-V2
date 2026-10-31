import http from 'k6/http';
import { check, sleep, group } from 'k6';

// ---------- Test configuration ----------
export const options = {
  scenarios: {
    // Simulate realistic traffic: ramps up, holds, ramps down
    browsing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 20 },  // ramp up to 20 users
        { duration: '30s', target: 20 },  // hold steady for 30s
        { duration: '10s', target: 0 },   // ramp down
      ],
      gracefulRampDown: '5s',
    },
  },

  // Pass/fail thresholds — k6 exits non-zero if these fail
  thresholds: {
    // 95% of requests must complete within 500ms
    http_req_duration: ['p(95)<500'],
    // 99% of requests must succeed
    http_req_failed: ['rate<0.01'],
  },
};

const BASE = 'http://localhost:3000/api';

// ---------- Setup: run once before test ----------
export function setup() {
  // Register a customer for authenticated requests
  const stamp = Date.now();
  const email = `k6_${stamp}@example.com`;
  const password = 'secret123';

  http.post(`${BASE}/auth/register`, JSON.stringify({
    name: 'K6 User',
    email,
    password,
    phone: '9000000099',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  return { email, password };
}

// ---------- Main VU loop ----------
export default function (data) {
  // ---- 1. Public product list (should hit cache) ----
  group('Browse products (cached)', function () {
    const res = http.get(`${BASE}/products`);

    check(res, {
      'products status 200': (r) => r.status === 200,
      'products has array': (r) => Array.isArray(r.json('products')),
    });

    // Log cache status so we can see hits
    const cache = res.headers['X-Cache'];
    if (cache) {
      console.log(`X-Cache: ${cache}`);
    }
  });

  // ---- 2. Public product list with filter (different cache key) ----
  group('Filtered products', function () {
    const res = http.get(`${BASE}/products?category=Testing`);
    check(res, {
      'filtered products 200': (r) => r.status === 200,
    });
  });

  // ---- 3. Simulate a small pause between user actions ----
  sleep(1);
}

// ---------- Teardown: run once at end ----------
export function teardown(data) {
  console.log('K6 test completed for user:', data.email);
}