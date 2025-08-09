import { assignment, assignment_student_try, student_try, users, student_streaks } from "@shared/schema";

type Assignment = typeof assignment.$inferSelect;
type AssignmentStudentTry = typeof assignment_student_try.$inferSelect;
type StudentTry = typeof student_try.$inferSelect;
import { eq, and, ne, count, desc, sql } from "drizzle-orm";
import { db } from "../db";

export class AssignmentStorage {
  async getAssignments(): Promise<Assignment[]> {
    try {
      return await db.select().from(assignment);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  }

  async getAssignmentById(id: string): Promise<Assignment | undefined> {
    try {
      const result = await db.select().from(assignment).where(eq(assignment.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching assignment by ID:', error);
      throw error;
    }
  }

  async createAssignment(assignmentData: any): Promise<Assignment> {
    try {
      console.log('Creating assignment with data:', assignmentData);
      const result = await db.insert(assignment).values(assignmentData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  }

  async getStudentTries(studentId: string, assignmentId?: string): Promise<StudentTry[]> {
    try {
      let query = db.select().from(student_try).where(eq(student_try.hocsinh_id, studentId));
      
      if (assignmentId) {
        return await db.select().from(student_try).where(and(eq(student_try.hocsinh_id, studentId), eq(student_try.assignmentid, assignmentId)));
      }
      
      return await query;
    } catch (error) {
      console.error('Error fetching student tries:', error);
      throw error;
    }
  }

  async createStudentTry(tryData: any): Promise<StudentTry> {
    try {
      // Convert time_start string to Date object for proper timestamp handling
      const processedData = {
        ...tryData,
        time_start: tryData.time_start ? new Date(tryData.time_start) : null,
        time_end: tryData.time_end ? new Date(tryData.time_end) : null
      };
      
      console.log('Creating student try with processed data:', processedData);
      const result = await db.insert(student_try).values(processedData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating student try:', error);
      throw error;
    }
  }

  async createAssignmentStudentTry(tryData: any): Promise<AssignmentStudentTry> {
    try {
      console.log('Creating assignment student try with data:', tryData);
      
      // Map the frontend data to the database schema
      const mappedData = {
        hocsinh_id: tryData.hocsinh_id,
        contentID: tryData.contentID,  // Use contentID as in database
        questionIDs: tryData.questionIDs,
        start_time: tryData.start_time,
        typeoftaking: tryData.typeoftaking
      };
      
      const result = await db.insert(assignment_student_try).values(mappedData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating assignment student try:', error);
      throw error;
    }
  }

  // Get student tries leaderboard - count of tries per student (excluding GV0002)
  async getStudentTriesLeaderboard(): Promise<any[]> {
    try {
      const result = await db
        .select({
          student_id: student_try.hocsinh_id,
          total_tries: count(student_try.id),
          full_name: users.full_name
        })
        .from(student_try)
        .leftJoin(users, eq(student_try.hocsinh_id, users.id))
        .where(ne(student_try.hocsinh_id, 'GV0002'))
        .groupBy(student_try.hocsinh_id, users.full_name)
        .orderBy(desc(count(student_try.id)))
        .limit(50);

      return result;
    } catch (error) {
      console.error('Error fetching student tries leaderboard:', error);
      throw error;
    }
  }

  // Get general leaderboards (points from streaks and tries)
  async getGeneralLeaderboards(): Promise<any> {
    try {
      // Get total points leaderboard from student streaks (excluding GV0002)
      const totalPoints = await db
        .select({
          student_id: student_streaks.student_id,
          total_points: sql<string>`COALESCE(${student_streaks.current_streak}, 0) * 10 + COALESCE(${student_streaks.longest_streak}, 0) * 5`,
          full_name: users.full_name
        })
        .from(student_streaks)
        .leftJoin(users, eq(student_streaks.student_id, users.id))
        .where(ne(student_streaks.student_id, 'GV0002'))
        .orderBy(desc(sql`COALESCE(${student_streaks.current_streak}, 0) * 10 + COALESCE(${student_streaks.longest_streak}, 0) * 5`))
        .limit(50);

      // Get best streak leaderboard (excluding GV0002)
      const bestStreak = await db
        .select({
          student_id: student_streaks.student_id,
          longest_streak: student_streaks.longest_streak,
          full_name: users.full_name
        })
        .from(student_streaks)
        .leftJoin(users, eq(student_streaks.student_id, users.id))
        .where(ne(student_streaks.student_id, 'GV0002'))
        .orderBy(desc(student_streaks.longest_streak))
        .limit(50);

      return {
        totalPoints,
        bestStreak
      };
    } catch (error) {
      console.error('Error fetching general leaderboards:', error);
      throw error;
    }
  }
}