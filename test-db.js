const mysql = require('mysql2/promise');

async function test() {
  try {
    const connection = await mysql.createConnection({
      host: 'db.utvt.cloud',
      user: 'conveme',
      password: 'bs',
      database: 'db_conveme'
    });
    console.log('✅ Connection to DB successful!');
    const [rows] = await connection.execute('SELECT 1 + 1 AS result');
    console.log('Test query result:', rows[0].result);
    await connection.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

test();
