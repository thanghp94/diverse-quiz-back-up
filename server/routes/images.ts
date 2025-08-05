import type { Express } from "express";
import { ImageStorage } from "../storage/imageStorage";

const imageStorage = new ImageStorage();

export function imageRoutes(app: Express) {
  // Get all images
  app.get("/api/images", async (req, res) => {
    try {
      const images = await imageStorage.getImages();
      res.json(images);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  // Get image by ID
  app.get("/api/images/:id", async (req, res) => {
    try {
      const image = await imageStorage.getImageById(req.params.id);
      if (image) {
        res.json(image);
      } else {
        res.status(404).json({ message: "Image not found" });
      }
    } catch (error) {
      console.error("Error fetching image:", error);
      res.status(500).json({ message: "Failed to fetch image" });
    }
  });
}