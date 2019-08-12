const Service = require('./_base');
const pathFn = require('path');
const fs = require('fs-extra');
const to = require('await-to-js').default;
const { isDef, set, get, unset } = require('../helpers');

const FILE_NAME = 'settings.json';

class Data {

  constructor(data) {
    this._data = data || {};
  }

  set(key, value) {
    return set(this._data, key, value);
  }
  
  get(key) {
    return isDef(key) ? get(this._data, key) : this._data;
  }

  unset(key) {
    return unset(this._data, key);
  }
}


class SettingsService extends Service {

  constructor(opts) {
    super(opts);
    const { options } = this.app;
    const { settings, baseDir } = options;
    
    this._settings = {};

    if (settings) {
      this.setPath('user', settings);
      let dir = this.get('user', 'baseDir');
      if (dir) {
        options.baseDir = dir;
        this.setPath('repo', pathFn.resolve(dir, FILE_NAME));
      }
    } else if (baseDir) {
      this.setPath('repo', pathFn.resolve(baseDir, FILE_NAME));
    }
  }

  setPath(scope, path) {
    let data;
    const settings = this.getScope(scope);
    
    if (fs.existsSync(path)) {
      data = fs.readFileSync(path, { encoding: 'utf8' });
      data = JSON.parse(data);
    }

    settings.path = path;
    settings.data = new Data(data);
  }

  getScope(scope) {
    const s = this._settings;
    s[scope] || (s[scope] = {})
    return s[scope];
  }

  get(scope, key) {
    const { data } = this.getScope(scope);
    return data ? data.get(key) : null;
  }

  set(scope, key, value) {
    const { data } = this.getScope(scope);

    if (isDef(value)) {
      const { options } = this.app;

      if (scope === 'user' && key === 'baseDir') {
        options.baseDir = value;
        this.setPath('repo', pathFn.resolve(value, FILE_NAME));
      }

      return data.set(key, value);
    } else {
      return data.unset(key) ? data.get() : null;
    }
  }

  async save(scope, key, value) {
    const { path } = this.getScope(scope);
    const data = this.set(scope, key, value);
    const stringifiedData = JSON.stringify(data, null, 2);
    const [ err, result ] = await to(fs.writeFile(path, stringifiedData));
    if (err) {
      err.message = '更新配置文件错误'
      throw err;
    }
    return result;
  }
}

module.exports = SettingsService;