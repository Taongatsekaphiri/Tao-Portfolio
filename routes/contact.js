const express = require('express');
const router = express.Router();

// Show contact page
router.get('/', (req, res) => {
    res.render('contact', {
        page: 'contact',
        pageStyles: '<link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="/css/contact.css">'
    });
});

module.exports = router;
