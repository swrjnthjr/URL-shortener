const express = require('express');
const { redirectToLongUrl } = require('../controllers/redirectController');

const router = express.Router();

router.get('/:code', redirectToLongUrl);

module.exports = router;
