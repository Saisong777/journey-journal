import { pgTable, text, uuid, date, timestamp, doublePrecision, pgEnum, integer, boolean, varchar, jsonb, index, uniqueIndex, serial, customType } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

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
  specialRemarks: text("special_remarks"),
  bibleLibraryEnabled: boolean("bible_library_enabled").default(false),
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
  googleId: text("google_id").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_users_reset_token").on(table.resetToken),
]);

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  birthday: text("birthday"),
  gender: text("gender"),
  familyMembers: text("family_members"),
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
  summaryCoverUrl: text("summary_cover_url"),
}, (table) => [
  index("idx_user_roles_user_id").on(table.userId),
  index("idx_user_roles_trip_id").on(table.tripId),
]);

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
}, (table) => [
  index("idx_journal_entries_user_id").on(table.userId),
  index("idx_journal_entries_trip_id").on(table.tripId),
  index("idx_journal_entries_entry_date").on(table.entryDate),
]);

export const journalPhotos = pgTable("journal_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  journalEntryId: uuid("journal_entry_id").references(() => journalEntries.id, { onDelete: "cascade" }).notNull(),
  photoUrl: text("photo_url").notNull(),
  caption: text("caption"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_journal_photos_entry_id").on(table.journalEntryId),
]);

export const userLocations = pgTable("user_locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_user_locations_trip_id").on(table.tripId),
]);

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
}, (table) => [
  index("idx_devotional_entries_user_id").on(table.userId),
  index("idx_devotional_entries_trip_id").on(table.tripId),
]);

export const attractionFavorites = pgTable("attraction_favorites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  attractionId: text("attraction_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_attraction_favorites_user_attraction").on(table.userId, table.attractionId),
]);

export const devotionalCourses = pgTable("devotional_courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  dayNo: integer("day_no"),
  title: text("title").notNull(),
  place: text("place"),
  scripture: text("scripture"),
  reflection: text("reflection"),
  action: text("action"),
  prayer: text("prayer"),
  lifeQuestion: text("life_question"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_devotional_courses_trip_day").on(table.tripId, table.dayNo),
]);

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
}, (table) => [
  index("idx_evening_reflections_user_trip").on(table.userId, table.tripId),
  uniqueIndex("idx_evening_reflections_user_trip_date").on(table.userId, table.tripId, table.entryDate),
]);

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

export const tripNotes = pgTable("trip_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tripNoteAssignments = pgTable("trip_note_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  noteId: uuid("note_id").references(() => tripNotes.id, { onDelete: "cascade" }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_trip_note_assignments_trip_note").on(table.tripId, table.noteId),
]);

export const bibleVerses = pgTable("bible_verses", {
  id: serial("id").primaryKey(),
  bookName: text("book_name").notNull(),
  bookNumber: integer("book_number").notNull(),
  chapter: integer("chapter").notNull(),
  verse: integer("verse").notNull(),
  text: text("text").notNull(),
}, (table) => [
  index("idx_bible_book_chapter_verse").on(table.bookName, table.chapter, table.verse),
  index("idx_bible_book_number").on(table.bookNumber),
]);

export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text("key").unique().notNull(),
  value: text("value").notNull(),
});

export const paulJourneys = pgTable("paul_journeys", {
  id: serial("id").primaryKey(),
  journey: text("journey").notNull(),
  sequence: integer("sequence").notNull(),
  year: text("year"),
  location: text("location").notNull(),
  scripture: text("scripture"),
  companions: text("companions"),
  events: text("events"),
  epistles: text("epistles"),
}, (table) => [
  index("idx_paul_journeys_journey").on(table.journey),
  index("idx_paul_journeys_sequence").on(table.journey, table.sequence),
]);

export const attractions = pgTable("attractions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  dayNo: integer("day_no").notNull(),
  seq: integer("seq").notNull(),
  nameZh: text("name_zh").notNull(),
  nameEn: text("name_en"),
  nameAlt: text("name_alt"),
  country: text("country"),
  date: text("date"),
  modernLocation: text("modern_location"),
  ancientToponym: text("ancient_toponym"),
  gps: text("gps"),
  openingHours: text("opening_hours"),
  admission: text("admission"),
  duration: text("duration"),
  scriptureRefs: text("scripture_refs"),
  bibleBooks: text("bible_books"),
  storySummary: text("story_summary"),
  keyFigures: text("key_figures"),
  historicalEra: text("historical_era"),
  theologicalSignificance: text("theological_significance"),
  lifeApplication: text("life_application"),
  discussionQuestions: text("discussion_questions"),
  archaeologicalFindings: text("archaeological_findings"),
  historicalStrata: text("historical_strata"),
  accuracyRating: text("accuracy_rating"),
  keyArtifacts: text("key_artifacts"),
  tourRoutePosition: text("tour_route_position"),
  bestTime: text("best_time"),
  dressCode: text("dress_code"),
  photoRestrictions: text("photo_restrictions"),
  crowdLevels: text("crowd_levels"),
  safetyNotes: text("safety_notes"),
  accessibility: text("accessibility"),
  nearbyDining: text("nearby_dining"),
  accommodation: text("accommodation"),
  nearbyBiblicalSites: text("nearby_biblical_sites"),
  localProducts: text("local_products"),
  recommendationScore: text("recommendation_score"),
  physicalComment: text("physical_comment"),
  mdContent: text("md_content"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_attractions_trip_day").on(table.tripId, table.dayNo),
]);

// ===== Trip Schedule Items (DB-driven timeline) =====
export const scheduleItemTypeEnum = pgEnum("schedule_item_type", [
  "meal",           // 餐食 (早/午/晚餐)
  "activity",       // 景點/活動
  "boarding",       // 上車
  "gathering",      // 集合
  "accommodation",  // 住宿
  "free_time",      // 自由時間
  "custom",         // 自訂
]);

export const tripScheduleItems = pgTable("trip_schedule_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  dayNo: integer("day_no").notNull(),
  seq: integer("seq").notNull().default(0),
  time: text("time").notNull(), // "HH:MM"
  type: scheduleItemTypeEnum("type").default("custom").notNull(),
  title: text("title").notNull(),
  location: text("location"),
  notes: text("notes"),
  attractionId: uuid("attraction_id").references(() => attractions.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_schedule_items_trip_day").on(table.tripId, table.dayNo),
]);

// ===== Roll Call (Attendance) System =====
export const rollCalls = pgTable("roll_calls", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  date: text("date").notNull(),
  location: text("location"),
  note: text("note"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }).notNull(),
  selfCheckInEnabled: boolean("self_check_in_enabled").default(false).notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_roll_calls_trip_date").on(table.tripId, table.date),
]);

export const rollCallAttendances = pgTable("roll_call_attendances", {
  id: uuid("id").defaultRandom().primaryKey(),
  rollCallId: uuid("roll_call_id").references(() => rollCalls.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status: text("status").default("absent").notNull(),
  checkedInBy: uuid("checked_in_by").references(() => users.id, { onDelete: "set null" }),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_roll_call_attendance_unique").on(table.rollCallId, table.userId),
  index("idx_roll_call_attendance_roll_call").on(table.rollCallId),
]);

// ===== Bible Library Module System =====
export const bibleLibraryModules = pgTable("bible_library_modules", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  iconName: text("icon_name").default("BookOpen"),
  coverImageUrl: text("cover_image_url"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isBuiltin: boolean("is_builtin").default(false).notNull(),
  moduleType: text("module_type").default("standard").notNull(), // "standard" | "document-library"
  visible: boolean("visible").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const bibleLibraryItems = pgTable("bible_library_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  moduleId: uuid("module_id").references(() => bibleLibraryModules.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  content: text("content"),
  imageUrl: text("image_url"),
  fileUrl: text("file_url"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_bible_library_items_module").on(table.moduleId),
]);

export const bibleLibraryModuleTrips = pgTable("bible_library_module_trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  moduleId: uuid("module_id").references(() => bibleLibraryModules.id, { onDelete: "cascade" }).notNull(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_bible_module_trips_unique").on(table.tripId, table.moduleId),
]);

export const fileUploads = pgTable("file_uploads", {
  id: uuid("id").defaultRandom().primaryKey(),
  data: bytea("data").notNull(),
  contentType: text("content_type").notNull(),
  fileName: text("file_name"),
  size: integer("size"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertAttractionSchema = createInsertSchema(attractions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTripInvitationSchema = createInsertSchema(tripInvitations).omit({ id: true, createdAt: true, usedCount: true });
export const insertTripScheduleItemSchema = createInsertSchema(tripScheduleItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEveningReflectionSchema = createInsertSchema(eveningReflections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPlatformRoleSchema = createInsertSchema(platformRoles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTripNoteSchema = createInsertSchema(tripNotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTripNoteAssignmentSchema = createInsertSchema(tripNoteAssignments).omit({ id: true, createdAt: true });

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
export type InsertTripScheduleItem = z.infer<typeof insertTripScheduleItemSchema>;

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
export type TripScheduleItem = typeof tripScheduleItems.$inferSelect;
export type TripNote = typeof tripNotes.$inferSelect;
export type TripNoteAssignment = typeof tripNoteAssignments.$inferSelect;
export type BibleVerse = typeof bibleVerses.$inferSelect;
export type InsertTripNote = z.infer<typeof insertTripNoteSchema>;
export type InsertTripNoteAssignment = z.infer<typeof insertTripNoteAssignmentSchema>;
export type AppSetting = typeof appSettings.$inferSelect;
export type PaulJourney = typeof paulJourneys.$inferSelect;
export type FileUpload = typeof fileUploads.$inferSelect;
export type Attraction = typeof attractions.$inferSelect;
export type InsertAttraction = z.infer<typeof insertAttractionSchema>;

export const insertBibleLibraryModuleSchema = createInsertSchema(bibleLibraryModules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBibleLibraryItemSchema = createInsertSchema(bibleLibraryItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBibleLibraryModuleTripSchema = createInsertSchema(bibleLibraryModuleTrips).omit({ id: true, createdAt: true });
export type BibleLibraryModule = typeof bibleLibraryModules.$inferSelect;
export type BibleLibraryItem = typeof bibleLibraryItems.$inferSelect;
export type BibleLibraryModuleTrip = typeof bibleLibraryModuleTrips.$inferSelect;
export type InsertBibleLibraryModule = z.infer<typeof insertBibleLibraryModuleSchema>;
export type InsertBibleLibraryItem = z.infer<typeof insertBibleLibraryItemSchema>;

export type RollCall = typeof rollCalls.$inferSelect;
export type RollCallAttendance = typeof rollCallAttendances.$inferSelect;
export type InsertRollCall = Omit<RollCall, "id" | "createdAt" | "updatedAt">;
export type InsertRollCallAttendance = Omit<RollCallAttendance, "id" | "createdAt">;
