class Service {

  constructor({ app, service }) {
    this.app = app;
    this.service = service;
  }

  config(path) {
    return this.app.config(path);
  }

  initialize() {
    
  }
}

module.exports = Service;