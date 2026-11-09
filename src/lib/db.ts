import mysql, { Pool } from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __dbConfigKey: string | undefined;
}

function cleanEnv(val?: string): string {
  if (val === undefined || val === null) return "";
  return val.split("#")[0].trim();
}

function getDbConfig() {
  return {
    host: cleanEnv(process.env.DB_HOST) || "127.0.0.1",
    port: parseInt(cleanEnv(process.env.DB_PORT) || "3306", 10),
    database: cleanEnv(process.env.DB_NAME) || "capcipcup-db",
    user: cleanEnv(process.env.DB_USER) || "root",
    password: cleanEnv(process.env.DB_PASSWORD),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 5000,
  };
}

export function getPool(): Pool {
  const config = getDbConfig();
  const configKey = `${config.host}:${config.port}:${config.database}:${config.user}:${config.password}`;

  if (!global.__dbPool || global.__dbConfigKey !== configKey) {
    if (global.__dbPool) {
      global.__dbPool.end().catch(() => {});
    }
    global.__dbPool = mysql.createPool(config);
    global.__dbConfigKey = configKey;
  }

  return global.__dbPool;
}

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const activePool = getPool();
    const value = (activePool as any)[prop];
    return typeof value === "function" ? value.bind(activePool) : value;
  },
});

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const activePool = getPool();
  const [results] = await activePool.execute(sql, params);
  return results as T;
}

export async function testDbConnection() {
  const config = getDbConfig();
  const start = Date.now();

  try {
    const activePool = getPool();
    const connection = await activePool.getConnection();
    try {
      const [rows] = await connection.query<any[]>("SELECT VERSION() as version");
      const latencyMs = Date.now() - start;
      const version = rows[0]?.version || "unknown";

      return {
        success: true,
        message: "Koneksi ke database MariaDB/MySQL berhasil terhubung!",
        details: {
          host: config.host,
          port: config.port,
          database: config.database,
          user: config.user,
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
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
      },
      error: err?.message || String(err),
    };
  }
}
