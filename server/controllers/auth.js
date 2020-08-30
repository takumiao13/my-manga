const Controller = require('./_base');
const { ERR_CODE } = require('../helpers/error-code');

class AuthController extends Controller {
  
  async login(ctx) {
    const { service } = this;
    const { username, password } = ctx.request.body;
    const data = service.auth.login(username, password);
    
    if (data) {
      ctx.body = { ...data };
    } else {
      this.app.throwError(ERR_CODE.USER_NOT_FOUND);
    }
  }

  async check(ctx) {
    const { auth } = this.config();

    if (auth) {
      // get auth decoded data;
      const data = ctx.state.auth;
      ctx.body = { ...data, needAuth: true }
    } else {
      ctx.body = { needAuth: false }
    }
  }
}

AuthController.actions = [ 'login', 'check' ];

module.exports = AuthController;