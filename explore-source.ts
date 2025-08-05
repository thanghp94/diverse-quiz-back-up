import { Pool as PgPool } from 'pg';

// Setup for source database using provided connection details
const sourcePool = new PgPool({
  host: '193.42.244.152',
  port: 2345,
  user: 'postgres',
  password: 'psql@2025',
  database: 'postgres'
});

async function exploreDatabase() {
  console.log('Exploring source database structure...');
  
  try {
    // List all tables
    const tablesQuery = `
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tables = await sourcePool.query(tablesQuery);
    console.log('\nAvailable tables:');
    for (const table of tables.rows) {
      console.log(`- ${table.table_name}`);
      
      // Get row count for each table
      try {
        const countResult = await sourcePool.query(`SELECT COUNT(*) FROM ${table.table_name}`);
        console.log(`  Records: ${countResult.rows[0].count}`);
      } catch (error) {
        console.log(`  Error counting records: ${error.message}`);
      }
    }

    // If there are tables, show structure of first few
    if (tables.rows.length > 0) {
      console.log('\nTable structures:');
      for (const table of tables.rows.slice(0, 3)) {
        console.log(`\n--- ${table.table_name} ---`);
        const columnsQuery = `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = '${table.table_name}' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `;
        
        const columns = await sourcePool.query(columnsQuery);
        for (const column of columns.rows) {
          console.log(`  ${column.column_name}: ${column.data_type} ${column.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error exploring database:', error);
  } finally {
    await sourcePool.end();
  }
}

exploreDatabase().catch(console.error);