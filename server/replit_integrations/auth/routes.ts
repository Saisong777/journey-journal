import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { storage } from "../../storage";

export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user (Replit Auth)
  app.get("/api/auth/replit-user", isAuthenticated, async (req: any, res) => {
    try {
      const replitId = req.user.claims.sub;
      const user = await authStorage.getUserByReplitId(replitId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get profile and role
      const profile = await storage.getProfile(user.id);
      const userRole = await storage.getUserRole(user.id);
      
      res.json({ 
        user: { id: user.id, email: user.email },
        profile,
        role: userRole?.role,
        tripId: userRole?.tripId,
      });
    } catch (error) {
      console.error("Error fetching Replit user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Create profile for Replit Auth user if doesn't exist
  app.post("/api/auth/replit-setup", isAuthenticated, async (req: any, res) => {
    try {
      const replitId = req.user.claims.sub;
      const user = await authStorage.getUserByReplitId(replitId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if profile exists
      let profile = await storage.getProfile(user.id);
      if (!profile) {
        // Create profile
        const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "用戶";
        profile = await storage.createProfile({
          userId: user.id,
          name,
          email: user.email,
          avatarUrl: user.profileImageUrl || undefined,
        });
      }

      // Check if user role exists
      let userRole = await storage.getUserRole(user.id);
      if (!userRole) {
        userRole = await storage.createUserRole({
          userId: user.id,
          tripId: null,
          role: "member",
        });
      }

      res.json({ 
        user: { id: user.id, email: user.email },
        profile,
        role: userRole.role,
        tripId: userRole.tripId,
      });
    } catch (error) {
      console.error("Error setting up Replit user:", error);
      res.status(500).json({ message: "Failed to setup user" });
    }
  });
}
