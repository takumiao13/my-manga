const cors = require('koa2-cors');

module.exports = () => cors({
  origin: () => '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'Range'],
});