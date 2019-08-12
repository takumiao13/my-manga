const Controller = require('./_base');
const to = require('await-to-js').default;

class ImageController extends Controller {

  async show(ctx) {
    const { app } = this;
    const { path } = ctx.params;
    const { baseDir } = app.options;
    const [ err, result ] = await to(app.send(ctx, path, { 
      root: baseDir,
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