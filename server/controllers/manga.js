const fs = require('fs-extra');
const pathFn = require('path');
const Controller = require('./_base');
const to = require('await-to-js').default;
const { CustomError } = require('../error');
const { ERR_CODE } = require('../helpers');

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
    try {
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
    const { repoMap } = this.app.options;
    return repoMap[dirId].baseDir;
  }
}

MangaController.actions = [ 'folder', 'list' ];

module.exports = MangaController;