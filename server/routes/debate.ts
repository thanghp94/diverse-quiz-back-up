import type { Express } from "express";
import { DebateStorage } from "../storage/debateStorage";

const debateStorage = new DebateStorage();

export function debateRoutes(app: Express) {
  // Get debate submissions for a student
  app.get("/api/debate/submissions/:studentId", async (req, res) => {
    try {
      const submissions = await debateStorage.getDebateSubmissions(req.params.studentId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching debate submissions:", error);
      res.status(500).json({ message: "Failed to fetch debate submissions" });
    }
  });

  // Get debate submission by ID
  app.get("/api/debate/submissions/details/:id", async (req, res) => {
    try {
      const submission = await debateStorage.getDebateSubmissionById(req.params.id);
      if (submission) {
        res.json(submission);
      } else {
        res.status(404).json({ message: "Debate submission not found" });
      }
    } catch (error) {
      console.error("Error fetching debate submission:", error);
      res.status(500).json({ message: "Failed to fetch debate submission" });
    }
  });

  // Create new debate submission
  app.post("/api/debate/submissions", async (req, res) => {
    try {
      const newSubmission = await debateStorage.createDebateSubmission(req.body);
      res.status(201).json(newSubmission);
    } catch (error) {
      console.error("Error creating debate submission:", error);
      res.status(500).json({ message: "Failed to create debate submission" });
    }
  });

  // Update debate submission
  app.put("/api/debate/submissions/:id", async (req, res) => {
    try {
      const updatedSubmission = await debateStorage.updateDebateSubmission(req.params.id, req.body);
      if (updatedSubmission) {
        res.json(updatedSubmission);
      } else {
        res.status(404).json({ message: "Debate submission not found" });
      }
    } catch (error) {
      console.error("Error updating debate submission:", error);
      res.status(500).json({ message: "Failed to update debate submission" });
    }
  });
}