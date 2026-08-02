const express = require('express');
const { createShortUrl } = require('../controllers/shortenController');

const router = express.Router();

router.post('/shorten', createShortUrl);

module.exports = router;
