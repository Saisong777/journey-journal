import { pgTable, text, uuid, date, timestamp, doublePrecision, pgEnum, integer, boolean, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const appRoleEnum = pgEnum("app_role", ["admin", "leader", "guide", "member"]);

export const platformRoleEnum = pgEnum("platform_role", ["super_admin", "management", "guide", "vip", "member"]);

export const trips = pgTable("trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  destination: text("destination").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  coverImageUrl: text("cover_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tripDays = pgTable("trip_days", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  dayNo: integer("day_no").notNull(),
  date: date("date").notNull(),
  cityArea: text("city_area"),
  title: text("title"),
  highlights: text("highlights"),
  attractions: text("attractions"),
  bibleRefs: text("bible_refs"),
  breakfast: text("breakfast"),
  lunch: text("lunch"),
  dinner: text("dinner"),
  lodging: text("lodging"),
  lodgingLevel: text("lodging_level"),
  transport: text("transport"),
  freeTimeFlag: boolean("free_time_flag").default(false),
  shoppingFlag: boolean("shopping_flag").default(false),
  mustKnow: text("must_know"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  tempPassword: text("temp_password"),
  replitId: text("replit_id").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "set null" }),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  dietaryRestrictions: text("dietary_restrictions"),
  medicalNotes: text("medical_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: appRoleEnum("role").default("member").notNull(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }),
});

export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  content: text("content"),
  location: text("location"),
  entryDate: date("entry_date").defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const journalPhotos = pgTable("journal_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  journalEntryId: uuid("journal_entry_id").references(() => journalEntries.id, { onDelete: "cascade" }).notNull(),
  photoUrl: text("photo_url").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userLocations = pgTable("user_locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const devotionalEntries = pgTable("devotional_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  scriptureReference: text("scripture_reference").notNull(),
  reflection: text("reflection"),
  prayer: text("prayer"),
  entryDate: date("entry_date").defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const attractionFavorites = pgTable("attraction_favorites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  attractionId: text("attraction_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const devotionalCourses = pgTable("devotional_courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  dayNo: integer("day_no"),
  title: text("title").notNull(),
  scripture: text("scripture"),
  reflection: text("reflection"),
  action: text("action"),
  prayer: text("prayer"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tripInvitations = pgTable("trip_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTripSchema = createInsertSchema(trips).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTripDaySchema = createInsertSchema(tripDays).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
export const insertUserRoleSchema = createInsertSchema(userRoles).omit({ id: true });
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertJournalPhotoSchema = createInsertSchema(journalPhotos).omit({ id: true, createdAt: true });
export const insertDevotionalEntrySchema = createInsertSchema(devotionalEntries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAttractionFavoriteSchema = createInsertSchema(attractionFavorites).omit({ id: true, createdAt: true });
export const insertDevotionalCourseSchema = createInsertSchema(devotionalCourses).omit({ id: true, createdAt: true, updatedAt: true });
export const eveningReflections = pgTable("evening_reflections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  gratitude: text("gratitude"),
  highlight: text("highlight"),
  prayerForTomorrow: text("prayer_for_tomorrow"),
  entryDate: date("entry_date").defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const authTokens = pgTable("auth_tokens", {
  token: varchar("token", { length: 128 }).primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const platformRoles = pgTable("platform_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  role: platformRoleEnum("role").default("member").notNull(),
  permissions: jsonb("permissions").$type<Record<string, boolean>>(),
  assignedBy: uuid("assigned_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertTripInvitationSchema = createInsertSchema(tripInvitations).omit({ id: true, createdAt: true, usedCount: true });
export const insertEveningReflectionSchema = createInsertSchema(eveningReflections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPlatformRoleSchema = createInsertSchema(platformRoles).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type InsertTripDay = z.infer<typeof insertTripDaySchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type InsertJournalPhoto = z.infer<typeof insertJournalPhotoSchema>;
export type InsertDevotionalEntry = z.infer<typeof insertDevotionalEntrySchema>;
export type InsertAttractionFavorite = z.infer<typeof insertAttractionFavoriteSchema>;
export type InsertDevotionalCourse = z.infer<typeof insertDevotionalCourseSchema>;
export type InsertTripInvitation = z.infer<typeof insertTripInvitationSchema>;
export type InsertEveningReflection = z.infer<typeof insertEveningReflectionSchema>;
export type InsertPlatformRole = z.infer<typeof insertPlatformRoleSchema>;

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type TripDay = typeof tripDays.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type JournalPhoto = typeof journalPhotos.$inferSelect;
export type DevotionalEntry = typeof devotionalEntries.$inferSelect;
export type AttractionFavorite = typeof attractionFavorites.$inferSelect;
export type UserLocation = typeof userLocations.$inferSelect;
export type DevotionalCourse = typeof devotionalCourses.$inferSelect;
export type TripInvitation = typeof tripInvitations.$inferSelect;
export type EveningReflection = typeof eveningReflections.$inferSelect;
export type PlatformRole = typeof platformRoles.$inferSelect;
