const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

// Messages page (admin view)
router.get('/', (req, res) => {
    db.all('SELECT * FROM contacts ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            console.error("DB ERROR:", err);
            return res.status(500).send("Database error");
        }
        res.render('messages', { messages: rows, page: 'messages', pageStyles: '<link rel="stylesheet" href="/css/style.css">' });
    });
});

module.exports = router;
