const Service = require('./_base');
const pathFn = require('path');
const fs = require('fs-extra');
const to = require('await-to-js').default;
const { CustomError} = require('../error');
const { isUndef, isDef, set, get, unset, has, md5, cloneDeep, pathAccess, ERR_CODE } = require('../helpers');

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


const _hooks = {
  repos: {
    get(value, context) {
      return context._cryptoedRepos;
    }
  }
}

class SettingsService extends Service {

  constructor(opts) {
    super(opts);
    const { options } = this.app;
    const { settings, baseDir } = options;
    
    this._settings = {};
    this._hooks = _hooks;
    const repoMap = {};

    if (settings) {
      this.setPath('user', settings); // 全局 settings 需要获取 repos
      const repos = this.get('user', 'repos', false);
      const cryptoedRepos = [];
    
      repos.forEach(baseDir => {
        const name = pathFn.basename(baseDir);
        const dirId = this.hashBaseDir(baseDir);

        repoMap[dirId] = { name, baseDir };
        cryptoedRepos.push({ name, dirId, accessed: pathAccess(baseDir) });
      });

      this._cryptoedRepos = cryptoedRepos;
    } else if (baseDir) {
      // single dir
      this.setPath('repo', pathFn.resolve(baseDir, FILE_NAME));
      const name = pathFn.basename(baseDir) || pathFn.dirname(baseDir).replace(pathFn.sep, '');
      const dirId = this.hashBaseDir(baseDir);

      this._singleRepoId = dirId;
      repoMap[dirId] = { name, baseDir };
    }

    // set repoMap to app options
    // we can get it from other service or controller
    options.repoMap = repoMap; 
  }

  setPath(scope, path) {
    let data;
    const settings = this._settings[scope] = {};
    
    if (fs.existsSync(path)) {
      data = fs.readFileSync(path, { encoding: 'utf8' });
      data = JSON.parse(data);
    }

    settings.path = path;
    settings.data = new Data(data);
    return settings;
  }

  hashBaseDir(baseDir) {
    return md5(baseDir);
  }

  getScope(scope) {
    let settings = null;
    const { repoMap } = this.app.options;

    // scope ['user'] has loaded when init
    if (scope === 'user') {
      settings = this._settings.user;
    } else if (scope === 'repo') {
      settings = this._settings.repo;
    // scope ['<hash>'] dynamic load
    } else if (repoMap[scope]) {
      const { baseDir } = repoMap[scope]; // get real dir
      settings = this._settings[scope];
      if (!settings) {
        settings = this.setPath(scope, pathFn.resolve(baseDir, FILE_NAME));
      }
    } else {
      throw new CustomError(ERR_CODE.REPO_UNACCESSED);
    }

    return settings;
  }

  get(scope, key, encode) {
    const { repoMap } = this.app.options;
    const settings = this.getScope(scope);
    // if unknown scope settings return null
    if (!settings) return null; 
    const { data } = settings;
    const value = encode === false ? 
        data.get(key) : 
        this.encode(data.get(key), key);
    
    if (scope !== 'user') {
      if (scope === 'repo') scope = this._singleRepoId;
      const repo = repoMap[scope]
      if (isUndef(key) && repo) {      
        Object.assign(value, {
          name: repo.name,
          dirId: scope
        });
      }
    }
    
    return value;
  }

  set(scope, key, value) {
    const { data } = this.getScope(scope);
    // @todo
    // if unknow scope return null
    if (isDef(value)) {
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

  encode(data, key) {
    data = cloneDeep(data);
    const _hooks = this._hooks;
    if (_hooks[key] && _hooks[key].get) {
      data = _hooks[key].get(data, this);
    }

    Object.keys(_hooks).forEach(key => {
      if (has(data, key) && _hooks[key].get) {
        const value = get(data, key);
        set(data, key, _hooks[key].get(value, this));
      }
    });

    return data;
  }

  // // @todo
  // decode(data, key) {
  //   return data;
  // }
}

module.exports = SettingsService;