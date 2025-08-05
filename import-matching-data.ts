
import { Pool } from 'pg';
import { db } from './server/db';
import { sql } from 'drizzle-orm';

const sourcePool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ONSLUx5f2pMo@ep-rapid-dew-ad58cvd6.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function importMatchingData() {
  try {
    console.log('Starting matching data import...');
    
    // First, check what's in the source matching table
    const sourceMatchingQuery = 'SELECT * FROM matching ORDER BY id LIMIT 10';
    const sampleData = await sourcePool.query(sourceMatchingQuery);
    console.log('Sample matching data structure:', sampleData.rows[0]);
    
    // Get total count
    const countResult = await sourcePool.query('SELECT COUNT(*) FROM matching');
    const totalCount = parseInt(countResult.rows[0].count);
    console.log(`Found ${totalCount} matching records to import`);
    
    if (totalCount === 0) {
      console.log('No matching data found in source database');
      return;
    }
    
    // Clear existing matching data in destination
    console.log('Clearing existing matching data...');
    await db.execute(sql`DELETE FROM matching`);
    
    // Import matching data in batches
    const batchSize = 100;
    let imported = 0;
    
    for (let offset = 0; offset < totalCount; offset += batchSize) {
      const batchQuery = `SELECT * FROM matching ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`;
      const batch = await sourcePool.query(batchQuery);
      
      for (const row of batch.rows) {
        try {
          await db.execute(sql`
            INSERT INTO matching (
              id, type, subject, topic, description,
              prompt1, prompt2, prompt3, prompt4, prompt5, prompt6,
              choice1, choice2, choice3, choice4, choice5, choice6,
              topicid, created_at
            ) VALUES (
              ${row.id || `matching_${imported + 1}`},
              ${row.type},
              ${row.subject},
              ${row.topic},
              ${row.description},
              ${row.prompt1},
              ${row.prompt2},
              ${row.prompt3},
              ${row.prompt4},
              ${row.prompt5},
              ${row.prompt6},
              ${row.choice1},
              ${row.choice2},
              ${row.choice3},
              ${row.choice4},
              ${row.choice5},
              ${row.choice6},
              ${row.topicid},
              ${row.created_at || new Date()}
            )
          `);
          imported++;
        } catch (error) {
          console.log(`Error importing matching record ${row.id}:`, error.message);
        }
      }
      
      console.log(`Imported ${imported} of ${totalCount} matching records...`);
    }
    
    // Final verification
    const finalCount = await db.execute(sql`SELECT COUNT(*) FROM matching`);
    console.log(`✓ Successfully imported ${imported} matching records`);
    console.log(`Final matching count: ${finalCount.rows[0].count}`);
    
  } catch (error) {
    console.error('Error importing matching data:', error);
    throw error;
  } finally {
    await sourcePool.end();
  }
}

// Run the import
importMatchingData()
  .then(() => {
    console.log('Matching data import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Matching data import failed:', error);
    process.exit(1);
  });
