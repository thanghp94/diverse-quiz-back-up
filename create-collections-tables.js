import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ONSLUx5f2pMo@ep-rapid-dew-ad58cvd6.c-2.us-east-1.aws.neon.tech/neondb');

async function createCollectionsTables() {
  try {
    console.log('Creating collections table...');
    await sql`
      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        page_route TEXT NOT NULL,
        display_type TEXT NOT NULL,
        filter_criteria JSONB,
        sort_order TEXT DEFAULT 'asc',
        sort_field TEXT DEFAULT 'title',
        is_active BOOLEAN DEFAULT true,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('Creating collection_content table...');
    await sql`
      CREATE TABLE IF NOT EXISTS collection_content (
        id TEXT PRIMARY KEY,
        collection_id TEXT NOT NULL,
        content_id TEXT,
        topic_id TEXT,
        groupcard_id TEXT,
        display_order INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('Tables created successfully!');
    
    // Create sample collections
    console.log('Creating sample collections...');
    
    const collection1Id = 'bowl-challenge-topics';
    await sql`
      INSERT INTO collections (id, name, description, page_route, display_type, filter_criteria, sort_field, sort_order)
      VALUES (${collection1Id}, 'Bowl & Challenge Topics', 'Main topic collection similar to current Topics page layout', '/topics', 'alphabetical', '{"showstudent": true, "parentid": null}', 'topic', 'asc')
      ON CONFLICT (id) DO NOTHING
    `;

    const collection2Id = 'writing-topics';
    await sql`
      INSERT INTO collections (id, name, description, page_route, display_type, filter_criteria, sort_field, sort_order)
      VALUES (${collection2Id}, 'Writing Topics', 'Writing prompts and exercises organized by subject', '/writing', 'by_subject', '{"challengesubject": "Writing", "showstudent": true}', 'topic', 'asc')
      ON CONFLICT (id) DO NOTHING
    `;

    const collection3Id = 'math-content';
    await sql`
      INSERT INTO collections (id, name, description, page_route, display_type, filter_criteria, sort_field, sort_order)
      VALUES (${collection3Id}, 'Math Content Collection', 'Mathematics topics and content organized for easy access', '/math', 'grid', '{"challengesubject": "Math"}', 'topic', 'asc')
      ON CONFLICT (id) DO NOTHING
    `;

    console.log('Sample collections created successfully!');
    
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

createCollectionsTables();