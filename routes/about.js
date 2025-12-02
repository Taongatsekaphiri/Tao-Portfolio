const express = require('express');
const router = express.Router();

// GET About page
router.get('/', (req, res) => {
    res.render('about', { page: 'about' });
});

module.exports = router;
