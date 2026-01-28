const express = require("express");
const db = require("../db");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Configurable admin password (fallback to old default)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "tao123";

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
// HOME PAGE ROUTES
// ------------------------------
router.get('/index', ensureAdmin, (req, res) => {
  db.get("SELECT * FROM home_info WHERE id = 1", (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.render('admin/indexa', { home: row || {} });  // Render indexa.ejs
  });
});

router.get("/", ensureAdmin, (req, res) => {
  res.render("admin/dashboard", { page: "home" });
});
// In the POST route for /admin/home/update, ensure it redirects to /admin/index

// ...existing code...

router.post('/home/update', ensureAdmin, upload.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'love_image', maxCount: 1 },
  { name: 'plant_image', maxCount: 1 }
]), (req, res) => {
  const { 
    main_heading = '', 
    typed_lines = '', 
    tags = '', 
    button_text = '', 
    button_link = '', 
    remove_main_image, 
    remove_love_image, 
    remove_plant_image 
  } = req.body;

  db.get("SELECT * FROM home_info WHERE id = 1", (err, row) => {
    if (err) {
      console.error(err);
      return res.send("DB error");
    }

    let mainImage = row?.main_image || '';
    let loveImage = row?.love_image || '';
    let plantImage = row?.plant_image || '';

    // Handle removals with error handling
    if (remove_main_image) {
      try {
        if (mainImage) fs.removeSync(path.join(__dirname, '../public', mainImage.replace(/^\//, '')));
      } catch (e) {
        console.log('Error removing main image:', e.message);
      }
      mainImage = '';
    }
    if (remove_love_image) {
      try {
        if (loveImage) fs.removeSync(path.join(__dirname, '../public', loveImage.replace(/^\//, '')));
      } catch (e) {
        console.log('Error removing love image:', e.message);
      }
      loveImage = '';
    }
    if (remove_plant_image) {
      try {
        if (plantImage) fs.removeSync(path.join(__dirname, '../public', plantImage.replace(/^\//, '')));
      } catch (e) {
        console.log('Error removing plant image:', e.message);
      }
      plantImage = '';
    }

    // Handle new uploads (only if not removing)
    if (req.files?.['main_image'] && !remove_main_image) {
      try {
        if (mainImage) fs.removeSync(path.join(__dirname, '../public', mainImage.replace(/^\//, '')));
      } catch (e) {
        console.log('Error removing old main image:', e.message);
      }
      mainImage = '/images/projects/' + req.files['main_image'][0].filename;
    }
    if (req.files?.['love_image'] && !remove_love_image) {
      try {
        if (loveImage) fs.removeSync(path.join(__dirname, '../public', loveImage.replace(/^\//, '')));
      } catch (e) {
        console.log('Error removing old love image:', e.message);
      }
      loveImage = '/images/projects/' + req.files['love_image'][0].filename;
    }
    if (req.files?.['plant_image'] && !remove_plant_image) {
      try {
        if (plantImage) fs.removeSync(path.join(__dirname, '../public', plantImage.replace(/^\//, '')));
      } catch (e) {
        console.log('Error removing old plant image:', e.message);
      }
      plantImage = '/images/projects/' + req.files['plant_image'][0].filename;
    }

    const typedLinesJSON = JSON.stringify(typed_lines.split('\n'));
    const tagsStr = tags;

    db.run(`
      INSERT INTO home_info (id, main_heading, typed_lines, tags, main_image, love_image, plant_image, button_text, button_link)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        main_heading=excluded.main_heading,
        typed_lines=excluded.typed_lines,
        tags=excluded.tags,
        main_image=excluded.main_image,
        love_image=excluded.love_image,
        plant_image=excluded.plant_image,
        button_text=excluded.button_text,
        button_link=excluded.button_link,
        updated_at=CURRENT_TIMESTAMP
    `, [main_heading, typedLinesJSON, tagsStr, mainImage, loveImage, plantImage, button_text, button_link], (err) => {
      if (err) {
        console.error(err);
        return res.send("DB error: " + err.message);
      }
      res.redirect("/admin/index");
    });
  });
});


// PROJECTS PAGE
// ------------------------------
router.get("/projects", ensureAdmin, (req, res) => {
  db.all("SELECT * FROM projects", (err, projects) => {
    if (err) {
      console.error(err);
      return res.send("Database error");
    }

    db.all("SELECT * FROM project_images", (err, images) => {
      if (err) return res.send("Database error");

      const projectsWithImages = projects.map(p => ({
        ...p,
        images: images
          .filter(img => img.project_id === p.id)
          .map(img => ({ id: img.id, path: img.image_path }))
      }));

      res.render("admin/projecta", {
        projects: projectsWithImages,
        page: "projects",
        pageStyles: '<link rel="stylesheet" href="/css/admin.css">'
      });
    });
  });
});

// ADD NEW PROJECT
router.post("/projects/add", ensureAdmin, upload.array('images', 5), (req, res) => {
  const { title, description, category, tech, link } = req.body;

  db.run("INSERT INTO projects (title, description, category, tech, link) VALUES (?, ?, ?, ?, ?)",
    [title, description, category, tech, link], function(err) {
      if(err) {
        console.error(err);
        return res.send("Database error");
      }

      const projectId = this.lastID;
      req.files?.forEach(file => {
        db.run("INSERT INTO project_images (project_id, image_path) VALUES (?, ?)", [projectId, '/images/projects/' + file.filename]);
      });

      res.redirect("/admin/projects");
    });
});

// UPDATE PROJECT
router.post("/projects/update/:id", ensureAdmin, upload.array('images', 5), (req, res) => {
  const id = req.params.id;
  const { title, description, category, tech, link } = req.body;

  db.run("UPDATE projects SET title = ?, description = ?, category = ?, tech = ?, link = ? WHERE id = ?",
    [title, description, category, tech, link, id], (err) => {
      if(err) {
        console.error(err);
        return res.send("Database error");
      }

      if(req.files?.length > 0){
        req.files.forEach(file => {
          db.run("INSERT INTO project_images (project_id, image_path) VALUES (?, ?)", [id, '/images/projects/' + file.filename]);
        });
      }

      res.redirect("/admin/projects");
    });
});

// DELETE PROJECT
router.get("/projects/delete/:id", ensureAdmin, (req, res) => {
  const id = req.params.id;

  db.all("SELECT image_path FROM project_images WHERE project_id = ?", [id], (err, images) => {
    if(images) images.forEach(img => fs.removeSync(path.join(__dirname, '../public', img.image_path.replace(/^\//, ''))));
    
    db.run("DELETE FROM project_images WHERE project_id = ?", [id], () => {
      db.run("DELETE FROM projects WHERE id = ?", [id], () => {
        res.redirect("/admin/projects");
      });
    });
  });
});

// DELETE SINGLE IMAGE
router.get("/projects/image/delete/:id", ensureAdmin, (req, res) => {
  const id = req.params.id;

  db.get("SELECT image_path FROM project_images WHERE id = ?", [id], (err, row) => {
    if(row){
      fs.removeSync(path.join(__dirname, '../public', row.image_path.replace(/^\//, '')));
      db.run("DELETE FROM project_images WHERE id = ?", [id], () => res.redirect("back"));
    } else res.redirect("back");
  });
});

// ------------------------------
// CONTACT PAGE
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
// ABOUT PAGE
// ------------------------------
router.get('/about', ensureAdmin, (req, res) => {
  db.get("SELECT * FROM about_info WHERE id = 1", (err, about) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    about = about || {
      content: '',
      additional_content: '',
      skills: '',
      profile_pic: '',
      cv_link: ''
    };
    res.render('admin/abouta', {
      about,
      pageStyles: '<link rel="stylesheet" href="/css/admin.css">'
    });
  });
});

router.post('/abouta/update', ensureAdmin, upload.fields([
  { name: 'profile_pic', maxCount: 1 },
  { name: 'cv_link', maxCount: 1 }
]), (req, res) => {
  const { 
    content = '', 
    additional_content = '', 
    skills = '' 
  } = req.body;

  db.get("SELECT * FROM about_info WHERE id = 1", (err, row) => {
    if (err) return res.send("DB error");

    let profilePic = row?.profile_pic || '';
    let cvLink = row?.cv_link || '';

    // Handle new uploads
    if (req.files?.['profile_pic']) {
      try {
        if (profilePic) fs.removeSync(path.join(__dirname, '../public', profilePic.replace(/^\//, '')));
      } catch (e) {
        console.log('Error removing old profile pic:', e.message);
      }
      profilePic = '/images/projects/' + req.files['profile_pic'][0].filename;
    }
    if (req.files?.['cv_link']) {
      try {
        if (cvLink) fs.removeSync(path.join(__dirname, '../public', cvLink.replace(/^\//, '')));
      } catch (e) {
        console.log('Error removing old CV:', e.message);
      }
      cvLink = '/files/' + req.files['cv_link'][0].filename;
    }

    db.run(`
      INSERT INTO about_info (id, content, additional_content, skills, profile_pic, cv_link)
      VALUES (1, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content=excluded.content,
        additional_content=excluded.additional_content,
        skills=excluded.skills,
        profile_pic=excluded.profile_pic,
        cv_link=excluded.cv_link,
        updated_at=CURRENT_TIMESTAMP
    `, [content, additional_content, skills, profilePic, cvLink], (err) => {
      if (err) {
        console.error(err);
        return res.send("DB error: " + err.message);
      }
      res.redirect("/admin/about");
    });
  });
});

// ...existing code...

// ------------------------------
// POPUP LOGIN
// ------------------------------
router.post("/popup-login", (req, res) => {
  const { password } = req.body;
  if(password === ADMIN_PASSWORD) {
    req.session.admin = true;
    return res.json({ success: true });
  }
  res.json({ success: false });
});

module.exports = router;
