import { pgTable, text, uuid, date, timestamp, doublePrecision, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appRoleEnum = pgEnum("app_role", ["admin", "leader", "guide", "member"]);

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

export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
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

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTripSchema = createInsertSchema(trips).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
export const insertUserRoleSchema = createInsertSchema(userRoles).omit({ id: true });
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertJournalPhotoSchema = createInsertSchema(journalPhotos).omit({ id: true, createdAt: true });
export const insertDevotionalEntrySchema = createInsertSchema(devotionalEntries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAttractionFavoriteSchema = createInsertSchema(attractionFavorites).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type InsertJournalPhoto = z.infer<typeof insertJournalPhotoSchema>;
export type InsertDevotionalEntry = z.infer<typeof insertDevotionalEntrySchema>;
export type InsertAttractionFavorite = z.infer<typeof insertAttractionFavoriteSchema>;

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type JournalPhoto = typeof journalPhotos.$inferSelect;
export type DevotionalEntry = typeof devotionalEntries.$inferSelect;
export type AttractionFavorite = typeof attractionFavorites.$inferSelect;
export type UserLocation = typeof userLocations.$inferSelect;
