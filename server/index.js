const Koa = require('koa');
const koaSend = require('koa-send');
const { assign } = require('./helpers');

// Load Config
const config = require('./configs');

// Load Router
const KoaRouter = require('koa-router');
const registerRouter = require('./router');

// Load Middlewares
const errorMw      = require('./middlewares/error');
const corsMw       = require('./middlewares/cors');
const bodyParserMw = require('./middlewares/body-parser');
const staticMw     = require('./middlewares/static');

// Load Controllers
const IndexController    = require('./controllers/index');
const ImageController    = require('./controllers/image');
const MangaController    = require('./controllers/manga');
const SettingsController = require('./controllers/settings');

// Load Services
const MangaService    = require('./services/manga');
const SettingsService = require('./services/settings');
const RepoService     = require('./services/repo');
const ShareService    = require('./services/share');

class Application {

  constructor(options) {
    this.koa = new Koa();
    this.router = new KoaRouter();
    
    this._loadConfig();
    this._setOptions(options);

    this._loadMiddlewares();
    this._loadServices();
    this._loadControllers();
    this._loadRouter();
  }

  _setOptions(options) {
    const { port } = this.config;

    this.options = assign({}, {
      port,
      baseDir: process.cwd()
    }, options);
  }

  _loadConfig() {
    this.config = config;
  }

  _loadMiddlewares() {
    [ errorMw, corsMw, staticMw, bodyParserMw ].forEach(mw => {
      this.koa.use(mw(this));
    });
  }

  _loadServices() {
    const service = {};
    const options = {
      app: this,
      config: this.config,
      service
    };

    Object.assign(service, {
      manga: new MangaService(options),
      settings: new SettingsService(options),
      share: new ShareService(options),
      repo: new RepoService(options)
    });

    this.service = service;

    Object.keys(this.service).forEach((key) => {
      this.service[key].initialize();
    });
  }

  _loadControllers() {
    const options = {
      app: this,
      config: this.config,
      service: this.service
    };

    this.controller = {
      index: new IndexController(options),
      image: new ImageController(options),
      manga: new MangaController(options),
      settings: new SettingsController(options)
    };
  }

  _loadRouter() {
    const router = registerRouter(this);
    this.koa.use(router.middleware());
  }

  start(callback) {
    const { port } = this.options;

    process.on('exit', () => {
      console.log('');
      console.log('GoodBye Guys!');
    });
    process.on('SIGINT', () => process.exit());

    this.koa.listen(port, callback);
  }
  
  async send(...args) {
    return await koaSend(...args)
  }
}

module.exports = Application;