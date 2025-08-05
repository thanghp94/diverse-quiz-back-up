import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from 'pg';
import * as schema from './shared/schema';
import ws from 'ws';
import { eq } from 'drizzle-orm';

// Configure neon for WebSocket
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

// Setup for source database
const sourcePool = new PgPool({
  host: '193.42.244.152',
  port: 2345,
  user: 'postgres',
  password: 'psql@2025',
  database: 'postgres'
});

// Setup for destination database
const destPool = new Pool({ connectionString: process.env.DATABASE_URL });
const destDb = drizzle({ client: destPool, schema });

async function completeContentImport() {
  console.log('Completing content import with remaining records...');
  
  try {
    // Get current content count in destination
    const currentCount = await destDb.select().from(schema.content);
    console.log(`Current content records: ${currentCount.length}`);
    
    // Get all content IDs that already exist
    const existingIds = new Set(currentCount.map(c => c.id));
    
    // Get all content from source
    const sourceContent = await sourcePool.query(`
      SELECT 
        "ID" as id,
        "TopicID" as topicid, 
        "imageID" as imageid,
        "VideoID" as videoid,
        "VideoID2" as videoid2,
        "ChallengeSubject" as challengesubject,
        "ParentID" as parentid,
        "Prompt" as prompt,
        "Information" as information,
        "Title" as title,
        "Short Blurb" as short_blurb,
        "Second Short Blurb" as second_short_blurb,
        "Mindmap" as mindmap,
        "MindmapURL" as mindmapurl,
        "Translation" as translation,
        "Vocabulary" as vocabulary,
        "ClassDone" as classdone,
        "StudentSeen" as studentseen,
        "Show" as show,
        "ShowTranslation" as showtranslation,
        "ShowStudent" as showstudent,
        "Order" as "order",
        "ContentGroup" as contentgroup,
        "TypeOfTaking" as typeoftaking,
        "Short_description" as short_description,
        "URL" as url,
        "header" as header,
        "update" as "update",
        "Imagelink" as imagelink
      FROM "Content" ORDER BY "ID"
    `);
    
    console.log(`Source has ${sourceContent.rows.length} total records`);
    
    // Filter out records that already exist
    const newRecords = sourceContent.rows.filter(item => !existingIds.has(item.id));
    console.log(`Need to import ${newRecords.length} new records`);
    
    if (newRecords.length === 0) {
      console.log('All content already imported!');
      return;
    }
    
    // Import in smaller batches to avoid timeout
    const batchSize = 50;
    let imported = 0;
    
    for (let i = 0; i < newRecords.length; i += batchSize) {
      const batch = newRecords.slice(i, i + batchSize);
      
      for (const item of batch) {
        try {
          const cleanItem = {
            ...item,
            title: item.title || 'Untitled Content', // Ensure title is not null
            challengesubject: item.challengesubject ? (Array.isArray(item.challengesubject) ? item.challengesubject : [item.challengesubject]) : null,
            order: item.order ? item.order.toString() : null
          };
          
          await destDb.insert(schema.content).values(cleanItem).onConflictDoNothing();
          imported++;
        } catch (error) {
          console.error(`Error importing content ${item.id}:`, error);
        }
      }
      
      console.log(`Imported batch: ${imported}/${newRecords.length} records`);
    }
    
    console.log(`Successfully imported ${imported} new content records`);
    
    // Verify final count
    const finalCount = await destDb.select().from(schema.content);
    console.log(`Final content count: ${finalCount.length}`);
    
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await sourcePool.end();
    await destPool.end();
  }
}

completeContentImport().catch(console.error);