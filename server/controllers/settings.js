const Controller = require('./_base');

class SettingsController extends Controller {

  async get(ctx) {
    const { service } = this;
    const { scope, key } = ctx.query;
    const data = await service.settings.get(scope, key);

    ctx.body = { data };
  }
  
  async post(ctx) {
    const { service } = this;
    const { scope, key, value } = ctx.request.body;
    const data = await service.settings.save(scope, key, value);
    
    ctx.body = { data };
  }
}

SettingsController.actions = [ 'get', 'post' ];

module.exports = SettingsController;
