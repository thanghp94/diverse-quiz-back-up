import type { Express } from "express";
import { ContentStorage } from "../storage/contentStorage";

const contentStorage = new ContentStorage();

export function contentRoutes(app: Express) {
  // Get all content or content by topic
  app.get("/api/content", async (req, res) => {
    try {
      const topicId = req.query.topicId as string;
      const content = await contentStorage.getContent(topicId);
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // Get content by ID
  app.get("/api/content/:id", async (req, res) => {
    try {
      const content = await contentStorage.getContentById(req.params.id);
      if (content) {
        res.json(content);
      } else {
        res.status(404).json({ message: "Content not found" });
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // Update content
  app.put("/api/content/:id", async (req, res) => {
    try {
      const updatedContent = await contentStorage.updateContent(req.params.id, req.body);
      if (updatedContent) {
        res.json(updatedContent);
      } else {
        res.status(404).json({ message: "Content not found" });
      }
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  // Update content (PATCH)
  app.patch("/api/content/:id", async (req, res) => {
    try {
      const updatedContent = await contentStorage.updateContent(req.params.id, req.body);
      if (updatedContent) {
        res.json(updatedContent);
      } else {
        res.status(404).json({ message: "Content not found" });
      }
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  // Create content
  app.post("/api/content", async (req, res) => {
    try {
      const newContent = await contentStorage.createContent(req.body);
      res.status(201).json(newContent);
    } catch (error) {
      console.error("Error creating content:", error);
      res.status(500).json({ message: "Failed to create content" });
    }
  });

  // Reorder content positions
  app.post("/api/content/reorder", async (req, res) => {
    try {
      const { items } = req.body; // Array of {id, position} objects
      const result = await contentStorage.reorderContent(items);
      res.json(result);
    } catch (error) {
      console.error("Error reordering content:", error);
      res.status(500).json({ message: "Failed to reorder content" });
    }
  });

  // Get content groups
  app.get("/api/content-groups", async (req, res) => {
    try {
      const groups = await contentStorage.getContentGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching content groups:", error);
      res.status(500).json({ message: "Failed to fetch content groups" });
    }
  });

  // Get content by group
  app.get("/api/content-groups/:group", async (req, res) => {
    try {
      const content = await contentStorage.getContentByGroup(req.params.group);
      res.json(content);
    } catch (error) {
      console.error("Error fetching content by group:", error);
      res.status(500).json({ message: "Failed to fetch content by group" });
    }
  });
}