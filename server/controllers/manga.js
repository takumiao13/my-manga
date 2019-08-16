const fs = require('fs-extra');
const pathFn = require('path');
const Controller = require('./_base');

class MangaController extends Controller {

  async folder(ctx) {
    const { service } = this;
    await this._cache(ctx, async ({ baseDir, path }) => {
      const results = await service.manga.folder(path, baseDir);
      ctx.body = { ...results };
    });
  }
  
  async list(ctx) {
    const { service } = this;
    await this._cache(ctx, async ({ baseDir, path }) => {
      const results = await service.manga.list(path, baseDir); 
      ctx.body = { ...results };
    });
  }

  async _cache(ctx, process) {
    const { request, response } = ctx;
    const { path = '', baseDir: dirId } = ctx.params;
    const ifModifiedSince = request.headers['if-modified-since'];
    const baseDir = this._getBaseDir(dirId);
    const dirStat = await fs.stat(pathFn.resolve(baseDir, path));
    const lastModified = dirStat.mtime.toGMTString();
    if (ifModifiedSince === lastModified) {
      response.status = 304;
    } else {
      ctx.response.lastModified = lastModified;
      await process({ baseDir, path });
    }
  }

  _getBaseDir(dirId) {
    const { repoMap } = this.app.options;
    return repoMap[dirId].baseDir;
  }
}

MangaController.actions = [ 'folder', 'list' ];

module.exports = MangaController;