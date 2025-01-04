const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Open database connection
const db = new sqlite3.Database('database.sqlite', (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Get all migration files
const migrationsDir = path.join(__dirname, 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort();

// Run migrations in sequence
db.serialize(() => {
  // Create migrations table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Run each migration file
  migrationFiles.forEach(file => {
    const migration = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    db.get('SELECT * FROM migrations WHERE name = ?', [file], (err, row) => {
      if (err) {
        console.error('Error checking migration:', err);
        return;
      }
      
      if (!row) {
        console.log(`Running migration: ${file}`);
        db.exec(migration, (err) => {
          if (err) {
            console.error(`Error running migration ${file}:`, err);
            return;
          }
          
          db.run('INSERT INTO migrations (name) VALUES (?)', [file], (err) => {
            if (err) {
              console.error(`Error recording migration ${file}:`, err);
              return;
            }
            console.log(`Completed migration: ${file}`);
          });
        });
      } else {
        console.log(`Skipping migration ${file} (already applied)`);
      }
    });
  });
});

// Close database connection when done
process.on('exit', () => {
  db.close();
}); 