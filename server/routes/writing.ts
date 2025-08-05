import type { Express } from "express";
import { WritingStorage } from "../storage/writingStorage";

const writingStorage = new WritingStorage();

export function writingRoutes(app: Express) {
  // Get writing submissions for a student
  app.get("/api/writing/submissions/:studentId", async (req, res) => {
    try {
      const submissions = await writingStorage.getWritingSubmissions(req.params.studentId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching writing submissions:", error);
      res.status(500).json({ message: "Failed to fetch writing submissions" });
    }
  });

  // Get writing submission by ID
  app.get("/api/writing/submissions/details/:id", async (req, res) => {
    try {
      const submission = await writingStorage.getWritingSubmissionById(req.params.id);
      if (submission) {
        res.json(submission);
      } else {
        res.status(404).json({ message: "Writing submission not found" });
      }
    } catch (error) {
      console.error("Error fetching writing submission:", error);
      res.status(500).json({ message: "Failed to fetch writing submission" });
    }
  });

  // Create new writing submission
  app.post("/api/writing/submissions", async (req, res) => {
    try {
      const {
        student_id,
        content_id,
        content_title,
        outline_data,
        essay_data,
        word_count,
        submitted_at,
        time_spent
      } = req.body;

      // Generate unique ID for writing submission
      const submissionId = 'ws_' + Math.random().toString(36).substr(2, 8);

      // Transform the data to match database schema
      const submissionData = {
        id: submissionId,
        student_id: student_id,
        prompt_id: content_id, // Use content_id as prompt_id
        title: content_title,
        opening_paragraph: essay_data?.introduction || '',
        body_paragraph_1: essay_data?.body1 || '',
        body_paragraph_2: essay_data?.body2 || '',
        body_paragraph_3: essay_data?.body3 || '',
        conclusion_paragraph: essay_data?.conclusion || '',
        full_essay: Object.values(essay_data || {}).join('\n\n'),
        word_count: word_count || 0,
        status: submitted_at ? 'submitted' : 'draft'
      };

      const newSubmission = await writingStorage.createWritingSubmission(submissionData);
      res.status(201).json(newSubmission);
    } catch (error) {
      console.error("Error creating writing submission:", error);
      res.status(500).json({ message: "Failed to create writing submission" });
    }
  });

  // Update writing submission
  app.put("/api/writing/submissions/:id", async (req, res) => {
    try {
      const updatedSubmission = await writingStorage.updateWritingSubmission(req.params.id, req.body);
      if (updatedSubmission) {
        res.json(updatedSubmission);
      } else {
        res.status(404).json({ message: "Writing submission not found" });
      }
    } catch (error) {
      console.error("Error updating writing submission:", error);
      res.status(500).json({ message: "Failed to update writing submission" });
    }
  });

  // Get writing prompts
  app.get("/api/writing/prompts", async (req, res) => {
    try {
      const prompts = await writingStorage.getWritingPrompts();
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching writing prompts:", error);
      res.status(500).json({ message: "Failed to fetch writing prompts" });
    }
  });
}