const pathFn = require('path');
const Controller = require('./_base');

class IndexController extends Controller {

  async render(ctx) {
    const { app } = this;
    const { isElectron } = app.options;
    const { context } = app.config.appinfo; // project dir
    await app.send(ctx, `${isElectron ? 'electron_' : '' }dist/index.html`, { root: context });    
  }

}

IndexController.actions = [ 'render' ];

module.exports = IndexController;