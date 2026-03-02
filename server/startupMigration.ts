import { db } from "./db";
import { users, trips, userRoles } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const ADMIN_EMAIL = "saisong@gmail.com";

const SEED_TRIPS = [
  {
    id: "15ef1f1f-fdb2-40fc-80ac-513107dd9995",
    title: "2026 土耳其希臘朝聖之旅",
    destination: "土耳其 · 希臘",
    startDate: "2026-03-13",
    endDate: "2026-03-28",
  },
  {
    id: "166632d9-70ab-4384-b657-2059b332b7e4",
    title: "2026 五天四夜 日本",
    destination: "日本",
    startDate: "2026-04-12",
    endDate: "2026-04-23",
  },
];

export async function runStartupMigration() {
  try {
    console.log("[startup-migration] checking admin role and trip data...");

    const adminUser = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);
    if (!adminUser.length) {
      console.log("[startup-migration] admin user not found, skipping");
      return;
    }

    const userId = adminUser[0].id;
    console.log("[startup-migration] found admin user:", userId);

    for (const tripData of SEED_TRIPS) {
      const existingTrip = await db.select().from(trips).where(eq(trips.id, tripData.id)).limit(1);
      if (!existingTrip.length) {
        await db.insert(trips).values(tripData);
        console.log("[startup-migration] created trip:", tripData.title);
      }
    }

    const existingAdminRole = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "admin")))
      .limit(1);

    if (!existingAdminRole.length) {
      await db.insert(userRoles).values({
        userId,
        role: "admin",
        tripId: SEED_TRIPS[0].id,
      });
      console.log("[startup-migration] created admin role for user:", userId);
    } else {
      console.log("[startup-migration] admin role already exists");
    }

    const existingMemberRole = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "member")))
      .limit(1);

    if (!existingMemberRole.length) {
      await db.insert(userRoles).values({
        userId,
        role: "member",
        tripId: SEED_TRIPS[0].id,
      });
      console.log("[startup-migration] created member role for user:", userId);
    }

    console.log("[startup-migration] complete");
  } catch (error) {
    console.error("[startup-migration] error:", error);
  }
}
