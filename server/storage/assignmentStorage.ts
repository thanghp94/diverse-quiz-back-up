import { assignment, assignment_student_try, student_try } from "@shared/schema";

type Assignment = typeof assignment.$inferSelect;
type AssignmentStudentTry = typeof assignment_student_try.$inferSelect;
type StudentTry = typeof student_try.$inferSelect;
import { eq, and } from "drizzle-orm";
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
      const result = await db.insert(student_try).values(tryData).returning();
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
}