import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MIGRATIONS = [
  '001_schema.sql',
  '002_search_indexes.sql',
];

async function runMigrations() {
  try {
    for (const file of MIGRATIONS) {
      const sqlContent = fs.readFileSync(path.join(__dirname, file), 'utf8');
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of statements) {
        await sql(`${stmt};`);
      }
      console.log(`Migration ${file} completed successfully.`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
