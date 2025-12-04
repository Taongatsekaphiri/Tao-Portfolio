require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const messagesRouter = require('./routes/messages');

const app = express();
const db = new sqlite3.Database('./database.sqlite');

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.use('/messages', messagesRouter);

// Tables
db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT,
    tech TEXT,
    link TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT,
    message TEXT
)`);

// ------------------------------
// HOME PAGE
// ------------------------------
app.get('/', (req, res) => {
    res.render('index', { 
        page: 'home',
        pageStyles: '<link rel="stylesheet" href="/css/style.css">'
    });
});

// ------------------------------
// ABOUT PAGE
// ------------------------------
app.get('/about', (req, res) => {
    res.render('about', { 
        page: 'about',
        pageStyles: '<link rel="stylesheet" href="/css/style.css">'
    });
});

// ------------------------------
// PROJECTS PAGE
// ------------------------------
app.get('/projects', (req, res) => {

    db.all(`SELECT * FROM projects`, [], (err, rows) => {
        if (err) {
            console.error("DB ERROR:", err);
            return res.render('projects', { 
                page: 'projects',
                pageStyles: '<link rel="stylesheet" href="/css/style.css">',
                projects: []
            });
        }

        res.render('projects', {
            page: 'projects',
            pageStyles: '<link rel="stylesheet" href="/css/style.css">',
            projects: rows
        });
    });
});

// ------------------------------
// CONTACT PAGE (GET)
// ------------------------------
app.get('/contact', (req, res) => {
    res.render('contact', {
        page: 'contact',
        pageStyles: `
            <link rel="stylesheet" href="/css/style.css">
            <link rel="stylesheet" href="/css/contact.css">
        `
    });
});

// ------------------------------
// CONTACT PAGE (POST)
// ------------------------------
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ status: 'error', details: 'All fields are required.' });
    }

    db.run(
        `INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)`,
        [name, email, message],
        (err) => {
            if (err) {
                console.error("DB ERROR:", err);
                return res.status(500).json({ status: 'error', details: err.message });
            }

            console.log("Saved contact to database.");
            res.json({ status: 'success' });
        }
    );
});

// ------------------------------
// START SERVER
// ------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:3000`));
