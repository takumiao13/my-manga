const { errorCodeMap } = require('../helpers');
const { CustomError } = require('../error');

module.exports = () => async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.log(err);
    if (err instanceof CustomError) {
      ctx.body = {
        ...err.value()
      }
    } else {
      ctx.status = err.status || 500;
      ctx.body = err.message;
    }
  }
}