import type { Express } from "express";
import { UserStorage } from "../storage/userStorage";

const userStorage = new UserStorage();

export function userRoutes(app: Express) {
  // Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await userStorage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await userStorage.getUser(req.params.id);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user
  app.put("/api/users/:id", async (req, res) => {
    try {
      const updatedUser = await userStorage.updateUser(req.params.id, req.body);
      if (updatedUser) {
        res.json(updatedUser);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Create user
  app.post("/api/users", async (req, res) => {
    try {
      const newUser = await userStorage.createUser(req.body);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Toggle user active status
  app.patch("/api/users/:id/toggle-status", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedUser = await userStorage.toggleUserStatus(id);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error toggling user status:", error);
      res.status(500).json({ message: "Failed to toggle user status" });
    }
  });

  // Add medal result
  app.post("/api/users/:id/medal-result", async (req, res) => {
    try {
      const { id } = req.params;
      const medalData = req.body;
      
      // Structure the medal data as JSON
      const medalResult = {
        year: medalData.year,
        division: medalData.division,
        round: medalData.round === 'custom' ? medalData.customRound : medalData.round,
        teamNumber: medalData.teamNumber,
        categories: {}
      };
      
      // Process categories to create proper medal strings
      if (medalData.categories) {
        Object.keys(medalData.categories).forEach(categoryKey => {
          const category = medalData.categories[categoryKey];
          if (category.type && category.type !== 'none') {
            medalResult.categories[categoryKey] = category.number ? 
              `${category.type}${category.number}` : category.type;
          }
        });
      }
      
      // Get current user to update medal_results_jsonb
      const currentUser = await userStorage.getUser(id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get existing medal results or initialize empty array
      const existingResults = currentUser.medal_results_jsonb || [];
      const newResults = Array.isArray(existingResults) ? [...existingResults, medalResult] : [medalResult];
      
      // Update user with new medal results
      const updatedUser = await userStorage.updateUser(id, { 
        medal_results_jsonb: newResults 
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error adding medal result:", error);
      res.status(500).json({ message: "Failed to add medal result" });
    }
  });
}