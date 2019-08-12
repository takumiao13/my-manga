const ObjectProto = Object.prototype;
const toString = ObjectProto.toString;

// Tags
const nullTag = '[object Null]';
const regexpTag = '[object RegExp]';
const undefinedTag = '[object Undefined]';

function getTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return toString.call(value);
}

exports.isUndef = (obj) => obj === void 0;

exports.isDef = (obj) => obj !== void 0;

exports.isRegExp = (obj) => getTag(obj) === regexpTag;

exports.isNumber = (obj) => typeof obj === 'number';

exports.isArray = Array.isArray;

exports.isIndex = (value) => /0|[1-9]\d*/.test(value); // allow negative int