const Service = require('./_base');
const pathFn = require('path');
const to = require('await-to-js').default;
const fs = require('../helpers/fs');
const { isUndef, isDef, omit, set, get, unset, cloneDeep } = require('../helpers/utils');

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

  async initialize() {
    const { 
      settings, 
      baseDir, 
      appinfo: { version, startAt }
    } = this.config();

    this._settings = {};

    // get repos from settings
    if (settings) {
      this._setPath('user', settings, {
        version,
        startAt
      });

      // when path setted, we can get value by key
      const repos = await this.get('user', 'repos', false);
      this.service.repo.multiple = true;
      this.service.repo.add(repos);

    // get repo from single dir
    } else if (baseDir) {
      this._setPath('repo', pathFn.resolve(baseDir, FILE_NAME), {
        version,
        startAt
      });

      this.service.repo.multiple = false;
      this.service.repo.add(baseDir);
    }
  }

  async get(scope, key, encode) {
    const settings = this._getScope(scope);

    // if unknown scope settings return null
    if (!settings) return null; 
    const { data } = settings;

    let value = data.get(key);

    if (encode !== false) {
      value = this._cryptoValue(key, value);
    }
    
    if (scope !== 'user') {
      // get repo by scope
      const dirId = scope === 'repo' ? '' : scope;
      const repo = this.service.repo.get(dirId)

      if (isUndef(key) && repo) {      
        Object.assign(value, {
          name: repo.name,
          dirId: repo.dirId
        });
      }
    }

    // handle get all user settings
    // addon latest updated mangas
    if (scope == 'user' && !key) {
      const repos = value.repos;
      for (let i = 0; i < repos.length; i++) {
        const repo = repos[i];
        const { dirId } = repo;
        const latest = await this.service.manga.latest(dirId, 10);
        repo.latest = latest;
      }
    }
    
    return value;
  }

  set(scope, key, value) {
    const { data } = this._getScope(scope);
    let result;

    this._perSet(key, value);

    if (isDef(value)) {  
      result = data.set(key, value);
    } else {
      result = data.unset(key);
    }

    return result
  }

  async save(scope, key, value) {
    const { path } = this._getScope(scope);
    const data = this.set(scope, key, value);

    // overwrite settings file
    const stringifiedData = JSON.stringify(data, null, 2);
    const [ err ] = await to(fs.writeFile(path, stringifiedData));
    if (err) {
      err.message = 'update settings error';
      throw err;
    }

    // only return the set value
    return value ? this.get(scope, key) : true;
  }

  _setPath(scope, path, addonData = {}) {
    let data;
    const settings = this._settings[scope] = {};
    
    if (fs.existsSync(path)) {
      data = fs.readFileSync(path, { encoding: 'utf8' });
      data = JSON.parse(data);
    }

    settings.path = path;
    settings.data = new Data(Object.assign(data || {}, addonData));

    return settings;
  }

  _getScope(scope) {
    let settings = null;

    // scope ['user'] has loaded when init
    if (scope === 'user') {
      settings = this._settings.user;

    } else if (scope === 'repo') {
      settings = this._settings.repo;

    // scope ['<hash>'] dynamic load
    } else {
      const repo = this.service.repo.get(scope);
      const { baseDir } = repo // get real dir from repo
      settings = this._settings[scope] || this._setPath(scope, pathFn.resolve(baseDir, FILE_NAME));
    }

    return settings;
  }

  _cryptoValue(key, value) {
    const reposRE = /repos\[(\d+)\]/; 

    if (isUndef(key)) {
      value = cloneDeep(value);
      if ('repos' in value) {
        value.repos = this.service.repo.list();
      } 

      // TODO: Optimize Later
      return omit(value, 'server');

    } else if (key === 'repos') {
      return this.service.repo.list();

    } else if (reposRE.test(key)) {
      const result = key.match(reposRE);
      const index = +result[1];
      return this.service.repo.list()[index]
    }
  }

  _perSet(key, value) {
    const reposRE = /repos\[(\d+)\]/; 
    if (reposRE.test(key)) {
      const result = key.match(reposRE);
      const index = result[1];

      if (isDef(value)) {
        this.service.repo.add(value);
      } else {
        this.service.repo.remove(index)
      }
    }
  }
}

module.exports = SettingsService;