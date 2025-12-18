import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "viha_sarees",
  password: "viha_sarees@1234",
  database: "viha_sarees",
});
