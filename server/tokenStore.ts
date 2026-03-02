import crypto from "crypto";
import { db } from "./db";
import { authTokens } from "@shared/schema";
import { eq, lt } from "drizzle-orm";

export const tokenStore = {
  async get(token: string): Promise<{ userId: string; expiresAt: Date } | undefined> {
    const [row] = await db.select().from(authTokens).where(eq(authTokens.token, token)).limit(1);
    if (!row) return undefined;
    return { userId: row.userId, expiresAt: row.expiresAt };
  },
  async set(token: string, data: { userId: string; expiresAt: Date }): Promise<void> {
    await db.insert(authTokens).values({
      token,
      userId: data.userId,
      expiresAt: data.expiresAt,
    }).onConflictDoUpdate({
      target: authTokens.token,
      set: { userId: data.userId, expiresAt: data.expiresAt },
    });
  },
  async delete(token: string): Promise<void> {
    await db.delete(authTokens).where(eq(authTokens.token, token));
  },
  async pruneExpired(): Promise<void> {
    await db.delete(authTokens).where(lt(authTokens.expiresAt, new Date()));
  },
};

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createAuthToken(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await tokenStore.set(token, { userId, expiresAt });
  return token;
}

setInterval(() => {
  tokenStore.pruneExpired().catch(console.error);
}, 60 * 60 * 1000);
