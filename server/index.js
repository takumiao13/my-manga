const Koa = require('koa');
const koaSend = require('koa-send');
const http = require('http');
const https = require('https');
const fs = require('./helpers/fs');
const pathFn = require('./helpers/path');
const { pick, get, merge } = require('./helpers/utils');
const { CustomError } = require('./error');
const EventEmitter = require('events');
const nanoid = require('nanoid');

// Load Config
const config = require('./config');

// Load Router
const KoaRouter = require('koa-router');
const registerRouter = require('./router');

// Load Middlewares (TODO: auto load)
const errorMw          = require('./middlewares/error');
const logMw            = require('./middlewares/log');
const jwtMw            = require('./middlewares/jwt');
const clientCertAuthMw = require('./middlewares/client-cert-auth');
const corsMw           = require('./middlewares/cors');
const bodyParserMw     = require('./middlewares/body-parser');
const staticMw         = require('./middlewares/static');

// Load Controllers (TODO: auto load)
const IndexController    = require('./controllers/index');
const ImageController    = require('./controllers/image');
const VideoController    = require('./controllers/video');
const PDFController      = require('./controllers/pdf');
const MangaController    = require('./controllers/manga');
const SettingsController = require('./controllers/settings');
const AuthController     = require('./controllers/auth');

// Load Services (TODO: auto load)
const MangaService    = require('./services/manga');
const SettingsService = require('./services/settings');
const RepoService     = require('./services/repo');
const ShareService    = require('./services/share');
const AuthService     = require('./services/auth');
const ImageService    = require('./services/image');

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
   *  options (CLI args) > config => this.confg
   * @param {*} options 
   */
  _setOptions(options) {
    const { appinfo } = config;
    const { settingsPath, dataDir, cacheDir } = options;
    // TODO: handle settings parse error
    const settings = fs.readJsonSync(settingsPath)
      
    this.options = merge({}, config, settings, options);

    // always use http for development
    const serverConfig = this.options.server;

    if (process.env.NODE_ENV === 'development') {
      serverConfig.ssl = false;
    }

    if (serverConfig.ssl) {
      const { key, cert, ca, clientCert } = serverConfig;
      const encoding = 'utf8';
      serverConfig.protocol = 'https';

      if (key) serverConfig.key = fs.readFileSync(key, encoding).toString();
      if (cert) serverConfig.cert = fs.readFileSync(cert, encoding).toString();
      if (ca) serverConfig.ca = fs.readFileSync(ca, encoding).toString();
      if (clientCert) {
        serverConfig.requestCert = true;
        serverConfig.rejectUnauthorized = false;
      }
    }

    // fallback use options (remove this.options later)
    this._config = this.options;
  }

  // readonly config
  // TODO use `config` replace `options`
  config(path) {
    if (!path) return this._config;
    return get(this._config, path);
  }

  _prepare() {
    const { dataDir, cacheDir } = this.config();
    // if not find datadir and cachedir try to make it
    fs.ensureDirSync(pathFn.join(dataDir, 'repos'));
    fs.ensureDirSync(pathFn.join(dataDir, 'users'));
    fs.ensureDirSync(pathFn.join(dataDir, 'logs'));
    fs.ensureDirSync(pathFn.join(cacheDir, 'images'));
  }

  _loadMiddlewares() {
    const { server } = this.config();
    const { ssl, clientCert } = server;
    const middlewares = [ logMw, jwtMw, ...staticMw, bodyParserMw ]

    // validate client cert if clientCert is true
    if (ssl && clientCert) middlewares.unshift(clientCertAuthMw);

    middlewares.unshift(corsMw);
    // add errorMw to first
    middlewares.unshift(errorMw);
    // apply each mw to app
    middlewares.forEach(mw => {
      this.koa.use(mw(this));
    });
  }

  async _loadServices() {
    const service = {};
    const options = { app: this, service };

    Object.assign(service, {
      settings: new SettingsService(options),
      manga: new MangaService(options),
      share: new ShareService(options),
      repo: new RepoService(options),
      auth: new AuthService(options),
      image: new ImageService(options)
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
      settings: new SettingsController(options),
      auth: new AuthController(options)
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
  
  throwError(code, err) {
    throw new CustomError(code, err)
  }
}

module.exports = Application;