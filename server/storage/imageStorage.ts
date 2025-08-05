import { images, type Image } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

export class ImageStorage {
  async getImages(): Promise<Image[]> {
    try {
      return await db.select().from(images);
    } catch (error) {
      console.error('Error fetching images:', error);
      throw error;
    }
  }

  async getImageById(id: string): Promise<Image | undefined> {
    try {
      const result = await db.select().from(images).where(eq(images.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching image by ID:', error);
      throw error;
    }
  }
}