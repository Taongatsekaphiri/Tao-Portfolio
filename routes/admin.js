const express = require("express");
const db = require("../db");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Middleware to protect admin routes
function ensureAdmin(req, res, next) {
  if (!req.session.admin) return res.redirect("/");
  next();
}

// ------------------------------
// MULTER CONFIG FOR PROJECT IMAGES
// ------------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/projects/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ------------------------------
// DASHBOARD
// ------------------------------
router.get("/", ensureAdmin, (req, res) => {
  res.render("admin/dashboard", { page: "home" });
});

// ------------------------------
// ABOUT PAGE
// ------------------------------
router.get("/abouta", ensureAdmin, (req, res) => {
  res.render("admin/abouta", { page: "abouta" });
});

// ------------------------------
// PROJECTS PAGE
// ------------------------------
router.get("/projects", ensureAdmin, (req, res) => {
  db.all("SELECT * FROM projects", (err, projects) => {
    if (err) return res.send("Database error");

    db.all("SELECT * FROM project_images", (err, images) => {
      if (err) return res.send("Database error");

      const projectsWithImages = projects.map(p => ({
        ...p,
        images: images
          .filter(img => img.project_id === p.id)
          .map(img => ({ id: img.id, path: img.image_path }))
      }));

      res.render("admin/projecta", { // EJS file stays projecta.ejs
        projects: projectsWithImages,
        page: "projects",
        pageStyles: '<link rel="stylesheet" href="/css/admin.css">'
      });
    });
  });
});

// ------------------------------
// ADD NEW PROJECT
// ------------------------------
router.post("/projects/add", ensureAdmin, upload.array('images', 5), (req, res) => {
  const { title, description, category, tech, link } = req.body;

  db.run("INSERT INTO projects (title, description, category, tech, link) VALUES (?, ?, ?, ?, ?)",
    [title, description, category, tech, link], function(err) {
      if(err) return res.send("Database error");

      const projectId = this.lastID;
      req.files.forEach(file => {
        db.run("INSERT INTO project_images (project_id, image_path) VALUES (?, ?)", [projectId, '/images/projects/' + file.filename]);
      });

      res.redirect("/admin/projects");
    });
});

// ------------------------------
// UPDATE PROJECT INFO
// ------------------------------
router.post("/projects/update/:id", ensureAdmin, upload.array('images', 5), (req, res) => {
  const id = req.params.id;
  const { title, description, category, tech, link } = req.body;

  db.run("UPDATE projects SET title = ?, description = ?, category = ?, tech = ?, link = ? WHERE id = ?",
    [title, description, category, tech, link, id], (err) => {
      if(err) return res.send("Database error");

      // Add new images if uploaded
      if(req.files.length > 0){
        req.files.forEach(file => {
          db.run("INSERT INTO project_images (project_id, image_path) VALUES (?, ?)", [id, '/images/projects/' + file.filename]);
        });
      }

      res.redirect("/admin/projects");
    });
});

// ------------------------------
// DELETE PROJECT
// ------------------------------
router.get("/projects/delete/:id", ensureAdmin, (req, res) => {
  const id = req.params.id;

  db.all("SELECT image_path FROM project_images WHERE project_id = ?", [id], (err, images) => {
    if(images) images.forEach(img => fs.removeSync(`public${img.image_path}`));
    
    db.run("DELETE FROM project_images WHERE project_id = ?", [id], () => {
      db.run("DELETE FROM projects WHERE id = ?", [id], () => {
        res.redirect("/admin/projects");
      });
    });
  });
});

// ------------------------------
// DELETE SINGLE IMAGE
// ------------------------------
router.get("/projects/image/delete/:id", ensureAdmin, (req, res) => {
  const id = req.params.id;

  db.get("SELECT image_path FROM project_images WHERE id = ?", [id], (err, row) => {
    if(row){
      fs.removeSync(`public${row.image_path}`);
      db.run("DELETE FROM project_images WHERE id = ?", [id], () => res.redirect("back"));
    } else res.redirect("back");
  });
});

// ------------------------------
// ADMIN CONTACT PAGE & UPDATE ROUTES
// ------------------------------
router.get('/contact', ensureAdmin, (req, res) => {
  db.get("SELECT * FROM contact_info WHERE id = 1", (err, contact) => {
    if (err) contact = {};
    res.render('admin/contacta', {
      contact,
      pageStyles: '<link rel="stylesheet" href="/css/admin.css">'
    });
  });
});

router.post("/contact/update-info", ensureAdmin, (req, res) => {
  const { email, phone, location } = req.body;
  db.run(`UPDATE contact_info SET email = ?, phone = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
    [email, phone, location], function(err) {
      if(err) return res.json({ status: 'error', details: err.message });
      res.json({ status: 'success', data: { email, phone, location } });
    });
});

router.post("/contact/update-social", ensureAdmin, (req, res) => {
  const { github, linkedin } = req.body;
  db.run(`UPDATE contact_info SET github = ?, linkedin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
    [github, linkedin], function(err) {
      if(err) return res.json({ status: 'error', details: err.message });
      res.json({ status: 'success', data: { github, linkedin } });
    });
});

router.post("/contact/update-header", ensureAdmin, (req, res) => {
  const { title, subtitle } = req.body;
  db.run(`UPDATE contact_info SET title = ?, subtitle = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
    [title, subtitle], function(err) {
      if(err) return res.json({ status: 'error', details: err.message });
      res.json({ status: 'success', data: { title, subtitle } });
    });
});

// ------------------------------
// MESSAGES PAGE
// ------------------------------
router.get("/messages", ensureAdmin, (req, res) => {
  db.all("SELECT * FROM messages ORDER BY id DESC", (err, messages) => {
    if(err) return res.send("Database error");
    res.render("admin/messages", {
      page: "messages",
      pageStyles: '<link rel="stylesheet" href="/css/messages.css">',
      messages
    });
  });
});

router.get("/messages/delete/:id", ensureAdmin, (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM messages WHERE id = ?", id, () => res.redirect("/admin/messages"));
});

// ------------------------------
// POPUP LOGIN POST
// ------------------------------
router.post("/popup-login", (req, res) => {
  const { password } = req.body;
  if(password === "tao123") {
    req.session.admin = true;
    return res.json({ success: true });
  }
  res.json({ success: false });
});

module.exports = router;
