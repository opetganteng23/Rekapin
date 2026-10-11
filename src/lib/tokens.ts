import { createHash, randomBytes } from "crypto";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 jam

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newResetToken() {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) };
}
