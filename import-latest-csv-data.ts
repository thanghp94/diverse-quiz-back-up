import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres';
const pool = postgres(connectionString);
const db = drizzle({ client: pool });

function parseCSV(csvContent: string): any[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(';').map(h => h.replace(/^"|"$/g, '').trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';');
    const row: any = {};

    headers.forEach((header, index) => {
      let value = values[index] || '';
      value = value.replace(/^"|"$/g, '').trim();
      row[header] = value === '' ? null : value;
    });

    data.push(row);
  }

  return data;
}

async function importContent() {
  console.log('Starting content import...');

  try {
    const contentPath = path.join(__dirname, 'attached_assets', 'Content_1750571532016.csv');
    const csvContent = fs.readFileSync(contentPath, 'utf-8');
    const contentData = parseCSV(csvContent);

    console.log(`Found ${contentData.length} content records to import`);

    // Get existing content IDs
    const existingContent = await db.execute(sql`SELECT id FROM content`);
    const existingIds = new Set(existingContent.rows.map((row: any) => row.id));

    let imported = 0;
    let skipped = 0;

    for (const row of contentData) {
      if (!row.id) continue;

      if (existingIds.has(row.id)) {
        skipped++;
        continue;
      }

      try {
        // Clean and prepare the data
        const cleanedRow = {
          id: row.id,
          topicid: row.topicid,
          imageid: row.imageid,
          videoid: row.videoid,
          videoid2: row.videoid2,
          challengesubject: row.challengesubject ? [row.challengesubject] : null,
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
          order: row.order,
          contentgroup: row.contentgroup,
          typeoftaking: row.typeoftaking,
          short_description: row.short_description,
          url: row.url,
          header: row.header,
          update: row.update,
          imagelink: row.imagelink,
          translation_dictionary: null
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

        imported++;

        if (imported % 10 === 0) {
          console.log(`Imported ${imported} content records...`);
        }

      } catch (error) {
        console.error(`Error importing content ${row.id}:`, error.message);
      }
    }

    console.log(`Content import complete: ${imported} imported, ${skipped} skipped`);

  } catch (error) {
    console.error('Error during content import:', error);
    throw error;
  }
}

async function importQuestions() {
  console.log('Starting questions import...');

  try {
    const questionsPath = path.join(__dirname, 'attached_assets', 'question2_1750578488422.csv');
    const csvContent = fs.readFileSync(questionsPath, 'utf-8');
    const questionsData = parseCSV(csvContent);

    console.log(`Found ${questionsData.length} question records to import`);

    // Get existing question IDs
    const existingQuestions = await db.execute(sql`SELECT id FROM question`);
    const existingIds = new Set(existingQuestions.rows.map((row: any) => row.id));

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of questionsData) {
      if (!row.id) continue;

      try {
        // Map the CSV fields to our schema
        const questionData = {
          id: row.id,
          topic: row.topicid || row.topic, // Use topicid if available, fallback to topic
          randomorder: row.randomorder,
          questionlevel: row.questionlevel,
          contentid: row.contentid,
          question_type: row.question_type || 'multiple-choice', // Default if empty
          noi_dung: row.noi_dung,
          video: row.video,
          picture: row.picture,
          cau_tra_loi_1: row.cau_tra_loi_1,
          cau_tra_loi_2: row.cau_tra_loi_2,
          cau_tra_loi_3: row.cau_tra_loi_3,
          cau_tra_loi_4: row.cau_tra_loi_4,
          correct_choice: row.correct_choice,
          writing_choice: row.writing_choice,
          time: row.time,
          explanation: row.explanation,
          questionorder: row.questionorder,
          tg_tao: row.tg_tao,
          answer: row.answer
        };

        if (existingIds.has(row.id)) {
          // Update existing question
          await db.execute(sql`
            UPDATE question SET
              topic = ${questionData.topic},
              randomorder = ${questionData.randomorder},
              questionlevel = ${questionData.questionlevel},
              contentid = ${questionData.contentid},
              question_type = ${questionData.question_type},
              noi_dung = ${questionData.noi_dung},
              video = ${questionData.video},
              picture = ${questionData.picture},
              cau_tra_loi_1 = ${questionData.cau_tra_loi_1},
              cau_tra_loi_2 = ${questionData.cau_tra_loi_2},
              cau_tra_loi_3 = ${questionData.cau_tra_loi_3},
              cau_tra_loi_4 = ${questionData.cau_tra_loi_4},
              correct_choice = ${questionData.correct_choice},
              writing_choice = ${questionData.writing_choice},
              time = ${questionData.time},
              explanation = ${questionData.explanation},
              questionorder = ${questionData.questionorder},
              tg_tao = ${questionData.tg_tao},
              answer = ${questionData.answer}
            WHERE id = ${questionData.id}
          `);
          updated++;
        } else {
          // Insert new question
          await db.execute(sql`
            INSERT INTO question (
              id, topic, randomorder, questionlevel, contentid, question_type,
              noi_dung, video, picture, cau_tra_loi_1, cau_tra_loi_2, 
              cau_tra_loi_3, cau_tra_loi_4, correct_choice, writing_choice,
              time, explanation, questionorder, tg_tao, answer
            ) VALUES (
              ${questionData.id}, ${questionData.topic}, ${questionData.randomorder}, 
              ${questionData.questionlevel}, ${questionData.contentid}, ${questionData.question_type}, 
              ${questionData.noi_dung}, ${questionData.video}, ${questionData.picture}, 
              ${questionData.cau_tra_loi_1}, ${questionData.cau_tra_loi_2},
              ${questionData.cau_tra_loi_3}, ${questionData.cau_tra_loi_4}, 
              ${questionData.correct_choice}, ${questionData.writing_choice},
              ${questionData.time}, ${questionData.explanation},
              ${questionData.questionorder}, ${questionData.tg_tao}, ${questionData.answer}
            )
          `);
          imported++;
        }

        if ((imported + updated) % 10 === 0) {
          console.log(`Processed ${imported + updated} question records...`);
        }

      } catch (error) {
        console.error(`Error importing question ${row.id}:`, error.message);
        skipped++;
      }
    }

    console.log(`Questions import complete: ${imported} imported, ${updated} updated, ${skipped} skipped`);

    // Final verification
    const finalQuestionCount = await db.execute(sql`SELECT COUNT(*) FROM question`);
    console.log(`Total question records: ${finalQuestionCount.rows[0].count}`);

  } catch (error) {
    console.error('Error during questions import:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('=== Starting CSV Data Import ===');

    // Import content first
    await importContent();

    // Then import questions
    await importQuestions();

    // Final verification
    const finalContentCount = await db.execute(sql`SELECT COUNT(*) FROM content`);
    const finalQuestionCount = await db.execute(sql`SELECT COUNT(*) FROM question`);

    console.log('\n=== Import Summary ===');
    console.log(`Total content records: ${finalContentCount.rows[0].count}`);
    console.log(`Total question records: ${finalQuestionCount.rows[0].count}`);
    console.log('Import completed successfully!');

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the import
main().catch(console.error);