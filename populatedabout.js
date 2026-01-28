const db = require('./db');

const aboutData = {
  profile_pic: "/images/cute.png",
  cv_link: "/doc/Taonga_CV.pdf",
  content: "I studied Bachelor of Science in ICT at Mzuzu University, based in Blantyre, Malawi. I am passionate about software development, web programming, and database management. I enjoy creating solutions that are both functional and user-friendly.",
  additional_content: "Additional info can be placed here.",
  skills: "PC maintenance,Operating systems,Web development,Database management,System analysis & design,Networking,Information systems auditing"
};

db.serialize(() => {
  db.run(
    `INSERT INTO about_info (profile_pic, cv_link, content, additional_content, skills) VALUES (?, ?, ?, ?, ?)`,
    [aboutData.profile_pic, aboutData.cv_link, aboutData.content, aboutData.additional_content, aboutData.skills],
    function(err) {
      if(err) return console.error("Insert error:", err);
      console.log("About page data populated successfully.");
    }
  );
});
