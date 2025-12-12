require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require("express-session");
const sqlite3 = require('sqlite3').verbose();

const messagesRouter = require('./routes/messages');
const adminRoutes = require("./routes/admin");

const app = express();

// -------------------------------------------------------
// MIDDLEWARE (must come BEFORE routes)
// -------------------------------------------------------
app.use(express.json());                               // for JSON (fetch, AJAX)
app.use(express.urlencoded({ extended: true }));        // for forms
app.use(bodyParser.urlencoded({ extended: true }));     // or if you still use bodyParser

app.use(session({
  secret: process.env.SESSION_SECRET || "yourSecretKey",
  resave: false,
  saveUninitialized: true
}));

// -------------------------------------------------------
// VIEW ENGINE & STATIC FILES
// -------------------------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------
// DATABASE CONNECTION
// -------------------------------------------------------
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// Make db global for other files (optional but you were using it)
app.set("db", db);

// -------------------------------------------------------
// ROUTES
// -------------------------------------------------------

// Home page
app.get('/', (req, res) => {
  res.render('index', { page: 'home' });
});

//
// Contact page (PUBLIC – reads from DB)
app.get('/contact', (req, res) => {
  db.get("SELECT * FROM contact_info WHERE id = 1", (err, contact) => {
    if (err) {
      console.log(err);
      return res.send("Database error");
    }

    res.render("contact", {
      page: "contact",
      contact,
      pageStyles: `
        <link rel="stylesheet" href="/css/style.css">
        <link rel="stylesheet" href="/css/contact.css">
      `
    });
  });
});

// About page
app.get('/about', (req, res) => {
  res.render('about', { 
    page: 'about',
    pageStyles: `<link rel="stylesheet" href="/css/style.css">`
  });
});

app.get('/projects', (req, res) => {
  db.all("SELECT * FROM projects", (err, projects) => {
    if (err) return res.send("Database error");

    db.all("SELECT * FROM project_images", (err, images) => {
      if (err) return res.send("Database error");

      const projectsWithImages = projects.map(p => ({
        ...p,
        images: images
          .filter(img => img.project_id === p.id)
          .map(img => img.image_path)
      }));

      const categories = [
        { id: 'all', name: 'All' },
        { id: 'data', name: 'Data Projects' },
        { id: 'community', name: 'Community Projects' },
        { id: 'portfolio', name: 'Portfolio Projects' }
      ];

      res.render('projects', {
        projects: projectsWithImages,
        categories,
        page: 'projects',
        pageStyles: '<link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="/css/projects.css">'
      });
    });
  });
});

// Messages route
app.use('/messages', messagesRouter);

// Admin route
app.use("/admin", adminRoutes);

// -------------------------------------------------------
// SERVER START
// -------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
