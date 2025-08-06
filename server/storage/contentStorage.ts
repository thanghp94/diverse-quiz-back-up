import { content, type Content } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";

export class ContentStorage {
  async getContent(topicId?: string): Promise<Content[]> {
    try {
      if (topicId) {
        return await db.select().from(content).where(eq(content.topicid, topicId));
      }
      return await db.select().from(content);
    } catch (error) {
      console.error('Error fetching content:', error);
      throw error;
    }
  }

  async getContentById(id: string): Promise<Content | undefined> {
    try {
      const result = await db.select().from(content).where(eq(content.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching content by ID:', error);
      throw error;
    }
  }

  async updateContent(id: string, updates: { 
    short_description?: string; 
    short_blurb?: string; 
    imageid?: string; 
    videoid?: string; 
    videoid2?: string;
    title?: string;
    prompt?: string;
    information?: string;
    topicid?: string;
    challengesubject?: string | string[];
    parentid?: string;
    contentgroup?: string;
    imagelink?: string;
  }): Promise<Content | undefined> {
    try {
      // Handle challengesubject conversion - ensure it's always an array or null
      const processedUpdates: any = { ...updates };
      
      if (updates.challengesubject !== undefined) {
        if (typeof updates.challengesubject === 'string') {
          if (updates.challengesubject.trim() === '') {
            processedUpdates.challengesubject = null;
          } else {
            // Convert comma-separated string to array
            processedUpdates.challengesubject = updates.challengesubject.split(',').map(s => s.trim()).filter(s => s.length > 0);
          }
        } else if (Array.isArray(updates.challengesubject)) {
          processedUpdates.challengesubject = updates.challengesubject.filter(s => s && s.trim().length > 0);
        }
      }

      const result = await db.update(content)
        .set(processedUpdates)
        .where(eq(content.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating content:', error);
      throw error;
    }
  }

  async createContent(contentData: any): Promise<Content> {
    try {
      const result = await db.insert(content).values(contentData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating content:', error);
      throw error;
    }
  }

  async getContentGroups(): Promise<Array<{ contentgroup: string; url: string; content_count: number }>> {
    try {
      const result = await db.execute(sql`
        SELECT contentgroup, url, COUNT(*) as content_count
        FROM content 
        WHERE contentgroup IS NOT NULL 
        GROUP BY contentgroup, url
        ORDER BY contentgroup
      `);
      return result.rows as Array<{ contentgroup: string; url: string; content_count: number }>;
    } catch (error) {
      console.error('Error fetching content groups:', error);
      throw error;
    }
  }

  async getContentByGroup(contentgroup: string): Promise<Content[]> {
    try {
      return await db.select().from(content).where(eq(content.contentgroup, contentgroup));
    } catch (error) {
      console.error('Error fetching content by group:', error);
      throw error;
    }
  }
}