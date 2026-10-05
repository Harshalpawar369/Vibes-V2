/**
 * Full Auth Test Suite
 * Runs every /api/auth route for every role.
 *
 * Usage:  node test.js
 * Requires: server running on http://localhost:5000, MongoDB running.
 */

const BASE = "http://localhost:3000/api/auth";

// ---------- tiny color helpers ----------
const c = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};

// ---------- stats ----------
let passed = 0;
let failed = 0;
const failures = [];

// ---------- helpers ----------
function log(msg) {
  console.log(msg);
}

function section(title) {
  log(`\n${c.cyan}${c.bold}══════════════════════════════════════════════════════${c.reset}`);
  log(`${c.cyan}${c.bold}  ${title}${c.reset}`);
  log(`${c.cyan}${c.bold}══════════════════════════════════════════════════════${c.reset}`);
}

function expect(actual, expected, label) {
  const ok = actual === expected;
  const symbol = ok ? `${c.green}✔${c.reset}` : `${c.red}�’${c.reset}`;
  const detail = `${c.gray}(expected ${expected}, got ${actual})${c.reset}`;
  log(`  ${symbol} ${label} ${ok ? "" : detail}`);
  if (ok) passed++;
  else {
    failed++;
    failures.push(`${label} → expected ${expected}, got ${actual}`);
  }
}

function expectTrue(cond, label) {
  const ok = !!cond;
  const symbol = ok ? `${c.green}✔${c.reset}` : `${c.red}✘${c.reset}`;
  log(`  ${symbol} ${label}`);
  if (ok) passed++;
  else {
    failed++;
    failures.push(label);
  }
}

// ---------- cookie jar (per session) ----------
function newJar() {
  return {};
}

function saveCookies(jar, res) {
  // Node 18+ fetch: getSetCookie() returns array
  const setCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : res.headers.raw?.()["set-cookie"] || [];

  if (!setCookies || setCookies.length === 0) return;

  for (const sc of setCookies) {
    const [pair] = sc.split(";");
    const [name, value] = pair.split("=");
    if (name && value !== undefined) jar[name.trim()] = value.trim();
  }
}

function cookieHeader(jar) {
  const parts = Object.entries(jar).map(([k, v]) => `${k}=${v}`);
  return parts.length ? parts.join("; ") : "";
}

// ---------- request wrapper ----------
async function req(method, path, { body, jar } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (jar) {
    const ch = cookieHeader(jar);
    if (ch) headers["Cookie"] = ch;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (jar) saveCookies(jar, res);

  let json = null;
  try {
    json = await res.json();
  } catch (_) {
    /* no body */
  }

  return { status: res.status, body: json };
}

// ============================================================
// MAIN TEST RUN
// ============================================================
async function run() {
  log(`\n${c.bold}${c.yellow}🧪 Multivendor Auth Test Suite${c.reset}`);
  log(`${c.gray}Target: ${BASE}${c.reset}`);

  // Use unique emails so re-runs don't hit 409 (unless testing 409 itself)
  const stamp = Date.now();
  const testUserEmail = `user_${stamp}@example.com`;
  const testVendorEmail = `vendor_${stamp}@example.com`;
  const testDeliveryEmail = `delivery_${stamp}@example.com`;
  const testAdminEmail = `admin_${stamp}@example.com`;
  const password = "secret123";
  const adminPassword = "admin123";

  // Jars: one per role session
  const userJar = newJar();
  const vendorJar = newJar();
  const deliveryJar = newJar();
  const adminJar = newJar();
  const secondJar = newJar();

  // ==========================================================
  section("1. PUBLIC — REGISTER (only 'user' role allowed)");
  // ==========================================================

  // 1.1 register valid user
  let r = await req("POST", "/register", {
    body: {
      name: "Test User",
      email: testUserEmail,
      password,
      phone: "9000000001",
    },
  });
  expect(r.status, 201, "Register new user → 201");
  expectTrue(r.body?.user?.role === "user", "Registered user has role 'user'");

  // 1.2 duplicate email
  r = await req("POST", "/register", {
    body: {
      name: "Test User",
      email: testUserEmail,
      password,
      phone: "9000000001",
    },
  });
  expect(r.status, 409, "Register duplicate email → 409");

  // 1.3 missing fields
  r = await req("POST", "/register", {
    body: { email: `x_${stamp}@example.com` },
  });
  expect(r.status, 400, "Register missing fields → 400");

  // ==========================================================
  section("2. PUBLIC — LOGIN");
  // ==========================================================

  // 2.1 wrong password
  r = await req("POST", "/login", {
    body: { email: testUserEmail, password: "wrongpass" },
  });
  expect(r.status, 401, "Login wrong password → 401");

  // 2.2 unknown email
  r = await req("POST", "/login", {
    body: { email: "nobody@example.com", password: "x" },
  });
  expect(r.status, 401, "Login unknown email → 401");

  // 2.3 missing fields
  r = await req("POST", "/login", {
    body: { email: testUserEmail },
  });
  expect(r.status, 400, "Login missing password → 400");

  // 2.4 user login success
  r = await req("POST", "/login", {
    jar: userJar,
    body: { email: testUserEmail, password },
  });
  expect(r.status, 200, "User login correct → 200");
  expectTrue(r.body?.user?.role === "user", "Login returns role 'user'");
  expectTrue(!!userJar.jwt, "JWT cookie set for user");

  // ==========================================================
  section("3. PUBLIC — IS LOGGED IN");
  // ==========================================================

  // 3.1 without cookie
  r = await req("GET", "/is-logged-in", { jar: newJar() });
  expect(r.status, 200, "is-logged-in without cookie → 200");
  expect(r.body?.isLoggedIn, false, "is-logged-in returns false without cookie");

  // 3.2 with user cookie
  r = await req("GET", "/is-logged-in", { jar: userJar });
  expect(r.status, 200, "is-logged-in with user cookie → 200");
  expect(r.body?.isLoggedIn, true, "is-logged-in returns true with cookie");
  expectTrue(r.body?.user?.role === "user", "is-logged-in returns role 'user'");

  // ==========================================================
  section("4. PRIVATE — GET PROFILE");
  // ==========================================================

  // 4.1 no cookie
  r = await req("GET", "/profile", { jar: newJar() });
  expect(r.status, 401, "Get profile without cookie → 401");

  // 4.2 with user cookie
  r = await req("GET", "/profile", { jar: userJar });
  expect(r.status, 200, "Get profile with user cookie → 200");
  expectTrue(r.body?.user?.email === testUserEmail, "Profile returns correct email");

  // ==========================================================
  section("5. PRIVATE — UPDATE PROFILE");
  // ==========================================================

  // 5.1 no cookie
  r = await req("PUT", "/profile", {
    body: { name: "Hacker" },
    jar: newJar(),
  });
  expect(r.status, 401, "Update profile without cookie → 401");

  // 5.2 update name + phone
  r = await req("PUT", "/profile", {
    jar: userJar,
    body: { name: "Updated Name", phone: "9111111111" },
  });
  expect(r.status, 200, "Update profile name & phone → 200");
  expectTrue(r.body?.user?.name === "Updated Name", "Name updated correctly");
  expectTrue(r.body?.user?.phone === "9111111111", "Phone updated correctly");

  // 5.3 update email to taken email (register a second user first)
  await req("POST", "/register", {
    body: {
      name: "Second User",
      email: `second_${stamp}@example.com`,
      password,
      phone: "9222222222",
    },
  });
  r = await req("PUT", "/profile", {
    jar: userJar,
    body: { email: `second_${stamp}@example.com` },
  });
  expect(r.status, 409, "Update profile to taken email → 409");

  // ==========================================================
  section("6. ADMIN BOOTSTRAP LOGIN (admin@example.com / admin123)");
  // ==========================================================

  r = await req("POST", "/login", {
    jar: adminJar,
    body: { email: "admin@example.com", password: adminPassword },
  });
  expect(r.status, 200, "Bootstrap admin login → 200");
  expectTrue(r.body?.user?.role === "admin", "Bootstrap admin has role 'admin'");

  // ==========================================================
  section("7. ADMIN — CREATE ACCOUNT (vendor / delivery / admin)");
  // ==========================================================

  // 7.1 non-admin tries to create account → 403
  r = await req("POST", "/create-account", {
    jar: userJar,
    body: {
      name: "Fake Vendor",
      email: `fake_${stamp}@example.com`,
      password,
      phone: "9333333333",
      role: "vendor",
    },
  });
  expect(r.status, 403, "User cannot create account → 403");

  // 7.2 admin creates vendor
  r = await req("POST", "/create-account", {
    jar: adminJar,
    body: {
      name: "Test Vendor",
      email: testVendorEmail,
      password,
      phone: "9444444444",
      role: "vendor",
    },
  });
  expect(r.status, 201, "Admin creates vendor → 201");
  expectTrue(r.body?.user?.role === "vendor", "Created account has role 'vendor'");

  // 7.3 admin creates delivery
  r = await req("POST", "/create-account", {
    jar: adminJar,
    body: {
      name: "Test Delivery",
      email: testDeliveryEmail,
      password,
      phone: "9555555555",
      role: "delivery",
    },
  });
  expect(r.status, 201, "Admin creates delivery → 201");
  expectTrue(r.body?.user?.role === "delivery", "Created account has role 'delivery'");

  // 7.4 admin creates admin
  r = await req("POST", "/create-account", {
    jar: adminJar,
    body: {
      name: "Test Admin",
      email: testAdminEmail,
      password,
      phone: "9666666666",
      role: "admin",
    },
  });
  expect(r.status, 201, "Admin creates another admin → 201");
  expectTrue(r.body?.user?.role === "admin", "Created account has role 'admin'");

  // 7.5 invalid role
  r = await req("POST", "/create-account", {
    jar: adminJar,
    body: {
      name: "Bad Role",
      email: `bad_${stamp}@example.com`,
      password,
      phone: "9777777777",
      role: "superman",
    },
  });
  expect(r.status, 400, "Invalid role → 400");

  // 7.6 duplicate email
  r = await req("POST", "/create-account", {
    jar: adminJar,
    body: {
      name: "Duplicate Vendor",
      email: testVendorEmail,
      password,
      phone: "9888888888",
      role: "vendor",
    },
  });
  expect(r.status, 409, "Create duplicate email → 409");

  // ==========================================================
  section("8. VENDOR LOGIN + PROFILE FLOW");
  // ==========================================================

  r = await req("POST", "/login", {
    jar: vendorJar,
    body: { email: testVendorEmail, password },
  });
  expect(r.status, 200, "Vendor login → 200");
  expectTrue(r.body?.user?.role === "vendor", "Vendor login role correct");

  r = await req("GET", "/profile", { jar: vendorJar });
  expect(r.status, 200, "Vendor get profile → 200");
  expectTrue(r.body?.user?.role === "vendor", "Vendor profile role correct");

  r = await req("GET", "/is-logged-in", { jar: vendorJar });
  expect(r.status, 200, "Vendor is-logged-in → 200");
  expect(r.body?.isLoggedIn, true, "Vendor is-logged-in true");

  // ==========================================================
  section("9. DELIVERY LOGIN + PROFILE FLOW");
  // ==========================================================

  r = await req("POST", "/login", {
    jar: deliveryJar,
    body: { email: testDeliveryEmail, password },
  });
  expect(r.status, 200, "Delivery login → 200");
  expectTrue(r.body?.user?.role === "delivery", "Delivery login role correct");

  r = await req("GET", "/profile", { jar: deliveryJar });
  expect(r.status, 200, "Delivery get profile → 200");
  expectTrue(r.body?.user?.role === "delivery", "Delivery profile role correct");

  // ==========================================================
  section("10. SECOND ADMIN LOGIN (created by admin)");
  // ==========================================================

  r = await req("POST", "/login", {
    jar: secondJar,
    body: { email: testAdminEmail, password },
  });
  expect(r.status, 200, "Second admin login → 200");
  expectTrue(r.body?.user?.role === "admin", "Second admin role correct");

  // ==========================================================
  section("11. LOGOUT");
  // ==========================================================

  r = await req("POST", "/logout", { jar: vendorJar });
  expect(r.status, 200, "Vendor logout → 200");

  r = await req("GET", "/is-logged-in", { jar: vendorJar });
  expect(r.status, 200, "is-logged-in after logout → 200");
  expect(r.body?.isLoggedIn, false, "is-logged-in false after logout");

  // ==========================================================
  section("12. DELETE ACCOUNT (self)");
  // ==========================================================

  // 12.1 delete user profile
  r = await req("DELETE", "/profile", { jar: userJar });
  expect(r.status, 200, "User delete own profile → 200");

  // 12.2 verify user can no longer log in
  r = await req("POST", "/login", {
    body: { email: testUserEmail, password },
  });
  expect(r.status, 401, "Deleted user cannot log in → 401");

  // 12.3 delete vendor profile
  r = await req("POST", "/login", {
    jar: vendorJar,
    body: { email: testVendorEmail, password },
  });
  expect(r.status, 200, "Re-login vendor before delete → 200");

  r = await req("DELETE", "/profile", { jar: vendorJar });
  expect(r.status, 200, "Vendor delete own profile → 200");

  // 12.4 delivery delete
  r = await req("DELETE", "/profile", { jar: deliveryJar });
  expect(r.status, 200, "Delivery delete own profile → 200");

  // 12.5 second admin delete
  r = await req("DELETE", "/profile", { jar: secondJar });
  expect(r.status, 200, "Second admin delete own profile → 200");

  // 12.6 bootstrap admin — DO NOT DELETE (we need it for future tests)
  // Skipping on purpose.

  // ==========================================================
  // SUMMARY
  // ==========================================================
  section("📊 SUMMARY");
  log(`  ${c.green}Passed: ${passed}${c.reset}`);
  log(`  ${c.red}Failed: ${failed}${c.reset}`);

  if (failures.length) {
    log(`\n${c.red}${c.bold}Failures:${c.reset}`);
    failures.forEach((f, i) => log(`  ${i + 1}. ${f}`));
  }

  log(
    `\n${failed === 0 ? c.green + "✅ ALL TESTS PASSED" : c.red + "❌ SOME TESTS FAILED"}${c.reset}\n`
  );

  process.exit(failed === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error(`\n${c.red}💥 Fatal error:${c.reset}`, err);
  process.exit(1);
});