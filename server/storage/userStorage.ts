import { users, type User, type InsertUser, type UpsertUser } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";

export class UserStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await db.select().from(users);
      console.log(`getAllUsers: fetched ${result.length} users`);
      
      // Debug: Check the types of show values
      const showValues = result.map(u => ({ id: u.id, show: u.show, type: typeof u.show }));
      const uniqueShowValues = [...new Set(showValues.map(v => `${v.show} (${v.type})`))];
      console.log('Unique show values:', uniqueShowValues);
      
      // Count users by show status for debugging
      const inactiveUsers = result.filter(u => u.show === false);
      const activeUsers = result.filter(u => u.show !== false);
      console.log(`getAllUsers: active=${activeUsers.length}, inactive=${inactiveUsers.length}`);
      
      if (inactiveUsers.length > 0) {
        console.log('Inactive users:', inactiveUsers.map(u => ({ id: u.id, show: u.show })));
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email));
      return result[0];
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(
        sql`${users.id} = ${identifier} OR ${users.email} = ${identifier} OR ${users.meraki_email} = ${identifier}`
      );
      return result[0];
    } catch (error) {
      console.error('Error fetching user by identifier:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updateData: Partial<User>): Promise<User | undefined> {
    try {
      const result = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async toggleUserStatus(userId: string): Promise<User | undefined> {
    try {
      // First get the current status
      const currentUser = await this.getUser(userId);
      if (!currentUser) {
        throw new Error('User not found');
      }
      
      console.log(`Toggling user ${userId}: current show=${currentUser.show}`);
      
      // Toggle the show status: treat null/undefined/true as active, false as inactive
      const newShowValue = currentUser.show === false ? true : false;
      
      console.log(`Setting show to: ${newShowValue}`);
      
      const result = await db.update(users)
        .set({ show: newShowValue })
        .where(eq(users.id, userId))
        .returning();
        
      console.log(`Updated user: ${result[0]?.id}, show=${result[0]?.show}`);
      
      // Verify the update worked by fetching the user again
      const verifyUser = await this.getUser(userId);
      console.log(`Verification - user ${userId}: show=${verifyUser?.show}`);
      
      return result[0];
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }

  async updateUserEmail(userId: string, newEmail: string): Promise<User> {
    try {
      const result = await db.update(users)
        .set({ email: newEmail })
        .where(eq(users.id, userId))
        .returning();
      
      if (!result[0]) {
        throw new Error('User not found');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating user email:', error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values(user).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    try {
      const existingUser = await this.getUser(user.id);
      
      if (existingUser) {
        const result = await db.update(users)
          .set(user)
          .where(eq(users.id, user.id))
          .returning();
        return result[0];
      } else {
        const result = await db.insert(users).values(user).returning();
        return result[0];
      }
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }
}