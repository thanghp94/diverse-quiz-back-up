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

  // Login endpoint for students
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { identifier, password } = req.body;
      
      if (!identifier || !password) {
        return res.status(400).json({ message: "Student ID/Email and password are required" });
      }

      // For now, we'll use a simple hardcoded password check for GV0002
      // In production, implement proper password verification
      if (identifier === "GV0002" && password === "password") {
        // Fetch user from database
        const { UserStorage } = await import("../storage/userStorage");
        const userStorage = new UserStorage();
        const user = await userStorage.getUser("GV0002");
        
        if (user) {
          // Set session
          (req.session as any).userId = user.id;
          (req.session as any).user = user;
          
          res.json({ 
            message: "Login successful",
            user: {
              id: user.id,
              name: user.full_name,
              email: user.email,
              category: user.category
            }
          });
        } else {
          res.status(404).json({ message: "User not found" });
        }
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/user", (req, res) => {
    if ((req.session as any)?.user) {
      res.json({ user: (req.session as any).user });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
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