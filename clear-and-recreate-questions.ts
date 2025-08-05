
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';

// Configure neon for WebSocket
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

async function clearAndRecreateQuestionsTable() {
  console.log('Dropping existing questions table...');
  
  try {
    // Drop the existing questions table
    await db.execute(sql`DROP TABLE IF EXISTS question CASCADE`);
    console.log('Existing questions table dropped successfully');
    
    // Create new questions table with structure matching CSV headers
    await db.execute(sql`
      CREATE TABLE question (
        id TEXT PRIMARY KEY,
        topic TEXT,
        randomorder TEXT,
        questionlevel TEXT,
        contentid TEXT,
        question_type TEXT,
        noi_dung TEXT,
        video TEXT,
        picture TEXT,
        cau_tra_loi_1 TEXT,
        cau_tra_loi_2 TEXT,
        cau_tra_loi_3 TEXT,
        cau_tra_loi_4 TEXT,
        correct_choice TEXT,
        writing_choice TEXT,
        time TEXT,
        explanation TEXT,
        questionorder TEXT,
        tg_tao TEXT,
        answer TEXT
      )
    `);
    
    console.log('New questions table created successfully with updated structure');
    
  } catch (error) {
    console.error('Error recreating questions table:', error);
  } finally {
    await pool.end();
  }
}

clearAndRecreateQuestionsTable().catch(console.error);
