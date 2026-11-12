const mysql = require("mysql2/promise");

async function main() {
  const conn = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "capcipcup-db",
  });

  const [cols] = await conn.query("SHOW COLUMNS FROM users LIKE 'has_completed_tutorial'");
  if (cols.length === 0) {
    await conn.query("ALTER TABLE users ADD COLUMN has_completed_tutorial TINYINT(1) NOT NULL DEFAULT 0");
    console.log("SUCCESS: Column has_completed_tutorial added to users table.");
  } else {
    console.log("INFO: Column has_completed_tutorial already exists.");
  }

  // Also check if Ahmad Faiz (siswa) has already completed the tutorial in the database
  const [userCols] = await conn.query("SELECT id, username, has_completed_tutorial FROM users WHERE username = 'siswa'");
  console.log("Current status for 'siswa':", userCols);

  await conn.end();
}

main().catch((e) => {
  console.error("Migration error:", e);
  process.exit(1);
});

