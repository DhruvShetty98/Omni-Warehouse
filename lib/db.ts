import mysql from 'mysql2/promise';

// Create the connection pool. The pool-specific settings are the defaults
export const dbMgmt = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME_MGMT || 'omni_warehouse_mgmt',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const dbReports = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME_REPORTS || 'omni_warehouse_reports',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
