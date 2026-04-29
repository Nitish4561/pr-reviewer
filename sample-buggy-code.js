/**
 * sample-buggy-code.js
 *
 * ⚠️  DELIBERATELY BUGGY — do not import this file from production code.
 *
 * This file exists only to give NirikshanAI something to flag when opening a
 * test PR. It contains a mix of HIGH / MEDIUM / LOW severity issues spanning
 * security, correctness, and style. Each problem is intentional.
 */

import crypto from "crypto";

// 🔴 HIGH — hardcoded secret committed to source control
const STRIPE_SECRET_KEY = "sk_live_51HxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxABCD";
const ADMIN_PASSWORD = "admin123";

// 🔴 HIGH — using a broken / weak hash for password storage
export function hashPassword(password) {
  return crypto.createHash("md5").update(password).digest("hex");
}

// 🔴 HIGH — SQL injection: query is built via string concatenation with user input
export async function findUserByEmail(db, email) {
  const sql = "SELECT * FROM users WHERE email = '" + email + "'";
  return db.query(sql);
}

// 🔴 HIGH — eval on untrusted input (RCE)
export function runUserExpression(expr) {
  return eval(expr);
}

// 🔴 HIGH — async function called without await; failures swallowed silently
export async function chargeCustomer(stripe, customerId, amountCents) {
  stripe.charges.create({
    customer: customerId,
    amount: amountCents,
    currency: "usd",
  });
  return { ok: true };
}

// 🟠 MEDIUM — unhandled promise rejection (catch swallows the error)
export async function loadConfig(fetch, url) {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (e) {
    // ignored
  }
}

// 🟠 MEDIUM — using == instead of ===, plus implicit type coercion footgun
export function isAdmin(user) {
  if (user.role == 1) {
    return true;
  }
  return false;
}

// 🟠 MEDIUM — sensitive data being logged
export function login(user, token) {
  console.log("User logged in:", user.email, "token:", token, "pwHash:", user.passwordHash);
}

// 🟠 MEDIUM — setInterval is never cleared → memory / handler leak
export function startHeartbeat(send) {
  setInterval(() => {
    send({ type: "ping", at: Date.now() });
  }, 5000);
}

// 🟠 MEDIUM — accessing properties on a value that may be null/undefined
export function getCity(user) {
  return user.address.city.toUpperCase();
}

// 🟡 LOW — magic numbers, no constants
export function isExpired(timestampMs) {
  return Date.now() - timestampMs > 86400000 * 7;
}

// 🟡 LOW — unused parameter / dead code
export function formatName(first, last, middle) {
  const fullName = first + " " + last;
  const unused = "this is never read";
  return fullName;
}

// 🟡 LOW — inconsistent naming + shadowed variable
export function calculate_total(items) {
  let Total = 0;
  for (var i = 0; i < items.length; i++) {
    var i = items[i].price; // shadows the loop counter
    Total += i;
  }
  return Total;
}

// 🟡 LOW — function does two unrelated things; poor cohesion
export function saveAndEmail(db, mailer, user) {
  db.users.insert(user);
  mailer.send(user.email, "Welcome!", "Hello " + user.name);
  return true;
}
