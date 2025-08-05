import { debate_submissions, type DebateSubmission, type InsertDebateSubmission } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

export class DebateStorage {
  async getDebateSubmissions(studentId: string): Promise<DebateSubmission[]> {
    try {
      return await db.select().from(debate_submissions).where(eq(debate_submissions.student_id, studentId));
    } catch (error) {
      console.error('Error fetching debate submissions:', error);
      throw error;
    }
  }

  async getDebateSubmissionById(id: string): Promise<DebateSubmission | undefined> {
    try {
      const result = await db.select().from(debate_submissions).where(eq(debate_submissions.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching debate submission by ID:', error);
      throw error;
    }
  }

  async createDebateSubmission(submission: InsertDebateSubmission): Promise<DebateSubmission> {
    try {
      const result = await db.insert(debate_submissions).values(submission).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating debate submission:', error);
      throw error;
    }
  }

  async updateDebateSubmission(id: string, updates: Partial<DebateSubmission>): Promise<DebateSubmission | undefined> {
    try {
      const result = await db.update(debate_submissions)
        .set(updates)
        .where(eq(debate_submissions.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating debate submission:', error);
      throw error;
    }
  }
}