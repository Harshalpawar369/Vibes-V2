/**
 * Full E2E Load Test — Customer Journey
 *   Browse → Cart → Wishlist → Order → Review
 *
 * Run:    k6 run test-k6-full.js
 * Config: 100 VUs, mixed scenarios
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';
import { Trend, Rate, Counter } from 'k6/metrics';

// ============================================================
// Custom metrics per module
// ============================================================
const browseDuration   = new Trend('browse_duration');
const cartDuration     = new Trend('cart_duration');
const wishlistDuration = new Trend('wishlist_duration');
const orderDuration    = new Trend('order_duration');
const reviewDuration   = new Trend('review_duration');

const orderCreated = new Counter('orders_created');
const ordersCancelled = new Counter('orders_cancelled');
const reviewsCreated  = new Counter('reviews_created');
const cartWrites      = new Counter('cart_writes');
const wishlistWrites  = new Counter('wishlist_writes');

// ============================================================
// Test configuration
// ============================================================
export const options = {
  scenarios: {
    // 40 VUs browsing products
    browse: {
      executor: 'ramping-vus',
      exec: 'browseScenario',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 40 },
        { duration: '1m',  target: 40 },
        { duration: '20s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    // 20 VUs doing cart operations
    cart: {
      executor: 'ramping-vus',
      exec: 'cartScenario',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 20 },
        { duration: '1m',  target: 20 },
        { duration: '20s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    // 15 VUs doing wishlist operations
    wishlist: {
      executor: 'ramping-vus',
      exec: 'wishlistScenario',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 15 },
        { duration: '1m',  target: 15 },
        { duration: '20s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    // 15 VUs placing + cancelling orders
    order: {
      executor: 'ramping-vus',
      exec: 'orderScenario',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 15 },
        { duration: '1m',  target: 15 },
        { duration: '20s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    // 10 VUs adding + reading reviews
    review: {
      executor: 'ramping-vus',
      exec: 'reviewScenario',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '1m',  target: 10 },
        { duration: '20s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration:  ['p(95)<1000'],  // 95% under 1s (writes are slower)
    http_req_failed:    ['rate<0.02'],   // <2% failures
    browse_duration:    ['p(95)<200'],   // cached reads are fast
    cart_duration:      ['p(95)<500'],
    wishlist_duration:  ['p(95)<500'],
    order_duration:     ['p(95)<1500'],
    review_duration:    ['p(95)<1000'],
  },
};

const BASE = 'http://localhost:3000/api';

// ============================================================
// SETUP — runs ONCE before the test
// ============================================================
export function setup() {
  const stamp = Date.now();

  // 1. Register + login an admin
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';
  loginUser(adminEmail, adminPassword); // sanity check

  // 2. Fetch available products
  const productsRes = http.get(`${BASE}/products`);
  const products = productsRes.json('products') || [];
  if (!products.length) {
    throw new Error('No products found. Create some before running this test.');
  }

  // 3. Register a vendor for the review scenario (must own a product)
  //    We'll use an existing product's vendor implicitly.

  // 4. Create pool of customer accounts for cart/wishlist/order scenarios
  const customerPool = [];
  const POOL_SIZE = 50; // 50 customers × ~3 VU reuse each
  for (let i = 0; i < POOL_SIZE; i++) {
    const email = `k6full_${stamp}_${i}@example.com`;
    const password = 'secret123';

    http.post(`${BASE}/auth/register`, JSON.stringify({
      name: `K6 Full ${i}`,
      email,
      password,
      phone: `900000${String(i).padStart(4, '0')}`,
    }), { headers: { 'Content-Type': 'application/json' } });

    customerPool.push({ email, password });
  }

  console.log(`✅ Setup complete: ${products.length} products, ${customerPool.length} customers`);

  return {
    products: products.map((p) => ({ _id: p._id, price: p.price, stock: p.stock })),
    customerPool,
  };
}

// ============================================================
// Helpers
// ============================================================
function loginUser(email, password) {
  // k6 has its own cookie jar per VU; we'll use jar via http.cookieJar()
  const res = http.post(`${BASE}/auth/login`, JSON.stringify({ email, password }), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status} ${res.body}`);
  }
  return res;
}

function pickProduct(products) {
  return products[Math.floor(Math.random() * products.length)];
}

function pickCustomer(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

// ============================================================
// SCENARIO 1 — Browse
// ============================================================
export function browseScenario(data) {
  group('browse', function () {
    const listRes = http.get(`${BASE}/products`);
    browseDuration.add(listRes.timings.duration);
    check(listRes, { 'list 200': (r) => r.status === 200 });

    const product = pickProduct(data.products);
    const detailRes = http.get(`${BASE}/products/${product._id}`);
    browseDuration.add(detailRes.timings.duration);
    check(detailRes, { 'detail 200': (r) => r.status === 200 });

    // Also fetch reviews (public, cached)
    const reviewRes = http.get(`${BASE}/reviews/${product._id}`);
    check(reviewRes, { 'reviews 200': (r) => r.status === 200 });
  });

  sleep(Math.random() * 1.5 + 0.5); // 0.5-2s
}

// ============================================================
// SCENARIO 2 — Cart
// ============================================================
export function cartScenario(data) {
  const customer = pickCustomer(data.customerPool);

  // Login as customer (fresh jar per iteration)
  const jar = http.cookieJar();
  jar.clear(BASE);
  loginUser(customer.email, customer.password);

  group('cart', function () {
    const product = pickProduct(data.products);

    // Add
    const addRes = http.post(
      `${BASE}/cart`,
      JSON.stringify({ productId: product._id, quantity: 1 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    cartDuration.add(addRes.timings.duration);
    cartWrites.add(1);
    check(addRes, { 'cart add 200': (r) => r.status === 200 });

    // Read
    const getRes = http.get(`${BASE}/cart`);
    cartDuration.add(getRes.timings.duration);
    check(getRes, { 'cart get 200': (r) => r.status === 200 });

    // Update
    const updateRes = http.put(
      `${BASE}/cart/${product._id}`,
      JSON.stringify({ quantity: 2 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    cartDuration.add(updateRes.timings.duration);
    check(updateRes, { 'cart update 200': (r) => r.status === 200 });

    // Remove
    const removeRes = http.del(`${BASE}/cart/${product._id}`);
    cartDuration.add(removeRes.timings.duration);
    check(removeRes, { 'cart remove 200': (r) => r.status === 200 });
  });

  sleep(Math.random() * 1 + 0.5);
}

// ============================================================
// SCENARIO 3 — Wishlist
// ============================================================
export function wishlistScenario(data) {
  const customer = pickCustomer(data.customerPool);

  const jar = http.cookieJar();
  jar.clear(BASE);
  loginUser(customer.email, customer.password);

  group('wishlist', function () {
    const product = pickProduct(data.products);

    // Toggle (add)
    const toggleRes = http.post(`${BASE}/wishlist/${product._id}`);
    wishlistDuration.add(toggleRes.timings.duration);
    wishlistWrites.add(1);
    check(toggleRes, { 'wishlist toggle 200': (r) => r.status === 200 });

    // Read
    const getRes = http.get(`${BASE}/wishlist`);
    wishlistDuration.add(getRes.timings.duration);
    check(getRes, { 'wishlist get 200': (r) => r.status === 200 });

    // Toggle back (remove)
    http.post(`${BASE}/wishlist/${product._id}`);
  });

  sleep(Math.random() * 1 + 0.5);
}

// ============================================================
// SCENARIO 4 — Orders (create + cancel)
// ============================================================
export function orderScenario(data) {
  const customer = pickCustomer(data.customerPool);

  const jar = http.cookieJar();
  jar.clear(BASE);
  loginUser(customer.email, customer.password);

  group('order', function () {
    const product = pickProduct(data.products);

    // Clear cart first
    http.del(`${BASE}/cart`);

    // Add to cart
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
          fullName: 'K6 Customer',
          phone: '9000000000',
          address: '123 K6 Street',
          city: 'Mumbai',
          state: 'MH',
          pincode: '400001',
        },
        paymentMethod: 'cod',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    orderDuration.add(orderRes.timings.duration);

    const success = check(orderRes, { 'order create 201': (r) => r.status === 201 });

    if (success) {
      orderCreated.add(1);
      const orderId = orderRes.json('order._id');

      // Read my orders
      const myRes = http.get(`${BASE}/orders/my`);
      check(myRes, { 'my orders 200': (r) => r.status === 200 });

      // Cancel the order immediately (restocks)
      const cancelRes = http.put(`${BASE}/orders/${orderId}/cancel`);
      orderDuration.add(cancelRes.timings.duration);
      const cancelled = check(cancelRes, { 'order cancel 200': (r) => r.status === 200 });
      if (cancelled) ordersCancelled.add(1);
    }
  });

  sleep(Math.random() * 2 + 1); // 1-3s
}

// ============================================================
// SCENARIO 5 — Reviews
// ============================================================
export function reviewScenario(data) {
  const customer = pickCustomer(data.customerPool);

  const jar = http.cookieJar();
  jar.clear(BASE);
  loginUser(customer.email, customer.password);

  group('review', function () {
    const product = pickProduct(data.products);

    // Public read of reviews
    const readRes = http.get(`${BASE}/reviews/${product._id}`);
    reviewDuration.add(readRes.timings.duration);
    check(readRes, { 'review read 200': (r) => r.status === 200 });

    // Try to add a review (may fail if user hasn't purchased — expected 403)
    const addRes = http.post(
      `${BASE}/reviews/${product._id}`,
      JSON.stringify({ rating: 5, comment: 'Great product!' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    reviewDuration.add(addRes.timings.duration);

    // We accept 201 (created) or 403 (not purchased) or 409 (already reviewed)
    check(addRes, {
      'review add 201|403|409': (r) => [201, 403, 409].includes(r.status),
    });

    if (addRes.status === 201) reviewsCreated.add(1);
  });

  sleep(Math.random() * 1.5 + 0.5);
}

// ============================================================
// TEARDOWN — runs ONCE after the test
// ============================================================
export function teardown(data) {
  console.log(`✅ Teardown: cleanup skipped (see notes about DB size)`);
  console.log(`   Products used: ${data.products.length}`);
  console.log(`   Customers created: ${data.customerPool.length}`);
}