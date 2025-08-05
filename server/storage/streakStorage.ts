import { student_streaks, type StudentStreak, type InsertStudentStreak } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { db } from "../db";

export class StreakStorage {
  async getStudentStreak(studentId: string): Promise<StudentStreak | undefined> {
    try {
      const result = await db.select().from(student_streaks).where(eq(student_streaks.student_id, studentId));
      return result[0];
    } catch (error) {
      console.error('Error fetching student streak:', error);
      throw error;
    }
  }

  async updateStudentStreak(studentId: string): Promise<StudentStreak> {
    try {
      // This would typically involve complex logic for streak calculation
      // For now, returning a basic implementation
      const existing = await this.getStudentStreak(studentId);
      
      if (existing) {
        // Update existing streak
        const result = await db.update(student_streaks)
          .set({ 
            current_streak: existing.current_streak + 1,
            last_activity_date: new Date()
          })
          .where(eq(student_streaks.student_id, studentId))
          .returning();
        return result[0];
      } else {
        // Create new streak
        const streakData: InsertStudentStreak = {
          student_id: studentId,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: new Date()
        };
        const result = await db.insert(student_streaks).values(streakData).returning();
        return result[0];
      }
    } catch (error) {
      console.error('Error updating student streak:', error);
      throw error;
    }
  }

  async getStreakLeaderboard(limit: number = 10): Promise<StudentStreak[]> {
    try {
      return await db.select()
        .from(student_streaks)
        .orderBy(desc(student_streaks.current_streak))
        .limit(limit);
    } catch (error) {
      console.error('Error fetching streak leaderboard:', error);
      throw error;
    }
  }
}