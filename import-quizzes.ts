import { Pool } from 'pg';
import { db } from './server/db';
import { questions } from './shared/schema';

// External database connection
const externalDb = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ONSLUx5f2pMo@ep-rapid-dew-ad58cvd6.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function importQuizzes() {
  try {
    console.log('🔗 Connecting to external database...');
    
    // First, let's examine the questions table structure
    // Check if questions table exists
    console.log('📋 Checking for questions table...');
    const tableExists = await externalDb.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'questions';
    `);
    
    if (tableExists.rows.length === 0) {
      console.log('ℹ️ Questions table does not exist in external database');
      console.log('📊 Available tables:');
      const allTables = await externalDb.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
      console.table(allTables.rows);
      console.log('✅ No questions to import - external database does not contain questions table');
      return;
    }
    
    console.log('✅ Questions table found');
    const tableInfo = await externalDb.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'questions' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Questions table structure:');
    console.table(tableInfo.rows);
    
    // Get total count
    const countResult = await externalDb.query('SELECT COUNT(*) as total FROM questions');
    console.log(`📊 Total questions found: ${countResult.rows[0].total}`);
    
    // Sample a few records to understand the data structure
    const sampleResult = await externalDb.query('SELECT * FROM questions LIMIT 5');
    console.log('📄 Sample questions:');
    console.table(sampleResult.rows);
    
    // Get all questions
    const questionsResult = await externalDb.query('SELECT * FROM questions ORDER BY id');
    const externalQuestions = questionsResult.rows;
    
    console.log(`📥 Importing ${externalQuestions.length} questions...`);
    
    let imported = 0;
    let skipped = 0;
    
    for (const externalQuestion of externalQuestions) {
      try {
        // Map external question structure to our schema
        const questionData = {
          id: externalQuestion.id?.toString() || `imported_${Date.now()}_${imported}`,
          topic_id: externalQuestion.topic_id?.toString() || externalQuestion.topicid?.toString() || 'general',
          content_id: externalQuestion.content_id?.toString() || externalQuestion.contentid?.toString() || null,
          question_text: externalQuestion.question_text || externalQuestion.question || externalQuestion.text || '',
          question_type: externalQuestion.question_type || externalQuestion.type || 'multiple_choice',
          options: externalQuestion.options ? 
            (Array.isArray(externalQuestion.options) ? externalQuestion.options : JSON.parse(externalQuestion.options || '[]')) : 
            [
              externalQuestion.option_a || externalQuestion.a || '',
              externalQuestion.option_b || externalQuestion.b || '',
              externalQuestion.option_c || externalQuestion.c || '',
              externalQuestion.option_d || externalQuestion.d || ''
            ].filter(Boolean),
          correct_answer: externalQuestion.correct_answer || externalQuestion.answer || externalQuestion.correct || '',
          difficulty: externalQuestion.difficulty || externalQuestion.level || 'medium',
          points: externalQuestion.points ? parseInt(externalQuestion.points) : 10,
          explanation: externalQuestion.explanation || externalQuestion.feedback || null,
          tags: externalQuestion.tags ? 
            (Array.isArray(externalQuestion.tags) ? externalQuestion.tags : JSON.parse(externalQuestion.tags || '[]')) : 
            [],
          created_at: externalQuestion.created_at || new Date().toISOString(),
          updated_at: externalQuestion.updated_at || new Date().toISOString()
        };
        
        // Insert into our database
        await db.insert(questions).values(questionData).onConflictDoNothing();
        imported++;
        
        if (imported % 10 === 0) {
          console.log(`📝 Imported ${imported} questions...`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to import question ${externalQuestion.id}:`, error);
        skipped++;
      }
    }
    
    console.log(`✅ Quiz import completed!`);
    console.log(`📊 Statistics:`);
    console.log(`   - Total processed: ${externalQuestions.length}`);
    console.log(`   - Successfully imported: ${imported}`);
    console.log(`   - Skipped due to errors: ${skipped}`);
    
    // Verify import
    const verifyResult = await db.select().from(questions);
    console.log(`🔍 Total questions now in local database: ${verifyResult.length}`);
    
  } catch (error) {
    console.error('❌ Quiz import failed:', error);
    throw error;
  } finally {
    await externalDb.end();
  }
}

// Run the import
importQuizzes()
  .then(() => {
    console.log('🎉 Quiz import process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Quiz import process failed:', error);
    process.exit(1);
  });