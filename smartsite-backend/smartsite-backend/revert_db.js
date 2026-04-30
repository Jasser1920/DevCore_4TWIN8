const { Client } = require('pg');
const client = new Client({
  user: 'smartsite',
  host: 'localhost',
  database: 'smartsite',
  password: 'smartsite',
  port: 5432,
});

async function revert() {
  try {
    await client.connect();
    const res = await client.query(`
      UPDATE projects 
      SET latitude = NULL, longitude = NULL 
      WHERE (latitude = 36.8065 AND longitude = 10.1815) 
      AND (name = 'rzergfdgdfg' OR name = 'fjdkfgkfdg')
    `);
    console.log('Rows reverted:', res.rowCount);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

revert();
