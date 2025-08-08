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
          const category = (medalData.categories as any)[categoryKey];
          if (category && category.type && category.type !== 'none') {
            (medalResult.categories as any)[categoryKey] = category.number ? 
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
      const existingResults = (currentUser as any).medal_results_jsonb || [];
      const newResults = Array.isArray(existingResults) ? [...existingResults, medalResult] : [medalResult];
      
      // Update user with new medal results
      const updatedUser = await userStorage.updateUser(id, { 
        medal_results_jsonb: newResults 
      } as any);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error adding medal result:", error);
      res.status(500).json({ message: "Failed to add medal result" });
    }
  });

  // Get teams for a specific round/year
  app.get("/api/teams/:round/:year", async (req, res) => {
    try {
      const { round, year } = req.params;
      const users = await userStorage.getAllUsers();
      
      const teamsData = users.map(user => {
        const userTeams = (user as any).teams_per_round_jsonb || [];
        const teamForRound = userTeams.find((team: any) => 
          team.round === round && team.year === parseInt(year)
        );
        
        return {
          student_id: user.id,
          student_name: user.full_name || `${user.first_name} ${user.last_name}`,
          team_assignment: teamForRound || null
        };
      });
      
      res.json(teamsData);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  // Assign student to team
  app.post("/api/users/:id/team-assignment", async (req, res) => {
    try {
      const { id } = req.params;
      const { round, year, teamName, teamNumber } = req.body;
      
      if (!round || !year || !teamName) {
        return res.status(400).json({ message: "Round, year, and team name are required" });
      }

      // Get current user
      const currentUser = await userStorage.getUser(id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get existing team assignments or initialize empty array
      const existingTeams = (currentUser as any).teams_per_round_jsonb || [];
      
      // Check if user already has a team assignment for this round/year
      const existingIndex = existingTeams.findIndex((team: any) => 
        team.round === round && team.year === parseInt(year)
      );
      
      const newTeamAssignment = {
        round,
        year: parseInt(year),
        teamName,
        teamNumber: teamNumber || null,
        assignedAt: new Date().toISOString()
      };
      
      let updatedTeams;
      if (existingIndex >= 0) {
        // Update existing assignment
        updatedTeams = [...existingTeams];
        updatedTeams[existingIndex] = newTeamAssignment;
      } else {
        // Add new assignment
        updatedTeams = [...existingTeams, newTeamAssignment];
      }
      
      // Update user with new team assignments
      const updatedUser = await userStorage.updateUser(id, { 
        teams_per_round_jsonb: updatedTeams 
      } as any);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error assigning team:", error);
      res.status(500).json({ message: "Failed to assign team" });
    }
  });

  // Remove student from team
  app.delete("/api/users/:id/team-assignment/:round/:year", async (req, res) => {
    try {
      const { id, round, year } = req.params;
      
      // Get current user
      const currentUser = await userStorage.getUser(id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get existing team assignments
      const existingTeams = (currentUser as any).teams_per_round_jsonb || [];
      
      // Remove the team assignment for this round/year
      const updatedTeams = existingTeams.filter((team: any) => 
        !(team.round === round && team.year === parseInt(year))
      );
      
      // Update user
      const updatedUser = await userStorage.updateUser(id, { 
        teams_per_round_jsonb: updatedTeams 
      } as any);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error removing team assignment:", error);
      res.status(500).json({ message: "Failed to remove team assignment" });
    }
  });

  // Get all available rounds and years
  app.get("/api/teams/rounds-years", async (req, res) => {
    try {
      const users = await userStorage.getAllUsers();
      const roundsYears = new Set<string>();
      
      users.forEach(user => {
        const userTeams = (user as any).teams_per_round_jsonb || [];
        userTeams.forEach((team: any) => {
          if (team.round && team.year) {
            roundsYears.add(`${team.round}-${team.year}`);
          }
        });
      });
      
      const result = Array.from(roundsYears).map(item => {
        const [round, year] = item.split('-');
        return { round, year: parseInt(year) };
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching rounds and years:", error);
      res.status(500).json({ message: "Failed to fetch rounds and years" });
    }
  });
}