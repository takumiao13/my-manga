const { errorCodeMap } = require('./helpers/error-code');

class CustomError extends Error {
  constructor(code, msg) {
    super(code, msg);
    this.code = code;
    this._info = errorCodeMap[code] || {};
  }

  getMesage(code) {
    return errorCodeMap[code] ? errorCodeMap[code].message : 'unknown error'
  }

  value() {
    return Object.assign({
      message: 'unknown error'
    }, {
      code: this.code,
      ...this._info
    })
  }
}

exports.CustomError = CustomError;