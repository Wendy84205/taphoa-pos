import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (compact.startsWith("+84")) return `0${compact.slice(3)}`;
  return compact;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) return false;
  const [salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function validatePhone(value: string) {
  return /^0\d{9,10}$/.test(normalizePhone(value));
}

export function validatePassword(value: string) {
  return value.length >= 8;
}

export function credentialsOpenId(kind: "email" | "phone", identifier: string) {
  return `credentials:${kind}:${identifier}`;
}
