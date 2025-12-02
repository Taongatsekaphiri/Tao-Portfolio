// FILE: app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const db = new sqlite3.Database('./database.sqlite');

// Set view engine and static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Create tables if not exist
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

// Routers
const projectsRouter = require('./routes/projects');
const contactRouter = require('./routes/contact');
const aboutRouter = require('./routes/about');

// Use routers
app.use(express.static('public'));

app.use('/projects', projectsRouter);
app.use('/contact', contactRouter);
app.use('/about', aboutRouter);
app.use(express.static('public'));



// Home page
app.get('/', (req, res) => {
    res.render('index', { 
        page: 'home',
        pageStyles: '<link rel="stylesheet" href="/css/style.css">'
    });
});

// About page
app.get('/about', (req, res) => {
    res.render('about', { 
        page: 'about',
        pageStyles: '<link rel="stylesheet" href="/css/style.css">'
    });
});

// Projects page
app.get('/projects', (req, res) => {
    db.all('SELECT * FROM projects', [], (err, rows) => {
        if (err) throw err;
        res.render('projects', { 
            page: 'projects',
            pageStyles: '<link rel="stylesheet" href="/css/style.css">',
            projects: rows 
        });
    });
});

// Contact page
app.get('/contact', (req, res) => {
    res.render('contact', { 
        page: 'contact',
        pageStyles: '<link rel="stylesheet" href="/css/style.css">'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

