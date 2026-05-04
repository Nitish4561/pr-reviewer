/**
 * sample-buggy-code.js
 *
 * ⚠️  DELIBERATELY BUGGY — do not import from production code.
 *
 * 25 intentional bugs spanning HIGH / MEDIUM / LOW severity.
 * Add this file in a PR to test NirikshanAI's review pipeline end-to-end.
 */

import crypto from "crypto";
import fs from "fs";

// ─────────────────────────────────────────────────────────────────────────────
// 🔴 HIGH — Security / Correctness (will break or be exploited in production)
// ─────────────────────────────────────────────────────────────────────────────

// BUG 1: Hardcoded secret key committed to source control
const STRIPE_SECRET = "sk_live_51HxxxxxxxxxxxxxxxxxxxABCD1234";
const JWT_SECRET    = "supersecret123";

// BUG 2: MD5 used for password hashing (cryptographically broken)
export function hashPassword(password) {
  return crypto.createHash("md5").update(password).digest("hex");
}

// BUG 3: SQL injection — user input concatenated directly into query string
export async function getUserByEmail(db, email) {
  const sql = "SELECT * FROM users WHERE email = '" + email + "'";
  return db.query(sql);
}

// BUG 4: eval() on untrusted user input — remote code execution
export function runExpression(expr) {
  return eval(expr);
}

// BUG 5: unawaited async call — payment errors are silently swallowed
export async function chargeUser(stripe, customerId, cents) {
  stripe.charges.create({ customer: customerId, amount: cents, currency: "usd" });
  return { charged: true };
}

// BUG 6: path traversal — user-supplied filename not sanitised
export function readUserFile(username) {
  return fs.readFileSync("/uploads/" + username);
}

// BUG 7: sensitive data (token + password hash) written to log
export function logLogin(user, token) {
  console.log("LOGIN", user.email, "token:", token, "hash:", user.passwordHash);
}

// BUG 8: timing-unsafe comparison for secret tokens (vulnerable to timing attack)
export function validateToken(incoming, stored) {
  return incoming === stored;
}

// ─────────────────────────────────────────────────────────────────────────────
// 🟠 MEDIUM — Bugs that cause incorrect behaviour or resource leaks
// ─────────────────────────────────────────────────────────────────────────────

// BUG 9: catch block silently swallows the error — callers never know it failed
export async function fetchConfig(url) {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (e) {
    // ignored
  }
}

// BUG 10: == instead of === — "1" == 1 is true, causes privilege escalation
export function isAdmin(user) {
  return user.role == 1;
}

// BUG 11: setInterval never cleared — handler and closure leak on every call
export function startHeartbeat(send) {
  setInterval(() => send({ type: "ping", ts: Date.now() }), 5000);
}

// BUG 12: property chain accessed without null guards — throws on missing address
export function getCity(user) {
  return user.address.city.toUpperCase();
}

// BUG 13: off-by-one — last element is never processed
export function sumPrices(items) {
  let total = 0;
  for (let i = 0; i < items.length - 1; i++) {
    total += items[i].price;
  }
  return total;
}

// BUG 14: async function not awaited at call site — result is always a Promise
export async function getUser(db, id) {
  return db.users.findById(id);
}
export function renderProfile(db, id) {
  const user = getUser(db, id); // missing await
  return `<h1>${user.name}</h1>`;
}

// BUG 15: object mutated inside a function — caller's object is changed unexpectedly
export function applyDiscount(order, pct) {
  order.total = order.total * (1 - pct / 100); // mutates the original
  return order;
}

// BUG 16: Promise.all fails fast — one rejection kills all in-flight requests
export async function loadDashboard(userId) {
  const [profile, orders, invoices] = await Promise.all([
    fetchProfile(userId),
    fetchOrders(userId),
    fetchInvoices(userId), // if this throws, profile and orders are lost too
  ]);
  return { profile, orders, invoices };
}

// BUG 17: regex with no anchors — "notanemail@" passes validation
export function isValidEmail(email) {
  return /\S+@\S+/.test(email);
}

// ─────────────────────────────────────────────────────────────────────────────
// 🟡 LOW — Code quality, maintainability, and style issues
// ─────────────────────────────────────────────────────────────────────────────

// BUG 18: magic numbers with no explanation
export function isSessionExpired(timestampMs) {
  return Date.now() - timestampMs > 86400000 * 7;
}

// BUG 19: dead code — unused parameter and unreachable variable
export function formatName(first, last, middle) {
  const unused = "never read";
  return first + " " + last;
}

// BUG 20: shadowed loop variable — var i re-declared inside the loop body
export function calcTotal(items) {
  let sum = 0;
  for (var i = 0; i < items.length; i++) {
    var i = items[i].price; // shadows the loop counter → infinite or broken loop
    sum += i;
  }
  return sum;
}

// BUG 21: inconsistent naming — snake_case mixed with camelCase in same file
export function get_user_name(userObject) {
  return userObject.firstName + " " + userObject.lastName;
}

// BUG 22: function violates single-responsibility — saves AND sends email
export function saveUser(db, mailer, user) {
  db.users.insert(user);
  mailer.send(user.email, "Welcome!", "Hello " + user.name);
  return true;
}

// BUG 23: incorrect default parameter — object default is shared across calls
export function createItem(name, meta = {}) {
  meta.createdAt = Date.now(); // mutates the shared default object
  return { name, meta };
}

// BUG 24: floating-point arithmetic used for money — rounding errors guaranteed
export function applyTax(price, taxRate) {
  return price * (1 + taxRate / 100); // use integer cents + Math.round instead
}

// BUG 25: recursive function with no base-case depth limit — stack overflow on deep input
export function deepClone(obj) {
  if (typeof obj !== "object" || obj === null) return obj;
  const copy = {};
  for (const key of Object.keys(obj)) {
    copy[key] = deepClone(obj[key]); // unbounded recursion on circular refs
  }
  return copy;
}
