import { questions, type Question } from "@shared/schema";
import { eq, sql, and, inArray } from "drizzle-orm";
import { db } from "../db";

export class QuestionStorage {
  async getQuestions(contentId?: string, topicId?: string, level?: string): Promise<Question[]> {
    try {
      console.log('Fetching questions with params:', { contentId, topicId, level });
      
      let query = db.select().from(questions) as any;
      
      // Build WHERE conditions dynamically
      const conditions = [];
      
      if (contentId) {
        conditions.push(eq(questions.contentid, contentId));
      }
      
      if (topicId) {
        // For topic-level queries, find all content in this topic first, then get questions for that content
        const contentQuery = db.select({ id: sql`content.id` })
          .from(sql`content`)
          .where(sql`content.topicid = ${topicId}`);
        
        // Get content IDs for this topic
        const topicContent = await db.execute(sql`
          SELECT id FROM content WHERE topicid = ${topicId}
        `);
        
        if (topicContent.rows.length > 0) {
          const contentIds = topicContent.rows.map((row: any) => row.id);
          console.log(`Found ${contentIds.length} content items in topic ${topicId}: ${contentIds.slice(0, 3).join(', ')}...`);
          
          // Debug: Check if any questions exist for these content IDs
          const questionCheck = await db.execute(sql`
            SELECT COUNT(*) as count FROM question WHERE contentid IN (${contentIds.map(id => `'${id}'`).join(', ')})
          `);
          console.log(`Total questions found for content IDs: ${questionCheck.rows[0]?.count || 0}`);
          
          // If level is specified, also check level-specific count
          if (level) {
            const levelCondition = level.toLowerCase() === 'easy' ? 'easy' : 
                                 level.toLowerCase() === 'hard' ? 'Hard' : level;
            const levelCheck = await db.execute(sql`
              SELECT COUNT(*) as count FROM question 
              WHERE contentid IN (${contentIds.map(id => `'${id}'`).join(', ')}) 
              AND questionlevel = ${levelCondition}
            `);
            console.log(`${level} level questions found: ${levelCheck.rows[0]?.count || 0}`);
          }
          
          // Add condition to find questions for any of these content IDs using Drizzle's inArray
          conditions.push(inArray(questions.contentid, contentIds));
        } else {
          console.log(`No content found for topic ${topicId}`);
          return []; // No content in this topic
        }
      }
      
      if (level) {
        // Handle case-insensitive level matching
        if (level.toLowerCase() === 'easy') {
          conditions.push(eq(questions.questionlevel, 'easy'));
        } else if (level.toLowerCase() === 'hard') {
          conditions.push(eq(questions.questionlevel, 'Hard'));
        } else if (level === 'Overview') {
          // For overview, get questions of all levels, limit to 50 for performance
          // Don't add level condition, but limit results
        } else {
          conditions.push(eq(questions.questionlevel, level));
        }
      }
      
      // Apply conditions if any exist
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // For Overview level, limit to 50 questions max
      // For Easy/Hard, limit to 50 questions as requested
      if (level === 'Overview' || level === 'Easy' || level === 'Hard') {
        query = query.limit(50);
      }
      
      const result = await query;
      console.log(`Found ${result.length} questions for topic ${topicId}, level ${level}`);
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