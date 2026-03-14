import { query } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse SQL statements properly, handling multi-line statements
function parseSQLStatements(sqlContent: string): string[] {
  const statements: string[] = [];
  let currentStatement = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < sqlContent.length; i++) {
    const char = sqlContent[i];
    const prevChar = i > 0 ? sqlContent[i - 1] : '';

    // Handle string literals
    if ((char === "'" || char === '"') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }

    // Check for statement end (semicolon outside of string)
    if (char === ';' && !inString) {
      currentStatement += char;
      const trimmed = currentStatement.trim();
      // Filter out comments and empty statements
      const filtered = trimmed
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim();
      
      if (filtered && filtered !== ';') {
        statements.push(filtered);
      }
      currentStatement = '';
    } else {
      currentStatement += char;
    }
  }

  // Add any remaining statement
  const remaining = currentStatement.trim();
  if (remaining) {
    const filtered = remaining
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .trim();
    if (filtered) {
      statements.push(filtered);
    }
  }

  return statements;
}

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database schema...');

    // Read schema.sql
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Parse statements properly
    const statements = parseSQLStatements(schema);

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    let successCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await query(statement);
        successCount++;
        console.log(`✓ Statement ${i + 1}/${statements.length} executed successfully`);
      } catch (err) {
        const error = err as any;
        const errorMsg = error.message || String(error);
        
        // Ignore "already exists" errors
        if (errorMsg.includes('already exists')) {
          console.log(`ℹ️  Statement ${i + 1}/${statements.length} (already exists, skipping)`);
          successCount++;
        } else {
          console.error(`\n❌ Error on statement ${i + 1}/${statements.length}:`);
          console.error('Statement:', statement.substring(0, 80) + '...');
          console.error('Error:', errorMsg);
          throw err;
        }
      }
    }

    console.log(`\n✅ Database schema setup complete! (${successCount}/${statements.length} executed)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
