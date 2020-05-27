const { CustomError } = require('../error');
const { ERR_CODE } = require('../helpers/error-code');

module.exports = () => async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error(err);

    // protected resource
    if (err.status === 401) {
      const error = new CustomError(ERR_CODE.INVALD_USER);
      ctx.body = {
        ...error.value()
      };
      ctx.status = 401;
      
    } else if (err instanceof CustomError) {
      ctx.body = {
        ...err.value()
      }
    } else {
      ctx.status = err.status || 500;
      ctx.body = err.message;
    }
  }
}