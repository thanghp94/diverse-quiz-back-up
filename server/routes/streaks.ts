import type { Express } from "express";
import { StreakStorage } from "../storage/streakStorage";

const streakStorage = new StreakStorage();

export function streakRoutes(app: Express) {
  // Get student streak
  app.get("/api/streaks/:studentId", async (req, res) => {
    try {
      const streak = await streakStorage.getStudentStreak(req.params.studentId);
      if (streak) {
        res.json(streak);
      } else {
        res.status(404).json({ message: "Streak not found" });
      }
    } catch (error) {
      console.error("Error fetching streak:", error);
      res.status(500).json({ message: "Failed to fetch streak" });
    }
  });

  // Update student streak
  app.post("/api/streaks/:studentId", async (req, res) => {
    try {
      const updatedStreak = await streakStorage.updateStudentStreak(req.params.studentId);
      res.json(updatedStreak);
    } catch (error) {
      console.error("Error updating streak:", error);
      res.status(500).json({ message: "Failed to update streak" });
    }
  });

  // Get streak leaderboard
  app.get("/api/streaks/leaderboard/:limit?", async (req, res) => {
    try {
      const limit = parseInt(req.params.limit || "10");
      const leaderboard = await streakStorage.getStreakLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching streak leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch streak leaderboard" });
    }
  });
}