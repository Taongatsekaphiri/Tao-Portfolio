const db = require('./db');

const projects = [
  {
    title: "M&E System",
    description: "Monitoring & evaluation system",
    category: "data",
    tech: "React, Node.js",
    link: "#",
    images: ["/images/M&Esy.png" ]
  },
  {
    title: "Girls Community",
    description: "Community project for girls",
    category: "community",
    tech: "HTML, CSS, JS",
    link: "#",
    images: ["/images/girlscomm.png"]
  },
  {
    title: "Tao Portfolio",
    description: "Personal portfolio website",
    category: "portfolio",
    tech: "EJS, Express, Node.js",
    link: "#",
    images: ["/images/myportfolio.png"]
  }
];

db.serialize(() => {
  projects.forEach(project => {
    db.run(
      "INSERT INTO projects (title, description, category, tech, link) VALUES (?, ?, ?, ?, ?)",
      [project.title, project.description, project.category, project.tech, project.link],
      function(err) {
        if (err) return console.log(err);
        const projectId = this.lastID;
        project.images.forEach(img => {
          db.run(
            "INSERT INTO project_images (project_id, image_path) VALUES (?, ?)",
            [projectId, img]
          );
        });
      }
    );
  });
});

console.log("Projects and images populated successfully.");
