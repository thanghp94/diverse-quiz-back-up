
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './shared/schema';
import ws from 'ws';

// Configure neon for WebSocket
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

// Setup for destination database
const destPool = new Pool({ connectionString: process.env.DATABASE_URL });
const destDb = drizzle({ client: destPool, schema });

async function clearQuestions() {
  console.log('Clearing existing question data...');
  
  try {
    // Delete all questions from the database
    const result = await destDb.delete(schema.questions);
    
    console.log('Successfully cleared all question data from the database.');
    console.log('You can now run the CSV import script to add new questions.');
    
  } catch (error) {
    console.error('Error clearing questions:', error);
  } finally {
    await destPool.end();
  }
}

clearQuestions().catch(console.error);
