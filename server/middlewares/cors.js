const cors = require('koa2-cors');

module.exports = () => cors({
  origin: () => '*',
  maxAge: 5,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'Range',
    'X-APP-VERSION',
    'X-APP-STARTAT'
  ],
});