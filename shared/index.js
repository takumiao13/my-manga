
const typeHelper = require('./type');
const stringHelper = require('./string');
const objectHelper = require('./object');
const arrayHelper = require('./array');
const functionHelper = require('./function');

module.exports = {
  ...typeHelper,
  ...stringHelper,
  ...objectHelper,
  ...arrayHelper,
  ...functionHelper
}