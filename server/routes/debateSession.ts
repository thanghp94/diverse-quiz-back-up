import type { Express } from "express";
import { ExternalDbService } from "../externalDb";
import { nanoid } from "nanoid";

const externalDbService = new ExternalDbService();

export function debateSessionRoutes(app: Express) {
  // Get all debate sessions
  app.get("/api/debate-sessions", async (req, res) => {
    try {
      const sessions = await externalDbService.getDebateSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching debate sessions:", error);
      res.status(500).json({ message: "Failed to fetch debate sessions" });
    }
  });

  // Create new debate session
  app.post("/api/debate-sessions", async (req, res) => {
    try {
      const sessionData = {
        id: nanoid(),
        session_type: "debate",
        ...req.body,
        created_by: req.body.created_by || "admin", // Should come from auth in real app
      };

      const newSession = await externalDbService.createDebateSession(sessionData);
      res.status(201).json(newSession);
    } catch (error) {
      console.error("Error creating debate session:", error);
      res.status(500).json({ message: "Failed to create debate session" });
    }
  });

  // Update debate session
  app.put("/api/debate-sessions/:id", async (req, res) => {
    try {
      const updatedSession = await externalDbService.updateDebateSession(req.params.id, req.body);
      
      if (updatedSession) {
        res.json(updatedSession);
      } else {
        res.status(404).json({ message: "Session not found" });
      }
    } catch (error) {
      console.error("Error updating debate session:", error);
      res.status(500).json({ message: "Failed to update debate session" });
    }
  });

  // Delete debate session
  app.delete("/api/debate-sessions/:id", async (req, res) => {
    try {
      const deletedSession = await externalDbService.deleteDebateSession(req.params.id);

      if (deletedSession) {
        res.json({ message: "Session deleted successfully" });
      } else {
        res.status(404).json({ message: "Session not found" });
      }
    } catch (error) {
      console.error("Error deleting debate session:", error);
      res.status(500).json({ message: "Failed to delete debate session" });
    }
  });

  // Get session registrations with team details
  app.get("/api/debate-sessions/:id/registrations", async (req, res) => {
    try {
      const registrations = await externalDbService.getSessionRegistrations(req.params.id);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching session registrations:", error);
      res.status(500).json({ message: "Failed to fetch session registrations" });
    }
  });

  // Register team for debate session
  app.post("/api/debate-sessions/:id/register", async (req, res) => {
    try {
      const { team_id, notes } = req.body;

      // Check if team is already registered for this session
      const existingRegistration = await externalDbService.checkExistingRegistration(req.params.id, team_id);

      if (existingRegistration) {
        return res.status(400).json({ message: "Team is already registered for this session" });
      }

      const registrationData = {
        id: nanoid(),
        session_id: req.params.id,
        team_id,
        registration_status: "pending",
        notes,
        registered_by: req.body.registered_by || "admin",
      };

      const newRegistration = await externalDbService.registerTeamForSession(registrationData);
      res.status(201).json(newRegistration);
    } catch (error) {
      console.error("Error registering team:", error);
      res.status(500).json({ message: "Failed to register team" });
    }
  });

  // Update registration status
  app.put("/api/session-registrations/:id", async (req, res) => {
    try {
      const updatedRegistration = await externalDbService.updateRegistration(req.params.id, req.body);

      if (updatedRegistration) {
        res.json(updatedRegistration);
      } else {
        res.status(404).json({ message: "Registration not found" });
      }
    } catch (error) {
      console.error("Error updating registration:", error);
      res.status(500).json({ message: "Failed to update registration" });
    }
  });

  // Cancel registration
  app.delete("/api/session-registrations/:id", async (req, res) => {
    try {
      const deletedRegistration = await externalDbService.deleteRegistration(req.params.id);

      if (deletedRegistration) {
        res.json({ message: "Registration cancelled successfully" });
      } else {
        res.status(404).json({ message: "Registration not found" });
      }
    } catch (error) {
      console.error("Error cancelling registration:", error);
      res.status(500).json({ message: "Failed to cancel registration" });
    }
  });

  // Note: Teams routes are now handled by the dedicated teams router in routes/teams.ts

  // Get teams by year and round for session registration
  app.get("/api/teams/available", async (req, res) => {
    try {
      const { year, round } = req.query;
      
      const filters: any = {};
      if (year) filters.year = year as string;
      if (round) filters.round = round as string;

      const availableTeams = await externalDbService.getTeams(filters);
      res.json(availableTeams);
    } catch (error) {
      console.error("Error fetching available teams:", error);
      res.status(500).json({ message: "Failed to fetch available teams" });
    }
  });
}