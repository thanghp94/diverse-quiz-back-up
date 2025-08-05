import type { Express } from "express";
import { MatchingStorage } from "../storage/matchingStorage";

const matchingStorage = new MatchingStorage();

export function matchingRoutes(app: Express) {
  // Get all matching activities
  app.get("/api/matching", async (req, res) => {
    try {
      const matching = await matchingStorage.getMatchingActivities();
      res.json(matching);
    } catch (error) {
      console.error("Error fetching matching activities:", error);
      res.status(500).json({ message: "Failed to fetch matching activities" });
    }
  });

  // Get matching by topic ID
  app.get("/api/matching/topic/:topicId", async (req, res) => {
    try {
      const matching = await matchingStorage.getMatchingByTopicId(req.params.topicId);
      res.json(matching);
    } catch (error) {
      console.error("Error fetching matching by topic:", error);
      res.status(500).json({ message: "Failed to fetch matching by topic" });
    }
  });

  // Get matching by ID
  app.get("/api/matching/:id", async (req, res) => {
    try {
      const matching = await matchingStorage.getMatchingById(req.params.id);
      if (matching) {
        res.json(matching);
      } else {
        res.status(404).json({ message: "Matching activity not found" });
      }
    } catch (error) {
      console.error("Error fetching matching activity:", error);
      res.status(500).json({ message: "Failed to fetch matching activity" });
    }
  });

  // Create new matching activity
  app.post("/api/matching", async (req, res) => {
    try {
      const newMatching = await matchingStorage.createMatching(req.body);
      res.status(201).json(newMatching);
    } catch (error) {
      console.error("Error creating matching activity:", error);
      res.status(500).json({ message: "Failed to create matching activity" });
    }
  });
}