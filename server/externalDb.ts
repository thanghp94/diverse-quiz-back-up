import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

// External database connection for activity_session table
// Use environment variables or fallback to the new database URL

// Use external database connection for activity_session tables
const externalDatabaseUrl = process.env.EXTERNAL_DATABASE_URL || process.env.DATABASE_URL || "postgresql://neondb_owner:npg_ONSLUx5f2pMo@ep-rapid-dew-ad58cvd6.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
const externalPool = new Pool({
  connectionString: externalDatabaseUrl
});

export const externalDb = drizzle({ client: externalPool });

// Raw SQL queries for external database tables since they're not in our schema
export class ExternalDbService {
  
  async ensureActivitySessionsTableExists() {
    try {
      await externalPool.query(`
        CREATE TABLE IF NOT EXISTS activity_sessions (
          session_id SERIAL PRIMARY KEY,
          type VARCHAR NOT NULL,
          status VARCHAR NOT NULL DEFAULT 'pending',
          start_time TIMESTAMP WITH TIME ZONE,
          end_time TIMESTAMP WITH TIME ZONE,
          activities_jsonb JSONB DEFAULT '{}',
          attendance JSONB DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `);
      console.log('Activity sessions table ensured to exist');
    } catch (error) {
      console.error('Error creating activity_sessions table:', error);
    }
  }

  async ensureSessionRegistrationsTableExists() {
    try {
      // Drop and recreate to ensure proper data types
      await externalPool.query(`DROP TABLE IF EXISTS session_registrations`);
      await externalPool.query(`
        CREATE TABLE session_registrations (
          id SERIAL PRIMARY KEY,
          session_id INTEGER NOT NULL,
          team_id INTEGER,
          student_id TEXT,
          division TEXT,
          status TEXT DEFAULT 'registered',
          registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          confirmed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `);
      console.log('Session registrations table created with proper schema');
    } catch (error) {
      console.error('Error creating session_registrations table:', error);
    }
  }

  async getSessionRegistrations(sessionId: number) {
    await this.ensureSessionRegistrationsTableExists();
    await this.ensureActivitySessionsTableExists();
    
    try {
      // Try to get registrations from activities_jsonb first  
      const activitiesResult = await externalPool.query(`
        SELECT activities_jsonb FROM activity_sessions WHERE session_id = $1
      `, [Number(sessionId)]);
      
      let registrations = [];
      let divisionCounts = {};
      
      if (activitiesResult.rows.length > 0) {
        const activities = activitiesResult.rows[0].activities_jsonb || {};
        registrations = activities.registrations || [];
        
        // Count by division from activities_jsonb
        divisionCounts = registrations.reduce((acc: Record<string, number>, reg: any) => {
          if (reg.division) {
            acc[reg.division] = (acc[reg.division] || 0) + 1;
          }
          return acc;
        }, {});
      }

      return {
        registrations,
        divisionCounts
      };
    } catch (error) {
      console.error('Session registration query error:', error);
      // Return empty result if query fails
      return {
        registrations: [],
        divisionCounts: {}
      };
    }
  }

  async createSessionRegistration(registrationData: any) {
    await this.ensureSessionRegistrationsTableExists();
    await this.ensureActivitySessionsTableExists();
    
    const { 
      session_id, team_id, student_id, division, status = 'registered'
    } = registrationData;
    
    // Insert into session_registrations table
    const result = await externalPool.query(`
      INSERT INTO session_registrations (
        session_id, team_id, student_id, division, status, registered_at, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, NOW(), NOW()
      ) RETURNING *
    `, [Number(session_id), team_id ? Number(team_id) : null, student_id || null, division || null, status]);
    
    const registration = result.rows[0];
    
    // Update activities_jsonb in activity_sessions table
    await this.updateSessionActivities(session_id, {
      type: 'team_registration',
      registration_id: registration.id,
      team_id: team_id,
      student_id: student_id,
      division: division,
      timestamp: new Date().toISOString()
    });
    
    return registration;
  }

  async updateSessionActivities(sessionId: number, activityData: any) {
    try {
      // Get current activities_jsonb
      const currentResult = await externalPool.query(`
        SELECT activities_jsonb FROM activity_sessions WHERE session_id = $1
      `, [Number(sessionId)]);
      
      let activities = {};
      if (currentResult.rows.length > 0) {
        activities = currentResult.rows[0].activities_jsonb || {};
      }
      
      // Add registrations array if it doesn't exist
      if (!activities.registrations) {
        activities.registrations = [];
      }
      
      // Add new registration data
      activities.registrations.push(activityData);
      
      // Update activities_jsonb
      await externalPool.query(`
        UPDATE activity_sessions 
        SET activities_jsonb = $1::jsonb, updated_at = NOW()
        WHERE session_id = $2
      `, [JSON.stringify(activities), sessionId]);
      
      console.log(`Updated session ${sessionId} activities with registration data`);
    } catch (error) {
      console.error('Error updating session activities:', error);
    }
  }

  async getSessionActivities(sessionId: number) {
    try {
      const result = await externalPool.query(`
        SELECT activities_jsonb FROM activity_sessions WHERE session_id = $1
      `, [Number(sessionId)]);
      
      if (result.rows.length > 0) {
        return result.rows[0].activities_jsonb || {};
      }
      return {};
    } catch (error) {
      console.error('Error getting session activities:', error);
      return {};
    }
  }

  async updateSessionRegistration(id: number, updateData: any) {
    await this.ensureSessionRegistrationsTableExists();
    
    const { status } = updateData;
    const confirmedAt = status === 'confirmed' ? 'NOW()' : 'NULL';
    
    const result = await externalPool.query(`
      UPDATE session_registrations 
      SET status = $1::text, confirmed_at = ${confirmedAt}
      WHERE id = $2::integer 
      RETURNING *
    `, [status, id]);
    
    return result.rows[0];
  }

  async deleteSessionRegistration(id: number) {
    await this.ensureSessionRegistrationsTableExists();
    
    const result = await externalPool.query(`
      DELETE FROM session_registrations 
      WHERE id = $1::integer 
      RETURNING *
    `, [id]);
    
    return result.rows[0];
  }

  async checkExistingRegistration(sessionId: number, teamId?: number, studentId?: string) {
    await this.ensureSessionRegistrationsTableExists();
    
    let query = 'SELECT * FROM session_registrations WHERE session_id = $1';
    const params = [Number(sessionId)];
    
    if (teamId) {
      query += ' AND team_id = $2';
      params.push(Number(teamId));
    } else if (studentId) {
      query += ' AND student_id = $2';
      params.push(String(studentId));
    }
    
    const result = await externalPool.query(query, params);
    return result.rows;
  }
  
  async getDebateSessions() {
    await this.ensureActivitySessionsTableExists();
    const result = await externalPool.query(`
      SELECT * FROM activity_sessions 
      WHERE type = 'debate' 
      ORDER BY start_time ASC
    `);
    return result.rows;
  }

  async createDebateSession(sessionData: any) {
    await this.ensureActivitySessionsTableExists();
    
    const { 
      type = 'debate', status = 'pending', start_time, end_time,
      activities_jsonb = '{}', attendance = '[]'
    } = sessionData;
    
    const result = await externalPool.query(`
      INSERT INTO activity_sessions (
        session_id, type, status, start_time, end_time, 
        activities_jsonb, attendance, created_at, updated_at
      ) VALUES (
        DEFAULT, $1, $2, $3, $4, $5, $6, NOW(), NOW()
      ) RETURNING *
    `, [
      type, status, start_time, end_time, 
      activities_jsonb, attendance
    ]);
    return result.rows[0];
  }

  async updateDebateSession(sessionId: string, updateData: any) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'session_id') {
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
      WHERE session_id = $${paramCount} 
      RETURNING *
    `, values);
    
    return result.rows[0];
  }

  async deleteDebateSession(sessionId: string) {
    // Delete session (no registrations table in this schema)
    const result = await externalPool.query(
      'DELETE FROM activity_sessions WHERE session_id = $1 RETURNING *', 
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
    try {
      // First, ensure tables exist
      await this.ensureTablesExist();
      
      let query = `
        SELECT 
          t.*,
          json_agg(
            json_build_object(
              'id', tm.id,
              'userId', tm.user_id,
              'createdAt', tm.created_at
            )
          ) FILTER (WHERE tm.id IS NOT NULL) as members
        FROM teams t
        LEFT JOIN team_members tm ON t.id = tm.team_id
        WHERE 1=1
      `;
      const values = [];
      let paramCount = 1;

      if (filters?.year) {
        query += ` AND t.year = $${paramCount}`;
        values.push(filters.year);
        paramCount++;
      }

      if (filters?.round) {
        query += ` AND t.round = $${paramCount}`;
        values.push(filters.round);
        paramCount++;
      }

      query += ' GROUP BY t.id, t.name, t.created_at, t.updated_at ORDER BY t.created_at DESC';

      const result = await externalPool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }

  async ensureTablesExist(): Promise<void> {
    try {
      // Create teams table with all necessary columns
      await externalPool.query(`
        CREATE TABLE IF NOT EXISTS teams (
          id TEXT PRIMARY KEY,
          name TEXT,
          members TEXT,
          year TEXT,
          round TEXT,
          team_type TEXT,
          status TEXT,
          created_by TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create team_members table
      await externalPool.query(`
        CREATE TABLE IF NOT EXISTS team_members (
          id TEXT PRIMARY KEY,
          team_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(team_id, user_id)
        )
      `);

      console.log('Teams tables ensured to exist in external database');
    } catch (error) {
      console.error('Error ensuring tables exist in external database:', error);
      // Don't throw error here, just log it
    }
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