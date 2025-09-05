import { Express, Request, Response } from "express";
import { db } from "../db";
import { content_ratings } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export function contentRatingsRoutes(app: Express) {
  // Get content rating by studentId and contentId
  app.get("/api/content-ratings/:studentId/:contentId", async (req: Request, res: Response) => {
    const { studentId, contentId } = req.params;
    try {
      const rating = await db.select()
        .from(content_ratings)
        .where(and(
          eq(content_ratings.student_id, studentId),
          eq(content_ratings.content_id, contentId)
        ))
        .limit(1);

      if (rating.length === 0) {
        return res.status(404).json(null);
      }

      res.json(rating[0]);
    } catch (error) {
      console.error("Error fetching content rating:", error);
      res.status(500).json({ message: "Failed to fetch content rating" });
    }
  });

  // Update or create content rating (including personal_note)
  app.put("/api/content-ratings/:studentId/:contentId", async (req: Request, res: Response) => {
    const { studentId, contentId } = req.params;
    const { personal_note, rating } = req.body;

    try {
      // Check if rating exists
      const existing = await db.select()
        .from(content_ratings)
        .where(and(
          eq(content_ratings.student_id, studentId),
          eq(content_ratings.content_id, contentId)
        ))
        .limit(1);

      if (existing.length === 0) {
        // Insert new record - rating is required in schema, so provide default
        const inserted = await db.insert(content_ratings).values({
          id: uuidv4(),
          student_id: studentId,
          content_id: contentId,
          personal_note: personal_note || null,
          rating: rating || "viewed", // Default rating if not provided
          created_at: new Date(),
          updated_at: new Date(),
        }).returning();

        return res.status(201).json(inserted[0]);
      } else {
        // Update existing record
        const updated = await db.update(content_ratings)
          .set({
            personal_note: personal_note !== undefined ? personal_note : existing[0].personal_note,
            rating: rating !== undefined ? rating : existing[0].rating,
            updated_at: new Date(),
          })
          .where(and(
            eq(content_ratings.student_id, studentId),
            eq(content_ratings.content_id, contentId)
          ))
          .returning();

        return res.json(updated[0]);
      }
    } catch (error) {
      console.error("Error saving content rating:", error);
      res.status(500).json({ message: "Failed to save content rating" });
    }
  });
}
