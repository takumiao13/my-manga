class Controller {
  
  constructor({ app, options, service }) {
    this.app = app;
    this.options = options;
    this.service = service;
    this._bindActions();
  }

  config(path) {
    return this.app.config(path);
  }

  _bindActions() {
    const { actions } = this.constructor;

    if (Array.isArray(actions)) {
      actions.forEach(action => {
        // old actions
        const _action = this[action];
        // wrapper
        this[action] = async (ctx, next) => {
          // pass ctx to each service
          Object.keys(this.service).forEach(key => {
            this.service[key].ctx = ctx;
          });
          await _action.call(this, ctx, next);
        }
      });
    }
  }
}

module.exports = Controller;