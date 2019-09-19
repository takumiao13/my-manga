
const typeHelper = require('./type');
const stringHelper = require('./string');
const objectHelper = require('./object');
const arrayHelper = require('./array');
const functionHelper = require('./function');
const errorCode = require('./error-code');

module.exports = Object.assign({}, 
  typeHelper,
  stringHelper,
  objectHelper,
  arrayHelper,
  functionHelper,
  errorCode
)