import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { insertTripSchema, insertGroupSchema, insertJournalEntrySchema, insertDevotionalEntrySchema } from "@shared/schema";

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

// In-memory token store (in production, use Redis or database)
const tokenStore = new Map<string, { userId: string; expiresAt: Date }>();

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Middleware to extract user from token or session
async function extractUser(req: Request, res: Response, next: NextFunction) {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const tokenData = tokenStore.get(token);
    if (tokenData && tokenData.expiresAt > new Date()) {
      req.userId = tokenData.userId;
    }
  }
  
  // Fall back to session
  if (!req.userId && req.session.userId) {
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
      
      // Auto-assign new user to the first available trip as a member
      const trips = await storage.getTrips();
      if (trips.length > 0) {
        await storage.createUserRole({
          userId: user.id,
          tripId: trips[0].id,
          role: "member",
        });
        console.log(`Auto-assigned user ${email} to trip ${trips[0].title}`);
      }
      
      // Generate auth token
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      tokenStore.set(token, { userId: user.id, expiresAt });
      
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

      // Check if user has a role with a trip, if not auto-assign
      const userRole = await storage.getUserRole(user.id);
      if (!userRole || !userRole.tripId) {
        const trips = await storage.getTrips();
        if (trips.length > 0) {
          if (!userRole) {
            await storage.createUserRole({
              userId: user.id,
              tripId: trips[0].id,
              role: "member",
            });
            console.log(`Auto-assigned existing user ${email} to trip ${trips[0].title}`);
          } else {
            // User has a role but no trip, update the role with trip
            await storage.updateUserRoleTrip(userRole.id, trips[0].id);
            console.log(`Updated user ${email} role to include trip ${trips[0].title}`);
          }
        }
      }

      // Generate auth token
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      tokenStore.set(token, { userId: user.id, expiresAt });

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
      const updated = await storage.updateProfile(req.userId!, req.body);
      res.json(updated);
    } catch (error) {
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
      const entries = await storage.getJournalEntries(userRole.tripId, date);
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
}
