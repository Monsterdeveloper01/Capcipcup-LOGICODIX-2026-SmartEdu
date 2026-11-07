import mysql, { Pool } from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
}

const dbConfig = {
  host: process.env.DB_HOST || "101.255.208.150",
  port: parseInt(process.env.DB_PORT || "8782", 10),
  database: process.env.DB_NAME || "capcipcup-db",
  user: process.env.DB_USER || "capcipcup-db-usr",
  password: process.env.DB_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
};

// Singleton pool for Next.js dev server hot reload
export const pool: Pool =
  global.__dbPool ||
  mysql.createPool({
    ...dbConfig,
  });

if (process.env.NODE_ENV !== "production") {
  global.__dbPool = pool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}

export async function testDbConnection(): Promise<{
  success: boolean;
  message: string;
  details?: {
    host: string;
    port: number;
    database: string;
    user: string;
    latencyMs?: number;
    version?: string;
  };
  error?: string;
}> {
  const start = Date.now();
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query<any[]>("SELECT VERSION() as version");
      const latencyMs = Date.now() - start;
      const version = rows[0]?.version || "unknown";

      return {
        success: true,
        message: "Koneksi ke database berhasil terhubung!",
        details: {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          user: dbConfig.user,
          latencyMs,
          version,
        },
      };
    } finally {
      connection.release();
    }
  } catch (err: any) {
    return {
      success: false,
      message: "Gagal terhubung ke database.",
      details: {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user,
      },
      error: err?.message || String(err),
    };
  }
}
