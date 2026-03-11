import { eq, and, inArray, desc, asc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  profiles,
  trips,
  tripDays,
  groups,
  userRoles,
  journalEntries,
  journalPhotos,
  devotionalEntries,
  attractionFavorites,
  userLocations,
  devotionalCourses,
  tripInvitations,
  eveningReflections,
  platformRoles,
  tripNotes,
  tripNoteAssignments,
  bibleVerses,
  type User,
  type Profile,
  type Trip,
  type TripDay,
  type Group,
  type UserRole,
  type JournalEntry,
  type JournalPhoto,
  type DevotionalEntry,
  type AttractionFavorite,
  type UserLocation,
  type DevotionalCourse,
  type TripInvitation,
  type InsertUser,
  type InsertProfile,
  type InsertTrip,
  type InsertTripDay,
  type InsertGroup,
  type InsertUserRole,
  type InsertJournalEntry,
  type InsertJournalPhoto,
  type InsertDevotionalEntry,
  type InsertAttractionFavorite,
  type InsertDevotionalCourse,
  type InsertTripInvitation,
  type EveningReflection,
  type InsertEveningReflection,
  type PlatformRole,
  type InsertPlatformRole,
  type TripNote,
  type InsertTripNote,
  type TripNoteAssignment,
  type InsertTripNoteAssignment,
  type BibleVerse,
  appSettings,
  paulJourneys,
  type PaulJourney,
  attractions,
  type Attraction,
  type InsertAttraction,
  bibleLibraryModules,
  bibleLibraryItems,
  bibleLibraryModuleTrips,
  type BibleLibraryModule,
  type BibleLibraryItem,
  type BibleLibraryModuleTrip,
  type InsertBibleLibraryModule,
  type InsertBibleLibraryItem,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUsersByIds(ids: string[]): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, profile: Partial<InsertProfile>): Promise<Profile | undefined>;

  getTrip(id: string): Promise<Trip | undefined>;
  getTrips(): Promise<Trip[]>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: string, trip: Partial<InsertTrip>): Promise<Trip | undefined>;
  deleteTrip(id: string): Promise<void>;

  getTripDays(tripId: string): Promise<TripDay[]>;
  getTripDay(id: string): Promise<TripDay | undefined>;
  createTripDay(tripDay: InsertTripDay): Promise<TripDay>;
  updateTripDay(id: string, tripDay: Partial<InsertTripDay>): Promise<TripDay | undefined>;
  deleteTripDay(id: string): Promise<void>;

  getGroups(tripId: string): Promise<Group[]>;
  getAllGroups(): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, name: string): Promise<Group | undefined>;
  deleteGroup(id: string): Promise<void>;

  getUserRole(userId: string): Promise<UserRole | undefined>;
  getAllUserRolesForUser(userId: string): Promise<UserRole[]>;
  getUserRoles(tripId: string): Promise<UserRole[]>;
  getAllUserRoles(): Promise<UserRole[]>;
  createUserRole(role: InsertUserRole): Promise<UserRole>;
  updateUserRole(id: string, role: string): Promise<UserRole | undefined>;
  updateUserRoleTrip(id: string, tripId: string): Promise<UserRole | undefined>;
  deleteUserRole(userId: string, tripId: string): Promise<void>;
  hasRole(userId: string, role: string): Promise<boolean>;

  getJournalEntries(tripId: string, date?: string): Promise<(JournalEntry & { photos: JournalPhoto[] })[]>;
  getJournalEntriesByUser(userId: string, tripId: string | null, date?: string): Promise<(JournalEntry & { photos: JournalPhoto[] })[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  getJournalEntry(id: string): Promise<JournalEntry | undefined>;
  updateJournalEntry(id: string, entry: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: string): Promise<void>;

  createJournalPhoto(photo: InsertJournalPhoto): Promise<JournalPhoto>;
  deleteJournalPhoto(id: string): Promise<void>;
  getJournalPhotos(journalEntryId: string): Promise<JournalPhoto[]>;

  getDevotionalEntries(tripId: string, date?: string): Promise<DevotionalEntry[]>;
  getDevotionalEntry(id: string): Promise<DevotionalEntry | undefined>;
  createDevotionalEntry(entry: InsertDevotionalEntry): Promise<DevotionalEntry>;
  updateDevotionalEntry(id: string, entry: Partial<InsertDevotionalEntry>): Promise<DevotionalEntry | undefined>;

  getAttractionFavorites(userId: string): Promise<AttractionFavorite[]>;
  addAttractionFavorite(fav: InsertAttractionFavorite): Promise<AttractionFavorite>;
  removeAttractionFavorite(userId: string, attractionId: string): Promise<void>;

  getMembers(tripId: string): Promise<(Profile & { group?: Group | null; role?: string })[]>;
  getAllProfiles(): Promise<Profile[]>;

  getDevotionalCourses(tripId: string): Promise<DevotionalCourse[]>;
  getDevotionalCourse(id: string): Promise<DevotionalCourse | undefined>;
  createDevotionalCourse(course: InsertDevotionalCourse): Promise<DevotionalCourse>;
  updateDevotionalCourse(id: string, course: Partial<InsertDevotionalCourse>): Promise<DevotionalCourse | undefined>;
  deleteDevotionalCourse(id: string): Promise<void>;
  deleteDevotionalCoursesByTrip(tripId: string): Promise<void>;

  lookupBibleVerses(bookName: string, chapter: number, verseStart?: number, verseEnd?: number): Promise<BibleVerse[]>;
  getBibleBooks(): Promise<{ bookName: string; bookNumber: number }[]>;

  getEveningReflection(userId: string, tripId: string, date: string): Promise<EveningReflection | undefined>;
  saveEveningReflection(data: InsertEveningReflection): Promise<EveningReflection>;

  getPlatformRole(userId: string): Promise<PlatformRole | undefined>;
  setPlatformRole(userId: string, role: string, permissions: Record<string, boolean> | null, assignedBy: string): Promise<PlatformRole>;
  deletePlatformRole(userId: string): Promise<void>;
  getAllPlatformRoles(): Promise<PlatformRole[]>;
  isSuperAdmin(userId: string): Promise<boolean>;
  hasAdminAccess(userId: string): Promise<boolean>;

  getAllTripNotes(): Promise<TripNote[]>;
  getTripNote(id: string): Promise<TripNote | undefined>;
  createTripNote(note: InsertTripNote): Promise<TripNote>;
  updateTripNote(id: string, note: Partial<InsertTripNote>): Promise<TripNote | undefined>;
  deleteTripNote(id: string): Promise<void>;
  getNotesForTrip(tripId: string): Promise<(TripNote & { sortOrder: number })[]>;
  getTripNoteAssignments(tripId: string): Promise<TripNoteAssignment[]>;
  assignNoteToTrip(tripId: string, noteId: string, sortOrder: number): Promise<TripNoteAssignment>;
  removeNoteFromTrip(tripId: string, noteId: string): Promise<void>;

  getTripInvitations(tripId: string): Promise<TripInvitation[]>;
  getAllTripInvitations(): Promise<TripInvitation[]>;
  getTripInvitation(id: string): Promise<TripInvitation | undefined>;
  getTripInvitationByCode(code: string): Promise<TripInvitation | undefined>;
  createTripInvitation(invitation: InsertTripInvitation): Promise<TripInvitation>;
  updateTripInvitation(id: string, invitation: Partial<InsertTripInvitation>): Promise<TripInvitation | undefined>;
  incrementInvitationUsedCount(id: string): Promise<void>;
  deleteTripInvitation(id: string): Promise<void>;

  getAttractionsByTrip(tripId: string): Promise<Attraction[]>;
  getAttractionsByDay(tripId: string, dayNo: number): Promise<Attraction[]>;
  getAttraction(id: string): Promise<Attraction | undefined>;
  createAttraction(data: InsertAttraction): Promise<Attraction>;
  bulkCreateAttractions(data: InsertAttraction[]): Promise<Attraction[]>;
  updateAttraction(id: string, data: Partial<InsertAttraction>): Promise<Attraction | undefined>;
  deleteAttraction(id: string): Promise<void>;
  deleteAttractionsByTrip(tripId: string): Promise<void>;

  getAppSetting(key: string): Promise<string | null>;
  setAppSetting(key: string, value: string): Promise<void>;
  updateTripBibleLibrary(tripId: string, enabled: boolean): Promise<void>;
  getPaulJourneys(): Promise<PaulJourney[]>;

  // Bible Library Modules
  getBibleLibraryModules(): Promise<BibleLibraryModule[]>;
  getBibleLibraryModule(id: string): Promise<BibleLibraryModule | undefined>;
  getBibleLibraryModuleBySlug(slug: string): Promise<BibleLibraryModule | undefined>;
  createBibleLibraryModule(data: InsertBibleLibraryModule): Promise<BibleLibraryModule>;
  updateBibleLibraryModule(id: string, data: Partial<InsertBibleLibraryModule>): Promise<BibleLibraryModule | undefined>;
  deleteBibleLibraryModule(id: string): Promise<void>;
  getBibleLibraryItems(moduleId: string): Promise<BibleLibraryItem[]>;
  getBibleLibraryItem(id: string): Promise<BibleLibraryItem | undefined>;
  createBibleLibraryItem(data: InsertBibleLibraryItem): Promise<BibleLibraryItem>;
  updateBibleLibraryItem(id: string, data: Partial<InsertBibleLibraryItem>): Promise<BibleLibraryItem | undefined>;
  deleteBibleLibraryItem(id: string): Promise<void>;
  getModulesForTrip(tripId: string): Promise<BibleLibraryModule[]>;
  assignModuleToTrip(moduleId: string, tripId: string): Promise<void>;
  unassignModuleFromTrip(moduleId: string, tripId: string): Promise<void>;
  getModuleTrips(moduleId: string): Promise<BibleLibraryModuleTrip[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUsersByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    return db.select().from(users).where(inArray(users.id, ids));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [created] = await db.insert(profiles).values(profile).returning();
    return created;
  }

  async updateProfile(userId: string, profile: Partial<InsertProfile>): Promise<Profile | undefined> {
    const [updated] = await db
      .update(profiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return updated;
  }

  async getTrip(id: string): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip;
  }

  async getTrips(): Promise<Trip[]> {
    return db.select().from(trips).orderBy(desc(trips.startDate));
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [created] = await db.insert(trips).values(trip).returning();
    return created;
  }

  async updateTrip(id: string, trip: Partial<InsertTrip>): Promise<Trip | undefined> {
    const [updated] = await db
      .update(trips)
      .set({ ...trip, updatedAt: new Date() })
      .where(eq(trips.id, id))
      .returning();
    return updated;
  }

  async deleteTrip(id: string): Promise<void> {
    await db.delete(trips).where(eq(trips.id, id));
  }

  async getTripDays(tripId: string): Promise<TripDay[]> {
    return db.select().from(tripDays).where(eq(tripDays.tripId, tripId)).orderBy(asc(tripDays.dayNo));
  }

  async getTripDay(id: string): Promise<TripDay | undefined> {
    const [tripDay] = await db.select().from(tripDays).where(eq(tripDays.id, id));
    return tripDay;
  }

  async createTripDay(tripDay: InsertTripDay): Promise<TripDay> {
    const [created] = await db.insert(tripDays).values(tripDay).returning();
    return created;
  }

  async updateTripDay(id: string, tripDay: Partial<InsertTripDay>): Promise<TripDay | undefined> {
    const [updated] = await db
      .update(tripDays)
      .set({ ...tripDay, updatedAt: new Date() })
      .where(eq(tripDays.id, id))
      .returning();
    return updated;
  }

  async deleteTripDay(id: string): Promise<void> {
    await db.delete(tripDays).where(eq(tripDays.id, id));
  }

  async getGroups(tripId: string): Promise<Group[]> {
    return db.select().from(groups).where(eq(groups.tripId, tripId));
  }

  async getAllGroups(): Promise<Group[]> {
    return db.select().from(groups);
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [created] = await db.insert(groups).values(group).returning();
    return created;
  }

  async updateGroup(id: string, name: string): Promise<Group | undefined> {
    const [updated] = await db.update(groups).set({ name }).where(eq(groups.id, id)).returning();
    return updated;
  }

  async deleteGroup(id: string): Promise<void> {
    await db.delete(groups).where(eq(groups.id, id));
  }

  async getUserRole(userId: string): Promise<UserRole | undefined> {
    const roles = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
    if (!roles.length) return undefined;
    return roles.find(r => r.tripId !== null) || roles[0];
  }

  async getAllUserRolesForUser(userId: string): Promise<UserRole[]> {
    return db.select().from(userRoles).where(eq(userRoles.userId, userId));
  }

  async getUserRoles(tripId: string): Promise<UserRole[]> {
    return db.select().from(userRoles).where(eq(userRoles.tripId, tripId));
  }

  async getAllUserRoles(): Promise<UserRole[]> {
    return db.select().from(userRoles);
  }

  async createUserRole(role: InsertUserRole): Promise<UserRole> {
    const [created] = await db.insert(userRoles).values(role).returning();
    return created;
  }

  async updateUserRole(id: string, role: string): Promise<UserRole | undefined> {
    const [updated] = await db
      .update(userRoles)
      .set({ role: role as any })
      .where(eq(userRoles.id, id))
      .returning();
    return updated;
  }

  async updateUserRoleTrip(id: string, tripId: string): Promise<UserRole | undefined> {
    const [updated] = await db
      .update(userRoles)
      .set({ tripId })
      .where(eq(userRoles.id, id))
      .returning();
    return updated;
  }

  async deleteUserRole(userId: string, tripId: string): Promise<void> {
    await db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.tripId, tripId)));
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, role as any)));
    return !!result;
  }

  async getJournalEntries(tripId: string, date?: string): Promise<(JournalEntry & { photos: JournalPhoto[] })[]> {
    const conditions: ReturnType<typeof eq>[] = [eq(journalEntries.tripId, tripId)];
    if (date) conditions.push(eq(journalEntries.entryDate, date));

    const entries = await db
      .select()
      .from(journalEntries)
      .where(and(...conditions))
      .orderBy(desc(journalEntries.createdAt));

    if (entries.length === 0) return [];

    const allPhotos = await db
      .select()
      .from(journalPhotos)
      .where(inArray(journalPhotos.journalEntryId, entries.map((e) => e.id)));

    const photosByEntry = allPhotos.reduce<Record<string, JournalPhoto[]>>((acc, photo) => {
      (acc[photo.journalEntryId] ??= []).push(photo);
      return acc;
    }, {});

    return entries.map((entry) => ({ ...entry, photos: photosByEntry[entry.id] ?? [] }));
  }

  async getJournalEntriesByUser(userId: string, tripId: string | null, date?: string): Promise<(JournalEntry & { photos: JournalPhoto[] })[]> {
    const conditions: ReturnType<typeof eq>[] = [eq(journalEntries.userId, userId)];
    if (tripId) conditions.push(eq(journalEntries.tripId, tripId));
    if (date) conditions.push(eq(journalEntries.entryDate, date));

    const entries = await db
      .select()
      .from(journalEntries)
      .where(and(...conditions))
      .orderBy(desc(journalEntries.createdAt));

    if (entries.length === 0) return [];

    const allPhotos = await db
      .select()
      .from(journalPhotos)
      .where(inArray(journalPhotos.journalEntryId, entries.map((e) => e.id)));

    const photosByEntry = allPhotos.reduce<Record<string, JournalPhoto[]>>((acc, photo) => {
      (acc[photo.journalEntryId] ??= []).push(photo);
      return acc;
    }, {});

    return entries.map((entry) => ({ ...entry, photos: photosByEntry[entry.id] ?? [] }));
  }

  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const [created] = await db.insert(journalEntries).values(entry).returning();
    return created;
  }

  async getJournalEntry(id: string): Promise<JournalEntry | undefined> {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id)).limit(1);
    return entry;
  }

  async updateJournalEntry(id: string, entry: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined> {
    const [updated] = await db
      .update(journalEntries)
      .set({ ...entry, updatedAt: new Date() })
      .where(eq(journalEntries.id, id))
      .returning();
    return updated;
  }

  async deleteJournalEntry(id: string): Promise<void> {
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
  }

  async createJournalPhoto(photo: InsertJournalPhoto): Promise<JournalPhoto> {
    const [created] = await db.insert(journalPhotos).values(photo).returning();
    return created;
  }

  async createJournalPhotos(photos: InsertJournalPhoto[]): Promise<JournalPhoto[]> {
    if (photos.length === 0) return [];
    return db.insert(journalPhotos).values(photos).returning();
  }

  async deleteJournalPhoto(id: string): Promise<void> {
    await db.delete(journalPhotos).where(eq(journalPhotos.id, id));
  }

  async getJournalPhotos(journalEntryId: string): Promise<JournalPhoto[]> {
    return db.select().from(journalPhotos).where(eq(journalPhotos.journalEntryId, journalEntryId));
  }

  async getDevotionalEntries(tripId: string, date?: string): Promise<DevotionalEntry[]> {
    const conditions = [eq(devotionalEntries.tripId, tripId)];
    if (date) {
      conditions.push(eq(devotionalEntries.entryDate, date));
    }
    return db.select().from(devotionalEntries)
      .where(and(...conditions))
      .orderBy(desc(devotionalEntries.createdAt));
  }

  async createDevotionalEntry(entry: InsertDevotionalEntry): Promise<DevotionalEntry> {
    const [created] = await db.insert(devotionalEntries).values(entry).returning();
    return created;
  }

  async getDevotionalEntry(id: string): Promise<DevotionalEntry | undefined> {
    const [entry] = await db.select().from(devotionalEntries).where(eq(devotionalEntries.id, id)).limit(1);
    return entry;
  }

  async updateDevotionalEntry(id: string, entry: Partial<InsertDevotionalEntry>): Promise<DevotionalEntry | undefined> {
    const [updated] = await db
      .update(devotionalEntries)
      .set({ ...entry, updatedAt: new Date() })
      .where(eq(devotionalEntries.id, id))
      .returning();
    return updated;
  }

  async getAttractionFavorites(userId: string): Promise<AttractionFavorite[]> {
    return db.select().from(attractionFavorites).where(eq(attractionFavorites.userId, userId));
  }

  async addAttractionFavorite(fav: InsertAttractionFavorite): Promise<AttractionFavorite> {
    const [created] = await db.insert(attractionFavorites).values(fav).returning();
    return created;
  }

  async removeAttractionFavorite(userId: string, attractionId: string): Promise<void> {
    await db
      .delete(attractionFavorites)
      .where(and(eq(attractionFavorites.userId, userId), eq(attractionFavorites.attractionId, attractionId)));
  }

  async getMembers(tripId: string): Promise<(Profile & { group?: Group | null; role?: string })[]> {
    const tripGroups = await this.getGroups(tripId);
    const groupIds = tripGroups.map((g) => g.id);
    
    if (groupIds.length === 0) return [];

    const profilesList = await db.select().from(profiles).where(inArray(profiles.groupId, groupIds));
    const roles = await this.getUserRoles(tripId);
    const roleMap = new Map(roles.map((r) => [r.userId, r.role]));
    const groupMap = new Map(tripGroups.map((g) => [g.id, g]));

    return profilesList.map((profile) => ({
      ...profile,
      group: profile.groupId ? groupMap.get(profile.groupId) || null : null,
      role: roleMap.get(profile.userId) || "member",
    }));
  }

  async getAllProfiles(): Promise<Profile[]> {
    return db.select().from(profiles);
  }

  async getUserLocation(userId: string): Promise<UserLocation | undefined> {
    const [location] = await db.select().from(userLocations).where(eq(userLocations.userId, userId));
    return location;
  }

  async getLocationsByTrip(tripId: string): Promise<(UserLocation & { profile?: Profile })[]> {
    const locations = await db.select().from(userLocations).where(eq(userLocations.tripId, tripId));
    const profilesList = await this.getAllProfiles();
    const profileMap = new Map(profilesList.map((p) => [p.userId, p]));
    
    return locations.map((loc) => ({
      ...loc,
      profile: profileMap.get(loc.userId),
    }));
  }

  async updateUserLocation(userId: string, tripId: string, latitude: number, longitude: number): Promise<UserLocation> {
    const existing = await this.getUserLocation(userId);
    
    if (existing) {
      const [updated] = await db
        .update(userLocations)
        .set({ latitude, longitude, updatedAt: new Date() })
        .where(eq(userLocations.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userLocations)
        .values({ userId, tripId, latitude, longitude })
        .returning();
      return created;
    }
  }

  async getDevotionalCourses(tripId: string): Promise<DevotionalCourse[]> {
    return db.select().from(devotionalCourses).where(eq(devotionalCourses.tripId, tripId)).orderBy(asc(devotionalCourses.dayNo));
  }

  async getDevotionalCourse(id: string): Promise<DevotionalCourse | undefined> {
    const [course] = await db.select().from(devotionalCourses).where(eq(devotionalCourses.id, id));
    return course;
  }

  async createDevotionalCourse(course: InsertDevotionalCourse): Promise<DevotionalCourse> {
    const [created] = await db.insert(devotionalCourses).values(course).returning();
    return created;
  }

  async updateDevotionalCourse(id: string, course: Partial<InsertDevotionalCourse>): Promise<DevotionalCourse | undefined> {
    const [updated] = await db
      .update(devotionalCourses)
      .set({ ...course, updatedAt: new Date() })
      .where(eq(devotionalCourses.id, id))
      .returning();
    return updated;
  }

  async deleteDevotionalCourse(id: string): Promise<void> {
    await db.delete(devotionalCourses).where(eq(devotionalCourses.id, id));
  }

  async deleteDevotionalCoursesByTrip(tripId: string): Promise<void> {
    await db.delete(devotionalCourses).where(eq(devotionalCourses.tripId, tripId));
  }

  async getPlatformRole(userId: string): Promise<PlatformRole | undefined> {
    const [role] = await db.select().from(platformRoles).where(eq(platformRoles.userId, userId));
    return role;
  }

  async setPlatformRole(userId: string, role: string, permissions: Record<string, boolean> | null, assignedBy: string): Promise<PlatformRole> {
    const existing = await this.getPlatformRole(userId);
    if (existing) {
      const [updated] = await db
        .update(platformRoles)
        .set({ role: role as any, permissions, assignedBy, updatedAt: new Date() })
        .where(eq(platformRoles.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(platformRoles)
      .values({ userId, role: role as any, permissions, assignedBy })
      .returning();
    return created;
  }

  async deletePlatformRole(userId: string): Promise<void> {
    await db.delete(platformRoles).where(eq(platformRoles.userId, userId));
  }

  async getAllPlatformRoles(): Promise<PlatformRole[]> {
    return db.select().from(platformRoles);
  }

  async isSuperAdmin(userId: string): Promise<boolean> {
    const role = await this.getPlatformRole(userId);
    if (role && role.role === "super_admin") return true;
    const hasOldAdmin = await this.hasRole(userId, "admin");
    return hasOldAdmin;
  }

  async hasAdminAccess(userId: string): Promise<boolean> {
    const role = await this.getPlatformRole(userId);
    if (role && (role.role === "super_admin" || role.role === "management")) return true;
    const hasOldAdmin = await this.hasRole(userId, "admin");
    return hasOldAdmin;
  }

  async getTripInvitations(tripId: string): Promise<TripInvitation[]> {
    return db.select().from(tripInvitations).where(eq(tripInvitations.tripId, tripId)).orderBy(desc(tripInvitations.createdAt));
  }

  async getAllTripInvitations(): Promise<TripInvitation[]> {
    return db.select().from(tripInvitations).orderBy(desc(tripInvitations.createdAt));
  }

  async getTripInvitation(id: string): Promise<TripInvitation | undefined> {
    const [invitation] = await db.select().from(tripInvitations).where(eq(tripInvitations.id, id));
    return invitation;
  }

  async getTripInvitationByCode(code: string): Promise<TripInvitation | undefined> {
    const [invitation] = await db.select().from(tripInvitations).where(eq(tripInvitations.code, code));
    return invitation;
  }

  async createTripInvitation(invitation: InsertTripInvitation): Promise<TripInvitation> {
    const [created] = await db.insert(tripInvitations).values(invitation).returning();
    return created;
  }

  async updateTripInvitation(id: string, invitation: Partial<InsertTripInvitation>): Promise<TripInvitation | undefined> {
    const [updated] = await db
      .update(tripInvitations)
      .set(invitation)
      .where(eq(tripInvitations.id, id))
      .returning();
    return updated;
  }

  async incrementInvitationUsedCount(id: string): Promise<void> {
    await db
      .update(tripInvitations)
      .set({ usedCount: sql`${tripInvitations.usedCount} + 1` })
      .where(eq(tripInvitations.id, id));
  }

  async deleteTripInvitation(id: string): Promise<void> {
    await db.delete(tripInvitations).where(eq(tripInvitations.id, id));
  }

  async getEveningReflection(userId: string, tripId: string, date: string): Promise<EveningReflection | undefined> {
    const [reflection] = await db
      .select()
      .from(eveningReflections)
      .where(
        and(
          eq(eveningReflections.userId, userId),
          eq(eveningReflections.tripId, tripId),
          eq(eveningReflections.entryDate, date)
        )
      );
    return reflection;
  }

  async saveEveningReflection(data: InsertEveningReflection): Promise<EveningReflection> {
    const existing = await this.getEveningReflection(data.userId, data.tripId, data.entryDate!);
    if (existing) {
      const [updated] = await db
        .update(eveningReflections)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(eveningReflections.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(eveningReflections).values(data).returning();
    return created;
  }
  async getAllTripNotes(): Promise<TripNote[]> {
    return db.select().from(tripNotes).orderBy(desc(tripNotes.createdAt));
  }

  async getTripNote(id: string): Promise<TripNote | undefined> {
    const [note] = await db.select().from(tripNotes).where(eq(tripNotes.id, id));
    return note;
  }

  async createTripNote(note: InsertTripNote): Promise<TripNote> {
    const [created] = await db.insert(tripNotes).values(note).returning();
    return created;
  }

  async updateTripNote(id: string, note: Partial<InsertTripNote>): Promise<TripNote | undefined> {
    const [updated] = await db
      .update(tripNotes)
      .set({ ...note, updatedAt: new Date() })
      .where(eq(tripNotes.id, id))
      .returning();
    return updated;
  }

  async deleteTripNote(id: string): Promise<void> {
    await db.delete(tripNotes).where(eq(tripNotes.id, id));
  }

  async getNotesForTrip(tripId: string): Promise<(TripNote & { sortOrder: number })[]> {
    const assignments = await db
      .select()
      .from(tripNoteAssignments)
      .where(eq(tripNoteAssignments.tripId, tripId))
      .orderBy(asc(tripNoteAssignments.sortOrder));

    if (assignments.length === 0) return [];

    const noteIds = assignments.map(a => a.noteId);
    const notes = await db.select().from(tripNotes).where(inArray(tripNotes.id, noteIds));
    const noteMap = new Map(notes.map(n => [n.id, n]));

    return assignments
      .map(a => {
        const note = noteMap.get(a.noteId);
        if (!note) return null;
        return { ...note, sortOrder: a.sortOrder };
      })
      .filter(Boolean) as (TripNote & { sortOrder: number })[];
  }

  async getTripNoteAssignments(tripId: string): Promise<TripNoteAssignment[]> {
    return db
      .select()
      .from(tripNoteAssignments)
      .where(eq(tripNoteAssignments.tripId, tripId))
      .orderBy(asc(tripNoteAssignments.sortOrder));
  }

  async assignNoteToTrip(tripId: string, noteId: string, sortOrder: number): Promise<TripNoteAssignment> {
    const [created] = await db
      .insert(tripNoteAssignments)
      .values({ tripId, noteId, sortOrder })
      .returning();
    return created;
  }

  async removeNoteFromTrip(tripId: string, noteId: string): Promise<void> {
    await db
      .delete(tripNoteAssignments)
      .where(and(eq(tripNoteAssignments.tripId, tripId), eq(tripNoteAssignments.noteId, noteId)));
  }

  async lookupBibleVerses(bookName: string, chapter: number, verseStart?: number, verseEnd?: number): Promise<BibleVerse[]> {
    const conditions = [
      eq(bibleVerses.bookName, bookName),
      eq(bibleVerses.chapter, chapter),
    ];
    let results = await db.select().from(bibleVerses).where(and(...conditions)).orderBy(asc(bibleVerses.verse));
    if (verseStart !== undefined && verseEnd !== undefined) {
      results = results.filter(v => v.verse >= verseStart && v.verse <= verseEnd);
    } else if (verseStart !== undefined) {
      results = results.filter(v => v.verse === verseStart);
    }
    return results;
  }

  async getBibleBooks(): Promise<{ bookName: string; bookNumber: number }[]> {
    const results = await db
      .selectDistinct({ bookName: bibleVerses.bookName, bookNumber: bibleVerses.bookNumber })
      .from(bibleVerses)
      .orderBy(asc(bibleVerses.bookNumber));
    return results;
  }

  async getAttractionsByTrip(tripId: string): Promise<Attraction[]> {
    return db.select().from(attractions).where(eq(attractions.tripId, tripId)).orderBy(asc(attractions.seq));
  }

  async getAttractionsByDay(tripId: string, dayNo: number): Promise<Attraction[]> {
    return db.select().from(attractions)
      .where(and(eq(attractions.tripId, tripId), eq(attractions.dayNo, dayNo)))
      .orderBy(asc(attractions.seq));
  }

  async getAttraction(id: string): Promise<Attraction | undefined> {
    const [row] = await db.select().from(attractions).where(eq(attractions.id, id));
    return row;
  }

  async createAttraction(data: InsertAttraction): Promise<Attraction> {
    const [created] = await db.insert(attractions).values(data).returning();
    return created;
  }

  async bulkCreateAttractions(data: InsertAttraction[]): Promise<Attraction[]> {
    if (data.length === 0) return [];
    return db.insert(attractions).values(data).returning();
  }

  async updateAttraction(id: string, data: Partial<InsertAttraction>): Promise<Attraction | undefined> {
    const [updated] = await db
      .update(attractions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(attractions.id, id))
      .returning();
    return updated;
  }

  async deleteAttraction(id: string): Promise<void> {
    await db.delete(attractions).where(eq(attractions.id, id));
  }

  async deleteAttractionsByTrip(tripId: string): Promise<void> {
    await db.delete(attractions).where(eq(attractions.tripId, tripId));
  }

  async getAppSetting(key: string): Promise<string | null> {
    const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return setting?.value ?? null;
  }

  async setAppSetting(key: string, value: string): Promise<void> {
    const [existing] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    if (existing) {
      await db.update(appSettings).set({ value }).where(eq(appSettings.key, key));
    } else {
      await db.insert(appSettings).values({ key, value });
    }
  }

  async updateTripBibleLibrary(tripId: string, enabled: boolean): Promise<void> {
    const { pool } = await import("./db");
    const client = await pool.connect();
    try {
      await client.query("UPDATE trips SET bible_library_enabled = $1 WHERE id = $2", [enabled, tripId]);
    } finally {
      client.release();
    }
  }

  async getPaulJourneys(): Promise<PaulJourney[]> {
    return await db.select().from(paulJourneys).orderBy(asc(paulJourneys.journey), asc(paulJourneys.sequence));
  }

  // ===== Bible Library Modules =====
  async getBibleLibraryModules(): Promise<BibleLibraryModule[]> {
    return db.select().from(bibleLibraryModules).orderBy(asc(bibleLibraryModules.sortOrder));
  }
  async getBibleLibraryModule(id: string): Promise<BibleLibraryModule | undefined> {
    const [m] = await db.select().from(bibleLibraryModules).where(eq(bibleLibraryModules.id, id));
    return m;
  }
  async getBibleLibraryModuleBySlug(slug: string): Promise<BibleLibraryModule | undefined> {
    const [m] = await db.select().from(bibleLibraryModules).where(eq(bibleLibraryModules.slug, slug));
    return m;
  }
  async createBibleLibraryModule(data: InsertBibleLibraryModule): Promise<BibleLibraryModule> {
    const [m] = await db.insert(bibleLibraryModules).values(data).returning();
    return m;
  }
  async updateBibleLibraryModule(id: string, data: Partial<InsertBibleLibraryModule>): Promise<BibleLibraryModule | undefined> {
    const [m] = await db.update(bibleLibraryModules).set({ ...data, updatedAt: new Date() }).where(eq(bibleLibraryModules.id, id)).returning();
    return m;
  }
  async deleteBibleLibraryModule(id: string): Promise<void> {
    await db.delete(bibleLibraryModules).where(eq(bibleLibraryModules.id, id));
  }

  async getBibleLibraryItems(moduleId: string): Promise<BibleLibraryItem[]> {
    return db.select().from(bibleLibraryItems).where(eq(bibleLibraryItems.moduleId, moduleId)).orderBy(asc(bibleLibraryItems.sortOrder));
  }
  async getBibleLibraryItem(id: string): Promise<BibleLibraryItem | undefined> {
    const [item] = await db.select().from(bibleLibraryItems).where(eq(bibleLibraryItems.id, id));
    return item;
  }
  async createBibleLibraryItem(data: InsertBibleLibraryItem): Promise<BibleLibraryItem> {
    const [item] = await db.insert(bibleLibraryItems).values(data).returning();
    return item;
  }
  async updateBibleLibraryItem(id: string, data: Partial<InsertBibleLibraryItem>): Promise<BibleLibraryItem | undefined> {
    const [item] = await db.update(bibleLibraryItems).set({ ...data, updatedAt: new Date() }).where(eq(bibleLibraryItems.id, id)).returning();
    return item;
  }
  async deleteBibleLibraryItem(id: string): Promise<void> {
    await db.delete(bibleLibraryItems).where(eq(bibleLibraryItems.id, id));
  }

  async getModulesForTrip(tripId: string): Promise<BibleLibraryModule[]> {
    const assignments = await db.select().from(bibleLibraryModuleTrips).where(eq(bibleLibraryModuleTrips.tripId, tripId));
    if (assignments.length === 0) return [];
    const moduleIds = assignments.map(a => a.moduleId);
    return db.select().from(bibleLibraryModules)
      .where(and(inArray(bibleLibraryModules.id, moduleIds), eq(bibleLibraryModules.visible, true)))
      .orderBy(asc(bibleLibraryModules.sortOrder));
  }
  async assignModuleToTrip(moduleId: string, tripId: string): Promise<void> {
    const existing = await db.select().from(bibleLibraryModuleTrips)
      .where(and(eq(bibleLibraryModuleTrips.moduleId, moduleId), eq(bibleLibraryModuleTrips.tripId, tripId)));
    if (existing.length === 0) {
      await db.insert(bibleLibraryModuleTrips).values({ moduleId, tripId });
    }
  }
  async unassignModuleFromTrip(moduleId: string, tripId: string): Promise<void> {
    await db.delete(bibleLibraryModuleTrips)
      .where(and(eq(bibleLibraryModuleTrips.moduleId, moduleId), eq(bibleLibraryModuleTrips.tripId, tripId)));
  }
  async getModuleTrips(moduleId: string): Promise<BibleLibraryModuleTrip[]> {
    return db.select().from(bibleLibraryModuleTrips).where(eq(bibleLibraryModuleTrips.moduleId, moduleId));
  }
}

export const storage = new DatabaseStorage();
