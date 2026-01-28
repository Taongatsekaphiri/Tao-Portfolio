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
app.use(express.urlencoded({ extended: true }));      // for forms
app.use(bodyParser.urlencoded({ extended: true }));   // legacy bodyParser support

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

// Make db global for other files
app.set("db", db);

// -------------------------------------------------------
// ROUTES
// -------------------------------------------------------

// One-page route: aggregates all sections
app.get('/onepage', (req, res) => {
  const result = { categories: [
    { id: 'all', name: 'All' },
    { id: 'data', name: 'Data Projects' },
    { id: 'community', name: 'Community Projects' },
    { id: 'portfolio', name: 'Portfolio Projects' }
  ]};

  db.get("SELECT * FROM home_info WHERE id = 1", (errHome, home) => {
    if (errHome) home = null;
    if (home && typeof home.typed_lines === 'string') {
      try { home.typed_lines = JSON.parse(home.typed_lines); } catch(e) { home.typed_lines = []; }
    }
    result.home = home || {};

    db.get("SELECT * FROM about_info WHERE id = 1", (errAbout, about) => {
      if (errAbout) about = null;
      if (!about) {
        about = {
          profile_pic: "/images/cute.png",
          cv_link: "/doc/Taonga_CV.pdf",
          content: "I studied Bachelor of Science in ICT at Mzuzu University, based in Blantyre, Malawi. I am passionate about software development, web programming, and database management. I enjoy creating solutions that are both functional and user-friendly.",
          additional_content: "",
          skills: "PC maintenance,Operating systems,Web development,Database management,System analysis & design,Networking,Information systems auditing"
        };
      }
      // ensure skills is array in view
      result.about = about;

      db.all("SELECT * FROM projects", (errProj, projects) => {
        if (errProj) projects = [];
        db.all("SELECT * FROM project_images", (errImgs, images) => {
          if (errImgs) images = [];

          const projectsWithImages = (projects || []).map(p => ({
            ...p,
            images: (images || []).filter(img => img.project_id === p.id).map(img => img.image_path)
          }));
          result.projects = projectsWithImages;

          db.get("SELECT * FROM contact_info WHERE id = 1", (errContact, contact) => {
            if (errContact) contact = null;
            res.render('index_onepage', {
              page: 'home',
              onePageMode: true,
              home: result.home,
              about: result.about,
              projects: result.projects,
              categories: result.categories,
              contact: contact || {}
            });
          });
        });
      });
    });
  });
});

// Home page -> render one-page aggregated view
app.get('/', (req, res) => {
  const result = { categories: [
    { id: 'all', name: 'All' },
    { id: 'data', name: 'Data Projects' },
    { id: 'community', name: 'Community Projects' },
    { id: 'portfolio', name: 'Portfolio Projects' }
  ]};

  db.get("SELECT * FROM home_info WHERE id = 1", (errHome, home) => {
    if (errHome) home = null;
    if (home && typeof home.typed_lines === 'string') {
      try { home.typed_lines = JSON.parse(home.typed_lines); } catch(e) { home.typed_lines = []; }
    }
    result.home = home || {};

    db.get("SELECT * FROM about_info WHERE id = 1", (errAbout, about) => {
      if (errAbout) about = null;
      if (!about) {
        about = {
          profile_pic: "/images/cute.png",
          cv_link: "/doc/Taonga_CV.pdf",
          content: "I studied Bachelor of Science in ICT at Mzuzu University, based in Blantyre, Malawi. I am passionate about software development, web programming, and database management. I enjoy creating solutions that are both functional and user-friendly.",
          additional_content: "",
          skills: "PC maintenance,Operating systems,Web development,Database management,System analysis & design,Networking,Information systems auditing"
        };
      }
      result.about = about;

      db.all("SELECT * FROM projects", (errProj, projects) => {
        if (errProj) projects = [];
        db.all("SELECT * FROM project_images", (errImgs, images) => {
          if (errImgs) images = [];

          const projectsWithImages = (projects || []).map(p => ({
            ...p,
            images: (images || []).filter(img => img.project_id === p.id).map(img => img.image_path)
          }));
          result.projects = projectsWithImages;

          db.get("SELECT * FROM contact_info WHERE id = 1", (errContact, contact) => {
            if (errContact) contact = null;
            res.render('index_onepage', {
              page: 'home',
              onePageMode: true,
              home: result.home,
              about: result.about,
              projects: result.projects,
              categories: result.categories,
              contact: contact || {}
            });
          });
        });
      });
    });
  });
});

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

// Public contact form submission (AJAX)
app.post('/contact', (req, res) => {
  const raw = req.body || {};
  const name = (raw.name || '').trim();
  const email = (raw.email || '').trim();
  const subject = (raw.subject || '').trim();
  const message = (raw.message || '').trim();

  // Ensure messages table exists with minimum columns
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, [], (err) => {
    if (err) {
      console.error('Error ensuring messages table:', err);
      return res.status(500).json({ status: 'error', details: 'Database setup failed' });
    }

    // Detect if 'subject' column exists
    db.all(`PRAGMA table_info(messages)`, [], (pragmaErr, columns) => {
      if (pragmaErr) {
        console.error('PRAGMA error:', pragmaErr);
        return res.status(500).json({ status: 'error', details: 'Database inspection failed' });
      }

      const hasSubject = Array.isArray(columns) && columns.some(c => c.name === 'subject');
      const sql = hasSubject
        ? `INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)`
        : `INSERT INTO messages (name, email, message) VALUES (?, ?, ?)`;
      const params = hasSubject
        ? [name, email, subject, message]
        : [name, email, message];

      db.run(sql, params, function (insertErr) {
        if (insertErr) {
          console.error('Error saving message:', insertErr);
          return res.status(500).json({ status: 'error', details: 'Failed to save message' });
        }
        return res.json({ status: 'success' });
      });
    });
  });
});
// About page (PUBLIC – reads from DB)
app.get('/about', (req, res) => {
  db.get("SELECT * FROM about_info WHERE id = 1", (err, about) => {
    if(err || !about) {
      // fallback if DB is empty
      about = {
        profile_pic: "/images/cute.png",
        cv_link: "/doc/Taonga_CV.pdf",
        content: "I studied Bachelor of Science in ICT at Mzuzu University, based in Blantyre, Malawi. I am passionate about software development, web programming, and database management. I enjoy creating solutions that are both functional and user-friendly.",
        additional_content: "",
        skills: "PC maintenance,Operating systems,Web development,Database management,System analysis & design,Networking,Information systems auditing"
      };
    }

    // Convert skills string to array
    const skills = about.skills ? about.skills.split(',') : [];

    res.render('about', { 
      page: 'about',
      pageStyles: `<link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="/css/about.css">`,
      about: {
        ...about,
        skills
      }
    });
  });
});

// Projects page (PUBLIC)
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
