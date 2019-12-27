const fs = require('fs-extra');
const pathFn = require('path');
const Controller = require('./_base');
const { ERR_CODE } = require('../helpers/error-code');

class MangaController extends Controller {

  async folder(ctx) {
    const { service } = this;
    await this._cache(ctx, async ({ baseDir, path, settings }) => {
      const results = await service.manga.folder(baseDir, path, settings);
      ctx.body = { ...results };
    });
  }
  
  async list(ctx) {
    const { service } = this;
    await this._cache(ctx, async ({ baseDir, path, settings }) => {
      const results = await service.manga.list(baseDir, path, settings); 
      ctx.body = { ...results };
    });
  }

  async search(ctx) {
    const { service } = this;
    const { path = '', dirId } = ctx.params;
    const data = await service.manga.search(dirId, path, ctx.query);
    ctx.body = data;
  }

  async version(ctx) {
    const { service } = this;
    const { dirId } = ctx.params;
    const data = await service.manga.version(dirId, ctx.query);
    ctx.body = data;
  }

  async pick(ctx) {
    const { service } = this;
    const { path = '', dirId } = ctx.params;
    const results = await service.manga.pick(dirId, path);
    ctx.body = results;
  }

  async _cache(ctx, process) {
    try {
      const { request, response } = ctx;
      const { path = '', dirId } = ctx.params;
      const ifModifiedSince = request.headers['if-modified-since'];

      const { baseDir } = this.app.service.repo.get(dirId);
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
          this.app.throwError(ERR_CODE.MANGA_NO_DIR);
        default:
          throw err;
      }
    }
  }

  async share(ctx) {
    const { url } = ctx.request.body;
    const shortId = this.service.share.generate(url);
    ctx.body = { shortId }
  }

  async expand(ctx) {
    const { shortId } = ctx.params;
    const url = this.service.share.expand(shortId);
    ctx.redirect(url || '/');
  }
}

MangaController.actions = [ 'folder', 'list', 'pick', 'search', 'version', 'share', 'expand' ];

module.exports = MangaController;