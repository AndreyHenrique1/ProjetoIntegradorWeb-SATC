// Conectando o banco de dados mysql

import mysql from "mysql2/promise";

const usandoNuvem = !!process.env.DB_HOST;

export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "bancoalfa",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: usandoNuvem
    ? { minVersion: "TLSv1.2", rejectUnauthorized: true }
    : undefined
});