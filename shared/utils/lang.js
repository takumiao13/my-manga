
const undefined = void 0;

const isUndef = (obj) => obj === undefined;

const isDef = (obj) => obj !== undefined;

const isNumeric = (value) => !isNaN(parseFloat(value)) && isFinite(value);

module.exports = {
  isUndef,
  isDef,
  isNumeric
}