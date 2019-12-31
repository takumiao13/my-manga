
const _ = require('lodash');
const stringUtil = require('./string');
const objectUtil = require('./object');
const langUtil = require('./lang');

module.exports = Object.assign({}, 
  _,
  stringUtil,
  objectUtil,
  langUtil
);