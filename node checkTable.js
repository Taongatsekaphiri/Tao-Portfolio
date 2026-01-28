const db = require('./db');

db.all("PRAGMA table_info(about_info)", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.table(rows);
  }
});
