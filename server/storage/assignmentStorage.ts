import { assignment, assignment_student_try, student_try, type Assignment, type AssignmentStudentTry, type StudentTry } from "@shared/schema";
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
      let query = db.select().from(student_try).where(eq(student_try.student_id, studentId));
      
      if (assignmentId) {
        return await db.select().from(student_try).where(and(eq(student_try.student_id, studentId), eq(student_try.assignment_id, assignmentId)));
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
}