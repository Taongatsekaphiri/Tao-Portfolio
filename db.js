const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.sqlite", (err) => {
    if (err) {
        console.log("DB connection error:", err);
    } else {
        console.log("Database connected successfully");

        // Create tables if they don't exist
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT,
                    description TEXT,
                    category TEXT,
                    tech TEXT,
                    link TEXT
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS project_images (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id INTEGER,
                    image_path TEXT,
                    FOREIGN KEY (project_id) REFERENCES projects(id)
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS home_info (
                    id INTEGER PRIMARY KEY,
                    main_heading TEXT,
                    typed_lines TEXT,
                    tags TEXT,
                    main_image TEXT,
                    love_image TEXT,
                    plant_image TEXT,
                    button_text TEXT,
                    button_link TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS about_info (
                    id INTEGER PRIMARY KEY,
                    profile_pic TEXT,
                    cv_link TEXT,
                    content TEXT,
                    additional_content TEXT,
                    skills TEXT
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS contact_info (
                    id INTEGER PRIMARY KEY,
                    email TEXT,
                    phone TEXT,
                    address TEXT,
                    linkedin TEXT,
                    github TEXT,
                    twitter TEXT
                )
            `);

            // Messages table for public contact form submissions
            db.run(`
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT,
                    email TEXT,
                    subject TEXT,
                    message TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Admin settings table for storing password
            db.run(`
                CREATE TABLE IF NOT EXISTS admin_settings (
                    id INTEGER PRIMARY KEY,
                    password TEXT NOT NULL DEFAULT 'tao123',
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error("Error creating admin_settings table:", err);
                } else {
                    // Initialize with default password if table is empty
                    db.get("SELECT COUNT(*) as count FROM admin_settings WHERE id = 1", (err, row) => {
                        if (err) {
                            console.error("Error checking admin_settings:", err);
                        } else if (row && row.count === 0) {
                            db.run("INSERT INTO admin_settings (id, password) VALUES (1, 'tao123')", (err) => {
                                if (err) {
                                    console.error("Error inserting default password:", err);
                                } else {
                                    console.log("Default admin password initialized");
                                }
                            });
                        }
                    });
                }
            });
        });
    }
});

module.exports = db;
