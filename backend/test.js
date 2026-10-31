/**
 * Full Journey Stress Test — 1000 VUs
 *
 * Scenarios:
 *   - Auth: register + login (multiple roles)
 *   - Cart: add, update, remove, clear
 *   - Wishlist: toggle add/remove
 *   - Orders: create, list, cancel
 *
 * Run:    k6 run test-k6-1000.js
 * Needs:  server on http://localhost:3000, MongoDB running,
 *         at least 1 active product in DB.
 *
 * ⚠️  Dev bcrypt cost MUST be 8 (not 12) or setup will be slow.
 *     See notes at the top of backend/src/controllers/auth.controllers.js.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// ============================================================
// Custom metrics
// ============================================================
const registerDuration = new Trend('register_duration');
const loginDuration    = new Trend('login_duration');
const cartDuration     = new Trend('cart_duration');
const wishDuration     = new Trend('wishlist_duration');
const orderDuration    = new Trend('order_duration');
const cancelDuration   = new Trend('cancel_duration');

const registersOk   = new Counter('registers_ok');
const registersFail = new Counter('registers_fail');
const loginsOk      = new Counter('logins_ok');
const loginsFail    = new Counter('logins_fail');
const cartsOk       = new Counter('carts_ok');
const cartFail      = new Counter('cart_fail');
const wishlistOk    = new Counter('wishlist_ok');
const wishlistFail  = new Counter('wishlist_fail');
const ordersOk      = new Counter('orders_ok');
const ordersFail    = new Counter('orders_fail');
const cancelOk      = new Counter('cancels_ok');
const cancelFail    = new Counter('cancels_fail');

const errorRate = new Rate('error_rate');

// ============================================================
// Test configuration — 1000 VUs total
// ============================================================
export const options = {
  // 🔑 Raise setup timeout — the pre-registration loop needs time
  setupTimeout: '3m',
  teardownTimeout: '30s',

  scenarios: {
    // 300 VUs — auth (register + login mix)
    auth: {
      executor: 'ramping-vus',
      exec: 'authScenario',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 300 },
        { duration: '2m',  target: 300 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '20s',
    },

    // 300 VUs — cart
    cart: {
      executor: 'ramping-vus',
      exec: 'cartScenario',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 300 },
        { duration: '2m',  target: 300 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '20s',
    },

    // 200 VUs — wishlist
    wishlist: {
      executor: 'ramping-vus',
      exec: 'wishlistScenario',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 200 },
        { duration: '2m',  target: 200 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '20s',
    },

    // 200 VUs — orders + cancel
    order: {
      executor: 'ramping-vus',
      exec: 'orderScenario',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 200 },
        { duration: '2m',  target: 200 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '20s',
    },
  },

  thresholds: {
    // Realistic thresholds for 1000 VUs on a single Node process
    http_req_duration: ['p(95)<3000'],
    http_req_failed:   ['rate<0.20'],

    register_duration: ['p(95)<2000'],
    login_duration:    ['p(95)<1000'],
    cart_duration:     ['p(95)<800'],
    wishlist_duration: ['p(95)<800'],
    order_duration:    ['p(95)<2500'],
    cancel_duration:   ['p(95)<1500'],
  },
};

const BASE = 'http://localhost:3000/api';

// ============================================================
// SETUP — runs ONCE before the test
// ============================================================
export function setup() {
  const stamp = Date.now();

  console.log('🔧 Setting up test data...');

  // 1. Confirm at least one product exists
  const productRes = http.get(`${BASE}/products?limit=50`);
  const products = productRes.json('products') || [];

  if (products.length === 0) {
    throw new Error('No products found. Create some via a vendor first.');
  }
  console.log(`✅ Found ${products.length} products`);

  // 2. Pre-register a small pool of customers.
  //    We keep this small (150) so setup finishes fast.
  //    The auth scenario also registers new users on the fly — the pool
  //    is only here to make login-heavy scenarios able to authenticate.
  const PASSWORD = 'secret123';
  const POOL_SIZE = 150;
  const customerPool = [];

  console.log(`🔧 Pre-registering ${POOL_SIZE} customers...`);
  const start = Date.now();

  for (let i = 0; i < POOL_SIZE; i++) {
    const email = `k6_1000_${stamp}_${i}@example.com`;
    const res = http.post(
      `${BASE}/auth/register`,
      JSON.stringify({
        name: `K6 User ${i}`,
        email,
        password: PASSWORD,
        phone: String(9000000000 + i).slice(0, 10),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.status === 201) {
      customerPool.push({ email, password: PASSWORD });
    }

    if ((i + 1) % 25 === 0) {
      console.log(`   ... ${i + 1}/${POOL_SIZE} (${Date.now() - start}ms elapsed)`);
    }
  }

  console.log(
    `✅ Pre-registered ${customerPool.length} customers in ${Date.now() - start}ms`
  );

  return {
    products: products.map((p) => ({
      _id: p._id,
      price: p.price,
      stock: p.stock,
    })),
    customerPool,
    stamp,
  };
}

// ============================================================
// Helpers
// ============================================================
function pickProduct(products) {
  return products[Math.floor(Math.random() * products.length)];
}

function pickCustomer(pool) {
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function loginAs(email, password) {
  return http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

// ============================================================
// SCENARIO 1 — AUTH (register + login mix)
// ============================================================
export function authScenario(data) {
  const roll = Math.random();

  group('auth', function () {
    if (roll < 0.3) {
      // 30% — fresh register
      const stamp = Date.now();
      const rand = Math.floor(Math.random() * 1e6);
      const email = `k6_auth_${stamp}_${__VU}_${__ITER}_${rand}@example.com`;

      const res = http.post(
        `${BASE}/auth/register`,
        JSON.stringify({
          name: `K6 Auth ${__VU}`,
          email,
          password: 'secret123',
          phone: String(9000000000 + (__VU % 999999)).slice(0, 10),
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );

      registerDuration.add(res.timings.duration);

      const ok = check(res, { 'register 201': (r) => r.status === 201 });
      if (ok) registersOk.add(1);
      else registersFail.add(1);
      errorRate.add(!ok);
    } else {
      // 70% — login as a pre-registered customer
      const customer = pickCustomer(data.customerPool);
      if (!customer) return;

      const res = loginAs(customer.email, customer.password);
      loginDuration.add(res.timings.duration);

      const ok = check(res, { 'login 200': (r) => r.status === 200 });
      if (ok) loginsOk.add(1);
      else loginsFail.add(1);
      errorRate.add(!ok);
    }
  });

  sleep(Math.random() * 0.5 + 0.2);
}

// ============================================================
// SCENARIO 2 — CART
// ============================================================
export function cartScenario(data) {
  const customer = pickCustomer(data.customerPool);
  const product = pickProduct(data.products);
  if (!customer || !product) return;

  // Fresh cookie jar per iteration
  const jar = http.cookieJar();
  jar.clear(BASE);

  // Login
  const loginRes = loginAs(customer.email, customer.password);
  if (loginRes.status !== 200) {
    loginsFail.add(1);
    return;
  }
  loginsOk.add(1);

  group('cart', function () {
    // Clear existing cart
    http.del(`${BASE}/cart`);

    // Add item
    const addRes = http.post(
      `${BASE}/cart`,
      JSON.stringify({ productId: product._id, quantity: 1 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    cartDuration.add(addRes.timings.duration);
    const added = check(addRes, { 'cart add 200': (r) => r.status === 200 });
    if (added) cartsOk.add(1);
    else cartFail.add(1);
    errorRate.add(!added);

    // Get cart
    http.get(`${BASE}/cart`);

    // Update quantity
    const updRes = http.put(
      `${BASE}/cart/${product._id}`,
      JSON.stringify({ quantity: 2 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    cartDuration.add(updRes.timings.duration);

    // Remove
    http.del(`${BASE}/cart/${product._id}`);
  });

  sleep(Math.random() * 0.5 + 0.2);
}

// ============================================================
// SCENARIO 3 — WISHLIST
// ============================================================
export function wishlistScenario(data) {
  const customer = pickCustomer(data.customerPool);
  const product = pickProduct(data.products);
  if (!customer || !product) return;

  const jar = http.cookieJar();
  jar.clear(BASE);

  const loginRes = loginAs(customer.email, customer.password);
  if (loginRes.status !== 200) {
    loginsFail.add(1);
    return;
  }
  loginsOk.add(1);

  group('wishlist', function () {
    // Toggle add
    const toggleRes = http.post(`${BASE}/wishlist/${product._id}`);
    wishDuration.add(toggleRes.timings.duration);
    const added = check(toggleRes, {
      'wishlist add 200': (r) => r.status === 200,
    });
    if (added) wishlistOk.add(1);
    else wishlistFail.add(1);
    errorRate.add(!added);

    // Read
    http.get(`${BASE}/wishlist`);

    // Toggle off
    http.post(`${BASE}/wishlist/${product._id}`);
  });

  sleep(Math.random() * 0.5 + 0.2);
}

// ============================================================
// SCENARIO 4 — ORDER create + cancel
// ============================================================
export function orderScenario(data) {
  const customer = pickCustomer(data.customerPool);
  const product = pickProduct(data.products);
  if (!customer || !product) return;

  const jar = http.cookieJar();
  jar.clear(BASE);

  const loginRes = loginAs(customer.email, customer.password);
  if (loginRes.status !== 200) {
    loginsFail.add(1);
    return;
  }
  loginsOk.add(1);

  group('order', function () {
    // Clear cart, add one item
    http.del(`${BASE}/cart`);
    http.post(
      `${BASE}/cart`,
      JSON.stringify({ productId: product._id, quantity: 1 }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Create COD order
    const orderRes = http.post(
      `${BASE}/orders`,
      JSON.stringify({
        shippingAddress: {
          fullName: 'K6 Load Test',
          phone: '9000000000',
          address: '123 Test Street',
          city: 'Mumbai',
          state: 'MH',
          pincode: '400001',
        },
        paymentMethod: 'cod',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    orderDuration.add(orderRes.timings.duration);

    const created = check(orderRes, {
      'order create 201': (r) => r.status === 201,
    });

    if (!created) {
      ordersFail.add(1);
      errorRate.add(true);
      return;
    }

    ordersOk.add(1);
    errorRate.add(false);

    const orderId = orderRes.json('order._id');
    if (!orderId) return;

    // List my orders
    http.get(`${BASE}/orders/my`);

    // Cancel the order (restocks)
    const cancelRes = http.put(`${BASE}/orders/${orderId}/cancel`);
    cancelDuration.add(cancelRes.timings.duration);

    const cancelled = check(cancelRes, {
      'order cancel 200': (r) => r.status === 200,
    });
    if (cancelled) cancelOk.add(1);
    else cancelFail.add(1);
  });

  sleep(Math.random() * 0.8 + 0.4);
}

// ============================================================
// TEARDOWN
// ============================================================
export function teardown(data) {
  console.log('🏁 Test finished.');
  console.log(`   Products in pool:     ${data.products.length}`);
  console.log(`   Customers pre-seeded: ${data.customerPool.length}`);
  console.log('   Cleanup not performed — see notes in the report.');
}