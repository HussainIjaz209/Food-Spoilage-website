const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'Hussainijaz@123',
    multipleStatements: true
  });

  console.log('Connected to MySQL server at 127.0.0.1.');

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log('Executing schema.sql...');
    await connection.query(schemaSql);
    console.log('Database schema created successfully.');

    const mockDataSql = fs.readFileSync(path.join(__dirname, 'mock_data.sql'), 'utf8');
    console.log('Executing mock_data.sql...');
    await connection.query(mockDataSql);
    console.log('Mock data populated successfully.');

    // Print created databases to confirm
    const [rows] = await connection.query('SHOW DATABASES;');
    console.log('Current Databases on Server:', rows.map(r => r.Database));

  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
    console.log('Database connection closed.');
  }
}

main();
