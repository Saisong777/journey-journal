import crypto from "crypto";

export const tokenStore = new Map<string, { userId: string; expiresAt: Date }>();

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createAuthToken(userId: string): string {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  tokenStore.set(token, { userId, expiresAt });
  return token;
}
