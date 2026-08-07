import crypto from "node:crypto";

// ===== تشفير كلمة السر (scrypt) =====
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string" || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const test = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(test, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ===== جلسات اللوحة (توكن) =====
const sessions = new Map(); // token -> expiry (ms)

export function createToken() {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 أيام
  return token;
}

export function isValidToken(token) {
  if (!token) return false;
  const expiry = sessions.get(token);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function revokeToken(token) {
  sessions.delete(token);
}
