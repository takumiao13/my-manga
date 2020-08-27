const Service = require('./_base');
const fs = require('../helpers/fs');
const pathFn = require('../helpers/path');
const LRU = require('lru-cache');
const nanoid = require('nanoid');


const DUMP_FILENAME = 'dump.json'

class ImageService extends Service {

  constructor(opts) {
    super(opts);
    this.cacheDir = pathFn.join(this.config('cacheDir'), 'images');

    this._dumpFilepath = pathFn.join(this.cacheDir, DUMP_FILENAME);
    this._cacheStart = +new Date;
    this._keyChangedCount = 0;

    const lruOptions = { 
      max: 10000000, 
      dispose: (key, n) => {
        const cachePath = pathFn.join(this.cacheDir, n);
        this.ctx.logger('compress').info(`dispose ${key} ${cachePath}}`);
        fs.unlink(cachePath); // remove compressed image when dispose
      },
      maxAge: 1000 * 60 * 60
    };

    this.lruCache = new LRU(lruOptions);

    // load dump file if exists
    if (fs.accessSync(this._dumpFilepath)) {
      this.lruCache.load(fs.readJsonSync(this._dumpFilepath));
    }
  }

  dump() {
    const dump = this.lruCache.dump();
    dump.length && fs.writeJsonSync(this._dumpFilepath, dump);
    this._cacheStart = new Date;
    this._keyChangedCount = 0; 
  }

  compress(path, { width = null, height = null }) {
    const outputDir = this.makeDir();
    const basename = nanoid(16);
    const cachePath = pathFn.join(outputDir, basename);

    return new Promise((resolve, reject) => {
      // make output dir
      try {
        fs.ensureDirSync(pathFn.join(this.cacheDir, outputDir));
        // save compressed image
        const outputPath = pathFn.join(this.cacheDir, cachePath);
        const ws = fs.createWriteStream(outputPath);

        // init gm module
        const { image: { imageMagick } } = this.config();
        const gm = require('gm').subClass({ imageMagick })

        // start to compress
        gm(path)
          .resize(width, height)
          .quality(80)
          .strip() // removes any profiles or comments. Work with pure data
          .interlace('Line') // progressive image
          .stream()
          .pipe(ws);

        ws.on('finish', () => {
          this.ctx.logger().debug(`${cachePath} | ${outputDir} ${basename}`)
          resolve(cachePath) 
        });
        ws.on('error', reject); 
      } catch (err) {
        reject(err);
      }
    });
  }

  getCache(url) {
    return this.lruCache.get(url);
  }

  setCache(url, value) {
    const now = +new Date;
    const diff = now - this._cacheStart;

    this.lruCache.set(url, value);
    this._keyChangedCount++;

    if (diff >= 900000 && this._keyChangedCount >= 1) {
      this.dump();
    } else if (diff >= 300000 && this._keyChangedCount >= 10) {
      this.dump();
    } else if (diff >= 60000 && this._keyChangedCount >= 10000) {
      this.dump();
    }   
  }

  reset() {
    return this.lruCache.reset();
  }

  makeDir() {
    return pathFn.join(
      this._subDir(), 
      this._subDir()
    );
  }

  _subDir() {
    return ('0' +Math.floor(Math.random()*256).toString(16)).slice(-2);
  }
}

module.exports = ImageService;