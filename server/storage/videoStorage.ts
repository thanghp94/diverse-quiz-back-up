import { videos, type Video } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

export class VideoStorage {
  async getVideos(): Promise<Video[]> {
    try {
      return await db.select().from(videos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      throw error;
    }
  }

  async getVideoById(id: string): Promise<Video | undefined> {
    try {
      const result = await db.select().from(videos).where(eq(videos.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching video by ID:', error);
      throw error;
    }
  }

  async getVideosByContentId(contentId: string): Promise<Video[]> {
    try {
      return await db.select().from(videos).where(eq(videos.contentid, contentId));
    } catch (error) {
      console.error('Error fetching videos by content ID:', error);
      throw error;
    }
  }
}