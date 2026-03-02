import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { insertTripSchema, insertGroupSchema, insertJournalEntrySchema, insertDevotionalEntrySchema } from "@shared/schema";
import { tokenStore, generateToken, createAuthToken } from "./tokenStore";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Middleware to extract user from token, session, or Replit Auth
async function extractUser(req: Request, res: Response, next: NextFunction) {
  // Check Authorization header first (token-based auth)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const tokenData = await tokenStore.get(token);
    if (tokenData && tokenData.expiresAt > new Date()) {
      req.userId = tokenData.userId;
    }
  }
  
  // Check Replit Auth session (passport)
  if (!req.userId && req.isAuthenticated && req.isAuthenticated() && (req.user as any)?.dbUserId) {
    req.userId = (req.user as any).dbUserId;
  }
  
  // Fall back to express-session
  if (!req.userId && req.session?.userId) {
    req.userId = req.session.userId;
  }
  
  next();
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const isAdmin = await storage.hasRole(req.userId, "admin");
  if (!isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

export function registerRoutes(app: Express) {
  // Apply extractUser middleware to all API routes
  app.use("/api", extractUser);

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ email, password: hashedPassword });
      
      await storage.createProfile({ userId: user.id, name, email });
      
      // Create user role without trip assignment - user must use invitation code to join a trip
      await storage.createUserRole({
        userId: user.id,
        tripId: null,
        role: "member",
      });
      
      // Generate auth token
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await tokenStore.set(token, { userId: user.id, expiresAt });
      
      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
        }
        res.json({ user: { id: user.id, email: user.email }, token });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // User must use invitation code to join a trip - no auto-assignment
      const userRole = await storage.getUserRole(user.id);
      if (!userRole) {
        // Create role without trip for legacy users who don't have a role yet
        await storage.createUserRole({
          userId: user.id,
          tripId: null,
          role: "member",
        });
      }

      // Generate auth token
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await tokenStore.set(token, { userId: user.id, expiresAt });

      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
        }
        res.json({ user: { id: user.id, email: user.email }, token });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/session", async (req, res) => {
    if (!req.userId) {
      return res.json({ user: null });
    }
    const user = await storage.getUser(req.userId);
    if (!user) {
      if (req.session) {
        req.session.userId = undefined;
        req.session.save(() => {});
      }
      return res.json({ user: null });
    }
    res.json({ user: { id: user.id, email: user.email } });
  });

  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const profile = await storage.getProfile(req.userId!);
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getProfile(req.userId!);
      let result;
      if (existing) {
        result = await storage.updateProfile(req.userId!, req.body);
      } else {
        result = await storage.createProfile({ ...req.body, userId: req.userId! });
      }
      res.json(result);
    } catch (error) {
      console.error("Failed to update profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/trip", requireAuth, async (req, res) => {
    try {
      const userRole = await storage.getUserRole(req.userId!);
      if (!userRole || !userRole.tripId) {
        return res.json(null);
      }
      const trip = await storage.getTrip(userRole.tripId);
      res.json(trip ? { ...trip, userRole: userRole.role } : null);
    } catch (error) {
      console.error("Failed to get trip:", error);
      res.status(500).json({ error: "Failed to get trip" });
    }
  });

  app.get("/api/trips/current", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;
      console.log("Fetching current trip for user:", userId);
      const userRole = await storage.getUserRole(userId);
      console.log("User role found:", JSON.stringify(userRole));
      if (!userRole || !userRole.tripId) {
        console.log("No tripId in user role");
        return res.status(404).json({ error: "No active trip found" });
      }
      const trip = await storage.getTrip(userRole.tripId);
      console.log("Trip found:", trip?.title);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      res.json({ ...trip, userRole: userRole.role });
    } catch (error) {
      console.error("Failed to get current trip:", error);
      res.status(500).json({ error: "Failed to get current trip" });
    }
  });

  app.get("/api/members", requireAuth, async (req, res) => {
    try {
      const userRole = await storage.getUserRole(req.userId!);
      if (!userRole) {
        return res.json([]);
      }
      const members = await storage.getMembers(userRole.tripId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to get members" });
    }
  });

  app.get("/api/groups", requireAuth, async (req, res) => {
    try {
      const userRole = await storage.getUserRole(req.userId!);
      if (!userRole) {
        return res.json([]);
      }
      const groupList = await storage.getGroups(userRole.tripId);
      res.json(groupList);
    } catch (error) {
      res.status(500).json({ error: "Failed to get groups" });
    }
  });

  app.get("/api/journal-entries", requireAuth, async (req, res) => {
    try {
      const userRole = await storage.getUserRole(req.userId!);
      if (!userRole) {
        return res.json([]);
      }
      const date = req.query.date as string | undefined;
      // Security: Only return user's own journal entries
      const entries = await storage.getJournalEntriesByUser(req.userId!, userRole.tripId, date);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to get journal entries" });
    }
  });

  app.post("/api/journal-entries", requireAuth, async (req, res) => {
    try {
      const userRole = await storage.getUserRole(req.userId!);
      if (!userRole || !userRole.tripId) {
        return res.status(400).json({ error: "User not in a trip" });
      }

      const { title, content, location, photos } = req.body;
      const entry = await storage.createJournalEntry({
        userId: req.userId!,
        tripId: userRole.tripId,
        title: title || location || "無標題",
        content: content || "",
        location: location || "",
        entryDate: new Date().toISOString().split("T")[0],
      });

      if (photos && Array.isArray(photos) && photos.length > 0) {
        for (const photoUrl of photos) {
          await storage.createJournalPhoto({
            journalEntryId: entry.id,
            photoUrl,
            caption: null,
          });
        }
      }

      res.json(entry);
    } catch (error) {
      console.error("Failed to create journal entry:", error);
      res.status(500).json({ error: "Failed to create journal entry" });
    }
  });

  app.patch("/api/journal-entries/:id", requireAuth, async (req, res) => {
    try {
      const { title, content, location, photos } = req.body;
      const entry = await storage.updateJournalEntry(req.params.id, {
        title,
        content,
        location,
      });

      if (photos && Array.isArray(photos)) {
        const existingPhotos = await storage.getJournalPhotos(req.params.id);
        const existingPaths = existingPhotos.map(p => p.photoUrl);
        const newPaths = photos as string[];

        const toDelete = existingPhotos.filter(p => !newPaths.includes(p.photoUrl));
        for (const photo of toDelete) {
          await storage.deleteJournalPhoto(photo.id);
        }

        const toAdd = newPaths.filter(p => !existingPaths.includes(p));
        for (const photoUrl of toAdd) {
          await storage.createJournalPhoto({
            journalEntryId: req.params.id,
            photoUrl,
            caption: null,
          });
        }
      }

      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to update journal entry" });
    }
  });

  app.delete("/api/journal-entries/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteJournalEntry(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete journal entry" });
    }
  });

  app.get("/api/devotional-entries", requireAuth, async (req, res) => {
    try {
      const userRole = await storage.getUserRole(req.userId!);
      if (!userRole || !userRole.tripId) {
        return res.json([]);
      }
      const date = req.query.date as string | undefined;
      const entries = await storage.getDevotionalEntries(userRole.tripId, date);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to get devotional entries" });
    }
  });

  app.post("/api/devotional-entries", requireAuth, async (req, res) => {
    try {
      const userRole = await storage.getUserRole(req.userId!);
      if (!userRole || !userRole.tripId) {
        return res.status(400).json({ error: "User not in a trip" });
      }

      const entryDate = req.body.entryDate || new Date().toISOString().split("T")[0];

      const entry = await storage.createDevotionalEntry({
        userId: req.userId!,
        tripId: userRole.tripId,
        scriptureReference: req.body.scriptureReference || "",
        reflection: req.body.reflection || "",
        prayer: req.body.prayer || "",
        entryDate,
      });
      res.json(entry);
    } catch (error) {
      console.error("Failed to create devotional entry:", error);
      res.status(500).json({ error: "Failed to create devotional entry" });
    }
  });

  app.patch("/api/devotional-entries/:id", requireAuth, async (req, res) => {
    try {
      const { scriptureReference, reflection, prayer } = req.body;
      const updated = await storage.updateDevotionalEntry(req.params.id, {
        scriptureReference: scriptureReference || "",
        reflection: reflection || "",
        prayer: prayer || "",
        updatedAt: new Date()
      });
      res.json(updated);
    } catch (error) {
      console.error("Failed to update devotional entry:", error);
      res.status(500).json({ error: "Failed to update devotional entry" });
    }
  });

  app.get("/api/evening-reflections", requireAuth, async (req, res) => {
    try {
      const userRole = await storage.getUserRole(req.userId!);
      if (!userRole || !userRole.tripId) {
        return res.json(null);
      }
      const date = (req.query.date as string) || new Date().toISOString().split("T")[0];
      const reflection = await storage.getEveningReflection(req.userId!, userRole.tripId, date);
      res.json(reflection || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to get evening reflection" });
    }
  });

  app.post("/api/evening-reflections", requireAuth, async (req, res) => {
    try {
      const userRole = await storage.getUserRole(req.userId!);
      if (!userRole || !userRole.tripId) {
        return res.status(400).json({ error: "User not in a trip" });
      }
      const entryDate = req.body.entryDate || new Date().toISOString().split("T")[0];
      const reflection = await storage.saveEveningReflection({
        userId: req.userId!,
        tripId: userRole.tripId,
        gratitude: req.body.gratitude || "",
        highlight: req.body.highlight || "",
        prayerForTomorrow: req.body.prayerForTomorrow || "",
        entryDate,
      });
      res.json(reflection);
    } catch (error) {
      console.error("Failed to save evening reflection:", error);
      res.status(500).json({ error: "Failed to save evening reflection" });
    }
  });

  app.get("/api/is-admin", requireAuth, async (req, res) => {
    try {
      const isAdmin = await storage.hasRole(req.userId!, "admin");
      res.json({ isAdmin });
    } catch (error) {
      res.status(500).json({ error: "Failed to check admin status" });
    }
  });

  app.get("/api/admin/trips", requireAdmin, async (req, res) => {
    try {
      const tripList = await storage.getTrips();
      res.json(tripList);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trips" });
    }
  });

  app.post("/api/admin/trips", requireAdmin, async (req, res) => {
    try {
      const trip = await storage.createTrip(req.body);
      res.json(trip);
    } catch (error) {
      res.status(500).json({ error: "Failed to create trip" });
    }
  });

  app.patch("/api/admin/trips/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateTrip(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update trip" });
    }
  });

  app.delete("/api/admin/trips/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteTrip(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete trip" });
    }
  });

  // Trip Days (每日行程) routes
  app.get("/api/admin/trips/:tripId/days", requireAdmin, async (req, res) => {
    try {
      const days = await storage.getTripDays(req.params.tripId);
      res.json(days);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trip days" });
    }
  });

  app.post("/api/admin/trips/:tripId/days", requireAdmin, async (req, res) => {
    try {
      const tripDay = await storage.createTripDay({
        ...req.body,
        tripId: req.params.tripId,
      });
      res.json(tripDay);
    } catch (error) {
      res.status(500).json({ error: "Failed to create trip day" });
    }
  });

  app.patch("/api/admin/trip-days/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateTripDay(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update trip day" });
    }
  });

  app.delete("/api/admin/trip-days/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteTripDay(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete trip day" });
    }
  });

  // Public trip days endpoint for members
  app.get("/api/trip-days", requireAuth, async (req, res) => {
    try {
      const userRole = await storage.getUserRole(req.userId!);
      if (!userRole?.tripId) {
        return res.json([]);
      }
      const days = await storage.getTripDays(userRole.tripId);
      res.json(days);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trip days" });
    }
  });

  // Get today's trip day based on current date
  app.get("/api/trip-days/today", requireAuth, async (req, res) => {
    try {
      const userRole = await storage.getUserRole(req.userId!);
      if (!userRole?.tripId) {
        return res.json(null);
      }
      const days = await storage.getTripDays(userRole.tripId);
      
      // Guard against empty days array
      if (!days || days.length === 0) {
        return res.json(null);
      }
      
      // Use local date (YYYY-MM-DD format) for comparison
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      // Find today's schedule
      const todaySchedule = days.find(d => d.date === today);
      if (todaySchedule) {
        return res.json({ ...todaySchedule, dayNumber: todaySchedule.dayNo });
      }
      
      // If trip hasn't started yet, return first day
      const trip = await storage.getTrip(userRole.tripId);
      if (trip && trip.startDate && today < trip.startDate) {
        const firstDay = days.find(d => d.dayNo === 1);
        return res.json(firstDay ? { ...firstDay, dayNumber: 1, isPreTrip: true } : null);
      }
      
      // If trip has ended, return last day
      if (trip && trip.endDate && today > trip.endDate) {
        const lastDay = days.reduce((max, d) => d.dayNo > max.dayNo ? d : max, days[0]);
        return res.json(lastDay ? { ...lastDay, dayNumber: lastDay.dayNo, isPostTrip: true } : null);
      }
      
      // Return first day as fallback
      const firstDay = days.find(d => d.dayNo === 1);
      res.json(firstDay ? { ...firstDay, dayNumber: 1 } : null);
    } catch (error) {
      res.status(500).json({ error: "Failed to get today's schedule" });
    }
  });

  // Get today's attractions for journal location selection
  app.get("/api/trip-days/today/attractions", requireAuth, async (req, res) => {
    try {
      const userRole = await storage.getUserRole(req.userId!);
      if (!userRole?.tripId) {
        return res.json([]);
      }
      const days = await storage.getTripDays(userRole.tripId);
      
      if (!days || days.length === 0) {
        return res.json([]);
      }
      
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      // Find today's schedule
      let todaySchedule = days.find(d => d.date === today);
      
      // If trip hasn't started, use first day
      if (!todaySchedule) {
        const trip = await storage.getTrip(userRole.tripId);
        if (trip && trip.startDate && today < trip.startDate) {
          todaySchedule = days.find(d => d.dayNo === 1);
        }
      }
      
      // If trip has ended, use last day
      if (!todaySchedule) {
        const trip = await storage.getTrip(userRole.tripId);
        if (trip && trip.endDate && today > trip.endDate) {
          todaySchedule = days.reduce((max, d) => d.dayNo > max.dayNo ? d : max, days[0]);
        }
      }
      
      // Fallback to first day
      if (!todaySchedule) {
        todaySchedule = days.find(d => d.dayNo === 1);
      }
      
      if (!todaySchedule) {
        return res.json([]);
      }
      
      // Parse attractions from the attractions field or highlights as fallback
      const attractionsStr = todaySchedule.attractions || todaySchedule.highlights || "";
      const attractions = attractionsStr.split("/").map((a: string) => a.trim()).filter(Boolean);
      
      // Add "其他景點" as fallback option
      if (!attractions.includes("其他景點")) {
        attractions.push("其他景點");
      }
      
      res.json(attractions);
    } catch (error) {
      console.error("Error getting today's attractions:", error);
      res.status(500).json({ error: "Failed to get attractions" });
    }
  });

  app.get("/api/admin/profiles", requireAdmin, async (req, res) => {
    try {
      const profileList = await storage.getAllProfiles();
      const allGroups = await storage.getAllGroups();
      const groupMap = new Map(allGroups.map((g) => [g.id, g]));
      
      const profilesWithGroups = profileList.map((p) => ({
        ...p,
        group: p.groupId ? groupMap.get(p.groupId) : null,
      }));
      res.json(profilesWithGroups);
    } catch (error) {
      res.status(500).json({ error: "Failed to get profiles" });
    }
  });

  app.get("/api/admin/user-roles", requireAdmin, async (req, res) => {
    try {
      const roles = await storage.getAllUserRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user roles" });
    }
  });

  app.post("/api/admin/user-roles", requireAdmin, async (req, res) => {
    try {
      const role = await storage.createUserRole(req.body);
      res.json(role);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user role" });
    }
  });

  app.delete("/api/admin/user-roles", requireAdmin, async (req, res) => {
    try {
      const { user_id, trip_id } = req.body;
      if (!user_id || !trip_id) {
        return res.status(400).json({ error: "userId and tripId are required" });
      }
      await storage.deleteUserRole(user_id, trip_id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user role" });
    }
  });

  app.get("/api/admin/groups", requireAdmin, async (req, res) => {
    try {
      const groupList = await storage.getAllGroups();
      const tripList = await storage.getTrips();
      const tripMap = new Map(tripList.map((t) => [t.id, t]));
      
      const groupsWithTrips = groupList.map((g) => ({
        ...g,
        trip: tripMap.get(g.tripId),
      }));
      res.json(groupsWithTrips);
    } catch (error) {
      res.status(500).json({ error: "Failed to get groups" });
    }
  });

  app.post("/api/admin/groups", requireAdmin, async (req, res) => {
    try {
      const group = await storage.createGroup(req.body);
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  app.patch("/api/admin/groups/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateGroup(req.params.id, req.body.name);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update group" });
    }
  });

  app.delete("/api/admin/groups/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteGroup(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete group" });
    }
  });

  app.patch("/api/admin/profiles/:id", requireAdmin, async (req, res) => {
    try {
      const profile = await storage.getAllProfiles();
      const target = profile.find((p) => p.id === req.params.id);
      if (!target) {
        return res.status(404).json({ error: "Profile not found" });
      }
      const updated = await storage.updateProfile(target.userId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/attraction-favorites", requireAuth, async (req, res) => {
    try {
      const favorites = await storage.getAttractionFavorites(req.userId!);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ error: "Failed to get favorites" });
    }
  });

  app.post("/api/attraction-favorites", requireAuth, async (req, res) => {
    try {
      const fav = await storage.addAttractionFavorite({
        userId: req.userId!,
        attractionId: req.body.attractionId,
      });
      res.json(fav);
    } catch (error) {
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  app.delete("/api/attraction-favorites/:attractionId", requireAuth, async (req, res) => {
    try {
      await storage.removeAttractionFavorite(req.userId!, req.params.attractionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  // Location endpoints
  app.get("/api/locations", requireAuth, async (req, res) => {
    try {
      const userRole = await storage.getUserRole(req.userId!);
      if (!userRole?.tripId) {
        return res.json([]);
      }
      const locations = await storage.getLocationsByTrip(userRole.tripId);
      res.json(locations);
    } catch (error) {
      console.error("Failed to get locations:", error);
      res.status(500).json({ error: "Failed to get locations" });
    }
  });

  app.post("/api/locations", requireAuth, async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return res.status(400).json({ error: "Invalid coordinates" });
      }
      
      const userRole = await storage.getUserRole(req.userId!);
      if (!userRole?.tripId) {
        return res.status(400).json({ error: "No trip assigned" });
      }
      
      const location = await storage.updateUserLocation(req.userId!, userRole.tripId, latitude, longitude);
      res.json(location);
    } catch (error) {
      console.error("Failed to update location:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  app.get("/api/my-location", requireAuth, async (req, res) => {
    try {
      const location = await storage.getUserLocation(req.userId!);
      res.json(location || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to get location" });
    }
  });

  // Devotional Courses Admin endpoints
  app.get("/api/admin/trips/:tripId/devotional-courses", requireAdmin, async (req, res) => {
    try {
      const courses = await storage.getDevotionalCourses(req.params.tripId);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch devotional courses" });
    }
  });

  app.post("/api/admin/trips/:tripId/devotional-courses", requireAdmin, async (req, res) => {
    try {
      const course = await storage.createDevotionalCourse({
        ...req.body,
        tripId: req.params.tripId,
      });
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to create devotional course" });
    }
  });

  app.patch("/api/admin/devotional-courses/:id", requireAdmin, async (req, res) => {
    try {
      const course = await storage.updateDevotionalCourse(req.params.id, req.body);
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to update devotional course" });
    }
  });

  app.delete("/api/admin/devotional-courses/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteDevotionalCourse(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete devotional course" });
    }
  });

  // Trip Invitations Admin endpoints
  app.get("/api/admin/trip-invitations", requireAdmin, async (req, res) => {
    try {
      const invitations = await storage.getAllTripInvitations();
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trip invitations" });
    }
  });

  app.get("/api/admin/trips/:tripId/invitations", requireAdmin, async (req, res) => {
    try {
      const invitations = await storage.getTripInvitations(req.params.tripId);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trip invitations" });
    }
  });

  app.post("/api/admin/trips/:tripId/invitations", requireAdmin, async (req, res) => {
    try {
      const { description, maxUses, expiresAt } = req.body;
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      
      const invitation = await storage.createTripInvitation({
        tripId: req.params.tripId,
        code,
        description,
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      });
      res.json(invitation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create invitation" });
    }
  });

  app.patch("/api/admin/trip-invitations/:id", requireAdmin, async (req, res) => {
    try {
      const invitation = await storage.updateTripInvitation(req.params.id, req.body);
      res.json(invitation);
    } catch (error) {
      res.status(500).json({ error: "Failed to update invitation" });
    }
  });

  app.delete("/api/admin/trip-invitations/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteTripInvitation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete invitation" });
    }
  });

  // User verification endpoint - verify invitation code and join trip
  app.post("/api/verify-invitation", requireAuth, async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: "驗證碼不可為空" });
      }

      const invitation = await storage.getTripInvitationByCode(code.toUpperCase());
      if (!invitation) {
        return res.status(404).json({ error: "驗證碼無效" });
      }

      if (!invitation.isActive) {
        return res.status(400).json({ error: "此驗證碼已停用" });
      }

      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).json({ error: "此驗證碼已過期" });
      }

      if (invitation.maxUses && invitation.usedCount >= invitation.maxUses) {
        return res.status(400).json({ error: "此驗證碼已達使用上限" });
      }

      // Check if user already has a role for this trip
      const existingRole = await storage.getUserRole(req.userId!);
      if (existingRole && existingRole.tripId === invitation.tripId) {
        return res.status(400).json({ error: "您已加入此旅程" });
      }

      // Update or create user role for this trip
      if (existingRole) {
        await storage.updateUserRoleTrip(existingRole.id, invitation.tripId);
      } else {
        await storage.createUserRole({
          userId: req.userId!,
          role: "member",
          tripId: invitation.tripId,
        });
      }

      // Increment used count
      await storage.incrementInvitationUsedCount(invitation.id);

      // Get the trip info to return
      const trip = await storage.getTrip(invitation.tripId);

      res.json({ success: true, trip, message: "成功加入旅程！" });
    } catch (error) {
      console.error("Failed to verify invitation:", error);
      res.status(500).json({ error: "驗證失敗，請稍後再試" });
    }
  });

  // Check if user needs to verify (no trip assigned)
  app.get("/api/check-trip-status", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;
      console.log("[check-trip-status] userId:", userId);

      const userRole = await storage.getUserRole(userId);
      console.log("[check-trip-status] userRole:", JSON.stringify(userRole));

      if (userRole && userRole.tripId) {
        const trip = await storage.getTrip(userRole.tripId);
        return res.json({ needsVerification: false, trip });
      }

      const isAdmin = await storage.hasRole(userId, "admin");
      console.log("[check-trip-status] isAdmin:", isAdmin);
      if (isAdmin) {
        const allRoles = await storage.getAllUserRolesForUser(userId);
        const roleWithTrip = allRoles.find(r => r.tripId);
        if (roleWithTrip) {
          const trip = await storage.getTrip(roleWithTrip.tripId!);
          return res.json({ needsVerification: false, trip, isAdmin: true });
        }
        return res.json({ needsVerification: false, isAdmin: true });
      }

      return res.json({ needsVerification: true });
    } catch (error) {
      console.error("[check-trip-status] error:", error);
      res.status(500).json({ error: "Failed to check trip status" });
    }
  });
}
