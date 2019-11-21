const Controller = require('./_base');
const to = require('await-to-js').default;

class PDFController extends Controller {

  async show(ctx) {
    const { app } = this;
    const { path, dirId } = ctx.params;

    const repo = this.app.service.repo.get(dirId);
    const root = repo.baseDir; // get real path;
    
    // path should re-encode when if contains `%` will throw 400 error.
    const [ err, result ] = await to(app.send(ctx, encodeURIComponent(path), { 
      root,
      hidden: true,
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'max-age=31536000')
      }
    }));
  
    if (err) {
      err.message = 'cannot find pdf';
      throw err;
    }
  
    return result;
  }

}

PDFController.actions = [ 'show' ];

module.exports = PDFController;