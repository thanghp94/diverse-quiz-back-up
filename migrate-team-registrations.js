import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Setup database connection
const neonConfig = { webSocketConstructor: ws };
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrateTeamRegistrations() {
  console.log('Starting team registration migration...');
  
  try {
    // Get all sessions that have activities_jsonb registrations but missing attendance data
    const result = await pool.query(`
      SELECT session_id, activities_jsonb, attendance 
      FROM activity_sessions 
      WHERE activities_jsonb IS NOT NULL 
        AND activities_jsonb::text != '{}'
        AND (attendance IS NULL OR attendance::text = '{}' OR JSON_ARRAY_LENGTH(attendance) = 0)
    `);
    
    console.log(`Found ${result.rows.length} sessions to migrate`);
    
    for (const session of result.rows) {
      const { session_id, activities_jsonb } = session;
      const registrations = activities_jsonb?.registrations || [];
      
      if (registrations.length > 0) {
        console.log(`Migrating session ${session_id} with ${registrations.length} registrations`);
        
        // Build attendance array from activities_jsonb registrations
        const attendanceData = [];
        
        for (const reg of registrations) {
          if (reg.team_id) {
            // Get team name
            const teamResult = await pool.query(
              'SELECT team_name FROM teams WHERE team_id = $1',
              [reg.team_id]
            );
            const teamName = teamResult.rows[0]?.team_name || `Team ${reg.team_id}`;
            
            attendanceData.push({
              team_id: reg.team_id,
              team_name: teamName,
              division: reg.division,
              status: 'registered',
              registered_at: reg.timestamp,
              registration_id: reg.registration_id
            });
          }
        }
        
        // Apply team matching logic - first 2 teams get matched
        if (attendanceData.length >= 2) {
          attendanceData.forEach((team, index) => {
            if (index < 2) {
              team.status = 'matched';
              team.matched_at = new Date().toISOString();
            } else {
              team.status = 'excluded';
              team.excluded_at = new Date().toISOString();
            }
          });
        }
        
        // Update the session with attendance data and clear activities_jsonb
        await pool.query(
          `UPDATE activity_sessions 
           SET attendance = $1, activities_jsonb = $2, updated_at = NOW()
           WHERE session_id = $3`,
          [JSON.stringify(attendanceData), JSON.stringify({}), session_id]
        );
        
        console.log(`✓ Migrated session ${session_id}: ${attendanceData.length} teams`);
      }
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateTeamRegistrations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });