import { createHash, randomBytes } from "crypto";

const HOUR_MS = 60 * 60 * 1000;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** ttlHours: 1 jam untuk reset password, lebih lama untuk undangan. */
export function newResetToken(ttlHours = 1) {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashToken(token), expiresAt: new Date(Date.now() + ttlHours * HOUR_MS) };
}
