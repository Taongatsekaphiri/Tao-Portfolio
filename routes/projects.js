const express = require('express');
const router = express.Router();

// Define projects array
const projects = [
    {
        title: 'Personal Portfolio Website',
        description: 'Showcases your skills, projects, and contact info.',
        imageUrl: '/images/MyPortfolio.png',
        category: 'UI/UX',
        tech: 'Node.js | Express.js | SQLite | HTML | CSS | JavaScript | EJS',
        link: '#'
    },
    {
        title: 'Girls Community',
        description: 'A web-based platform that empowers girls 🌸',
        imageUrl: '/images/girlscomm.png',
        category: 'UI/UX',
        tech: 'Node.js | Express.js | SQLite | HTML | CSS | JavaScript | EJS',
        link: '#'
    },
    {
        title: 'M&E System',
        description: 'Monitoring & evaluation system for SPRODETA 📊',
        imageUrl: '/images/M&Esy.png',
        category: 'Data Management',
        tech: 'JavaScript | SQL | HTML | CSS | React | Next.js | Node.js | Express.js | Mongoose | MongoDB',
        link: '#'
    }
];

router.get('/', (req, res) => {
    res.render('projects', {
        page: 'projects',
        projects: projects   // <-- This is what EJS needs
    });
});

module.exports = router;
