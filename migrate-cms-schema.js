import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function migrateCmsSchema() {
  try {
    console.log('Adding CMS columns to topic table...');
    await db.execute(sql`
      ALTER TABLE topic 
      ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS subject TEXT,
      ADD COLUMN IF NOT EXISTS tags TEXT[],
      ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
    `);

    console.log('Adding CMS columns to content table...');
    await db.execute(sql`
      ALTER TABLE content 
      ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 4,
      ADD COLUMN IF NOT EXISTS subject TEXT,
      ADD COLUMN IF NOT EXISTS tags TEXT[],
      ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
    `);

    console.log('Creating CMS filter configuration table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cms_filter_config (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        level INTEGER NOT NULL,
        parent_level INTEGER,
        filter_type TEXT NOT NULL,
        column_name TEXT,
        column_value TEXT,
        filter_logic TEXT DEFAULT 'equals',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('CMS schema migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateCmsSchema();