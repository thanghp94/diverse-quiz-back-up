import type { Express } from "express";
import { TopicStorage } from "../storage/topicStorage";

const topicStorage = new TopicStorage();

export function topicRoutes(app: Express) {
  // Get all topics
  app.get("/api/topics", async (req, res) => {
    try {
      const topics = await topicStorage.getTopics();
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  // Get bowl challenge topics
  app.get("/api/topics/bowl-challenge", async (req, res) => {
    try {
      const topics = await topicStorage.getBowlChallengeTopics();
      res.json(topics);
    } catch (error) {
      console.error("Error fetching bowl challenge topics:", error);
      res.status(500).json({ message: "Failed to fetch bowl challenge topics" });
    }
  });

  // Get topic by ID
  app.get("/api/topics/:id", async (req, res) => {
    try {
      const topic = await topicStorage.getTopicById(req.params.id);
      if (topic) {
        res.json(topic);
      } else {
        res.status(404).json({ message: "Topic not found" });
      }
    } catch (error) {
      console.error("Error fetching topic:", error);
      res.status(500).json({ message: "Failed to fetch topic" });
    }
  });

  // Update topic
  app.put("/api/topics/:id", async (req, res) => {
    try {
      const updatedTopic = await topicStorage.updateTopic(req.params.id, req.body);
      if (updatedTopic) {
        res.json(updatedTopic);
      } else {
        res.status(404).json({ message: "Topic not found" });
      }
    } catch (error) {
      console.error("Error updating topic:", error);
      res.status(500).json({ message: "Failed to update topic" });
    }
  });

  // Create topic
  app.post("/api/topics", async (req, res) => {
    try {
      const newTopic = await topicStorage.createTopic(req.body);
      res.status(201).json(newTopic);
    } catch (error) {
      console.error("Error creating topic:", error);
      res.status(500).json({ message: "Failed to create topic" });
    }
  });

  // Reorder topics positions
  app.post("/api/topics/reorder", async (req, res) => {
    try {
      const { items } = req.body; // Array of {id, position} objects
      const result = await topicStorage.reorderTopics(items);
      res.json(result);
    } catch (error) {
      console.error("Error reordering topics:", error);
      res.status(500).json({ message: "Failed to reorder topics" });
    }
  });
}