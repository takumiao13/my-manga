const Controller = require('./_base');

class MangaController extends Controller {

  async folder(ctx) {
    const { service } = this;
    const { path } = ctx.params;
    const results = await service.manga.folder(path);
    
    ctx.body = { ...results };
  }
  
  async list(ctx) {
    const { service } = this;
    const { path } = ctx.params;
    const results = await service.manga.list(path);

    ctx.body = { ...results };
  }

}

MangaController.actions = [ 'folder', 'list' ];

module.exports = MangaController;