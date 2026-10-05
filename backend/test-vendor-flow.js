/**
 * Vendor Onboarding Flow Test
 * Tests: register → request-vendor → admin approves → vendor creates product
 *
 * Usage:  node test-vendor-flow.js
 * Needs:  server running on http://localhost:3000, MongoDB running
 */

const fs = require("fs");
const path = require("path");

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

// ---------- request helper (JSON) ----------
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

// ---------- multipart helper (for product image upload) ----------
async function reqMultipart(method, url, { fields = {}, files = [], jar } = {}) {
  const boundary = "----BrunoTestBoundary" + Date.now();
  const chunks = [];

  // text fields
  for (const [key, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
      )
    );
  }

  // files
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

  const bodyBuffer = Buffer.concat(chunks);

  const headers = {
    "Content-Type": `multipart/form-data; boundary=${boundary}`,
    "Content-Length": bodyBuffer.length,
  };

  if (jar) {
    const ch = cookieHeader(jar);
    if (ch) headers["Cookie"] = ch;
  }

  const res = await fetch(url, { method, headers, body: bodyBuffer });

  if (jar) saveCookies(jar, res);

  let json = null;
  try {
    json = await res.json();
  } catch (_) {}

  return { status: res.status, body: json };
}

// ---------- make a tiny fake image buffer (1x1 PNG) ----------
function makeTinyPng() {
  // 1x1 red PNG, base64-encoded
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  return Buffer.from(base64, "base64");
}

// ============================================================
// MAIN
// ============================================================
async function run() {
  log(`\n${c.bold}${c.yellow}🧪 Vendor Onboarding + Product Upload Test${c.reset}`);
  log(`${c.gray}Target: ${BASE}${c.reset}`);

  const stamp = Date.now();
  const customerEmail = `customer_${stamp}@example.com`;
  const password = "secret123";

  const customerJar = newJar();
  const adminJar = newJar();

  // ==========================================================
  section("1. Register customer");
  // ==========================================================
  let r = await req("POST", `${BASE}/auth/register`, {
    body: {
      name: "Test Customer",
      email: customerEmail,
      password,
      phone: "9000000001",
    },
  });
  expect(r.status, 201, "Register customer → 201");
  expectTrue(r.body?.user?.role === "user", "Registered with role 'user'");

  // ==========================================================
  section("2. Login as customer");
  // ==========================================================
  r = await req("POST", `${BASE}/auth/login`, {
    jar: customerJar,
    body: { email: customerEmail, password },
  });
  expect(r.status, 200, "Customer login → 200");
  expectTrue(r.body?.user?.role === "user", "Customer role confirmed");

  // ==========================================================
  section("3. Request vendor status");
  // ==========================================================
  r = await req("POST", `${BASE}/auth/request-vendor`, {
    jar: customerJar,
    body: {
      businessName: "Test Electronics Store",
      businessAddress: "123 Test Street, Mumbai, MH 400001",
      businessPhone: "9876543210",
      reason: "I sell phone accessories and want to expand online",
    },
  });
  expect(r.status, 200, "Request vendor → 200");
  expectTrue(
    r.body?.vendorRequestStatus === "pending",
    "Status set to 'pending'"
  );

  // ==========================================================
  section("4. Check vendor request status (customer)");
  // ==========================================================
  r = await req("GET", `${BASE}/auth/vendor-request-status`, {
    jar: customerJar,
  });
  expect(r.status, 200, "Get vendor-request-status → 200");
  expectTrue(
    r.body?.vendorRequestStatus === "pending",
    "Status shows 'pending'"
  );

  // ==========================================================
  section("5. Login as admin");
  // ==========================================================
  r = await req("POST", `${BASE}/auth/login`, {
    jar: adminJar,
    body: { email: "admin@example.com", password: "admin123" },
  });
  expect(r.status, 200, "Admin login → 200");
  expectTrue(r.body?.user?.role === "admin", "Admin role confirmed");

  // ==========================================================
  section("6. Admin lists pending vendor requests");
  // ==========================================================
  r = await req("GET", `${BASE}/admin/vendor-requests`, { jar: adminJar });
  expect(r.status, 200, "Get pending requests → 200");
  expectTrue(
    Array.isArray(r.body?.requests) && r.body.requests.length >= 1,
    "At least one pending request"
  );

  const ourRequest = r.body?.requests?.find(
    (x) => x.email === customerEmail
  );
  expectTrue(!!ourRequest, "Our customer's request is in the list");
  const requestUserId = ourRequest?._id;
  expectTrue(!!requestUserId, "Request has a user ID");

  // ==========================================================
  section("7. Admin approves the vendor request");
  // ==========================================================
  r = await req(
    "PUT",
    `${BASE}/admin/vendor-requests/${requestUserId}/approve`,
    { jar: adminJar }
  );
  expect(r.status, 200, "Approve request → 200");
  expectTrue(
    r.body?.user?.role === "vendor",
    "User role upgraded to 'vendor'"
  );
  expectTrue(
    r.body?.user?.vendorRequestStatus === "approved",
    "vendorRequestStatus = 'approved'"
  );

  // ==========================================================
  section("8. Vendor can now log in");
  // ==========================================================
  // Logout customer first to be safe
  await req("POST", `${BASE}/auth/logout`, { jar: customerJar });

  r = await req("POST", `${BASE}/auth/login`, {
    jar: customerJar,
    body: { email: customerEmail, password },
  });
  expect(r.status, 200, "Vendor login → 200");
  expectTrue(r.body?.user?.role === "vendor", "Role is now 'vendor'");

  // ==========================================================
  section("9. Vendor creates a product (with 2 images)");
  // ==========================================================
  const tinyPng = makeTinyPng();

  r = await reqMultipart("POST", `${BASE}/products`, {
    jar: customerJar,
    fields: {
      name: "Test iPhone Case",
      description: "A sturdy case for iPhone 15 Pro",
      price: "999",
      stock: "25",
      category: "Accessories",
    },
    files: [
      {
        field: "images",
        filename: "case1.png",
        contentType: "image/png",
        buffer: tinyPng,
      },
      {
        field: "images",
        filename: "case2.png",
        contentType: "image/png",
        buffer: tinyPng,
      },
    ],
  });

  if (r.status === 201) {
    expect(r.status, 201, "Create product → 201");
    expectTrue(
      Array.isArray(r.body?.product?.images) &&
        r.body.product.images.length === 2,
      "Product has 2 images uploaded to ImageKit"
    );
    if (r.body?.product?.images?.length) {
      const firstImage = r.body.product.images[0];
      expectTrue(
        typeof firstImage.url === "string" &&
          firstImage.url.startsWith("http"),
        "First image has a valid URL"
      );
      expectTrue(
        typeof firstImage.fileId === "string" && firstImage.fileId.length > 0,
        "First image has a fileId (for deletion)"
      );

      log(`\n  ${c.gray}📸 Sample ImageKit URL:${c.reset}`);
      log(`  ${c.gray}${firstImage.url}${c.reset}`);
      log(`  ${c.gray}🔑 fileId: ${firstImage.fileId}${c.reset}\n`);
    }
  } else {
    // Likely an ImageKit config error — report the exact body
    expect(r.status, 201, "Create product → 201");
    log(
      `\n  ${c.red}Response body:${c.reset} ${JSON.stringify(
        r.body,
        null,
        2
      )}\n`
    );
    log(
      `  ${c.yellow}⚠️  If the error mentions ImageKit, check your .env keys.${c.reset}\n`
    );
  }

  // ==========================================================
  section("10. Customer cannot request again while pending/approved");
  // ==========================================================
  r = await req("POST", `${BASE}/auth/request-vendor`, {
    jar: customerJar,
    body: {
      businessName: "Another Shop",
      businessAddress: "Different Address",
      businessPhone: "1111111111",
    },
  });
  expect(
    r.status,
    400,
    "Vendor re-request after approval → 400 (already a vendor)"
  );

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