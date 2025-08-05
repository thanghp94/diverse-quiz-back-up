import type { Express } from "express";
import { VideoStorage } from "../storage/videoStorage";

const videoStorage = new VideoStorage();

export function videoRoutes(app: Express) {
  // Get all videos
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await videoStorage.getVideos();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  // Get video by ID
  app.get("/api/videos/:id", async (req, res) => {
    try {
      const video = await videoStorage.getVideoById(req.params.id);
      if (video) {
        res.json(video);
      } else {
        res.status(404).json({ message: "Video not found" });
      }
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ message: "Failed to fetch video" });
    }
  });

  // Get videos by content ID
  app.get("/api/videos/content/:contentId", async (req, res) => {
    try {
      const videos = await videoStorage.getVideosByContentId(req.params.contentId);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching videos by content:", error);
      res.status(500).json({ message: "Failed to fetch videos by content" });
    }
  });
}