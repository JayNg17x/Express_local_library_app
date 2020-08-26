const express = require('express');
const router = express.Router();

// get home page 
router.get('/', (req, res) => {
    // home page is catalog
    res.redirect('/catalog');
});

module.exports = router;