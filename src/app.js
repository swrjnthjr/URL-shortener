const express = require('express');
const shortenRouter = require('./routes/shorten');
const redirectRouter = require('./routes/redirect');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(express.static('public'));

app.use('/api', shortenRouter);
app.use('/', redirectRouter);

app.use(errorHandler);

module.exports = app;
