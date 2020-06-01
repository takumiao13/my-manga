const { CustomError } = require('../error');
const { ERR_CODE } = require('../helpers/error-code');

module.exports = () => async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    // protected resource
    if (err.status === 401) {
      const error = new CustomError(ERR_CODE.INVALD_USER);
      ctx.body = {
        ...error.value()
      };
      ctx.status = 401;
      ctx.logger('app').warn(err);
      
    // biz error
    } else if (err instanceof CustomError) {
      const errInfo = err.value();
      ctx.body = errInfo;
      ctx.logger('app').warn(errInfo);

    // serve error
    } else {
      ctx.status = err.status || 500;
      ctx.body = err.message;
      ctx.logger('app').error(`${ctx.status} ${err}`);
    }
  }
}