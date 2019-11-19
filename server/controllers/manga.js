const fs = require('fs-extra');
const pathFn = require('path');
const Controller = require('./_base');
const to = require('await-to-js').default;
const { CustomError } = require('../error');
const { ERR_CODE } = require('../helpers');

class MangaController extends Controller {

  async folder(ctx) {
    const { service } = this;
    await this._cache(ctx, async ({ baseDir, path, settings }) => {
      const results = await service.manga.folder(path, baseDir, settings);
      ctx.body = { ...results };
    });
  }
  
  async list(ctx) {
    const { service } = this;
    await this._cache(ctx, async ({ baseDir, path, settings }) => {
      const results = await service.manga.list(path, baseDir, settings); 
      ctx.body = { ...results };
    });
  }

  async _cache(ctx, process) {
    try {
      const { request, response } = ctx;
      const { path = '', dirId } = ctx.params;
      const ifModifiedSince = request.headers['if-modified-since'];
      const baseDir = this._getBaseDir(dirId);
      const settings = this.app.service.settings.get(dirId);
      const dirStat = await fs.stat(pathFn.resolve(baseDir, path));
      const lastModified = dirStat.mtime.toGMTString();

      // TODO: check sub dir mtime is gt `ifModifiedSince`
      if (ifModifiedSince === lastModified) {
        response.status = 304;
      } else {
        ctx.response.lastModified = lastModified;
        await process({ baseDir, path, settings });
      }
    } catch(err) {
      switch (err.errno) {
        case -4058: // no such file or directory
          throw new CustomError(ERR_CODE.MANGA_NO_DIR)
        default:
          throw err;
      }
    }
  }

  _getBaseDir(dirId) {
    const repo = this.app.service.repo.get(dirId);
    
    if (!repo) throw new CustomError(ERR_CODE.REPO_UNACCESSED);
    return repo.baseDir;
  }

  async share(ctx) {
    const { service } = this;
    const { url } = ctx.request.body;
    const shortId = service.share.generate(url);
    ctx.body = { shortId }
  }

  async expand(ctx) {
    const { service } = this;
    const { shortId } = ctx.params;
    const url = service.share.expand(shortId);
    ctx.redirect(url || '/');
  }
}

MangaController.actions = [ 'folder', 'list', 'share', 'expand' ];

module.exports = MangaController;