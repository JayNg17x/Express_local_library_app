const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    res.send('responding with resource...');
});

module.exports = router;