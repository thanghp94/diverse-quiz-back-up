import { matching, matching_attempts, type Matching, type MatchingAttempt, type InsertMatchingAttempt } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { db } from "../db";

export class MatchingStorage {
  async getMatchingActivities(): Promise<Matching[]> {
    try {
      return await db.select().from(matching);
    } catch (error) {
      console.error('Error fetching matching activities:', error);
      throw error;
    }
  }

  async getMatchingById(id: string): Promise<Matching | undefined> {
    try {
      const result = await db.select().from(matching).where(eq(matching.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching matching by ID:', error);
      throw error;
    }
  }

  async getMatchingByTopicId(topicId: string): Promise<Matching[]> {
    try {
      return await db.select().from(matching).where(eq(matching.topicid, topicId));
    } catch (error) {
      console.error('Error fetching matching by topic ID:', error);
      throw error;
    }
  }

  async createMatching(matchingData: any): Promise<Matching> {
    try {
      const result = await db.insert(matching).values(matchingData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating matching:', error);
      throw error;
    }
  }

  async createMatchingAttempt(attempt: InsertMatchingAttempt): Promise<MatchingAttempt> {
    try {
      const result = await db.insert(matching_attempts).values(attempt).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating matching attempt:', error);
      throw error;
    }
  }

  async getMatchingAttempts(studentId: string, matchingId?: string): Promise<MatchingAttempt[]> {
    try {
      let query = db.select().from(matching_attempts).where(eq(matching_attempts.student_id, studentId));
      
      if (matchingId) {
        return await db.select().from(matching_attempts).where(and(eq(matching_attempts.student_id, studentId), eq(matching_attempts.matching_id, matchingId)));
      }
      
      return await query;
    } catch (error) {
      console.error('Error fetching matching attempts:', error);
      throw error;
    }
  }

  async getMatchingAttemptById(id: string): Promise<MatchingAttempt | undefined> {
    try {
      const result = await db.select().from(matching_attempts).where(eq(matching_attempts.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching matching attempt by ID:', error);
      throw error;
    }
  }

  async updateMatchingAttempt(id: string, updates: Partial<MatchingAttempt>): Promise<MatchingAttempt> {
    try {
      const result = await db.update(matching_attempts)
        .set(updates)
        .where(eq(matching_attempts.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating matching attempt:', error);
      throw error;
    }
  }
}