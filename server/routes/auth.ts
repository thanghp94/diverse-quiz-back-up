import type { Express } from "express";
import { getSessionMiddleware } from "../sessionAuth";
import { setupGoogleAuth } from "../googleAuth";

export function authRoutes(app: Express) {
  // Session middleware setup
  app.use(getSessionMiddleware());
  
  // Setup Google OAuth routes (if configured)
  setupGoogleAuth(app);

  // Current user endpoint
  app.get("/api/current-user", (req, res) => {
    if (req.session?.user) {
      res.json({ user: req.session.user });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        res.status(500).json({ message: "Failed to logout" });
      } else {
        res.json({ message: "Logged out successfully" });
      }
    });
  });
}