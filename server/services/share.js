const Service = require('./_base');
const nanoid = require('nanoid');

// TODO: Auth and Extraction code
class ShareService extends Service {

  constructor(opts) {
    super(opts);
    this._value = new Map();
    this._longUrlHash = new Map();
  }

  generate(url) {
    // check url first
    let id = this.exists(url);
    if (id) { return id };

    id = nanoid();
    this._value.set(id, url);
    this._longUrlHash.set(url, id);
    return id;
  }

  expand(shortId) {
    return this._value.get(shortId);
  }
  
  exists(url) {
    const result = this._longUrlHash.get(url);
    return result;
  }
}
module.exports = ShareService;