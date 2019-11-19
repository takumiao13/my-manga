const Controller = require('./_base');
const fs = require('fs-extra');
const pathFn = require('path');
const { isNumeric } = require('../helpers/utils');
const mimetypes = require('../helpers/mimetypes');

class VideoController extends Controller {

  async show(ctx) {
    const { path, dirId } = ctx.params;
    let { range } = ctx.request.headers;

    const repo = this.app.service.repo.get(dirId);
    const root = repo.baseDir; // get real path;
    const filepath = pathFn.join(root, path);
    const stat = await fs.stat(filepath);
    const { ext, base: filename } = pathFn.parse(filepath);
    const mime = mimetypes[ext];
    const { mtime, size } = stat;
    
    let start = 0;
    let end = size - 1;
    let modified = mtime;
    let rangeRequest = false;
    
    if (range !== undefined && (range = range.match(/bytes=(.+)-(.+)?/)) !== null) {
      // Check range contains numbers and they fit in the file.
      // Make sure info.start & info.end are numbers (not strings) or stream.pipe errors out if start > 0.
      start = isNumeric(range[1]) && range[1] >= 0 && range[1] < end ? 
        range[1] - 0 : start;
      end = isNumeric(range[2]) && range[2] > start && range[2] <= end ? 
        range[2] - 0 : end;
      rangeRequest = true;
    }

    this.downloadHeader(ctx, { start, end, size, filename, mime, modified, rangeRequest });
    ctx.body = fs.createReadStream(filepath, { flags: 'r', start, end });
  }

  downloadHeader(ctx, { start, end, size, filename, mime, rangeRequest, modified }) {
    let code = 200;
    const length = (end - start) + 1;

    const header = {
      //'Cache-Control': 'public; max-age=31536000',
      //'Content-Disposition': 'inline; filename=' + encodeURIComponent(filename) + ';',
      'Connection': 'keep-alive',
      'Content-Type': mime,
      'Accept-Ranges': 'bytes',
      'Last-Modified': modified.toUTCString(),
      'Content-Transfer-Encoding': 'binary',
      'Content-Length': length
    };
  
    if (rangeRequest) {
      // Partial http response
      code = 206;
      header['Content-Range'] = 'bytes ' + start + '-' + end + '/' + size;
    }
        
    ctx.set(header);
    ctx.status = code;
  }

}

VideoController.actions = [ 'show' ];

module.exports = VideoController;