const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function exportDb() {
  const dbPath = path.join(process.cwd(), 'db/konjac2.db');
  
  if (!fs.existsSync(dbPath)) {
    console.warn(`[WARNING] Database not found at ${dbPath}. Skipping export. (Existing JSON files will be used)`);
    return;
  }

  try {
    console.log(`Connecting to SQLite database: ${dbPath}`);
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    console.log('Querying unique strategy names...');
    const strategies = await db.all('SELECT DISTINCT strategy FROM trade WHERE strategy IS NOT NULL');
    console.log(`Found ${strategies.length} strategies.`);

    const outputDir = path.join(process.cwd(), 'public/data/trades');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const { strategy } of strategies) {
      if (!strategy) continue;
      
      console.log(`Exporting trades for strategy: ${strategy}`);
      const rows = await db.all(
        `SELECT *
         FROM trade
         WHERE strategy = ?
         AND entry_date IS NOT NULL 
         AND exit_date IS NOT NULL
         ORDER BY entry_date ASC`,
        [strategy]
      );

      const outputPath = path.join(outputDir, `${strategy}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2), 'utf8');
      console.log(`Successfully exported ${rows.length} trades to ${outputPath}`);
    }

    await db.close();
    console.log('Database export completed successfully!');
  } catch (error) {
    console.error('Error during database export:', error);
    process.exit(1);
  }
}

exportDb();
