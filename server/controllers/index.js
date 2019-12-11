const pathFn = require('path');
const Controller = require('./_base');

class IndexController extends Controller {

  async render(ctx) {
    const { app } = this;
    const { isElectron, appinfo } = app.options;
    await app.send(ctx, `${isElectron ? 'electron_' : '' }dist/index.html`, { root: appinfo.context });    
  }

}

IndexController.actions = [ 'render' ];

module.exports = IndexController;