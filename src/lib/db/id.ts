import { randomBytes } from "node:crypto";

/**
 * Generate a cuid-like random id (25 chars, url-safe).
 */
export function createId(): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(12).toString("base64url").slice(0, 16);
  return `${timestamp}${random}`;
}
