import type { Express } from "express";
import { CollectionStorage } from "../storage/collectionStorage";

const collectionStorage = new CollectionStorage();

export function collectionRoutes(app: Express) {
  // Get all collections
  app.get("/api/collections", async (req, res) => {
    try {
      const collections = await collectionStorage.getCollections();
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  // Get collection by route
  app.get("/api/collections/route/:route", async (req, res) => {
    try {
      const collection = await collectionStorage.getCollectionByRoute(`/${req.params.route}`);
      if (collection) {
        res.json(collection);
      } else {
        res.status(404).json({ message: "Collection not found" });
      }
    } catch (error) {
      console.error("Error fetching collection by route:", error);
      res.status(500).json({ message: "Failed to fetch collection" });
    }
  });

  // Get collection by ID
  app.get("/api/collections/:id", async (req, res) => {
    try {
      const collection = await collectionStorage.getCollectionById(req.params.id);
      if (collection) {
        res.json(collection);
      } else {
        res.status(404).json({ message: "Collection not found" });
      }
    } catch (error) {
      console.error("Error fetching collection:", error);
      res.status(500).json({ message: "Failed to fetch collection" });
    }
  });

  // Create collection
  app.post("/api/collections", async (req, res) => {
    try {
      const newCollection = await collectionStorage.createCollection(req.body);
      res.status(201).json(newCollection);
    } catch (error) {
      console.error("Error creating collection:", error);
      res.status(500).json({ message: "Failed to create collection" });
    }
  });

  // Update collection
  app.put("/api/collections/:id", async (req, res) => {
    try {
      const updatedCollection = await collectionStorage.updateCollection(req.params.id, req.body);
      if (updatedCollection) {
        res.json(updatedCollection);
      } else {
        res.status(404).json({ message: "Collection not found" });
      }
    } catch (error) {
      console.error("Error updating collection:", error);
      res.status(500).json({ message: "Failed to update collection" });
    }
  });

  // Delete collection
  app.delete("/api/collections/:id", async (req, res) => {
    try {
      const success = await collectionStorage.deleteCollection(req.params.id);
      if (success) {
        res.json({ message: "Collection deleted successfully" });
      } else {
        res.status(404).json({ message: "Collection not found" });
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ message: "Failed to delete collection" });
    }
  });

  // Get collection content
  app.get("/api/collections/:id/content", async (req, res) => {
    try {
      const content = await collectionStorage.getCollectionContent(req.params.id);
      res.json(content);
    } catch (error) {
      console.error("Error fetching collection content:", error);
      res.status(500).json({ message: "Failed to fetch collection content" });
    }
  });

  // Add content to collection
  app.post("/api/collections/:id/content", async (req, res) => {
    try {
      const mapping = await collectionStorage.addContentToCollection(req.params.id, req.body);
      res.status(201).json(mapping);
    } catch (error) {
      console.error("Error adding content to collection:", error);
      res.status(500).json({ message: "Failed to add content to collection" });
    }
  });

  // Remove content from collection
  app.delete("/api/collections/content/:mappingId", async (req, res) => {
    try {
      const success = await collectionStorage.removeContentFromCollection(req.params.mappingId);
      if (success) {
        res.json({ message: "Content removed from collection successfully" });
      } else {
        res.status(404).json({ message: "Content mapping not found" });
      }
    } catch (error) {
      console.error("Error removing content from collection:", error);
      res.status(500).json({ message: "Failed to remove content from collection" });
    }
  });

  // Reorder collection content
  app.post("/api/collections/:id/reorder", async (req, res) => {
    try {
      const { items } = req.body; // Array of {id, position} objects
      const result = await collectionStorage.reorderCollectionContent(items);
      res.json(result);
    } catch (error) {
      console.error("Error reordering collection content:", error);
      res.status(500).json({ message: "Failed to reorder collection content" });
    }
  });

  // Get content by collection filters
  app.get("/api/collections/:id/filtered-content", async (req, res) => {
    try {
      const collection = await collectionStorage.getCollectionById(req.params.id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      const content = await collectionStorage.getContentByCollectionFilters(collection);
      res.json(content);
    } catch (error) {
      console.error("Error fetching filtered collection content:", error);
      res.status(500).json({ message: "Failed to fetch filtered collection content" });
    }
  });
}