/**
 * Full End-to-End Backend Test Suite (FIXED)
 *
 * Uses SEPARATE accounts for each role so cross-role flows work cleanly:
 *   - vendor   → registers, requests vendor status, gets approved, creates products
 *   - customer → separate account, buys products, reviews them
 *   - delivery → created by admin
 *   - admin    → bootstrap account
 *
 * Usage:  node test-backend.js
 * Needs:  server running on http://localhost:3000, MongoDB running
 */

const BASE = "http://localhost:3000/api";

// ---------- colors ----------
const c = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};

let passed = 0;
let failed = 0;
const failures = [];

function log(m) {
  console.log(m);
}
function section(t) {
  log(`\n${c.cyan}${c.bold}══════════════════════════════════════════════════${c.reset}`);
  log(`${c.cyan}${c.bold}  ${t}${c.reset}`);
  log(`${c.cyan}${c.bold}══════════════════════════════════════════════════${c.reset}`);
}
function expect(actual, expected, label) {
  const ok = actual === expected;
  const sym = ok ? `${c.green}✔${c.reset}` : `${c.red}✘${c.reset}`;
  const det = ok ? "" : `${c.gray}(expected ${expected}, got ${actual})${c.reset}`;
  log(`  ${sym} ${label} ${det}`);
  if (ok) passed++;
  else {
    failed++;
    failures.push(`${label} → expected ${expected}, got ${actual}`);
  }
}
function expectTrue(cond, label) {
  const ok = !!cond;
  const sym = ok ? `${c.green}✔${c.reset}` : `${c.red}✘${c.reset}`;
  log(`  ${sym} ${label}`);
  if (ok) passed++;
  else {
    failed++;
    failures.push(label);
  }
}

// ---------- cookie jar ----------
function newJar() {
  return {};
}
function saveCookies(jar, res) {
  const setCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];
  for (const sc of setCookies) {
    const [pair] = sc.split(";");
    const [name, value] = pair.split("=");
    if (name && value !== undefined) jar[name.trim()] = value.trim();
  }
}
function cookieHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

// ---------- JSON request ----------
async function req(method, url, { body, jar } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (jar) {
    const ch = cookieHeader(jar);
    if (ch) headers["Cookie"] = ch;
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (jar) saveCookies(jar, res);
  let json = null;
  try {
    json = await res.json();
  } catch (_) {}
  return { status: res.status, body: json };
}

// ---------- multipart request ----------
async function reqMultipart(method, url, { fields = {}, files = [], jar } = {}) {
  const boundary = "----NodeTestBoundary" + Date.now();
  const chunks = [];

  for (const [key, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
      )
    );
  }
  for (const f of files) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${f.field}"; filename="${f.filename}"\r\nContent-Type: ${f.contentType}\r\n\r\n`
      )
    );
    chunks.push(f.buffer);
    chunks.push(Buffer.from("\r\n"));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));

  const body = Buffer.concat(chunks);
  const headers = {
    "Content-Type": `multipart/form-data; boundary=${boundary}`,
    "Content-Length": body.length,
  };
  if (jar) {
    const ch = cookieHeader(jar);
    if (ch) headers["Cookie"] = ch;
  }

  const res = await fetch(url, { method, headers, body });
  if (jar) saveCookies(jar, res);

  let json = null;
  try {
    json = await res.json();
  } catch (_) {}
  return { status: res.status, body: json };
}

// ---------- tiny 1x1 PNG / JPEG ----------
function makeTinyPng() {
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  return Buffer.from(base64, "base64");
}
function makeTinyJpeg() {
  const base64 =
    "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";
  return Buffer.from(base64, "base64");
}

// ============================================================
async function run() {
  log(`\n${c.bold}${c.yellow}🧪 Full Backend Test Suite${c.reset}`);
  log(`${c.gray}Target: ${BASE}${c.reset}`);

  const stamp = Date.now();
  const adminEmail = "admin@example.com";
  const adminPassword = "admin123";

  // ---------- three separate accounts ----------
  const vendorEmail = `vendor_${stamp}@example.com`;
  const vendorPass = "vendor123";

  const custEmail = `cust_${stamp}@example.com`;
  const custPass = "cust123";

  const delEmail = `del_${stamp}@example.com`;
  const delPass = "deliver123";

  // ---------- separate cookie jars per role ----------
  const adminJar = newJar();
  const vendorJar = newJar();
  const custJar = newJar();
  const delJar = newJar();

  // ==========================================================
  section("1. ADMIN LOGIN (bootstrap)");
  // ==========================================================
  let r = await req("POST", `${BASE}/auth/login`, {
    jar: adminJar,
    body: { email: adminEmail, password: adminPassword },
  });
  expect(r.status, 200, "Admin login → 200");
  expectTrue(r.body?.user?.role === "admin", "Admin role confirmed");

  // ==========================================================
  section("2. REGISTER VENDOR + CUSTOMER (two accounts)");
  // ==========================================================
  // 2a — Register vendor
  r = await req("POST", `${BASE}/auth/register`, {
    body: {
      name: "Test Vendor",
      email: vendorEmail,
      password: vendorPass,
      phone: "9000000010",
    },
  });
  expect(r.status, 201, "Register vendor → 201");

  // 2b — Register customer
  r = await req("POST", `${BASE}/auth/register`, {
    body: {
      name: "Test Customer",
      email: custEmail,
      password: custPass,
      phone: "9000000011",
    },
  });
  expect(r.status, 201, "Register customer → 201");

  // ==========================================================
  section("3. VENDOR REQUESTS VENDOR STATUS");
  // ==========================================================
  // Login vendor first
  r = await req("POST", `${BASE}/auth/login`, {
    jar: vendorJar,
    body: { email: vendorEmail, password: vendorPass },
  });
  expect(r.status, 200, "Vendor login (pre-approval) → 200");
  expectTrue(r.body?.user?.role === "user", "Still 'user' before approval");

  r = await req("POST", `${BASE}/auth/request-vendor`, {
    jar: vendorJar,
    body: {
      businessName: "E2E Vendor Store",
      businessAddress: "789 Vendor Ave, Mumbai 400001",
      businessPhone: "9000000010",
      reason: "E2E test vendor",
    },
  });
  expect(r.status, 200, "Request vendor → 200");
  expectTrue(r.body?.vendorRequestStatus === "pending", "Status = 'pending'");

  // ==========================================================
  section("4. ADMIN APPROVES VENDOR");
  // ==========================================================
  r = await req("GET", `${BASE}/admin/vendor-requests`, { jar: adminJar });
  expect(r.status, 200, "List pending → 200");

  const vendorRequest = r.body?.requests?.find((x) => x.email === vendorEmail);
  expectTrue(!!vendorRequest, "Found vendor's request");

  r = await req(
    "PUT",
    `${BASE}/admin/vendor-requests/${vendorRequest._id}/approve`,
    { jar: adminJar }
  );
  expect(r.status, 200, "Approve vendor → 200");
  expectTrue(r.body?.user?.role === "vendor", "Vendor promoted");

  // ==========================================================
  section("5. ADMIN CREATES DELIVERY BOY");
  // ==========================================================
  r = await req("POST", `${BASE}/admin/create-staff`, {
    jar: adminJar,
    body: {
      name: "Test Delivery",
      email: delEmail,
      password: delPass,
      phone: "9000000012",
      role: "delivery",
    },
  });
  expect(r.status, 201, "Create delivery → 201");
  expectTrue(r.body?.user?.role === "delivery", "Created as 'delivery'");

  const deliveryId = r.body?.user?.id;

  // ==========================================================
  section("6. VENDOR RE-LOGS IN (role upgraded)");
  // ==========================================================
  r = await req("POST", `${BASE}/auth/login`, {
    jar: vendorJar,
    body: { email: vendorEmail, password: vendorPass },
  });
  expect(r.status, 200, "Vendor login (post-approval) → 200");
  expectTrue(r.body?.user?.role === "vendor", "Role = 'vendor'");

  // ==========================================================
  section("7. VENDOR CREATES PRODUCT (2 images)");
  // ==========================================================
  const tinyPng = makeTinyPng();
  const tinyJpeg = makeTinyJpeg();

  r = await reqMultipart("POST", `${BASE}/products`, {
    jar: vendorJar,
    fields: {
      name: `E2E Product ${stamp}`,
      description: "A great test product for E2E",
      price: "500",
      stock: "10",
      category: "Testing",
    },
    files: [
      {
        field: "images",
        filename: "p1.png",
        contentType: "image/png",
        buffer: tinyPng,
      },
      {
        field: "images",
        filename: "p2.jpg",
        contentType: "image/jpeg",
        buffer: tinyJpeg,
      },
    ],
  });
  if (r.status !== 201) {
    log(`  ${c.gray}↳ body: ${JSON.stringify(r.body)}${c.reset}`);
  }
  expect(r.status, 201, "Create product → 201");
  expectTrue(
    Array.isArray(r.body?.product?.images) && r.body.product.images.length === 2,
    "Product has 2 images"
  );

  const productId = r.body?.product?._id;
  const firstImage = r.body?.product?.images?.[0];
  expectTrue(
    typeof firstImage?.url === "string" && firstImage.url.startsWith("http"),
    "Image has valid ImageKit URL"
  );
  log(`  ${c.gray}📸 ${firstImage?.url}${c.reset}`);

  // ==========================================================
  section("8. CUSTOMER LOGS IN + VIEWS PRODUCT");
  // ==========================================================
  r = await req("POST", `${BASE}/auth/login`, {
    jar: custJar,
    body: { email: custEmail, password: custPass },
  });
  expect(r.status, 200, "Customer login → 200");
  expectTrue(r.body?.user?.role === "user", "Customer role = 'user'");

  r = await req("GET", `${BASE}/products/${productId}`, { jar: custJar });
  expect(r.status, 200, "View product → 200");
  expectTrue(r.body?.product?.name?.startsWith("E2E Product"), "Correct product");

  // ==========================================================
  section("9. CUSTOMER ADDS TO CART");
  // ==========================================================
  r = await req("POST", `${BASE}/cart`, {
    jar: custJar,
    body: { productId, quantity: 2 },
  });
  if (r.status !== 200) {
    log(`  ${c.gray}↳ body: ${JSON.stringify(r.body)}${c.reset}`);
  }
  expect(r.status, 200, "Add to cart → 200");
  expectTrue(r.body?.cart?.items?.length === 1, "Cart has 1 item");
  expectTrue(r.body?.cart?.items?.[0]?.quantity === 2, "Quantity = 2");

  // ==========================================================
  section("10. CUSTOMER ADDS TO WISHLIST (toggle add + remove)");
  // ==========================================================
  r = await req("POST", `${BASE}/wishlist/${productId}`, { jar: custJar });
  expect(r.status, 200, "Toggle (add) → 200");
  expectTrue(r.body?.added === true, "added = true");
  expectTrue(r.body?.wishlist?.products?.length === 1, "1 product");

  r = await req("POST", `${BASE}/wishlist/${productId}`, { jar: custJar });
  expect(r.status, 200, "Toggle (remove) → 200");
  expectTrue(r.body?.added === false, "added = false");
  expectTrue(r.body?.wishlist?.products?.length === 0, "Wishlist empty");

  // Add back for the final check
  await req("POST", `${BASE}/wishlist/${productId}`, { jar: custJar });

  // ==========================================================
  section("11. CUSTOMER PLACES COD ORDER");
  // ==========================================================
  r = await req("POST", `${BASE}/orders`, {
    jar: custJar,
    body: {
      shippingAddress: {
        fullName: "Test Customer",
        phone: "9000000011",
        address: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
      paymentMethod: "cod",
    },
  });
  if (r.status !== 201) {
    log(`  ${c.gray}↳ body: ${JSON.stringify(r.body)}${c.reset}`);
  }
  expect(r.status, 201, "Create COD order → 201");

  const orderId = r.body?.order?._id;
  expectTrue(!!orderId, "Order has an ID");
  expectTrue(r.body?.order?.paymentMethod === "cod", "Payment = 'cod'");
  expectTrue(r.body?.order?.orderStatus === "placed", "Status = 'placed'");
  expectTrue(
    r.body?.order?.paymentStatus === "pending",
    "Payment status = 'pending'"
  );

  // Cart cleared
  r = await req("GET", `${BASE}/cart`, { jar: custJar });
  expectTrue(r.body?.cart?.items?.length === 0, "Cart cleared after order");

  // Stock decremented
  r = await req("GET", `${BASE}/products/${productId}`);
  expectTrue(r.body?.product?.stock === 8, "Stock 10 → 8");

  // ==========================================================
  section("12. ADMIN ASSIGNS DELIVERY");
  // ==========================================================
  r = await req("PUT", `${BASE}/admin/orders/${orderId}/assign`, {
    jar: adminJar,
    body: { deliveryBoyId: deliveryId },
  });
  if (r.status !== 200) {
    log(`  ${c.gray}↳ body: ${JSON.stringify(r.body)}${c.reset}`);
  }
  expect(r.status, 200, "Assign delivery → 200");
  expectTrue(r.body?.order?.orderStatus === "shipped", "Status → 'shipped'");

  // ==========================================================
  section("13. DELIVERY BOY LOGS IN + SEES ORDERS");
  // ==========================================================
  r = await req("POST", `${BASE}/auth/login`, {
    jar: delJar,
    body: { email: delEmail, password: delPass },
  });
  expect(r.status, 200, "Delivery login → 200");
  expectTrue(r.body?.user?.role === "delivery", "Role = 'delivery'");

  r = await req("GET", `${BASE}/delivery/orders`, { jar: delJar });
  expect(r.status, 200, "Get assigned orders → 200");
  expectTrue(r.body?.orders?.length === 1, "1 order assigned");

  // ==========================================================
  section("14. DELIVERY CONFIRMS COD + DELIVERS");
  // ==========================================================
  r = await req("PUT", `${BASE}/delivery/orders/${orderId}/confirm-cod`, {
    jar: delJar,
  });
  if (r.status !== 200) {
    log(`  ${c.gray}↳ body: ${JSON.stringify(r.body)}${c.reset}`);
  }
  expect(r.status, 200, "Confirm COD → 200");
  expectTrue(r.body?.order?.isPaid === true, "isPaid = true");
  expectTrue(
    r.body?.order?.paymentStatus === "paid",
    "Payment status = 'paid'"
  );

  r = await req("PUT", `${BASE}/delivery/orders/${orderId}/deliver`, {
    jar: delJar,
  });
  if (r.status !== 200) {
    log(`  ${c.gray}↳ body: ${JSON.stringify(r.body)}${c.reset}`);
  }
  expect(r.status, 200, "Mark delivered → 200");
  expectTrue(r.body?.order?.isDelivered === true, "isDelivered = true");
  expectTrue(
    r.body?.order?.orderStatus === "delivered",
    "Status = 'delivered'"
  );

  // ==========================================================
  section("15. CUSTOMER REVIEWS PRODUCT");
  // ==========================================================
  r = await req("POST", `${BASE}/reviews/${productId}`, {
    jar: custJar,
    body: { rating: 5, comment: "Excellent E2E product!" },
  });
  if (r.status !== 201) {
    log(`  ${c.gray}↳ body: ${JSON.stringify(r.body)}${c.reset}`);
  }
  expect(r.status, 201, "Add review → 201");

  const reviewId = r.body?.review?._id;
  expectTrue(!!reviewId, "Review created");

  r = await req("GET", `${BASE}/products/${productId}`);
  expectTrue(r.body?.product?.rating === 5, "Product rating = 5");
  expectTrue(r.body?.product?.numReviews === 1, "numReviews = 1");

  // ==========================================================
  section("16. DUPLICATE REVIEW BLOCKED");
  // ==========================================================
  r = await req("POST", `${BASE}/reviews/${productId}`, {
    jar: custJar,
    body: { rating: 3, comment: "Second attempt" },
  });
  expect(r.status, 409, "Duplicate review → 409");

  // ==========================================================
  section("17. VENDOR DASHBOARD");
  // ==========================================================
  r = await req("GET", `${BASE}/vendor/dashboard`, { jar: vendorJar });
  expect(r.status, 200, "Vendor dashboard → 200");
  expectTrue(r.body?.stats?.totalProducts >= 1, "Has products");
  expectTrue(
    r.body?.stats?.totalOrders >= 1,
    "Has orders (from customer)"
  );

  r = await req("GET", `${BASE}/vendor/orders`, { jar: vendorJar });
  expect(r.status, 200, "Vendor orders → 200");
  expectTrue(r.body?.orders?.length >= 1, "At least 1 order visible");

  r = await req("GET", `${BASE}/vendor/reviews`, { jar: vendorJar });
  expect(r.status, 200, "Vendor reviews → 200");
  expectTrue(r.body?.reviews?.length === 1, "1 review visible");

  // ==========================================================
  section("18. ADMIN SEES DELIVERED ORDER");
  // ==========================================================
  r = await req("GET", `${BASE}/admin/orders?status=delivered`, {
    jar: adminJar,
  });
  expect(r.status, 200, "Admin delivered orders → 200");
  expectTrue(
    r.body?.orders?.some((o) => o._id === orderId),
    "Our order is in delivered list"
  );

  // ==========================================================
  section("19. UPDATE REVIEW → RATING RECALCULATES");
  // ==========================================================
  r = await req("PUT", `${BASE}/reviews/${reviewId}`, {
    jar: custJar,
    body: { rating: 3, comment: "Updated: still good" },
  });
  if (r.status !== 200) {
    log(`  ${c.gray}↳ body: ${JSON.stringify(r.body)}${c.reset}`);
  }
  expect(r.status, 200, "Update review → 200");

  r = await req("GET", `${BASE}/products/${productId}`);
  expectTrue(r.body?.product?.rating === 3, "Rating updated to 3");

  // ==========================================================
  section("20. DELETE REVIEW → RATING RESETS");
  // ==========================================================
  r = await req("DELETE", `${BASE}/reviews/${reviewId}`, { jar: custJar });
  if (r.status !== 200) {
    log(`  ${c.gray}↳ body: ${JSON.stringify(r.body)}${c.reset}`);
  }
  expect(r.status, 200, "Delete review → 200");

  r = await req("GET", `${BASE}/products/${productId}`);
  expectTrue(r.body?.product?.rating === 0, "Rating reset to 0");
  expectTrue(r.body?.product?.numReviews === 0, "numReviews = 0");

  // ==========================================================
  section("21. NEGATIVE TESTS (role guards)");
  // ==========================================================
  // Customer blocked from admin
  r = await req("GET", `${BASE}/admin/users`, { jar: custJar });
  expect(r.status, 403, "Customer blocked from /admin/users → 403");

  // Customer blocked from vendor
  r = await req("GET", `${BASE}/vendor/dashboard`, { jar: custJar });
  expect(r.status, 403, "Customer blocked from /vendor/dashboard → 403");

  // Customer blocked from delivery
  r = await req("GET", `${BASE}/delivery/orders`, { jar: custJar });
  expect(r.status, 403, "Customer blocked from /delivery/orders → 403");

  // Public routes
  r = await req("GET", `${BASE}/products`);
  expect(r.status, 200, "Public product list → 200");

  // No-auth blocked from cart
  r = await req("GET", `${BASE}/cart`, { jar: newJar() });
  expect(r.status, 401, "Unauthenticated cart → 401");

  // ==========================================================
  section("22. CANCEL ORDER → STOCK RESTORES");
  // ==========================================================
  // Add to cart + place second order
  await req("POST", `${BASE}/cart`, {
    jar: custJar,
    body: { productId, quantity: 1 },
  });
  r = await req("POST", `${BASE}/orders`, {
    jar: custJar,
    body: {
      shippingAddress: {
        fullName: "Test Customer",
        phone: "9000000011",
        address: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
      paymentMethod: "cod",
    },
  });
  const order2Id = r.body?.order?._id;
  expectTrue(!!order2Id, "Second order created");

  const stockBefore = (await req("GET", `${BASE}/products/${productId}`)).body
    ?.product?.stock;

  r = await req("PUT", `${BASE}/orders/${order2Id}/cancel`, { jar: custJar });
  if (r.status !== 200) {
    log(`  ${c.gray}↳ body: ${JSON.stringify(r.body)}${c.reset}`);
  }
  expect(r.status, 200, "Cancel order → 200");
  expectTrue(
    r.body?.order?.orderStatus === "cancelled",
    "Status = 'cancelled'"
  );

  const stockAfter = (await req("GET", `${BASE}/products/${productId}`)).body
    ?.product?.stock;
  expectTrue(stockAfter === stockBefore + 1, "Stock restored after cancel");

  // ==========================================================
  section("📊 SUMMARY");
  // ==========================================================
  log(`  ${c.green}Passed: ${passed}${c.reset}`);
  log(`  ${c.red}Failed: ${failed}${c.reset}`);

  if (failures.length) {
    log(`\n${c.red}${c.bold}Failures:${c.reset}`);
    failures.forEach((f, i) => log(`  ${i + 1}. ${f}`));
  }

  log(
    `\n${
      failed === 0
        ? c.green + "✅ ALL TESTS PASSED"
        : c.red + "❌ SOME TESTS FAILED"
    }${c.reset}\n`
  );

  process.exit(failed === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error(`\n${c.red}💥 Fatal error:${c.reset}`, e);
  process.exit(1);
});