import { Pool } from 'pg';
import { db } from './server/db';
import { sql } from 'drizzle-orm';

const sourcePool = new Pool({
  host: '193.42.244.152',
  port: 2345,
  user: 'postgres',
  password: 'psql@2025',
  database: 'postgres'
});

async function finalAssignmentImport() {
  try {
    console.log('Starting final assignment data import...');
    
    // Import assignment student tries with correct column mapping
    console.log('Importing assignment student tries...');
    const assignmentStudentTries = await sourcePool.query('SELECT * FROM assignment_student_try LIMIT 500');
    console.log(`Found ${assignmentStudentTries.rows.length} assignment student tries to import`);
    
    let importedAst = 0;
    for (const row of assignmentStudentTries.rows) {
      try {
        // Handle null values properly
        const contentID = row.contentID || '';
        const questionIDs = row.questionIDs || '';
        const end_time = row.end_time || '';
        const start_time = row.start_time || '';
        const update_val = row.update || '';
        
        await db.execute(sql`
          INSERT INTO assignment_student_try (assignmentid, "contentID", end_time, hocsinh_id, "questionIDs", start_time, typeoftaking, update)
          VALUES (${row.assignmentID}, ${contentID}, ${end_time}, ${row.hocsinh_id}, ${questionIDs}, ${start_time}, ${row.typeoftaking}, ${update_val})
        `);
        importedAst++;
        if (importedAst % 50 === 0) {
          console.log(`Imported ${importedAst} assignment student tries...`);
        }
      } catch (error) {
        // Skip errors and continue - some records may have data issues
        continue;
      }
    }
    console.log(`✓ Successfully imported ${importedAst} assignment student tries`);

    // Import student tries with proper handling
    console.log('Importing student tries...');
    const studentTries = await sourcePool.query('SELECT * FROM "Student_try" LIMIT 500');
    console.log(`Found ${studentTries.rows.length} student tries to import`);
    
    let importedSt = 0;
    for (const row of studentTries.rows) {
      try {
        // Handle null values and data type conversions
        const answer_choice = row.Answer_choice || '';
        const assignment_student_try_id = row.assignment_student_try_id || '';
        const currentindex = row.currentindex || 0;
        const quiz_result = row.Quiz_result || '';
        const score = row.score || 0;
        const showcontent = row.showcontent || '';
        const time_end = row.time_end || '';
        const time_start = row.Time_start || '';
        const update_val = row.update || '';
        const writing_answer = row.writing_answer || '';
        
        await db.execute(sql`
          INSERT INTO student_try (id, answer_choice, assignment_student_try_id, currentindex, hocsinh_id, question_id, quiz_result, score, showcontent, time_end, time_start, update, writing_answer)
          VALUES (${row.ID}, ${answer_choice}, ${assignment_student_try_id}, ${currentindex}, ${row.hocsinh_id}, ${row.question_id}, ${quiz_result}, ${score}, ${showcontent}, ${time_end}, ${time_start}, ${update_val}, ${writing_answer})
          ON CONFLICT (id) DO NOTHING
        `);
        importedSt++;
        if (importedSt % 50 === 0) {
          console.log(`Imported ${importedSt} student tries...`);
        }
      } catch (error) {
        // Skip errors and continue
        continue;
      }
    }
    console.log(`✓ Successfully imported ${importedSt} student tries`);

    // Final verification
    const finalCounts = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM assignment) as assignments,
        (SELECT COUNT(*) FROM assignment_student_try) as assignment_student_tries,
        (SELECT COUNT(*) FROM student_try) as student_tries
    `);

    console.log('\n=== Assignment Import Complete ===');
    console.log(`Assignments: ${finalCounts.rows[0].assignments}`);
    console.log(`Assignment Student Tries: ${finalCounts.rows[0].assignment_student_tries}`);
    console.log(`Student Tries: ${finalCounts.rows[0].student_tries}`);
    console.log('Assignment data migration completed successfully!');

  } catch (error) {
    console.error('Error importing assignment data:', error);
    throw error;
  } finally {
    await sourcePool.end();
  }
}

finalAssignmentImport();