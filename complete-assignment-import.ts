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

async function completeAssignmentImport() {
  try {
    console.log('Starting remaining assignment data import...');
    
    // Import assignment student tries
    console.log('Importing assignment student tries...');
    const assignmentStudentTries = await sourcePool.query('SELECT * FROM assignment_student_try LIMIT 1000');
    console.log(`Found ${assignmentStudentTries.rows.length} assignment student tries to import`);
    
    let importedAst = 0;
    for (const row of assignmentStudentTries.rows) {
      try {
        await db.execute(sql`
          INSERT INTO assignment_student_try (assignmentid, "contentID", end_time, hocsinh_id, "questionIDs", start_time, typeoftaking, update)
          VALUES (${row.assignmentID}, ${row.contentID}, ${row.end_time}, ${row.hocsinh_id}, ${row.questionIDs}, ${row.start_time}, ${row.typeoftaking}, ${row.update})
        `);
        importedAst++;
        if (importedAst % 100 === 0) {
          console.log(`Imported ${importedAst} assignment student tries...`);
        }
      } catch (error) {
        console.log(`Error importing assignment student try ${row.ID}:`, error.message);
      }
    }
    console.log(`✓ Imported ${importedAst} assignment student tries`);

    // Import student tries (limit to manageable batch)
    console.log('Importing student tries...');
    const studentTries = await sourcePool.query('SELECT * FROM "Student_try" LIMIT 2000');
    console.log(`Found ${studentTries.rows.length} student tries to import`);
    
    let importedSt = 0;
    for (const row of studentTries.rows) {
      try {
        await db.execute(sql`
          INSERT INTO student_try (id, answer_choice, assignment_student_try_id, currentindex, hocsinh_id, question_id, quiz_result, score, showcontent, time_end, time_start, update, writing_answer)
          VALUES (${row.ID}, ${row.Answer_choice}, ${row.assignment_student_try_id}, ${row.currentindex}, ${row.hocsinh_id}, ${row.question_id}, ${row.Quiz_result}, ${row.score}, ${row.showcontent}, ${row.time_end}, ${row.Time_start}, ${row.update}, ${row.writing_answer})
          ON CONFLICT (id) DO NOTHING
        `);
        importedSt++;
        if (importedSt % 200 === 0) {
          console.log(`Imported ${importedSt} student tries...`);
        }
      } catch (error) {
        console.log(`Error importing student try ${row.ID}:`, error.message);
      }
    }
    console.log(`✓ Imported ${importedSt} student tries`);

    // Final verification
    const finalCounts = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM assignment) as assignments,
        (SELECT COUNT(*) FROM assignment_student_try) as assignment_student_tries,
        (SELECT COUNT(*) FROM student_try) as student_tries
    `);

    console.log('\n=== Final Import Summary ===');
    console.log(`Assignments: ${finalCounts.rows[0].assignments}`);
    console.log(`Assignment Student Tries: ${finalCounts.rows[0].assignment_student_tries}`);
    console.log(`Student Tries: ${finalCounts.rows[0].student_tries}`);
    console.log('Assignment data import completed successfully!');

  } catch (error) {
    console.error('Error importing assignment data:', error);
    throw error;
  } finally {
    await sourcePool.end();
  }
}

completeAssignmentImport();