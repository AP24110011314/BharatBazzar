const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'shopdb';

  console.log(`📡 Connecting to MySQL at ${host}:${port} as ${user}...`);

  let connection;
  try {
    // Connect without a database first
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
    });
    console.log('✅ Connected to MySQL server.');
  } catch (err) {
    console.error('❌ Failed to connect to MySQL server. Please verify your credentials in backend/.env');
    console.error('Error details:', err.message);
    process.exit(1);
  }

  try {
    console.log(`🔨 Re-creating database "${database}" for a clean installation...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${database}\`;`);
    await connection.query(`CREATE DATABASE \`${database}\`;`);
    await connection.query(`USE \`${database}\`;`);
    console.log(`📂 Using database "${database}".`);

    // Paths to schema.sql and seed.sql
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');

    const executeSqlFile = async (filePath) => {
      console.log(`📖 Reading SQL file: ${path.basename(filePath)}...`);
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      const sqlContent = fs.readFileSync(filePath, 'utf-8');
      
      const queries = [];
      let currentQuery = '';
      let currentDelimiter = ';';
      const lines = sqlContent.split('\n');

      for (let line of lines) {
        // Strip line comments safely
        let uncommentedLine = line;
        const doubleDashIndex = line.indexOf('--');
        if (doubleDashIndex !== -1) {
          uncommentedLine = line.substring(0, doubleDashIndex);
        }
        const hashIndex = uncommentedLine.indexOf('#');
        if (hashIndex !== -1) {
          uncommentedLine = uncommentedLine.substring(0, hashIndex);
        }

        const trimmedLine = uncommentedLine.trim();
        if (!trimmedLine) {
          continue;
        }

        // Check for DELIMITER change
        if (trimmedLine.toUpperCase().startsWith('DELIMITER')) {
          const parts = trimmedLine.split(/\s+/);
          if (parts.length > 1) {
            currentDelimiter = parts[1];
          }
          continue;
        }

        currentQuery += uncommentedLine + '\n';

        // Check if the current delimiter ends the query
        if (trimmedLine.endsWith(currentDelimiter)) {
          let queryToExecute = currentQuery.trim();
          if (queryToExecute.endsWith(currentDelimiter)) {
            queryToExecute = queryToExecute.slice(0, -currentDelimiter.length);
          }
          queryToExecute = queryToExecute.trim();
          
          if (queryToExecute) {
            queries.push(queryToExecute);
          }
          currentQuery = '';
        }
      }

      // Add any remaining query
      const finalTrimmed = currentQuery.trim();
      if (finalTrimmed) {
        queries.push(finalTrimmed);
      }

      console.log(`⚡ Executing ${queries.length} SQL queries from ${path.basename(filePath)}...`);
      for (let i = 0; i < queries.length; i++) {
        const q = queries[i];
        try {
          await connection.query(q);
        } catch (err) {
          console.error(`❌ Error executing query #${i + 1} in ${path.basename(filePath)}:`);
          console.error(`Query snippet: ${q.substring(0, 150)}...`);
          console.error(`Error message: ${err.message}`);
          throw err;
        }
      }
      console.log(`✅ Finished executing ${path.basename(filePath)}.`);
    };

    await executeSqlFile(schemaPath);
    await executeSqlFile(seedPath);
    console.log('🎉 Database initialization completed successfully!');

  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDB();
