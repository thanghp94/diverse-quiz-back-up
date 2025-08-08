import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

// External database connection for activity_session table
if (!process.env.EXTERNAL_DATABASE_URL && !process.env.DATABASE_URL) {
  throw new Error(
    "EXTERNAL_DATABASE_URL or DATABASE_URL must be set for external database access",
  );
}

// Use external database URL if available, otherwise fall back to main database
const externalPool = new Pool({ 
  connectionString: process.env.EXTERNAL_DATABASE_URL || process.env.DATABASE_URL 
});

export const externalDb = drizzle({ client: externalPool });

// Raw SQL queries for external database tables since they're not in our schema
export class ExternalDbService {
  
  async getDebateSessions() {
    const result = await externalPool.query(`
      SELECT * FROM activity_sessions 
      WHERE session_type = 'debate' 
      ORDER BY date ASC
    `);
    return result.rows;
  }

  async createDebateSession(sessionData: any) {
    const { 
      id, session_type = 'debate', title, description, date, 
      duration_minutes, location, max_participants, topic_id, 
      content_id, year, round, status, created_by 
    } = sessionData;
    
    const result = await externalPool.query(`
      INSERT INTO activity_sessions (
        id, session_type, title, description, date, duration_minutes, 
        location, max_participants, topic_id, content_id, year, 
        round, status, created_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
      ) RETURNING *
    `, [
      id, session_type, title, description, date, duration_minutes,
      location, max_participants, topic_id, content_id, year,
      round, status, created_by
    ]);
    return result.rows[0];
  }

  async updateDebateSession(sessionId: string, updateData: any) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(sessionId);

    const result = await externalPool.query(`
      UPDATE activity_sessions 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING *
    `, values);
    
    return result.rows[0];
  }

  async deleteDebateSession(sessionId: string) {
    // First delete registrations
    await externalPool.query('DELETE FROM session_registrations WHERE session_id = $1', [sessionId]);
    
    // Then delete session
    const result = await externalPool.query(
      'DELETE FROM activity_sessions WHERE id = $1 RETURNING *', 
      [sessionId]
    );
    return result.rows[0];
  }

  async getSessionRegistrations(sessionId: string) {
    const result = await externalPool.query(`
      SELECT sr.*, t.name as team_name, t.members, t.year as team_year, t.round as team_round
      FROM session_registrations sr
      LEFT JOIN teams t ON sr.team_id = t.id
      WHERE sr.session_id = $1
      ORDER BY sr.registered_at ASC
    `, [sessionId]);
    return result.rows;
  }

  async registerTeamForSession(registrationData: any) {
    const { id, session_id, team_id, student_id, registration_status, registered_by, notes } = registrationData;
    
    const result = await externalPool.query(`
      INSERT INTO session_registrations (
        id, session_id, team_id, student_id, registration_status, 
        registered_by, notes, registered_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
      ) RETURNING *
    `, [id, session_id, team_id, student_id, registration_status, registered_by, notes]);
    
    return result.rows[0];
  }

  async updateRegistration(registrationId: string, updateData: any) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(registrationId);

    const result = await externalPool.query(`
      UPDATE session_registrations 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING *
    `, values);
    
    return result.rows[0];
  }

  async deleteRegistration(registrationId: string) {
    const result = await externalPool.query(
      'DELETE FROM session_registrations WHERE id = $1 RETURNING *', 
      [registrationId]
    );
    return result.rows[0];
  }

  async getTeams(filters?: { year?: string; round?: string }) {
    let query = 'SELECT * FROM teams WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters?.year) {
      query += ` AND year = $${paramCount}`;
      values.push(filters.year);
      paramCount++;
    }

    if (filters?.round) {
      query += ` AND round = $${paramCount}`;
      values.push(filters.round);
      paramCount++;
    }

    query += ' ORDER BY created_at ASC';

    const result = await externalPool.query(query, values);
    return result.rows;
  }

  async createTeam(teamData: any) {
    const { id, name, members, year, round, team_type, status, created_by } = teamData;
    
    const result = await externalPool.query(`
      INSERT INTO teams (
        id, name, members, year, round, team_type, status, 
        created_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      ) RETURNING *
    `, [id, name, members, year, round, team_type, status, created_by]);
    
    return result.rows[0];
  }

  async checkExistingRegistration(sessionId: string, teamId: string) {
    const result = await externalPool.query(
      'SELECT * FROM session_registrations WHERE session_id = $1 AND team_id = $2', 
      [sessionId, teamId]
    );
    return result.rows[0];
  }
}