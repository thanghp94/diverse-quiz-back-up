import { topics, type Topic } from "@shared/schema";
import { eq, sql, asc, inArray } from "drizzle-orm";
import { db } from "../db";

export class TopicStorage {
  async getTopics(): Promise<Topic[]> {
    try {
      return await db.select().from(topics);
    } catch (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }
  }

  async getBowlChallengeTopics(): Promise<Topic[]> {
    try {
      // Return specific bowl and challenge topics by ID
      // Ordered alphabetically by topic name
      const allowedTopicIds = [
        '6b3993f5',
        'dbc19831',
        '0fa0d1be',
        'ed0ccd11',
        'fe8bb008',
        'f2295242',
        '7bbaacd1',
        '3fc42ab6',
        '0097d01d',
        'af9decc8',
        'ac34b3f2',
        '81b82b4c',
        '9f218f5b'
      ];
      
      return await db.select().from(topics)
        .where(inArray(topics.id, allowedTopicIds))
        .orderBy(asc(topics.topic));
    } catch (error) {
      console.error('Error fetching bowl challenge topics:', error);
      throw error;
    }
  }

  async getTopicById(id: string): Promise<Topic | undefined> {
    try {
      const result = await db.select().from(topics).where(eq(topics.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching topic by ID:', error);
      throw error;
    }
  }

  async updateTopic(topicId: string, updateData: Partial<Topic>): Promise<Topic | undefined> {
    try {
      const result = await db.update(topics)
        .set(updateData)
        .where(eq(topics.id, topicId))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating topic:', error);
      throw error;
    }
  }

  async createTopic(topicData: any): Promise<Topic> {
    try {
      const result = await db.insert(topics).values(topicData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  }

  async reorderTopics(items: Array<{ id: string; position: number }>): Promise<{ success: boolean; message: string }> {
    try {
      // Update each topic's order field based on position
      for (const item of items) {
        await db.update(topics)
          .set({ parentid: item.position.toString() }) // Using parentid field for ordering for now
          .where(eq(topics.id, item.id));
      }
      
      return { success: true, message: 'Topics reordered successfully' };
    } catch (error) {
      console.error('Error reordering topics:', error);
      throw error;
    }
  }

  // New method to get subtopics by parent ID
  async getSubtopicsByParentId(parentId: string): Promise<Topic[]> {
    try {
      return await db.select().from(topics).where(eq(topics.parentid, parentId)).orderBy(asc(topics.topic));
    } catch (error) {
      console.error('Error fetching subtopics by parent ID:', error);
      throw error;
    }
  }
}
