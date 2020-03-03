const Controller = require('./_base');
const to = require('await-to-js').default;

class ImageController extends Controller {

  async show(ctx) {
    const { app } = this;
    const { path, dirId } = ctx.params;

    const repo = this.app.service.repo.get(dirId);
    const root = repo.baseDir; // get real path;
    
    // path should re-encode when it contains `%` will throw 400 error.
    const [ err, result ] = await to(app.send(ctx, encodeURIComponent(path), { 
      root,
      hidden: true,
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'max-age=31536000')
      }
    }));
  
    if (err) {
      // hidden real image path
      err.message = 'cannot find image';
      throw err;
    }
  
    return result;
  }

}

ImageController.actions = [ 'show' ];

module.exports = ImageController;