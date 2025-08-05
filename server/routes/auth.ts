import type { Express } from "express";
import { getSessionMiddleware } from "../sessionAuth";
import { setupGoogleAuth } from "../googleAuth";

export function authRoutes(app: Express) {
  // Session middleware setup
  app.use(getSessionMiddleware());
  
  // Setup Google OAuth routes (if configured)
  setupGoogleAuth(app);

  // Current user endpoint (legacy)
  app.get("/api/current-user", (req, res) => {
    const session = req.session as any;
    if (session?.user && session?.userId) {
      res.json({ user: session.user });
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

      // For now, we'll use a simple hardcoded password check
      // In production, implement proper password verification
      
      // Import user storage
      const { UserStorage } = await import("../storage/userStorage");
      const userStorage = new UserStorage();
      
      // Try to find user by identifier (ID, email, or meraki email)
      let user = null;
      
      // First try to get user by ID
      if (identifier.match(/^[A-Z]{2}\d{4}$/)) {
        user = await userStorage.getUser(identifier);
      } else {
        user = await userStorage.getUserByIdentifier(identifier);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Accept "Meraki123" as the default password for all users
      const validPassword = password === "Meraki123" || 
                           (user.category === "Teacher" && password === "password");
      
      if (validPassword) {
        // Set session with proper data structure
        (req.session as any).userId = user.id;
        (req.session as any).user = user;
        
        // Save session explicitly to ensure persistence
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Session error" });
          }
          
          res.json({ 
            message: "Login successful",
            user: {
              id: user.id,
              name: user.full_name || `${user.first_name} ${user.last_name}`,
              email: user.email,
              category: user.category
            }
          });
        });
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
    const session = req.session as any;
    if (session?.user && session?.userId) {
      res.json(session.user);
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