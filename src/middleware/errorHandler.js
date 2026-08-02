// Express identifies error middleware by its 4-arg signature, so `next`
// must stay in the signature even though it's unused here.
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: { message: err.message || 'Internal Server Error' } });
}

module.exports = errorHandler;
