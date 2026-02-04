import { users } from "@shared/schema";
import type { User } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export type UpsertReplitUser = {
  replitId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
};

export interface IAuthStorage {
  getUserByReplitId(replitId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertReplitUser(userData: UpsertReplitUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUserByReplitId(replitId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.replitId, replitId));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertReplitUser(userData: UpsertReplitUser): Promise<User> {
    // First check if user exists by replitId
    const existingByReplitId = await this.getUserByReplitId(userData.replitId);
    if (existingByReplitId) {
      // Update existing user
      const [updated] = await db
        .update(users)
        .set({
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.replitId, userData.replitId))
        .returning();
      return updated;
    }

    // Check if user exists by email (for linking existing accounts)
    if (userData.email) {
      const existingByEmail = await this.getUserByEmail(userData.email);
      if (existingByEmail) {
        // Link existing account with Replit
        const [updated] = await db
          .update(users)
          .set({
            replitId: userData.replitId,
            firstName: userData.firstName || existingByEmail.firstName,
            lastName: userData.lastName || existingByEmail.lastName,
            profileImageUrl: userData.profileImageUrl || existingByEmail.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.email, userData.email))
          .returning();
        return updated;
      }
    }

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        email: userData.email || `replit-${userData.replitId}@temp.local`,
        replitId: userData.replitId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
      })
      .returning();
    return newUser;
  }
}

export const authStorage = new AuthStorage();
