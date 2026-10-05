/**
 * Cart + Wishlist Focused Test Suite
 *
 * Usage:  node test-cart-wishlist.js
 * Needs:  server running on http://localhost:3000, MongoDB running,
 *         at least one active product in the DB.
 *
 * The script auto-picks the first available product from /api/products.
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
function printBody(body) {
  log(`  ${c.gray}↳ body: ${JSON.stringify(body, null, 2).split("\n").join("\n          ")}${c.reset}`);
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

// ---------- request helper ----------
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

// ============================================================
async function run() {
  log(`\n${c.bold}${c.yellow}🧪 Cart + Wishlist Test Suite${c.reset}`);
  log(`${c.gray}Target: ${BASE}${c.reset}`);

  const stamp = Date.now();
  const email = `cartuser_${stamp}@example.com`;
  const password = "secret123";

  const jar = newJar();

  // ==========================================================
  // PRECHECK — server reachable + at least one product exists
  // ==========================================================
  section("0. PRECHECK");
  let r = await req("GET", `${BASE}/products?limit=1`);
  expect(r.status, 200, "Server reachable and /products responds");

  const product = r.body?.products?.[0];
  if (!product) {
    log(`\n${c.red}❌ No active product found in DB.${c.reset}`);
    log(`   Create one first (as a vendor), then re-run this test.`);
    process.exit(1);
  }
  expectTrue(!!product._id, "Picked a product");
  const productId = product._id;
  const originalStock = product.stock;
  log(`  ${c.gray}Product: ${product.name} (stock=${originalStock})${c.reset}`);

  // ==========================================================
  section("1. REGISTER + LOGIN A FRESH USER");
  // ==========================================================
  r = await req("POST", `${BASE}/auth/register`, {
    body: {
      name: "Cart Tester",
      email,
      password,
      phone: "9000000009",
    },
  });
  expect(r.status, 201, "Register → 201");

  r = await req("POST", `${BASE}/auth/login`, {
    jar,
    body: { email, password },
  });
  expect(r.status, 200, "Login → 200");
  expectTrue(r.body?.user?.role === "user", "Role = 'user'");
  expectTrue(!!jar.jwt, "Cookie set");

  // ==========================================================
  section("2. CART — GET (empty, auto-create)");
  // ==========================================================
  r = await req("GET", `${BASE}/cart`, { jar });
  expect(r.status, 200, "Get empty cart → 200");
  expectTrue(Array.isArray(r.body?.cart?.items), "Cart has items array");
  expectTrue(r.body?.cart?.items?.length === 0, "Cart is empty");

  // ==========================================================
  section("3. CART — ADD to cart");
  // ==========================================================
  r = await req("POST", `${BASE}/cart`, {
    jar,
    body: { productId, quantity: 2 },
  });
  if (r.status !== 200) printBody(r.body);
  expect(r.status, 200, "Add to cart → 200");
  expectTrue(r.body?.cart?.items?.length === 1, "Cart has 1 item");
  expectTrue(r.body?.cart?.items?.[0]?.quantity === 2, "Quantity = 2");
  expectTrue(
    r.body?.cart?.items?.[0]?.product?._id === productId,
    "Item is our product"
  );

  // ==========================================================
  section("4. CART — ADD same product (increments)");
  // ==========================================================
  r = await req("POST", `${BASE}/cart`, {
    jar,
    body: { productId, quantity: 1 },
  });
  expect(r.status, 200, "Add again → 200");
  expectTrue(r.body?.cart?.items?.length === 1, "Still 1 item (not duplicate)");
  expectTrue(r.body?.cart?.items?.[0]?.quantity === 3, "Quantity = 3");

  // ==========================================================
  section("5. CART — ADD with missing productId → 400");
  // ==========================================================
  r = await req("POST", `${BASE}/cart`, {
    jar,
    body: { quantity: 1 },
  });
  expect(r.status, 400, "Missing productId → 400");

  // ==========================================================
  section("6. CART — ADD with invalid productId → 404");
  // ==========================================================
  r = await req("POST", `${BASE}/cart`, {
    jar,
    body: { productId: "000000000000000000000000", quantity: 1 },
  });
  expect(r.status, 404, "Unknown product → 404");

  // ==========================================================
  section("7. CART — ADD more than stock → 400");
  // ==========================================================
  r = await req("POST", `${BASE}/cart`, {
    jar,
    body: { productId, quantity: 9999 },
  });
  expect(r.status, 400, "Over-stock → 400");

  // ==========================================================
  section("8. CART — UPDATE quantity");
  // ==========================================================
  r = await req("PUT", `${BASE}/cart/${productId}`, {
    jar,
    body: { quantity: 5 },
  });
  expect(r.status, 200, "Update qty → 200");
  expectTrue(r.body?.cart?.items?.[0]?.quantity === 5, "Quantity = 5");

  // ==========================================================
  section("9. CART — UPDATE qty < 1 → 400");
  // ==========================================================
  r = await req("PUT", `${BASE}/cart/${productId}`, {
    jar,
    body: { quantity: 0 },
  });
  expect(r.status, 400, "Qty 0 → 400");

  // ==========================================================
  section("10. CART — UPDATE qty > stock → 400");
  // ==========================================================
  r = await req("PUT", `${BASE}/cart/${productId}`, {
    jar,
    body: { quantity: 9999 },
  });
  expect(r.status, 400, "Over-stock update → 400");

  // ==========================================================
  section("11. CART — UPDATE unknown product → 404");
  // ==========================================================
  r = await req("PUT", `${BASE}/cart/000000000000000000000000`, {
    jar,
    body: { quantity: 1 },
  });
  expect(r.status, 404, "Update unknown product → 404");

  // ==========================================================
  section("12. CART — GET (persisted)");
  // ==========================================================
  r = await req("GET", `${BASE}/cart`, { jar });
  expect(r.status, 200, "Get cart → 200");
  expectTrue(r.body?.cart?.items?.length === 1, "Still 1 item");
  expectTrue(r.body?.cart?.items?.[0]?.quantity === 5, "Still qty = 5");

  // ==========================================================
  section("13. CART — REMOVE item");
  // ==========================================================
  r = await req("DELETE", `${BASE}/cart/${productId}`, { jar });
  expect(r.status, 200, "Remove item → 200");
  expectTrue(r.body?.cart?.items?.length === 0, "Cart empty after remove");

  // ==========================================================
  section("14. CART — CLEAR all");
  // ==========================================================
  await req("POST", `${BASE}/cart`, {
    jar,
    body: { productId, quantity: 2 },
  });
  r = await req("DELETE", `${BASE}/cart`, { jar });
  expect(r.status, 200, "Clear cart → 200");

  r = await req("GET", `${BASE}/cart`, { jar });
  expectTrue(r.body?.cart?.items?.length === 0, "Cart is empty after clear");

  // ==========================================================
  section("15. CART — protected routes without cookie → 401");
  // ==========================================================
  r = await req("GET", `${BASE}/cart`, { jar: newJar() });
  expect(r.status, 401, "GET /cart without auth → 401");
  r = await req("POST", `${BASE}/cart`, {
    jar: newJar(),
    body: { productId, quantity: 1 },
  });
  expect(r.status, 401, "POST /cart without auth → 401");

  // ==========================================================
  section("16. WISHLIST — GET (empty, auto-create)");
  // ==========================================================
  r = await req("GET", `${BASE}/wishlist`, { jar });
  expect(r.status, 200, "Get empty wishlist → 200");
  expectTrue(Array.isArray(r.body?.wishlist?.products), "products is array");
  expectTrue(r.body?.wishlist?.products?.length === 0, "Wishlist is empty");

  // ==========================================================
  section("17. WISHLIST — TOGGLE add");
  // ==========================================================
  r = await req("POST", `${BASE}/wishlist/${productId}`, { jar });
  if (r.status !== 200) printBody(r.body);
  expect(r.status, 200, "Toggle (add) → 200");
  expectTrue(r.body?.added === true, "added = true");
  expectTrue(r.body?.wishlist?.products?.length === 1, "1 product in wishlist");

  // ==========================================================
  section("18. WISHLIST — TOGGLE remove");
  // ==========================================================
  r = await req("POST", `${BASE}/wishlist/${productId}`, { jar });
  expect(r.status, 200, "Toggle (remove) → 200");
  expectTrue(r.body?.added === false, "added = false");
  expectTrue(r.body?.wishlist?.products?.length === 0, "Wishlist empty");

  // ==========================================================
  section("19. WISHLIST — TOGGLE unknown product → 404");
  // ==========================================================
  r = await req("POST", `${BASE}/wishlist/000000000000000000000000`, { jar });
  expect(r.status, 404, "Toggle unknown → 404");

  // ==========================================================
  section("20. WISHLIST — GET (persisted after add)");
  // ==========================================================
  await req("POST", `${BASE}/wishlist/${productId}`, { jar }); // add back
  r = await req("GET", `${BASE}/wishlist`, { jar });
  expect(r.status, 200, "Get wishlist → 200");
  expectTrue(r.body?.wishlist?.products?.length === 1, "1 product present");
  expectTrue(
    r.body?.wishlist?.products?.[0]?._id === productId,
    "Correct product id"
  );

  // ==========================================================
  section("21. WISHLIST — CLEAR");
  // ==========================================================
  r = await req("DELETE", `${BASE}/wishlist`, { jar });
  expect(r.status, 200, "Clear wishlist → 200");

  r = await req("GET", `${BASE}/wishlist`, { jar });
  expectTrue(r.body?.wishlist?.products?.length === 0, "Wishlist cleared");

  // ==========================================================
  section("22. WISHLIST — protected routes without cookie → 401");
  // ==========================================================
  r = await req("GET", `${BASE}/wishlist`, { jar: newJar() });
  expect(r.status, 401, "GET /wishlist without auth → 401");
  r = await req("POST", `${BASE}/wishlist/${productId}`, { jar: newJar() });
  expect(r.status, 401, "POST /wishlist without auth → 401");

  // ==========================================================
  section("23. CROSS-USER isolation");
  // ==========================================================
  // Create a second user
  const jar2 = newJar();
  const email2 = `cartuser2_${stamp}@example.com`;
  await req("POST", `${BASE}/auth/register`, {
    body: {
      name: "Cart Tester 2",
      email: email2,
      password,
      phone: "9000000008",
    },
  });
  await req("POST", `${BASE}/auth/login`, {
    jar: jar2,
    body: { email: email2, password },
  });

  // User 1 adds to cart
  await req("POST", `${BASE}/cart`, {
    jar,
    body: { productId, quantity: 2 },
  });

  // User 2's cart should be empty
  r = await req("GET", `${BASE}/cart`, { jar: jar2 });
  expectTrue(
    r.body?.cart?.items?.length === 0,
    "User 2's cart is empty (isolated from user 1)"
  );

  // User 1's cart should still have 2
  r = await req("GET", `${BASE}/cart`, { jar });
  expectTrue(
    r.body?.cart?.items?.length === 1 && r.body.cart.items[0].quantity === 2,
    "User 1's cart preserved"
  );

  // Cleanup: clear user 1's cart
  await req("DELETE", `${BASE}/cart`, { jar });

  // ==========================================================
  section("24. STOCK remains unchanged (cart does not affect stock)");
  // ==========================================================
  r = await req("GET", `${BASE}/products/${productId}`);
  expectTrue(
    r.body?.product?.stock === originalStock,
    `Stock unchanged (${r.body?.product?.stock} === ${originalStock})`
  );

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