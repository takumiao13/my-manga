const { errorCodeMap } = require('./helpers/error-code');

class CustomError extends Error {
  // TODO messsage
  constructor(code, msg) {
    super(msg);
    this.code = code;
    this._info = errorCodeMap[code] || {};
  }

  value() {
    return {
      message: 'unknown error',
      code: this.code,
      ...this._info,
      eMessage: this.message
    }
  }
}

exports.CustomError = CustomError;