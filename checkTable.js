const db = require('./db');

db.all("PRAGMA table_info(about_info)", (err, rows) => {
  if (err) {
    console.error("Error:", err.message);
  } else {
    console.log("about_info table structure:");
    console.table(rows);
  }
});
