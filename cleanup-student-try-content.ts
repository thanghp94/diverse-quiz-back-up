import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function cleanupStudentTryContent() {
  console.log('Starting cleanup of student_try_content update column...');
  
  try {
    // Get records with excessive update data
    const excessiveRecords = await db.execute(sql`
      SELECT id, length(update) as update_length, 
             LEFT(update, 100) as update_sample
      FROM student_try_content 
      WHERE update IS NOT NULL 
        AND length(update) > 1000
      ORDER BY length(update) DESC
      LIMIT 10
    `);
    
    console.log('Records with excessive update data:');
    excessiveRecords.rows.forEach((row: any) => {
      console.log(`ID: ${row.id}, Length: ${row.update_length}, Sample: ${row.update_sample}...`);
    });
    
    // Clean up the update column by keeping only unique question IDs
    const cleanupResult = await db.execute(sql`
      UPDATE student_try_content 
      SET update = (
        SELECT string_agg(DISTINCT unnest_val, ', ')
        FROM unnest(string_to_array(update, ', ')) as unnest_val
        WHERE unnest_val != ''
      )
      WHERE update IS NOT NULL 
        AND length(update) > 1000
    `);
    
    console.log(`Cleaned up ${cleanupResult.rowCount} records`);
    
    // Show results after cleanup
    const afterCleanup = await db.execute(sql`
      SELECT id, length(update) as new_length
      FROM student_try_content 
      WHERE update IS NOT NULL
      ORDER BY length(update) DESC
      LIMIT 5
    `);
    
    console.log('After cleanup - top 5 longest update fields:');
    afterCleanup.rows.forEach((row: any) => {
      console.log(`ID: ${row.id}, New Length: ${row.new_length}`);
    });
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanupStudentTryContent().then(() => {
  console.log('Cleanup completed');
  process.exit(0);
}).catch(error => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});