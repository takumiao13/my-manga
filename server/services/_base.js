class Service {

  constructor({ app, options, service }) {
    this.app = app;
    this.options = options;
    this.service = service;
  }

  config(path) {
    return this.app.config(path);
  }

  initialize() {
    
  }
}

module.exports = Service;