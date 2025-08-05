import { questions, type Question } from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";
import { db } from "../db";

export class QuestionStorage {
  async getQuestions(contentId?: string, topicId?: string, level?: string): Promise<Question[]> {
    try {
      let query = db.select().from(questions);
      
      // Build WHERE conditions dynamically
      const conditions = [];
      
      if (contentId) {
        conditions.push(eq(questions.contentid, contentId));
      }
      if (topicId) {
        conditions.push(eq(questions.topic, topicId));
      }
      if (level) {
        conditions.push(eq(questions.questionlevel, level));
      }
      
      // Apply conditions if any exist
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const result = await query;
      return result;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }

  async getQuestionById(id: string): Promise<Question | undefined> {
    try {
      const result = await db.select().from(questions).where(eq(questions.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching question by ID:', error);
      throw error;
    }
  }
}