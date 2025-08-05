import type { Express } from "express";
import { AssignmentStorage } from "../storage/assignmentStorage";

const assignmentStorage = new AssignmentStorage();

export function assignmentRoutes(app: Express) {
  // Get all assignments
  app.get("/api/assignments", async (req, res) => {
    try {
      const assignments = await assignmentStorage.getAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  // Get assignment by ID
  app.get("/api/assignments/:id", async (req, res) => {
    try {
      const assignment = await assignmentStorage.getAssignmentById(req.params.id);
      if (assignment) {
        res.json(assignment);
      } else {
        res.status(404).json({ message: "Assignment not found" });
      }
    } catch (error) {
      console.error("Error fetching assignment:", error);
      res.status(500).json({ message: "Failed to fetch assignment" });
    }
  });

  // Get student tries
  app.get("/api/student-tries", async (req, res) => {
    try {
      const { studentId, assignmentId } = req.query;
      const tries = await assignmentStorage.getStudentTries(
        studentId as string,
        assignmentId as string
      );
      res.json(tries);
    } catch (error) {
      console.error("Error fetching student tries:", error);
      res.status(500).json({ message: "Failed to fetch student tries" });
    }
  });

  // Create student try
  app.post("/api/student-tries", async (req, res) => {
    try {
      const newTry = await assignmentStorage.createStudentTry(req.body);
      res.status(201).json(newTry);
    } catch (error) {
      console.error("Error creating student try:", error);
      res.status(500).json({ message: "Failed to create student try" });
    }
  });

  // Create assignment student try (quiz sessions)
  app.post("/api/assignment-student-tries", async (req, res) => {
    try {
      console.log('Creating assignment student try:', req.body);
      const newTry = await assignmentStorage.createAssignmentStudentTry(req.body);
      res.json(newTry);
    } catch (error) {
      console.error("Error creating assignment student try:", error);
      res.status(500).json({ message: "Failed to create assignment student try" });
    }
  });
}