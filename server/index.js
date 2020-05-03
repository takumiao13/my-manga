const Koa = require('koa');
const koaSend = require('koa-send');
const http = require('http');
const https = require('https');
const fs = require('./helpers/fs');
const pathFn = require('./helpers/path');
const { pick, get, merge } = require('./helpers/utils');
const { CustomError } = require('./error');
const EventEmitter = require('events');

// Load Config
const config = require('./config');

// Load Router
const KoaRouter = require('koa-router');
const registerRouter = require('./router');

// Load Middlewares
const errorMw          = require('./middlewares/error');
const clientCertAuthMw = require('./middlewares/client-cert-auth');
const corsMw           = require('./middlewares/cors');
const bodyParserMw     = require('./middlewares/body-parser');
const staticMw         = require('./middlewares/static');

// Load Controllers
const IndexController    = require('./controllers/index');
const ImageController    = require('./controllers/image');
const VideoController    = require('./controllers/video');
const PDFController      = require('./controllers/pdf');
const MangaController    = require('./controllers/manga');
const SettingsController = require('./controllers/settings');

// Load Services
const MangaService    = require('./services/manga');
const SettingsService = require('./services/settings');
const RepoService     = require('./services/repo');
const ShareService    = require('./services/share');

class Application extends EventEmitter {

  constructor(options) {
    super();
    this.koa = new Koa();
    this.router = new KoaRouter();
    this._setOptions(options);
    this._prepare();
  }

  async setup() {
    this._loadMiddlewares();
    await this._loadServices();
    this._loadControllers();
    this._loadRouter();
  }

  /**
   * Ensure app options
   * CLI args > .env > config
   * @param {*} options 
   */
  _setOptions(options) {
    let settings = {};
    const settingsPath = options.settings || config.settings;

    if (settingsPath && fs.accessSync(settingsPath)) {
      settings = fs.readJsonSync(settingsPath) || {};
    }

    this.options = merge({}, config, settings, options);

    // always use http for development
    const serverConfig = this.options.server;

    if (process.env.NODE_ENV === 'development') {
      serverConfig.ssl = false;
    }

    if (serverConfig.ssl) {
      const { key, cert, ca, clientCert } = serverConfig;

      serverConfig.protocol = 'https';
      if (key) serverConfig.key = fs.readFileSync(key, 'utf8').toString();
      if (cert) serverConfig.cert = fs.readFileSync(cert, 'utf8').toString();
      if (ca) serverConfig.ca = fs.readFileSync(ca, 'utf8').toString();
      if (clientCert) {
        serverConfig.requestCert = true;
        serverConfig.rejectUnauthorized = false;
      }
    }


    // fallback use options
    this._config = this.options;
  }

  // readonly config
  config(path) {
    if (!path) {
      return this._config;
    }

    return get(this._config, path);
  }

  _prepare() {
    const { dataDir, cacheDir } = this.config();
    // if not find datadir and cachedir try to make it
    fs.ensureDirSync(pathFn.join(dataDir, 'repos'));
    fs.ensureDirSync(pathFn.join(dataDir, 'users'));
    fs.ensureDirSync(cacheDir);
  }

  _loadMiddlewares() {
    const { ssl, clientCert } = this.config('server');
    const middlewares = [ corsMw, ...staticMw, bodyParserMw ]

    // validate client cert if clientCert is true
    if (ssl && clientCert) middlewares.unshift(clientCertAuthMw);

    // add errorMw to first
    middlewares.unshift(errorMw);

    // apply each mw to app
    middlewares.forEach(mw => {
      this.koa.use(mw(this));
    });
  }

  async _loadServices() {
    const service = {};
    const options = {
      app: this,
      service
    };

    Object.assign(service, {
      settings: new SettingsService(options),
      manga: new MangaService(options),
      share: new ShareService(options),
      repo: new RepoService(options)
    });

    const keys = Object.keys(service)
    for (let i = 0; i < keys.length; i++) {
      await service[keys[i]].initialize();
    }

    this.service = service;
  }

  _loadControllers() {
    const options = {
      app: this,
      service: this.service
    };

    this.controller = {
      index: new IndexController(options),
      image: new ImageController(options),
      video: new VideoController(options),
      pdf: new PDFController(options),
      manga: new MangaController(options),
      settings: new SettingsController(options)
    };
  }

  _loadRouter() {
    const router = registerRouter(this);
    this.koa.use(router.middleware());
  }

  start(callback) {
    const { port, server: serverConfig } = this.config();
    const { protocol, ssl } = serverConfig
    const httpsOptions = pick(serverConfig, [
      'key', 'cert', 'ca', 'requestCert', 'rejectUnauthorized'
    ]);

    const serverCallback = this.koa.callback();

    try {
      const server = ssl ?
        https.createServer(httpsOptions, serverCallback) :
        http.createServer(serverCallback);
      
      server.listen(port, function(err) {
        if (err) {
          console.error(`${protocol} server FAIL: `, err);
          return;
        } else {
          callback();
        }
      });

      process.on('exit', () => {
        console.log('GoodBye Guys!');
      });
  
      process.on('SIGINT', () => process.exit());
    } catch (err) {
      console.error(`Failed to start ${protocol} server\n`, err);
    }
  }
  
  async send(...args) {
    return await koaSend(...args)
  }
  
  throwError(code) {
    throw new CustomError(code)
  }
}

module.exports = Application;