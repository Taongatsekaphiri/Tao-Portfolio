const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all('SELECT * FROM contacts', [], (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Contacts in database:");
    console.table(rows);
    db.close();
});
