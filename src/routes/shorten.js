const express = require('express');
const { createShortUrl } = require('../controllers/shortenController');
const { shortenRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/shorten', shortenRateLimiter, createShortUrl);

module.exports = router;
