const Controller = require('./_base');
const pathFn = require('../helpers/path');
const to = require('await-to-js').default;

const MAX_IMAGE_CACHE_AGE = 30*24*60; // seconds

class ImageController extends Controller {

  async show(ctx) {
    const { path, dirId } = ctx.params;
    const { w, h } = ctx.query;
    const { baseDir } = this.service.repo.get(dirId);
    const { image: { compression } } = this.config();
 
    // make absolute image filepath
    const cacheDir = this.service.image.cacheDir;
    const cachedPath = this.service.image.get(ctx.url);

    // if get cache just send it
    if (cachedPath) {
      await this.send(ctx, {
        root: cacheDir,
        path: cachedPath
      });
    } else {
      if (compression && (w || h)) {
        // compress image
        const imagePath = pathFn.join(baseDir, path);
        const [ err, cachePath ] = await to(this.service.image.compress(imagePath, {
          width: w,
          height: h
        }));

        // compress fail
        if (err) {
          ctx.logger().info(err.message);
          await this.send(ctx, { 
            root: baseDir, 
            path
          });

        // compress done
        } else {
          // cache it
          this.service.image.set(ctx.url, cachePath);
          await this.send(ctx, {
            root: cacheDir,
            path: cachePath
          });
        }
      } else {
        await this.send(ctx, { 
          root: baseDir, 
          path
        });
      }
    }
  }

  async send(ctx, { root, path }) {
    const { app } = this;

    // path should re-encode when it contains `%` will throw 400 error.
    const [ err ] = await to(app.send(ctx, encodeURIComponent(path), { 
      root, // get real path
      hidden: true,
      setHeaders: (res) => {
        res.setHeader('Cache-Control', `max-age=${MAX_IMAGE_CACHE_AGE}`)
      }
    }));

    // hidden real image path
    if (err) {
      err.message = 'cannot find image';
      throw err;
    }
  }
}

ImageController.actions = [ 'show' ];

module.exports = ImageController;