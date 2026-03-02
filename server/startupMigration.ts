import { db } from "./db";
import { users, trips, userRoles } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const ADMIN_EMAIL = "saisong@gmail.com";

export async function runStartupMigration() {
  try {
    console.log("[startup-migration] checking admin role...");

    const adminUser = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);
    if (!adminUser.length) {
      console.log("[startup-migration] admin user not found, skipping");
      return;
    }

    const userId = adminUser[0].id;
    console.log("[startup-migration] found admin user:", userId);

    const existingAdminRole = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "admin")))
      .limit(1);

    if (!existingAdminRole.length) {
      const existingTrips = await db.select().from(trips).limit(1);
      const tripId = existingTrips.length ? existingTrips[0].id : null;

      await db.insert(userRoles).values({
        userId,
        role: "admin",
        tripId,
      });
      console.log("[startup-migration] created admin role for user:", userId);
    } else {
      console.log("[startup-migration] admin role already exists");
    }

    console.log("[startup-migration] complete");
  } catch (error) {
    console.error("[startup-migration] error:", error);
  }
}
