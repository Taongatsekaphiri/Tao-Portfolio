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
        });
    }
});

module.exports = db;
