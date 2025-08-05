import { questions, type Question } from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";
import { db } from "../db";

export class QuestionStorage {
  async getQuestions(contentId?: string, topicId?: string, level?: string): Promise<Question[]> {
    try {
      // Use raw SQL to avoid column duplication issues in Drizzle
      let sqlQuery = 'SELECT DISTINCT * FROM question WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;
      
      if (contentId) {
        sqlQuery += ` AND contentid = $${paramIndex}`;
        params.push(contentId);
        paramIndex++;
      }
      if (topicId) {
        sqlQuery += ` AND topic = $${paramIndex}`;
        params.push(topicId);
        paramIndex++;
      }
      if (level) {
        sqlQuery += ` AND questionlevel = $${paramIndex}`;
        params.push(level);
        paramIndex++;
      }
      
      const result = await db.execute(sql.raw(sqlQuery, ...params));
      return result.rows as Question[];
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