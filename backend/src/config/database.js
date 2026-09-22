// Conectando o banco de dados mysql

import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "bancoalfa",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});