import { writing_submissions, writing_prompts, type WritingSubmission, type InsertWritingSubmission, type WritingPrompt } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

export class WritingStorage {
  async getWritingSubmissions(studentId: string): Promise<WritingSubmission[]> {
    try {
      return await db.select().from(writing_submissions).where(eq(writing_submissions.student_id, studentId));
    } catch (error) {
      console.error('Error fetching writing submissions:', error);
      throw error;
    }
  }

  async getWritingSubmissionById(id: string): Promise<WritingSubmission | undefined> {
    try {
      const result = await db.select().from(writing_submissions).where(eq(writing_submissions.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching writing submission by ID:', error);
      throw error;
    }
  }

  async createWritingSubmission(submission: InsertWritingSubmission): Promise<WritingSubmission> {
    try {
      const result = await db.insert(writing_submissions).values(submission).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating writing submission:', error);
      throw error;
    }
  }

  async updateWritingSubmission(id: string, updates: Partial<WritingSubmission>): Promise<WritingSubmission | undefined> {
    try {
      const result = await db.update(writing_submissions)
        .set(updates)
        .where(eq(writing_submissions.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating writing submission:', error);
      throw error;
    }
  }

  async getWritingPrompts(): Promise<WritingPrompt[]> {
    try {
      return await db.select().from(writing_prompts);
    } catch (error) {
      console.error('Error fetching writing prompts:', error);
      throw error;
    }
  }
}