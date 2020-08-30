
const _ = require('lodash');
const stringUtil = require('./string');
const objectUtil = require('./object');
const arrayUtil = require('./array');
const langUtil = require('./lang');

module.exports = Object.assign({}, 
  _,
  stringUtil,
  objectUtil,
  arrayUtil,
  langUtil
);