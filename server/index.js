const Koa = require('koa');
const koaSend = require('koa-send');
const http = require('http');
const https = require('https');
const fs = require('./helpers/fs');
const { pick, get } = require('./helpers/utils'); 

// Load Config
const config = require('./configs');

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

class Application {

  constructor(options) {
    this.koa = new Koa();
    this.router = new KoaRouter();
    this.config = config;

    this._setOptions(options);
    this._loadMiddlewares();
    this._loadServices();
    this._loadControllers();
    this._loadRouter();
  }


  /**
   * Ensure app options
   * options > settings > config
   * @param {*} options 
   */
  _setOptions(options) {
    const { settings: settingsPath } = options;
    let serverSettings;
    if (settingsPath && fs.accessSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, { encoding: 'utf8' }));
      serverSettings = get(settings, 'server') || {};
    }

    this.options = Object.assign({
      protocol: 'http',
      baseDir: process.cwd(),
      ssl: false, // http default
      clientCert: false, // client auth
    }, config, serverSettings, options);

    
    // always use http for development
    if (process.env.NODE_ENV === 'development') {
      this.options.ssl = false;
    }

    if (this.options.ssl) {
      const { key, cert, ca, clientCert } = this.options;

      this.options.protocol = 'https';
      if (key) this.options.key = fs.readFileSync(key, 'utf8').toString();
      if (cert) this.options.cert = fs.readFileSync(cert, 'utf8').toString();
      if (ca) this.options.ca = fs.readFileSync(ca, 'utf8').toString();
      if (clientCert) {
        this.options.requestCert = true;
        this.options.rejectUnauthorized = false;
      }
    }
  }

  _loadMiddlewares() {
    const { ssl, clientCert } = this.options;
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

  _loadServices() {
    const service = {};
    const options = {
      app: this,
      config: this.config,
      service
    };

    Object.assign(service, {
      settings: new SettingsService(options),
      manga: new MangaService(options),
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
    const { protocol, port, ssl } = this.options;
    const httpsOptions = pick(this.options, [
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
}

module.exports = Application;