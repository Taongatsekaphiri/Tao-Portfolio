const db = require('./db');

const homeData = {
  main_heading: "G'day, I'm Taonga!<br>I'm a Designer turned Developer ✨",
  typed_lines: JSON.stringify([
    "💻 A Digital Dreamweaver and Pixel Princess who believes technology should be as beautiful as it is powerful.",
    "I craft innovative web applications and manage databases.",
    "I transform ideas into functional digital experiences 🌸."
  ]),
  tags: "Designer,Developer,Creative",
  main_image: "",
  love_image: "",
  plant_image: "",
  button_text: "View My Project Log",
  button_link: "/projects"
};

db.serialize(() => {
  db.run(
    `INSERT INTO home_info (id, main_heading, typed_lines, tags, main_image, love_image, plant_image, button_text, button_link) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [homeData.main_heading, homeData.typed_lines, homeData.tags, homeData.main_image, homeData.love_image, homeData.plant_image, homeData.button_text, homeData.button_link],
    function(err) {
      if(err) return console.error("Insert error:", err);
      console.log("Home page data populated successfully.");
    }
  );
});