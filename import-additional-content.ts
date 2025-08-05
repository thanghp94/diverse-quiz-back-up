
import { Pool } from 'pg';
import { db } from './server/db';
import { sql } from 'drizzle-orm';

const sourcePool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ONSLUx5f2pMo@ep-rapid-dew-ad58cvd6.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function importAdditionalContent() {
  try {
    console.log('Starting additional content import...');
    
    // Get current content count in destination
    const currentContent = await db.execute(sql`SELECT id FROM content`);
    const existingIds = new Set(currentContent.rows.map(row => row.id));
    console.log(`Current content records: ${existingIds.size}`);
    
    // Get total count from source
    const sourceCountQuery = 'SELECT COUNT(*) FROM content';
    const sourceCount = await sourcePool.query(sourceCountQuery);
    const totalSourceRecords = parseInt(sourceCount.rows[0].count);
    console.log(`Source database has ${totalSourceRecords} total content records`);
    
    // Get all content from source in batches
    const batchSize = 100;
    let totalImported = 0;
    let newRecordsFound = 0;
    
    for (let offset = 0; offset < totalSourceRecords; offset += batchSize) {
      console.log(`Processing batch: ${offset} to ${offset + batchSize}`);
      
      const batchQuery = `
        SELECT 
          id,
          topicid,
          imageid,
          videoid,
          videoid2,
          challengesubject,
          parentid,
          prompt,
          information,
          title,
          short_blurb,
          second_short_blurb,
          mindmap,
          mindmapurl,
          translation,
          vocabulary,
          classdone,
          studentseen,
          show,
          showtranslation,
          showstudent,
          "order",
          contentgroup,
          typeoftaking,
          short_description,
          url,
          header,
          "update",
          imagelink,
          translation_dictionary
        FROM content 
        ORDER BY id 
        LIMIT ${batchSize} OFFSET ${offset}
      `;
      
      const batch = await sourcePool.query(batchQuery);
      
      for (const row of batch.rows) {
        // Skip if already exists
        if (existingIds.has(row.id)) {
          continue;
        }
        
        newRecordsFound++;
        
        try {
          // Clean and prepare the data
          const cleanedRow = {
            id: row.id,
            topicid: row.topicid,
            imageid: row.imageid,
            videoid: row.videoid,
            videoid2: row.videoid2,
            challengesubject: row.challengesubject ? 
              (Array.isArray(row.challengesubject) ? row.challengesubject : [row.challengesubject]) : null,
            parentid: row.parentid,
            prompt: row.prompt,
            information: row.information,
            title: row.title || 'Untitled Content',
            short_blurb: row.short_blurb,
            second_short_blurb: row.second_short_blurb,
            mindmap: row.mindmap,
            mindmapurl: row.mindmapurl,
            translation: row.translation,
            vocabulary: row.vocabulary,
            classdone: row.classdone,
            studentseen: row.studentseen,
            show: row.show,
            showtranslation: row.showtranslation,
            showstudent: row.showstudent,
            order: row.order ? row.order.toString() : null,
            contentgroup: row.contentgroup,
            typeoftaking: row.typeoftaking,
            short_description: row.short_description,
            url: row.url,
            header: row.header,
            update: row.update,
            imagelink: row.imagelink,
            translation_dictionary: row.translation_dictionary
          };
          
          await db.execute(sql`
            INSERT INTO content (
              id, topicid, imageid, videoid, videoid2, challengesubject, parentid,
              prompt, information, title, short_blurb, second_short_blurb, mindmap,
              mindmapurl, translation, vocabulary, classdone, studentseen, show,
              showtranslation, showstudent, "order", contentgroup, typeoftaking,
              short_description, url, header, "update", imagelink, translation_dictionary
            ) VALUES (
              ${cleanedRow.id}, ${cleanedRow.topicid}, ${cleanedRow.imageid}, 
              ${cleanedRow.videoid}, ${cleanedRow.videoid2}, ${cleanedRow.challengesubject},
              ${cleanedRow.parentid}, ${cleanedRow.prompt}, ${cleanedRow.information},
              ${cleanedRow.title}, ${cleanedRow.short_blurb}, ${cleanedRow.second_short_blurb},
              ${cleanedRow.mindmap}, ${cleanedRow.mindmapurl}, ${cleanedRow.translation},
              ${cleanedRow.vocabulary}, ${cleanedRow.classdone}, ${cleanedRow.studentseen},
              ${cleanedRow.show}, ${cleanedRow.showtranslation}, ${cleanedRow.showstudent},
              ${cleanedRow.order}, ${cleanedRow.contentgroup}, ${cleanedRow.typeoftaking},
              ${cleanedRow.short_description}, ${cleanedRow.url}, ${cleanedRow.header},
              ${cleanedRow.update}, ${cleanedRow.imagelink}, ${cleanedRow.translation_dictionary}
            )
          `);
          
          totalImported++;
          
        } catch (error) {
          console.error(`Error importing content ${row.id}:`, error.message);
        }
      }
      
      console.log(`Batch complete. New records found: ${newRecordsFound}, Imported: ${totalImported}`);
    }
    
    // Final verification
    const finalContent = await db.execute(sql`SELECT COUNT(*) FROM content`);
    console.log(`\n=== Content Import Complete ===`);
    console.log(`Total new records found: ${newRecordsFound}`);
    console.log(`Successfully imported: ${totalImported}`);
    console.log(`Final content count: ${finalContent.rows[0].count}`);
    
  } catch (error) {
    console.error('Error during content import:', error);
    throw error;
  } finally {
    await sourcePool.end();
  }
}

// Run the import
importAdditionalContent()
  .then(() => {
    console.log('Additional content import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Additional content import failed:', error);
    process.exit(1);
  });
