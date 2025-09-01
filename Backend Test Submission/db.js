const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "sai",
  password: "s1a2i3$$",
  database: "urlshortner",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
  }
  console.log("Connected to the database.");
});

module.exports = db;
