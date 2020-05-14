class Controller {
  
  constructor({ app, service }) {
    this.app = app;
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
        this[action] = this[action].bind(this);
      });
    }
  }
}

module.exports = Controller;