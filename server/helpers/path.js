const pathFn = require('path');

const split = (path) => {
  return path.split(/\\|\//);
}

const slash = (path, strict) => {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
	const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex

	if (strict && isExtendedLengthPath || hasNonAscii) {
		return path;
	}

	return path.replace(/\\/g, '/');
}

module.exports = {
  ...pathFn,
  split,
  slash,
}