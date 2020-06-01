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
    const { path = '', dirId } = ctx.params;

    if (path === '@random') {
      const results = await service.manga.rand(dirId, path);
      ctx.body = {
        hasSubfolder: true,
        isDir: true,
        name: 'Random',
        path: '@random',
        type: 'FILE',
        children: results
      }
    } else {
      await this._cache(ctx, async ({ baseDir, path, settings }) => {
        const results = await service.manga.list(baseDir, path, settings);
        const { metadata } = results;
        if (metadata && metadata.$error) {
          ctx.logger('metadata').warn($error);
        }
        ctx.body = { ...results };
      });
    }
  }

  async search(ctx) {
    const { service } = this;
    const { path = '', dirId } = ctx.params;
    const data = await service.manga.search(dirId, path, ctx.query);
    ctx.body = data;
  }

  async versions(ctx) {
    const { service } = this;
    const { dirId } = ctx.params;
    const data = await service.manga.versions(dirId);
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
      const appinfo = this.config('appinfo');
      const { request, response, headers } = ctx;
      const { path = '', dirId } = ctx.params;
      const { baseDir } = this.service.repo.get(dirId);
      const settings = await this.service.settings.get(dirId);
      const dirPath = pathFn.resolve(baseDir, path);
      const dirStat = await fs.stat(dirPath);

      let ifModifiedSince = request.headers['if-modified-since'];
      if (ifModifiedSince) {
        ifModifiedSince = new Date(ifModifiedSince);
      }
      let lastModified = dirStat.mtime;

      // if cached check sub folder mtime is gt `ifModifiedSince`

      if (ctx.fresh) {
        const files = await fs.readdir(dirPath);
        for (let i = 0; i < files.length; i++) {
          const fileStat = await fs.stat(pathFn.resolve(dirPath, files[i]));
          if (
            fileStat.isDirectory()
            && fileStat.mtime - ifModifiedSince >= 1000 // gt 1 second then last modified
          ) {
            // update lastModified
            lastModified = fileStat.mtime;
            break;
          }
        }
      }

      const xAppStartChanged = headers['x-app-startat'] && headers['x-app-startat'] !== ''+appinfo.startAt;
      const xAppVersionChanged = headers['x-app-version'] && headers['x-app-version'] !== appinfo.version;
      const lastModifiedChanged = !ifModifiedSince || lastModified - ifModifiedSince >= 1000;
      
      if (xAppStartChanged || xAppVersionChanged || !ctx.fresh || lastModifiedChanged) {
        // remove force cache for fetch list
        response.lastModified = lastModified;
        response.set({
          'Cache-Control': 'no-cache'
        });
        await process({ baseDir, path, settings });
      } else {
        response.status = 304;
        response.lastModified = ifModifiedSince;
      }
    } catch(err) {
      this.app.throwError(ERR_CODE.MANGA_NO_DIR);
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

  async latest(ctx) {
    const { service } = this;
    const { dirId } = ctx.params;
    const data = await service.manga.latest(dirId);
    ctx.body = data;
  }
}

MangaController.actions = [ 
  'folder', 'list', 'pick', 
  'latest', 'search', 'versions', 
  'share', 'expand' 
];

module.exports = MangaController;