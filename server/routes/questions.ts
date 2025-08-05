import type { Express } from "express";
import { QuestionStorage } from "../storage/questionStorage";

const questionStorage = new QuestionStorage();

export function questionRoutes(app: Express) {
  // Get all questions or filtered by content/topic/level
  app.get("/api/questions", async (req, res) => {
    try {
      const { contentId, topicId, level } = req.query;
      const questions = await questionStorage.getQuestions(
        contentId as string,
        topicId as string,
        level as string
      );
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Get question by ID
  app.get("/api/questions/:id", async (req, res) => {
    try {
      const question = await questionStorage.getQuestionById(req.params.id);
      if (question) {
        res.json(question);
      } else {
        res.status(404).json({ message: "Question not found" });
      }
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ message: "Failed to fetch question" });
    }
  });
}