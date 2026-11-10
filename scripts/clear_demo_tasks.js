const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'capcipcup-db',
  });

  const [delRes] = await conn.query("DELETE FROM lab_tasks WHERE id LIKE '%demo%'");
  console.log('Deleted rows:', delRes.affectedRows);

  const [remaining] = await conn.query('SELECT id, title, room_code FROM lab_tasks');
  console.log('Remaining tasks count:', remaining.length);
  console.log(remaining);

  await conn.end();
}

main().catch(console.error);

