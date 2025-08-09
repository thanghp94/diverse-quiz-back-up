// Quick debug script to test registration table
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ 
  connectionString: "postgresql://neondb_owner:npg_ONSLUx5f2pMo@ep-rapid-dew-ad58cvd6.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function debug() {
  try {
    // First create table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session_registrations (
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
    console.log('Table created');
    
    // Check table structure
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'session_registrations'
      ORDER BY ordinal_position;
    `);
    console.log('Table structure:', structure.rows);
    
    // Test simple select
    const result = await pool.query(`
      SELECT * FROM session_registrations 
      WHERE session_id = $1
      ORDER BY registered_at DESC
    `, [7]);
    console.log('Query result:', result.rows);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
  
  await pool.end();
}

debug();